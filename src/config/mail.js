// Nodemailer transport. Used by the mail-worker to send queued notifications.

import nodemailer from 'nodemailer';
import { env } from './env.js';

export const mailTransport = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: env.SMTP_PORT,
  secure: env.SMTP_SECURE,
  auth:
    env.SMTP_USER && env.SMTP_PASS
      ? { user: env.SMTP_USER, pass: env.SMTP_PASS }
      : undefined,
});

export const mailDefaults = {
  from: env.SMTP_FROM,
};
