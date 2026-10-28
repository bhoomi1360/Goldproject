import { Router, Request, Response, NextFunction } from 'express';
import { agentService } from '../services/agentService.js';

export const chatRouter = Router();

/**
 * POST /api/v1/chat
 * Gold Loan AI Assistant chat endpoint
 */
chatRouter.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { message, history, state } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({
        error: {
          code: 'INVALID_INPUT',
          message: 'message field is required and must be a string',
        },
      });
    }

    const response = await agentService.processMessage(
      message,
      Array.isArray(history) ? history : [],
      state || {}
    );

    res.status(200).json({
      data: response,
    });
  } catch (error) {
    next(error);
  }
});
