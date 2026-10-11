import { Router } from 'express';
import * as c from '../controllers/authController.js';
import asyncHandler from '../utils/asyncHandler.js';
import { authenticate } from '../middleware/auth.js';
const r = Router();
r.post('/register', asyncHandler(c.register));
r.post('/login', asyncHandler(c.login));
r.get('/me', authenticate, asyncHandler(c.me));
export default r;