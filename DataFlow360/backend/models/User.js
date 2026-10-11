import { pool } from '../config/database.js';
export const findUserByEmail = async(email) =>
    (await pool.query('SELECT * FROM users WHERE email=?', [email]))[0][0];