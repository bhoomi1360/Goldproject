import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { db } from '../db/database.js';

/**
 * Idempotency Middleware for POST /leads
 * Checks the 'Idempotency-Key' header. If seen previously for the exact same payload,
 * returns the saved response immediately.
 */
export function idempotencyMiddleware(req: Request, res: Response, next: NextFunction) {
  const idempotencyKey = req.header('Idempotency-Key');

  if (!idempotencyKey) {
    return next();
  }

  const payloadHash = crypto
    .createHash('sha256')
    .update(JSON.stringify(req.body || {}))
    .digest('hex');

  const existing = db
    .prepare('SELECT response_status, response_body, request_hash FROM idempotency_keys WHERE key = ?')
    .get(idempotencyKey) as { response_status: number; response_body: string; request_hash: string } | undefined;

  if (existing) {
    if (existing.request_hash !== payloadHash) {
      return res.status(400).json({
        error: {
          code: 'IDEMPOTENCY_CONFLICT',
          message: 'Idempotency-Key was previously used with a different request payload.',
        },
      });
    }

    try {
      const parsedBody = JSON.parse(existing.response_body);
      res.setHeader('X-Cache-Lookup', 'HIT');
      return res.status(existing.response_status).json(parsedBody);
    } catch {
      // Fallback
      return res.status(existing.response_status).send(existing.response_body);
    }
  }

  // Intercept response to save upon completion
  const originalJson = res.json.bind(res);
  res.json = function (body: any) {
    if (res.statusCode >= 200 && res.statusCode < 300) {
      try {
        db.prepare(
          'INSERT INTO idempotency_keys (key, request_hash, response_status, response_body) VALUES (?, ?, ?, ?)'
        ).run(idempotencyKey, payloadHash, res.statusCode, JSON.stringify(body));
      } catch (err) {
        console.error('Failed to store idempotency record:', err);
      }
    }
    return originalJson(body);
  };

  next();
}
