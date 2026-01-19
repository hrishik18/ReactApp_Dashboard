import { Router, type Request, type Response } from 'express';
import {
  getWebhooks,
  getWebhookById,
  getAvailableDates,
  getWebhookStats,
  deleteWebhook,
  type ListWebhooksParams,
} from '../services/blobStorage.js';

const router = Router();

// GET /api/webhooks - List all webhooks with pagination and filtering
router.get('/', async (req: Request, res: Response) => {
  try {
    const params: ListWebhooksParams = {
      date: req.query.date as string | undefined,
      page: req.query.page ? parseInt(req.query.page as string, 10) : undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string, 10) : undefined,
      method: req.query.method as string | undefined,
      sourceIp: req.query.sourceIp as string | undefined,
      search: req.query.search as string | undefined,
      conversationId: req.query.conversationId as string | undefined,
    };

    const result = await getWebhooks(params);
    res.json(result);
  } catch (error) {
    console.error('Error fetching webhooks:', error);
    res.status(500).json({ error: 'Failed to fetch webhooks' });
  }
});

// GET /api/webhooks/dates - Get list of available dates
router.get('/dates', async (_req: Request, res: Response) => {
  try {
    const dates = await getAvailableDates();
    res.json({ dates });
  } catch (error) {
    console.error('Error fetching dates:', error);
    res.status(500).json({ error: 'Failed to fetch dates' });
  }
});

// GET /api/webhooks/stats - Get aggregated statistics
router.get('/stats', async (_req: Request, res: Response) => {
  try {
    const stats = await getWebhookStats();
    res.json(stats);
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// GET /api/webhooks/:id - Get single webhook by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const webhook = await getWebhookById(id);

    if (!webhook) {
      res.status(404).json({ error: 'Webhook not found' });
      return;
    }

    res.json(webhook);
  } catch (error) {
    console.error('Error fetching webhook:', error);
    res.status(500).json({ error: 'Failed to fetch webhook' });
  }
});

// DELETE /api/webhooks/:id - Delete a webhook
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const deleted = await deleteWebhook(id);

    if (!deleted) {
      res.status(404).json({ error: 'Webhook not found' });
      return;
    }

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting webhook:', error);
    res.status(500).json({ error: 'Failed to delete webhook' });
  }
});

export default router;
