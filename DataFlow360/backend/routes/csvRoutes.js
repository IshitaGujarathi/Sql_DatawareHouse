import { Router } from 'express';
import { analyzeCsv, importCsv, listDatasets, datasetOverview } from '../controllers/csvController.js';
import { authenticate, authorize } from '../middleware/auth.js';
import asyncHandler from '../utils/asyncHandler.js';

const router = Router();
router.post('/analyze', authenticate, authorize('ADMIN', 'ANALYST'), asyncHandler(analyzeCsv));
router.post('/import', authenticate, authorize('ADMIN', 'ANALYST'), asyncHandler(importCsv));
router.get('/datasets', authenticate, authorize('ADMIN', 'ANALYST'), asyncHandler(listDatasets));
router.get('/datasets/:id/overview', authenticate, authorize('ADMIN', 'ANALYST'), asyncHandler(datasetOverview));
export default router;
