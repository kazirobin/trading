import { Schema, model, type Document, type Model, type Types } from 'mongoose';
import bcrypt from 'bcryptjs';

export type UserRole = 'user' | 'admin';
export type UserStatus = 'active' | 'suspended' | 'banned';
export type KycStatus = 'unverified' | 'pending' | 'approved' | 'rejected';

export interface IUser extends Document<Types.ObjectId> {
  _id: Types.ObjectId;
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  status: UserStatus;
  kycStatus: KycStatus;
  emailVerified: boolean;
  twoFAEnabled: boolean;
  twoFASecret?: string | null;
  lastLoginAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(plain: string): Promise<boolean>;
}

export interface IUserModel extends Model<IUser> {
  hashPassword(plain: string): Promise<string>;
}

const userSchema = new Schema<IUser, IUserModel>(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Invalid email'],
    },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ['user', 'admin'], default: 'user', index: true },
    status: { type: String, enum: ['active', 'suspended', 'banned'], default: 'active', index: true },
    kycStatus: {
      type: String,
      enum: ['unverified', 'pending', 'approved', 'rejected'],
      default: 'unverified',
      index: true,
    },
    emailVerified: { type: Boolean, default: false },
    twoFAEnabled: { type: Boolean, default: false },
    twoFASecret: { type: String, default: null, select: false },
    lastLoginAt: { type: Date, default: null },
  },
  { timestamps: true },
);

userSchema.statics.hashPassword = function (plain: string): Promise<string> {
  return bcrypt.hash(plain, 12);
};

userSchema.methods.comparePassword = function (plain: string): Promise<boolean> {
  if (!this.passwordHash) return Promise.resolve(false);
  return bcrypt.compare(plain, this.passwordHash);
};

userSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: (_doc, ret) => {
    const r = ret as unknown as Record<string, unknown>;
    delete r.passwordHash;
    delete r.twoFASecret;
    return ret;
  },
});

export const User = model<IUser, IUserModel>('User', userSchema);
