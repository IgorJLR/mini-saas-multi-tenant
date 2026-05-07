import { Schema, model, Document, Types } from 'mongoose';

export interface IProduct extends Document {
  name: string;
  description: string;
  price: number;
  category: string;
  imageUrl: string;
  companyId: Types.ObjectId;
}

const productSchema = new Schema<IProduct>(
  {
    name: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    category: { type: String, required: true },
    imageUrl: { type: String, default: '' },
    companyId: { type: Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
  },
  { timestamps: true }
);

productSchema.index({ companyId: 1, category: 1 });

export const Product = model<IProduct>('Product', productSchema);
