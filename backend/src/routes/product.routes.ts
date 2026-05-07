import { Router, Request, Response } from 'express';
import { Product } from '../models/product.model';
import { authenticate } from '../middleware/auth.middleware';
import { requireAdmin } from '../middleware/role.middleware';

const router = Router();

router.use(authenticate);

router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const products = await Product.find({ companyId: req.user!.companyId }).lean();
    res.json(products);
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const product = await Product.findOne({
      _id: req.params.id,
      companyId: req.user!.companyId,
    }).lean();

    if (!product) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }

    res.json(product);
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/', requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, description, price, category, imageUrl } = req.body;

    if (!name || !description || price === undefined || !category) {
      res.status(400).json({ error: 'name, description, price and category are required' });
      return;
    }

    const product = await Product.create({
      name,
      description,
      price,
      category,
      imageUrl: imageUrl ?? '',
      companyId: req.user!.companyId,
    });

    res.status(201).json(product);
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/:id', requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, description, price, category, imageUrl } = req.body;

    const product = await Product.findOneAndUpdate(
      { _id: req.params.id, companyId: req.user!.companyId },
      { name, description, price, category, imageUrl },
      { new: true, runValidators: true }
    );

    if (!product) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }

    res.json(product);
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/:id', requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const product = await Product.findOneAndDelete({
      _id: req.params.id,
      companyId: req.user!.companyId,
    });

    if (!product) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }

    res.json({ message: 'Product deleted' });
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
