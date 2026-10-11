import { pool } from '../config/database.js';
import AppError from '../utils/AppError.js';
const queries = { revenue: 'SELECT * FROM gold_monthly_revenue ORDER BY month', customers: 'SELECT * FROM gold_customer_summary ORDER BY total_spent DESC', products: 'SELECT * FROM gold_product_performance ORDER BY revenue DESC', datasets: 'SELECT * FROM gold_csv_dataset_summary ORDER BY processed_at DESC', 'data-quality': 'SELECT * FROM data_quality_results ORDER BY created_at DESC', etl: 'SELECT * FROM etl_jobs ORDER BY started_at DESC' };
export async function report(req, res) { const query = queries[req.params.report]; if (!query) throw new AppError('Unknown report.', 400); const [data] = await pool.query(query);
    res.json(data); }