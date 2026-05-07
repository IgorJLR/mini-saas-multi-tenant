import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/user.model';
import { Company } from '../models/company.model';

const router = Router();

router.post('/register', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, role, companySlug } = req.body;

    if (!email || !password || !companySlug) {
      res.status(400).json({ error: 'email, password and companySlug are required' });
      return;
    }

    const company = await Company.findOne({ slug: companySlug });
    if (!company) {
      res.status(400).json({ error: 'Company not found' });
      return;
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      res.status(409).json({ error: 'Email already registered' });
      return;
    }

    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({
      email,
      password: hashed,
      role: role === 'admin' ? 'admin' : 'user',
      companyId: company._id,
    });

    const token = jwt.sign(
      { userId: user._id, companyId: company._id, role: user.role, email: user.email },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      token,
      user: { id: user._id, email: user.email, role: user.role, companyId: company._id },
    });
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'email and password are required' });
      return;
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const token = jwt.sign(
      { userId: user._id, companyId: user.companyId, role: user.role, email: user.email },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: { id: user._id, email: user.email, role: user.role, companyId: user.companyId },
    });
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
