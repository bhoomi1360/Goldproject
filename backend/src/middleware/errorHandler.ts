import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

export interface FieldError {
  field: string;
  message: string;
}

export class AppError extends Error {
  public statusCode: number;
  public code: string;
  public fields?: FieldError[];

  constructor(message: string, statusCode: number = 400, code: string = 'BAD_REQUEST', fields?: FieldError[]) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    this.fields = fields;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found', code: string = 'NOT_FOUND') {
    super(message, 404, code);
  }
}

export class ConflictError extends AppError {
  public existingApplicationId?: string;

  constructor(message: string, existingApplicationId?: string, code: string = 'CONFLICT') {
    super(message, 409, code);
    this.existingApplicationId = existingApplicationId;
  }
}

/**
 * Express centralized error handling middleware
 */
export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
) {
  // Handle Zod Schema Validation Errors (400)
  if (err instanceof ZodError) {
    const fields: FieldError[] = err.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));

    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid request payload',
        fields,
      },
    });
  }

  // Handle Known Application Errors
  if (err instanceof AppError) {
    const responsePayload: any = {
      error: {
        code: err.code,
        message: err.message,
      },
    };

    if (err.fields && err.fields.length > 0) {
      responsePayload.error.fields = err.fields;
    }

    if (err instanceof ConflictError && err.existingApplicationId) {
      responsePayload.error.existingApplicationId = err.existingApplicationId;
    }

    return res.status(err.statusCode).json(responsePayload);
  }

  // Handle Unexpected 500s - Never expose stack traces
  console.error('[Unhandled Internal Error]', err);
  return res.status(500).json({
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected internal server error occurred. Please try again later.',
    },
  });
}
