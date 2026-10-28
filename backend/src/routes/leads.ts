import { Router, Request, Response, NextFunction } from 'express';
import { LeadRequestSchema, LeadStatusUpdateSchema } from '../validation/schemas.js';
import { leadService } from '../services/leadService.js';
import { idempotencyMiddleware } from '../middleware/idempotency.js';
import { NotFoundError } from '../middleware/errorHandler.js';

export const leadsRouter = Router();

/**
 * POST /api/v1/leads
 * Validates, re-computes the quote server-side, de-duplicates, stores lead with status SUBMITTED,
 * and returns 201 with an applicationId.
 * Supports Idempotency-Key header.
 */
leadsRouter.post(
  '/',
  idempotencyMiddleware,
  (req: Request, res: Response, next: NextFunction) => {
    try {
      const validatedData = LeadRequestSchema.parse(req.body);
      const lead = leadService.submitLead(validatedData);

      res.status(201).json({
        applicationId: lead.id,
        data: lead,
        message: 'Application submitted successfully',
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/v1/leads
 * All leads, newest first. Mobile numbers are always masked (e.g. 9876XXXX10).
 * Supports filter by plan and status, plus pagination.
 */
leadsRouter.get('/', (req: Request, res: Response, next: NextFunction) => {
  try {
    const planId = typeof req.query.planId === 'string' ? req.query.planId : undefined;
    const status = typeof req.query.status === 'string' ? req.query.status : undefined;
    const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;

    const result = leadService.getLeads({
      planId,
      status,
      page: isNaN(page) ? 1 : page,
      limit: isNaN(limit) ? 50 : limit,
    });

    res.status(200).json({
      data: result.leads,
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: Math.ceil(result.total / result.limit),
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/leads/:id
 * Single lead by ID
 */
leadsRouter.get('/:id', (req: Request, res: Response, next: NextFunction) => {
  try {
    const lead = leadService.getLeadById(req.params.id);
    if (!lead) {
      throw new NotFoundError(`Lead with ID '${req.params.id}' was not found`);
    }

    res.status(200).json({ data: lead });
  } catch (error) {
    next(error);
  }
});

/**
 * PATCH /api/v1/leads/:id/status (Bonus B1: Status workflow)
 * SUBMITTED -> UNDER_REVIEW -> APPROVED / REJECTED
 */
leadsRouter.patch('/:id/status', (req: Request, res: Response, next: NextFunction) => {
  try {
    const validated = LeadStatusUpdateSchema.parse(req.body);
    const updated = leadService.updateStatus(req.params.id, validated.status, validated.notes);

    res.status(200).json({
      data: updated,
      message: `Status updated to ${validated.status}`,
    });
  } catch (error) {
    next(error);
  }
});
