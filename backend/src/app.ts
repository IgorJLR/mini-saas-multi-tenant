import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { connectDB } from './config/db';
import authRoutes from './routes/auth.routes';
import productRoutes from './routes/product.routes';
import chatRoutes from './routes/chat.routes';

const app = express();

app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => res.json({ status: 'ok' }));
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/chat', chatRoutes);

const PORT = process.env.PORT ?? 3001;

connectDB()
  .then(() => {
    app.listen(PORT, () => console.log(`[server] running on http://localhost:${PORT}`));
  })
  .catch((err) => {
    console.error('[server] failed to connect to DB:', err);
    process.exit(1);
  });

export default app;
