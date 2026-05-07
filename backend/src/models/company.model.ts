import { Schema, model, Document } from 'mongoose';

export interface ICompany extends Document {
  name: string;
  slug: string;
}

const companySchema = new Schema<ICompany>(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
  },
  { timestamps: true }
);

export const Company = model<ICompany>('Company', companySchema);
