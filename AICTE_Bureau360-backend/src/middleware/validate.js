// Zod validation middleware. Validates req.body, req.query and/or req.params against schemas.

import { AppError } from '../utils/AppError.js';

/**
 * Returns an Express middleware that validates parts of the request against zod schemas.
 *
 * @param {object} schemas
 * @param {import('zod').ZodSchema} [schemas.body]   - Schema for req.body
 * @param {import('zod').ZodSchema} [schemas.query]  - Schema for req.query
 * @param {import('zod').ZodSchema} [schemas.params] - Schema for req.params
 * @returns {import('express').RequestHandler}
 *
 * @example
 *   router.post('/complaints', validate({ body: createComplaintSchema }), controller.create);
 */
export function validate(schemas) {
  return (req, _res, next) => {
    const errors = [];

    for (const [source, schema] of Object.entries(schemas)) {
      if (!schema) {
        continue;
      }

      const result = schema.safeParse(req[source]);

      if (!result.success) {
        for (const issue of result.error.issues) {
          errors.push({
            field: issue.path.join('.'),
            message: issue.message,
            source,
          });
        }
      } else {
        // Replace with parsed/coerced values so controllers get clean data.
        // In Express 5, req.query is a getter without a setter, so direct assignment throws.
        try {
          req[source] = result.data;
        } catch {
          Object.defineProperty(req, source, {
            value: result.data,
            writable: true,
            configurable: true,
            enumerable: true,
          });
        }
      }
    }

    if (errors.length > 0) {
      return next(new AppError(400, 'VALIDATION_ERROR', 'Request validation failed', errors));
    }

    next();
  };
}
