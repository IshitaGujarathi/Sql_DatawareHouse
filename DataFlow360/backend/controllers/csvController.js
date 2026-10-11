import AppError from '../utils/AppError.js';
import { pool } from '../config/database.js';

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phonePattern = /^[0-9+() .-]{8,20}$/;

export async function analyzeCsv(request, response) {
  const { fileName = 'uploaded.csv', headers, rows } = request.body;
  if (!Array.isArray(headers) || !Array.isArray(rows) || !headers.length) throw new AppError('A CSV file with a header row is required.', 400);
  if (headers.length > 100 || rows.length > 10000) throw new AppError('CSV is limited to 100 columns and 10,000 rows for interactive analysis.', 400);
  const normalizedHeaders = headers.map((header, index) => String(header || `Column ${index + 1}`).trim());
  const columnStats = normalizedHeaders.map((header, columnIndex) => {
    const values = rows.map(row => String(row?.[columnIndex] ?? '').trim());
    const nonEmpty = values.filter(Boolean);
    const nulls = values.length - nonEmpty.length;
    const duplicates = nonEmpty.length - new Set(nonEmpty.map(value => value.toLowerCase())).size;
    const isEmail = /email|e-mail/i.test(header);
    const isPhone = /phone|mobile|telephone|tel/i.test(header);
    const invalid = nonEmpty.filter(value => (isEmail && !emailPattern.test(value)) || (isPhone && !phonePattern.test(value))).length;
    return { name: header, nulls, duplicates: Math.max(0, duplicates), invalid, uniqueValues: new Set(nonEmpty).size };
  });
  const duplicateRows = rows.length - new Set(rows.map(row => JSON.stringify(row.map(value => String(value ?? '').trim().toLowerCase())))).size;
  const nullCells = columnStats.reduce((sum, column) => sum + column.nulls, 0);
  const invalidValues = columnStats.reduce((sum, column) => sum + column.invalid, 0);
  const totalCells = Math.max(1, rows.length * normalizedHeaders.length);
  const completeness = Number((100 - (nullCells / totalCells * 100)).toFixed(2));
  const validity = Number((100 - (invalidValues / Math.max(1, rows.length) * 100)).toFixed(2));
  const uniqueness = Number((100 - (Math.max(0, duplicateRows) / Math.max(1, rows.length) * 100)).toFixed(2));
  const overallScore = Number(((completeness + validity + uniqueness) / 3).toFixed(2));
  response.json({ fileName, rowCount: rows.length, columnCount: normalizedHeaders.length, headers: normalizedHeaders, preview: rows.slice(0, 100).map(row => Object.fromEntries(normalizedHeaders.map((header, index) => [header, row?.[index] ?? '']))), summary: { nullCells, duplicateRows: Math.max(0, duplicateRows), invalidValues, completeness, validity, uniqueness, overallScore }, columns: columnStats.filter(column => column.nulls || column.duplicates || column.invalid) });
}

export async function ensureDatasetTables(connection) {
  await connection.query(`CREATE TABLE IF NOT EXISTS csv_datasets (
    id INT PRIMARY KEY AUTO_INCREMENT,
    file_name VARCHAR(255) NOT NULL,
    headers JSON NOT NULL,
    row_count INT NOT NULL,
    quality_score DECIMAL(5,2) NOT NULL,
    uploaded_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE CASCADE
  )`);
  await connection.query(`CREATE TABLE IF NOT EXISTS csv_dataset_rows (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    dataset_id INT NOT NULL,
    row_num INT NOT NULL,
    row_data JSON NOT NULL,
    FOREIGN KEY (dataset_id) REFERENCES csv_datasets(id) ON DELETE CASCADE,
    INDEX idx_csv_dataset_row (dataset_id, row_num)
  )`);
  await connection.query(`CREATE TABLE IF NOT EXISTS bronze_csv_records (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    dataset_id INT NOT NULL,
    row_num INT NOT NULL,
    row_data JSON NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (dataset_id) REFERENCES csv_datasets(id) ON DELETE CASCADE,
    INDEX idx_bronze_csv_dataset (dataset_id, row_num)
  )`);
  await connection.query(`CREATE TABLE IF NOT EXISTS silver_csv_records (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    dataset_id INT NOT NULL,
    row_num INT NOT NULL,
    row_data JSON NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (dataset_id) REFERENCES csv_datasets(id) ON DELETE CASCADE,
    INDEX idx_silver_csv_dataset (dataset_id, row_num)
  )`);
  await connection.query(`CREATE TABLE IF NOT EXISTS gold_csv_dataset_summary (
    id INT PRIMARY KEY AUTO_INCREMENT,
    dataset_id INT NOT NULL UNIQUE,
    file_name VARCHAR(255) NOT NULL,
    total_rows INT NOT NULL,
    clean_rows INT NOT NULL,
    duplicate_rows INT NOT NULL,
    null_cells INT NOT NULL,
    quality_score DECIMAL(5,2) NOT NULL,
    processed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (dataset_id) REFERENCES csv_datasets(id) ON DELETE CASCADE
  )`);
  try { await connection.query('ALTER TABLE etl_jobs ADD COLUMN dataset_id INT NULL, ADD INDEX idx_etl_dataset (dataset_id)'); } catch (error) { if (error.code !== 'ER_DUP_FIELDNAME' && error.code !== 'ER_DUP_KEYNAME') throw error; }
  try { await connection.query('ALTER TABLE data_quality_results ADD COLUMN dataset_id INT NULL, ADD INDEX idx_quality_dataset (dataset_id)'); } catch (error) { if (error.code !== 'ER_DUP_FIELDNAME' && error.code !== 'ER_DUP_KEYNAME') throw error; }
}

export async function importCsv(request, response) {
  const { fileName = 'uploaded.csv', headers, rows, qualityScore = 0 } = request.body;
  if (!Array.isArray(headers) || !Array.isArray(rows) || !headers.length) throw new AppError('Analyze a CSV before importing it.', 400);
  if (headers.length > 100 || rows.length > 10000) throw new AppError('CSV is limited to 100 columns and 10,000 rows.', 400);
  const cleanHeaders = headers.map((header, index) => String(header || `Column ${index + 1}`).trim());
  const connection = await pool.getConnection();
  try {
    await ensureDatasetTables(connection); await connection.beginTransaction();
    const [dataset] = await connection.query('INSERT INTO csv_datasets (file_name,headers,row_count,quality_score,uploaded_by) VALUES (?,?,?,?,?)', [String(fileName).slice(0, 255), JSON.stringify(cleanHeaders), rows.length, Number(qualityScore) || 0, request.user.id]);
    const records = rows.map((row, index) => [dataset.insertId, index + 1, JSON.stringify(Object.fromEntries(cleanHeaders.map((header, column) => [header, String(row?.[column] ?? '')])))]);
    for (let start = 0; start < records.length; start += 500) { const batch = records.slice(start, start + 500); await connection.query('INSERT INTO csv_dataset_rows (dataset_id,row_num,row_data) VALUES ?', [batch]); await connection.query('INSERT INTO bronze_csv_records (dataset_id,row_num,row_data) VALUES ?', [batch]); }
    const cleanRecords = []; const seen = new Set(); let nullCells = 0; let duplicateRows = 0;
    rows.forEach((row, index) => { const cleaned = Object.fromEntries(cleanHeaders.map((header, column) => { const value = String(row?.[column] ?? '').trim(); if (!value) nullCells += 1; return [header, value]; })); const signature = JSON.stringify(Object.values(cleaned).map(value => value.toLowerCase())); if (seen.has(signature)) { duplicateRows += 1; return; } seen.add(signature); cleanRecords.push([dataset.insertId, index + 1, JSON.stringify(cleaned)]); });
    for (let start = 0; start < cleanRecords.length; start += 500) await connection.query('INSERT INTO silver_csv_records (dataset_id,row_num,row_data) VALUES ?', [cleanRecords.slice(start, start + 500)]);
    await connection.query('INSERT INTO gold_csv_dataset_summary (dataset_id,file_name,total_rows,clean_rows,duplicate_rows,null_cells,quality_score) VALUES (?,?,?,?,?,?,?)', [dataset.insertId, String(fileName).slice(0, 255), rows.length, cleanRecords.length, duplicateRows, nullCells, Number(qualityScore) || 0]);
    await connection.commit(); response.status(201).json({ id: dataset.insertId, message: 'CSV loaded into Bronze, cleaned into Silver, and summarized in Gold.', rowCount: rows.length, cleanRows: cleanRecords.length });
  } catch (error) { await connection.rollback(); throw error; } finally { connection.release(); }
}

export async function listDatasets(request, response) {
  const connection = await pool.getConnection();
  try { await ensureDatasetTables(connection); const [datasets] = await connection.query('SELECT id,file_name,row_count,quality_score,created_at FROM csv_datasets WHERE uploaded_by=? ORDER BY created_at DESC', [request.user.id]); response.json(datasets); } finally { connection.release(); }
}

export async function datasetOverview(request, response) {
  const datasetId = Number(request.params.id); if (!Number.isInteger(datasetId) || datasetId < 1) throw new AppError('Invalid dataset.', 400);
  const connection = await pool.getConnection();
  try { await ensureDatasetTables(connection); const [[dataset]] = await connection.query('SELECT id,file_name,headers,row_count,quality_score,created_at FROM csv_datasets WHERE id=? AND uploaded_by=?', [datasetId, request.user.id]); if (!dataset) throw new AppError('Dataset not found.', 404); const [[bronze]] = await connection.query('SELECT COUNT(*) count FROM bronze_csv_records WHERE dataset_id=?', [datasetId]); const [[silver]] = await connection.query('SELECT COUNT(*) count FROM silver_csv_records WHERE dataset_id=?', [datasetId]); const [[gold]] = await connection.query('SELECT * FROM gold_csv_dataset_summary WHERE dataset_id=?', [datasetId]); response.json({ dataset, bronzeRecords: bronze.count, silverRecords: silver.count, gold: gold || null }); } finally { connection.release(); }
}

export async function backfillCsvWarehouses(connection) {
  await ensureDatasetTables(connection);
  const [datasets] = await connection.query('SELECT d.id,d.file_name,d.quality_score FROM csv_datasets d LEFT JOIN gold_csv_dataset_summary g ON g.dataset_id=d.id WHERE g.dataset_id IS NULL');
  for (const dataset of datasets) {
    const [stored] = await connection.query('SELECT row_num,row_data FROM csv_dataset_rows WHERE dataset_id=? ORDER BY row_num', [dataset.id]);
    if (!stored.length) continue;
    const raw = stored.map(row => [dataset.id, row.row_num, JSON.stringify(typeof row.row_data === 'string' ? JSON.parse(row.row_data) : row.row_data)]);
    for (let start=0; start<raw.length; start+=500) await connection.query('INSERT INTO bronze_csv_records (dataset_id,row_num,row_data) VALUES ?', [raw.slice(start,start+500)]);
    const seen=new Set();const clean=[];let duplicateRows=0;let nullCells=0;
    stored.forEach(row=>{const value=typeof row.row_data==='string'?JSON.parse(row.row_data):row.row_data;const cleaned=Object.fromEntries(Object.entries(value).map(([key,item])=>{const text=String(item??'').trim();if(!text)nullCells+=1;return [key,text];}));const signature=JSON.stringify(Object.values(cleaned).map(item=>item.toLowerCase()));if(seen.has(signature)){duplicateRows+=1;return;}seen.add(signature);clean.push([dataset.id,row.row_num,JSON.stringify(cleaned)]);});
    for (let start=0; start<clean.length; start+=500) await connection.query('INSERT INTO silver_csv_records (dataset_id,row_num,row_data) VALUES ?', [clean.slice(start,start+500)]);
    await connection.query('INSERT INTO gold_csv_dataset_summary (dataset_id,file_name,total_rows,clean_rows,duplicate_rows,null_cells,quality_score) VALUES (?,?,?,?,?,?,?)',[dataset.id,dataset.file_name,stored.length,clean.length,duplicateRows,nullCells,dataset.quality_score]);
  }
}
