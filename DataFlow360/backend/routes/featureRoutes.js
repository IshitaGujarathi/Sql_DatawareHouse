import { Router } from 'express';
import * as etl from '../controllers/etlController.js';
import * as q from '../controllers/qualityController.js';
import * as sql from '../controllers/sqlController.js';
import * as reports from '../controllers/reportController.js';
import asyncHandler from '../utils/asyncHandler.js';
import { authenticate, authorize } from '../middleware/auth.js';
const guard = authenticate;
export const etlRoutes = Router();

etlRoutes.post('/run', guard, authorize('ADMIN', 'ANALYST'), asyncHandler(etl.run));
etlRoutes.get('/status', guard, asyncHandler(etl.status));
etlRoutes.get('/jobs', guard, asyncHandler(etl.jobs));
etlRoutes.get('/logs', guard, asyncHandler(etl.logs));
export const qualityRoutes = Router();

qualityRoutes.get('/', guard, asyncHandler(q.getQuality));
qualityRoutes.get('/issues', guard, asyncHandler(q.issues));
qualityRoutes.post('/run', guard, authorize('ADMIN', 'ANALYST'), asyncHandler(q.runQuality));
export const sqlRoutes = Router();

sqlRoutes.post('/execute', guard, authorize('ADMIN', 'ANALYST'), asyncHandler(sql.execute));
sqlRoutes.get('/history', guard, asyncHandler(sql.history));
sqlRoutes.get('/saved', guard, asyncHandler(sql.saved));
sqlRoutes.post('/saved', guard, authorize('ADMIN', 'ANALYST'), asyncHandler(sql.save));
export const reportRoutes = Router();

reportRoutes.get('/:report', guard, asyncHandler(reports.report));