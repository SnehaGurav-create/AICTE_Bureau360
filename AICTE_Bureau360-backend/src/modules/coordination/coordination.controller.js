// Controller for cross-bureau coordination endpoints.

import * as service from './coordination.service.js';

export async function create(req, res, next) {
  try {
    const data = await service.requestCoordination(req.body, req.user);
    res.status(201).json({ data });
  } catch (err) {
    next(err);
  }
}

export async function list(req, res, next) {
  try {
    const result = await service.getCoordinationList(req.query);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function getOne(req, res, next) {
  try {
    const data = await service.getCoordinationDetail(req.params.id);
    res.json({ data });
  } catch (err) {
    next(err);
  }
}

export async function respond(req, res, next) {
  try {
    const data = await service.respondToCoordination(req.params.id, req.body, req.user);
    res.json({ data });
  } catch (err) {
    next(err);
  }
}

export async function addAction(req, res, next) {
  try {
    const data = await service.addAction(req.params.id, req.body, req.user);
    res.status(201).json({ data });
  } catch (err) {
    next(err);
  }
}

export async function updateAction(req, res, next) {
  try {
    const data = await service.updateAction(req.params.id, req.params.actionId, req.body, req.user);
    res.json({ data });
  } catch (err) {
    next(err);
  }
}

export async function recordDecision(req, res, next) {
  try {
    const data = await service.recordDecision(req.params.id, req.body, req.user);
    res.json({ data });
  } catch (err) {
    next(err);
  }
}

export async function metrics(req, res, next) {
  try {
    const bureauId = req.query.bureau_id ? parseInt(req.query.bureau_id, 10) : null;
    const data = await service.getMetrics(bureauId);
    res.json({ data });
  } catch (err) {
    next(err);
  }
}

