import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { runChatAgent } from '../services/ai.service';

const router = Router();

router.use(authenticate);

router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { message } = req.body;

    if (!message?.trim()) {
      res.status(400).json({ error: 'message is required' });
      return;
    }

    const reply = await runChatAgent(req.user!.companyId, message);
    res.json({ reply });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[chat] error:', msg);
    if (msg.includes('429') || msg.includes('quota')) {
      res.status(429).json({ error: 'AI rate limit reached. Please wait a moment and try again.' });
      return;
    }
    res.status(500).json({ error: 'Failed to process message' });
  }
});

export default router;
