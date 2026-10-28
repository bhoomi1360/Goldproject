import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { schemesRouter } from './routes/schemes.js';
import { quotesRouter } from './routes/quotes.js';
import { leadsRouter } from './routes/leads.js';
import { chatRouter } from './routes/chat.js';
import { goldRateRouter } from './routes/goldRate.js';
import { errorHandler, NotFoundError } from './middleware/errorHandler.js';

export const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Optional rate limiting on /leads (Bonus B4)
const leadsLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 mins
  max: process.env.NODE_ENV === 'test' ? 1000 : 100,
  message: {
    error: {
      code: 'TOO_MANY_REQUESTS',
      message: 'Too many applications submitted from this IP, please try again later.',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// API Routes (Base path /api/v1)
app.use('/api/v1/loan-schemes', schemesRouter);
app.use('/api/v1/quotes', quotesRouter);
app.use('/api/v1/leads', leadsLimiter, leadsRouter);
app.use('/api/v1/chat', chatRouter);
app.use('/api/v1/gold-rate', goldRateRouter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve compiled frontend production static files if available
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const frontendDist = path.resolve(__dirname, '../../frontend/dist');

if (fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
}

// 404 Catch-All Handler
app.use((req, res, next) => {
  next(new NotFoundError(`Route ${req.method} ${req.path} not found`));
});

// Centralized Error Handling Middleware
app.use(errorHandler);
