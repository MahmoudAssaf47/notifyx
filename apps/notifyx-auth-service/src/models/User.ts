import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  email: string;
  passwordHash: string;
  name: string;
  role: 'admin' | 'developer' | 'viewer';
  isActive: boolean;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, unique: true, index: true },
    passwordHash: { type: String, required: true },
    name: { type: String, required: true },
    role: { type: String, enum: ['admin', 'developer', 'viewer'], default: 'viewer' },
    isActive: { type: Boolean, default: true },
    lastLogin: { type: Date }
  },
  { 
    timestamps: true,
    versionKey: false
  }
);

export const User = mongoose.model<IUser>('User', UserSchema);
