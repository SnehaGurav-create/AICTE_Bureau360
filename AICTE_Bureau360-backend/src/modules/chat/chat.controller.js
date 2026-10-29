// Chat controller for AICTE Bureau360

import * as chatService from './chat.service.js';

export async function handleChatMessage(req, res) {
  const { message, context } = req.body;
  const user = req.user || null;

  const result = await chatService.processChatMessage(message, context, user);
  res.status(200).json({ data: result });
}

export async function getQuickPrompts(req, res) {
  res.status(200).json({ data: chatService.QUICK_PROMPTS });
}
