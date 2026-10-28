// Notification API routes.

import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { validate } from '../../middleware/validate.js';
import * as controller from './notifications.controller.js';
import * as schemas from './notifications.schemas.js';

const router = Router();

// All routes require authentication (no special permission — users see their own)
router.use(authenticate);

// List notifications (inbox)
router.get(
  '/',
  validate(schemas.listNotificationsSchema),
  controller.listNotifications,
);

// Unread count (badge)
router.get('/unread-count', controller.getUnreadCount);

// Mark all as read
router.patch('/read-all', controller.markAllAsRead);

// Mark single notification as read
router.patch(
  '/:id/read',
  validate(schemas.notificationIdSchema),
  controller.markAsRead,
);

export default router;
