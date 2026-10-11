import { Router } from 'express';
import * as c from '../controllers/dataController.js';
import { run as transform } from '../controllers/etlController.js';
import asyncHandler from '../utils/asyncHandler.js';
import { authenticate, authorize } from '../middleware/auth.js';
const router = Router();
const secured = authenticate;
const analyst = authorize('ADMIN', 'ANALYST');
for (const layer of['bronze', 'silver']) { const r = Router();
    r.use(secured, analyst);
    r.get('/tables', asyncHandler(c.tables(layer))); if (layer === 'bronze') { r.get('/:tableName/columns', asyncHandler(c.columns));
        r.get('/:tableName/count', asyncHandler(c.count)); } if (layer === 'silver') { r.get('/quality', asyncHandler(c.silverQuality));
        r.post('/transform', asyncHandler(transform)); }
    r.get('/:tableName', asyncHandler(c.records(layer)));
    router.use(`/${layer}`, r); }
const gold = Router();
gold.use(secured);
gold.get('/revenue', asyncHandler((q, s) => c.goldMetric({...q, params: { metric: 'revenue' } }, s)));
gold.get('/city-sales', asyncHandler((q, s) => c.goldMetric({...q, params: { metric: 'city-sales' } }, s)));
gold.get('/top-products', asyncHandler((q, s) => c.goldMetric({...q, params: { metric: 'top-products' } }, s)));
gold.get('/customer-summary', asyncHandler((q, s) => c.goldMetric({...q, params: { metric: 'customer-summary' } }, s)));
gold.get('/tables', asyncHandler(c.tables('gold')));
gold.get('/:tableName', asyncHandler(c.records('gold')));
export { router, gold };