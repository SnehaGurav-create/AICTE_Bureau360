// Builds and configures the Express application. Does not listen — server.js does that.

import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import pinoHttp from 'pino-http';
import swaggerUi from 'swagger-ui-express';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { env } from './config/env.js';
import { logger } from './config/logger.js';
import { checkDatabaseHealth } from './config/database.js';
import { requestId } from './middleware/requestId.js';
import { notFound } from './middleware/notFound.js';
import { errorHandler } from './middleware/errorHandler.js';
import authRoutes from './modules/auth/auth.routes.js';
import metaRoutes from './modules/meta/meta.routes.js';
import institutionRoutes from './modules/institutions/institutions.routes.js';
import complaintRoutes from './modules/complaints/complaints.routes.js';
import overlapRoutes from './modules/overlap/overlap.routes.js';
import notificationRoutes from './modules/notifications/notifications.routes.js';
import reportRoutes from './modules/reports/reports.routes.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, '..');

export function createApp() {
  const app = express();

  // ── Security ──────────────────────────────────────────────────────────
  app.use(helmet());
  app.use(
    cors({
      origin: env.CORS_ORIGIN,
      credentials: true,
    }),
  );

  // ── General rate limit ────────────────────────────────────────────────
  app.use(
    '/api/',
    rateLimit({
      windowMs: env.API_RATE_LIMIT_WINDOW_MS,
      max: env.API_RATE_LIMIT_MAX,
      standardHeaders: true,
      legacyHeaders: false,
      message: { error: { code: 'RATE_LIMIT', message: 'Too many requests, try again later' } },
    }),
  );

  // ── Request ID + logging ──────────────────────────────────────────────
  app.use(requestId);
  app.use(
    pinoHttp({
      logger,
      genReqId: (req) => req.id,
      serializers: {
        req: (req) => ({ id: req.id, method: req.method, url: req.url }),
        res: (res) => ({ statusCode: res.statusCode }),
      },
    }),
  );

  // ── Body parsing ──────────────────────────────────────────────────────
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: false }));

  // ── Swagger docs ──────────────────────────────────────────────────────
  const openapiYamlPath = path.join(ROOT_DIR, 'openapi.yaml');
  const openapiJsonPath = path.join(ROOT_DIR, 'openapi.json');

  let swaggerDoc = null;
  if (fs.existsSync(openapiJsonPath)) {
    try {
      swaggerDoc = JSON.parse(fs.readFileSync(openapiJsonPath, 'utf8'));
    } catch (err) {
      logger.error({ err }, 'Failed to parse openapi.json');
    }
  }

  // Raw specification endpoints — must be defined BEFORE swaggerUi.serve
  if (fs.existsSync(openapiYamlPath)) {
    const openapiDoc = fs.readFileSync(openapiYamlPath, 'utf8');
    app.get('/api/docs/openapi.yaml', (_req, res) => {
      res.type('text/yaml').send(openapiDoc);
    });
  }

  if (swaggerDoc) {
    app.get('/api/docs/openapi.json', (_req, res) => {
      res.json(swaggerDoc);
    });
    app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerDoc));
  } else if (fs.existsSync(openapiYamlPath)) {
    app.use(
      '/api/docs',
      swaggerUi.serve,
      swaggerUi.setup(null, {
        swaggerOptions: {
          url: '/api/docs/openapi.yaml',
        },
      }),
    );
  }

  // ── Health check ──────────────────────────────────────────────────────
  app.get('/api/v1/health', async (_req, res) => {
    const health = { status: 'ok', timestamp: new Date().toISOString() };
    try {
      await checkDatabaseHealth();
      health.database = 'connected';
    } catch (err) {
      logger.error({ err }, 'Health check: database unreachable');
      health.status = 'degraded';
      health.database = 'unreachable';
      return res.status(503).json({ data: health });
    }
    res.json({ data: health });
  });

  // ── API routes ─────────────────────────────────────────────────────────
  app.use('/api/v1/auth', authRoutes);
  app.use('/api/v1', metaRoutes);
  app.use('/api/v1', institutionRoutes);
  app.use('/api/v1/complaints', complaintRoutes);
  app.use('/api/v1/overlaps', overlapRoutes);
  app.use('/api/v1/notifications', notificationRoutes);
  app.use('/api/v1/reports', reportRoutes);

  // ── 404 + error handler ───────────────────────────────────────────────
  app.use(notFound);
  app.use(errorHandler);

  return app;
}
