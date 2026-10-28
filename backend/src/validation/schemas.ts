import { z } from 'zod';

/**
 * Validation schema for Quote calculation: POST /api/v1/quotes
 */
export const QuoteRequestSchema = z
  .object({
    grossWeightGrams: z
      .number({
        required_error: 'grossWeightGrams is required',
        invalid_type_error: 'grossWeightGrams must be a number',
      })
      .gt(0, 'grossWeightGrams must be greater than 0')
      .lte(1000, 'grossWeightGrams cannot exceed 1000 g'),
    netWeightGrams: z
      .number({
        required_error: 'netWeightGrams is required',
        invalid_type_error: 'netWeightGrams must be a number',
      })
      .gt(0, 'netWeightGrams must be greater than 0')
      .lte(1000, 'netWeightGrams cannot exceed 1000 g'),
    karat: z
      .union([z.literal(18), z.literal(22), z.literal(24)], {
        errorMap: () => ({ message: 'karat must be 18, 22, or 24' }),
      }),
  })
  .refine((data) => data.netWeightGrams <= data.grossWeightGrams, {
    message: 'netWeightGrams cannot exceed grossWeightGrams',
    path: ['netWeightGrams'],
  });

export type QuoteRequestInput = z.infer<typeof QuoteRequestSchema>;

/**
 * Validation schema for Lead Application: POST /api/v1/leads
 */
export const LeadRequestSchema = z
  .object({
    fullName: z
      .string({
        required_error: 'fullName is required',
        invalid_type_error: 'fullName must be a string',
      })
      .trim()
      .min(2, 'fullName must be at least 2 characters')
      .max(60, 'fullName cannot exceed 60 characters')
      .regex(/^[a-zA-Z\s]+$/, 'fullName must contain only letters and spaces'),
    mobileNumber: z
      .string({
        required_error: 'mobileNumber is required',
        invalid_type_error: 'mobileNumber must be a string',
      })
      .trim()
      .regex(/^[6-9]\d{9}$/, 'mobileNumber must be a valid 10-digit Indian number starting with 6-9'),
    grossWeightGrams: z
      .number({
        required_error: 'grossWeightGrams is required',
        invalid_type_error: 'grossWeightGrams must be a number',
      })
      .gt(0, 'grossWeightGrams must be greater than 0')
      .lte(1000, 'grossWeightGrams cannot exceed 1000 g'),
    netWeightGrams: z
      .number({
        required_error: 'netWeightGrams is required',
        invalid_type_error: 'netWeightGrams must be a number',
      })
      .gt(0, 'netWeightGrams must be greater than 0')
      .lte(1000, 'netWeightGrams cannot exceed 1000 g'),
    karat: z
      .union([z.literal(18), z.literal(22), z.literal(24)], {
        errorMap: () => ({ message: 'karat must be 18, 22, or 24' }),
      }),
    planId: z
      .string({
        required_error: 'planId is required',
        invalid_type_error: 'planId must be a string',
      })
      .trim()
      .min(1, 'planId is required'),
  })
  .refine((data) => data.netWeightGrams <= data.grossWeightGrams, {
    message: 'netWeightGrams cannot exceed grossWeightGrams',
    path: ['netWeightGrams'],
  });

export type LeadRequestInput = z.infer<typeof LeadRequestSchema>;

/**
 * Lead Status Workflow update schema (Bonus B1)
 */
export const LeadStatusUpdateSchema = z.object({
  status: z.enum(['SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED'], {
    errorMap: () => ({
      message: 'status must be SUBMITTED, UNDER_REVIEW, APPROVED, or REJECTED',
    }),
  }),
  notes: z.string().max(500).optional(),
});
