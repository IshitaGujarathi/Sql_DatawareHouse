import bcrypt from 'bcrypt'; import jwt from 'jsonwebtoken'; import { pool } from '../config/database.js';
import AppError from '../utils/AppError.js';
const tokenFor = (user) =>
    jwt.sign({
        id: user.id,
        name: user.name,
        email: user.email, role: user.role
    },
        process.env.JWT_SECRET, { expiresIn: '1d' });
export async function register(request, response) {
    const { name, email, password, role = 'VIEWER' }
        = request.body; if (!name || !email || !password) throw new AppError('Name, email, and password are required.', 400);
    if (!['ANALYST', 'VIEWER'].includes(role))
        throw new AppError('Public registration supports ANALYST or VIEWER roles only.', 400); const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email.toLowerCase()]); if (existing.length) throw new AppError('Email is already registered.', 409); const hash = await bcrypt.hash(password, 12); const [result] = await pool.query('INSERT INTO users (name,email,password,role) VALUES (?,?,?,?)', [name.trim(), email.toLowerCase(), hash, role]); const user = { id: result.insertId, name: name.trim(), email: email.toLowerCase(), role }; response.status(201).json({ user, token: tokenFor(user) });
}
export async function login(request, response) {
    const { email, password } = request.body;
    const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email?.toLowerCase()]);
    const user = rows[0]; if (!user || !(await bcrypt.compare(password || '', user.password)))
        throw new AppError('Invalid email or password.', 401);
    response.json({
        user: { id: user.id, name: user.name, email: user.email, role: user.role },
        token: tokenFor(user)
    });
}
export async function me(request, response) {
    const [rows] = await pool.query('SELECT id,name,email,role,created_at FROM users WHERE id=?',
        [request.user.id]); response.json(rows[0]);
}
