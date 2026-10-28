import { Router, Request, Response, NextFunction } from 'express';
import { QuoteRequestSchema } from '../validation/schemas.js';
import { quoteService } from '../services/quoteService.js';

export const quotesRouter = Router();

/**
 * POST /api/v1/quotes
 * Pure calculation with no DB write. Returns pure gold, gold value and eligible loan per plan.
 */
quotesRouter.post('/', (req: Request, res: Response, next: NextFunction) => {
  try {
    const validatedData = QuoteRequestSchema.parse(req.body);
    const result = quoteService.calculateQuotes(validatedData);

    res.status(200).json({
      data: result,
    });
  } catch (error) {
    next(error);
  }
});
