// Notification request handlers.

import * as service from './notifications.service.js';
import { parsePagination, buildPaginationMeta } from '../../utils/pagination.js';

/**
 * GET /notifications — user's notification inbox.
 */
export async function listNotifications(req, res) {
  const unreadOnly = req.query.unread === 'true';
  const pagination = parsePagination(req.query);
  const { rows, total } = await service.getUserNotifications(
    req.user.id,
    pagination,
    unreadOnly,
  );

  res.json({
    data: rows,
    meta: buildPaginationMeta(total, pagination.page, pagination.limit),
  });
}

/**
 * GET /notifications/unread-count — badge count.
 */
export async function getUnreadCount(req, res) {
  const count = await service.getUnreadCount(req.user.id);
  res.json({ data: { unread_count: count } });
}

/**
 * PATCH /notifications/:id/read — mark one notification as read.
 */
export async function markAsRead(req, res) {
  const updated = await service.markAsRead(req.params.id, req.user.id);
  res.json({ data: updated });
}

/**
 * PATCH /notifications/read-all — mark all as read.
 */
export async function markAllAsRead(req, res) {
  const result = await service.markAllAsRead(req.user.id);
  res.json({ data: result });
}
