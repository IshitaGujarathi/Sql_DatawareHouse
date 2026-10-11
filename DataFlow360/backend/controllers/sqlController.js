import { pool } from '../config/database.js';
import AppError from '../utils/AppError.js';
const allowed = /^\s*(SELECT|SHOW|DESCRIBE)\b/i;
const blocked = /\b(INSERT|UPDATE|DELETE|DROP|ALTER|TRUNCATE|CREATE|GRANT|REVOKE|CALL|INTO\s+OUTFILE)\b/i;
export async function execute(req, res) { const query = String(req.body.query || '').trim().replace(/;\s*$/, ''); if (!query || !allowed.test(query) || blocked.test(query)) throw new AppError('Only read-only SELECT, SHOW, and DESCRIBE queries are allowed.', 400); const started = Date.now(); const [rows] = await pool.query({ sql: query, timeout: 5000 }); const result = Array.isArray(rows) ? rows.slice(0, 500) : rows; const executionTime = Date.now() - started;
    await pool.query('INSERT INTO query_history (user_id,query_text,rows_returned,execution_ms) VALUES (?,?,?,?)', [req.user.id, query, result.length || 0, executionTime]);
    res.json({ columns: result[0] ? Object.keys(result[0]) : [], rows: result, rowsReturned: result.length || 0, executionTime }); }
export async function history(req, res) { const [data] = await pool.query('SELECT id,query_text,rows_returned,execution_ms,created_at FROM query_history WHERE user_id=? ORDER BY created_at DESC LIMIT 50', [req.user.id]);
    res.json(data); }
export async function saved(req, res) { const [data] = await pool.query('SELECT * FROM saved_queries WHERE user_id=? OR is_public=1 ORDER BY created_at DESC', [req.user.id]);
    res.json(data); }
export async function save(req, res) { const { name, query } = req.body; if (!name || !query) throw new AppError('Name and query are required.', 400); const [r] = await pool.query('INSERT INTO saved_queries (user_id,name,query_text) VALUES (?,?,?)', [req.user.id, name, query]);
    res.status(201).json({ id: r.insertId, name, query }); }