import { Router, Request, Response } from 'express';
import { MOCK_24K_RATE_PER_GRAM } from '../utils/maths.js';

export const goldRateRouter = Router();

/**
 * GET /api/v1/gold-rate (Bonus B1: Cached Gold Rate Endpoint)
 */
goldRateRouter.get('/', (req: Request, res: Response) => {
  // Set cache headers (e.g. 5 minutes)
  res.setHeader('Cache-Control', 'public, max-age=300');

  const rate24k = MOCK_24K_RATE_PER_GRAM;
  const rate22k = Math.round(rate24k * (22 / 24));
  const rate18k = Math.round(rate24k * (18 / 24));

  res.status(200).json({
    data: {
      currency: 'INR',
      unit: 'gram',
      rates: {
        '24K': rate24k,
        '22K': rate22k,
        '18K': rate18k,
      },
      lastUpdated: new Date().toISOString(),
      source: 'Mock Bullion Feed (Benchmark ₹7,000/g)',
    },
  });
});
