import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { Company } from '../src/models/company.model';
import { User } from '../src/models/user.model';
import { Product } from '../src/models/product.model';

const COMPANIES = [
  { name: 'TechMart', slug: 'techmart' },
  { name: 'FashionHub', slug: 'fashionhub' },
];

const PRODUCTS: Record<string, Array<{ name: string; description: string; price: number; category: string; imageUrl: string }>> = {
  techmart: [
    { name: 'Gaming Laptop Pro', description: 'High-performance gaming laptop with RTX 4070 and 16GB RAM', price: 1499.99, category: 'Laptops', imageUrl: 'https://placehold.co/400x300?text=Gaming+Laptop' },
    { name: 'Mechanical Keyboard', description: 'RGB mechanical keyboard with Cherry MX Blue switches', price: 129.99, category: 'Accessories', imageUrl: 'https://placehold.co/400x300?text=Keyboard' },
    { name: '4K IPS Monitor 27"', description: '27-inch 4K IPS monitor with 144Hz and HDR support', price: 499.99, category: 'Monitors', imageUrl: 'https://placehold.co/400x300?text=Monitor' },
    { name: 'Wireless Gaming Mouse', description: 'Ergonomic wireless mouse with 25600 DPI sensor and 70h battery', price: 79.99, category: 'Accessories', imageUrl: 'https://placehold.co/400x300?text=Mouse' },
    { name: '7-in-1 USB-C Hub', description: 'USB-C hub with HDMI 4K, SD card reader, and 3x USB 3.0 ports', price: 49.99, category: 'Accessories', imageUrl: 'https://placehold.co/400x300?text=USB+Hub' },
    { name: '4K Webcam', description: 'Professional 4K webcam with autofocus and AI noise cancellation', price: 199.99, category: 'Cameras', imageUrl: 'https://placehold.co/400x300?text=Webcam' },
    { name: 'NVMe SSD 1TB', description: 'Ultra-fast 1TB NVMe M.2 SSD with 7400MB/s sequential read', price: 89.99, category: 'Storage', imageUrl: 'https://placehold.co/400x300?text=SSD' },
    { name: 'ANC Headphones', description: 'Over-ear headphones with active noise cancellation and 30h battery', price: 299.99, category: 'Audio', imageUrl: 'https://placehold.co/400x300?text=Headphones' },
    { name: 'Smart Speaker 360', description: '360° smart speaker with voice assistant and deep bass', price: 79.99, category: 'Audio', imageUrl: 'https://placehold.co/400x300?text=Speaker' },
    { name: 'Graphics Tablet XL', description: 'Professional drawing tablet with 8192 pressure levels', price: 249.99, category: 'Accessories', imageUrl: 'https://placehold.co/400x300?text=Tablet' },
    { name: 'Streaming Microphone', description: 'Cardioid condenser microphone for podcasting and streaming', price: 149.99, category: 'Audio', imageUrl: 'https://placehold.co/400x300?text=Microphone' },
    { name: 'Mini PC Cube', description: 'Compact desktop PC with Intel i7, 32GB RAM, 512GB SSD', price: 699.99, category: 'Desktops', imageUrl: 'https://placehold.co/400x300?text=Mini+PC' },
  ],
  fashionhub: [
    { name: 'Classic White Sneakers', description: 'Timeless white leather sneakers with memory foam insole', price: 89.99, category: 'Shoes', imageUrl: 'https://placehold.co/400x300?text=Sneakers' },
    { name: 'Slim Fit Jeans', description: 'Dark wash slim fit jeans with 2% elastane stretch fabric', price: 69.99, category: 'Pants', imageUrl: 'https://placehold.co/400x300?text=Jeans' },
    { name: 'Linen Summer Dress', description: 'Lightweight 100% linen dress, breathable and elegant', price: 79.99, category: 'Dresses', imageUrl: 'https://placehold.co/400x300?text=Dress' },
    { name: 'Leather Handbag', description: 'Full-grain leather handbag with gold hardware and suede lining', price: 199.99, category: 'Bags', imageUrl: 'https://placehold.co/400x300?text=Handbag' },
    { name: 'Wool Blazer', description: 'Italian wool blazer, fully lined, available in navy and charcoal', price: 159.99, category: 'Jackets', imageUrl: 'https://placehold.co/400x300?text=Blazer' },
    { name: 'Silk Blouse', description: 'Pure silk blouse with pearl buttons, elegant drape', price: 119.99, category: 'Tops', imageUrl: 'https://placehold.co/400x300?text=Blouse' },
    { name: 'Distressed Denim Jacket', description: 'Classic denim jacket with vintage distressed finish', price: 99.99, category: 'Jackets', imageUrl: 'https://placehold.co/400x300?text=Jacket' },
    { name: 'High-Waist Leggings', description: 'Compression high-waist leggings with hidden pocket', price: 54.99, category: 'Activewear', imageUrl: 'https://placehold.co/400x300?text=Leggings' },
    { name: 'Cotton T-Shirt Pack (3x)', description: 'Pack of 3 premium Pima cotton t-shirts in neutral tones', price: 44.99, category: 'Tops', imageUrl: 'https://placehold.co/400x300?text=T-Shirts' },
    { name: 'Leather Crossbody Bag', description: 'Compact crossbody in pebbled leather with adjustable strap', price: 79.99, category: 'Bags', imageUrl: 'https://placehold.co/400x300?text=Crossbody' },
    { name: 'Chelsea Ankle Boots', description: 'Genuine leather Chelsea boots with elastic side panels', price: 139.99, category: 'Shoes', imageUrl: 'https://placehold.co/400x300?text=Boots' },
    { name: 'Cashmere Sweater', description: 'Ultra-soft 100% cashmere crew-neck sweater', price: 189.99, category: 'Tops', imageUrl: 'https://placehold.co/400x300?text=Sweater' },
  ],
};

async function seed() {
  const uri = process.env.MONGODB_URI ?? 'mongodb://localhost:27017/saas_platform';
  await mongoose.connect(uri);
  console.log('[seed] connected to MongoDB');

  await Company.deleteMany({});
  await User.deleteMany({});
  await Product.deleteMany({});
  console.log('[seed] cleared existing data');

  const password = await bcrypt.hash('password123', 10);

  for (const companyData of COMPANIES) {
    const company = await Company.create(companyData);

    await User.create({ email: `admin@${companyData.slug}.com`, password, role: 'admin', companyId: company._id });
    await User.create({ email: `user@${companyData.slug}.com`, password, role: 'user', companyId: company._id });

    const products = PRODUCTS[companyData.slug];
    await Product.insertMany(products.map((p) => ({ ...p, companyId: company._id })));

    console.log(`[seed] ${company.name}: 2 users + ${products.length} products`);
  }

  console.log('\n✅ Seed complete!\n');
  console.log('Test accounts (password: password123)');
  console.log('  TechMart  admin -> admin@techmart.com');
  console.log('  TechMart  user  -> user@techmart.com');
  console.log('  FashionHub admin -> admin@fashionhub.com');
  console.log('  FashionHub user  -> user@fashionhub.com');

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error('[seed] failed:', err);
  process.exit(1);
});
