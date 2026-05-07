import { Schema, model, Document, Types } from 'mongoose';

export interface IUser extends Document {
  email: string;
  password: string;
  role: 'admin' | 'user';
  companyId: Types.ObjectId;
}

const userSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['admin', 'user'], default: 'user' },
    companyId: { type: Schema.Types.ObjectId, ref: 'Company', required: true },
  },
  { timestamps: true }
);

export const User = model<IUser>('User', userSchema);
