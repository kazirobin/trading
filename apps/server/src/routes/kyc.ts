import { Router } from 'express';
import { z } from 'zod';
import { Kyc } from '../models/Kyc';
import { User } from '../models/User';
import { ApiError, asyncHandler } from '../utils/http';
import { validate } from '../middleware/validate';
import { authenticate, requireActive } from '../middleware/auth';

export const kycRouter = Router();
kycRouter.use(authenticate, requireActive);

const submitSchema = z.object({
  docType: z.enum(['nid', 'passport', 'driving_license']),
  docNumber: z.string().min(3).max(60),
  fullName: z.string().min(2).max(120),
  dateOfBirth: z.string().max(20).optional(),
  country: z.string().max(60).optional(),
  frontImage: z.string().min(4),
  backImage: z.string().optional(),
  selfie: z.string().min(4),
});

kycRouter.post(
  '/',
  validate(submitSchema),
  asyncHandler(async (req, res) => {
    const existing = await Kyc.findOne({ userId: req.user!.id, status: 'pending' });
    if (existing) throw ApiError.conflict('A KYC submission is already under review');

    const body = req.body as z.infer<typeof submitSchema>;
    const kyc = await Kyc.create({ ...body, userId: req.user!.id, status: 'pending' });

    await User.findByIdAndUpdate(req.user!.id, { kycStatus: 'pending' });
    res.status(201).json({ success: true, data: kyc });
  }),
);

kycRouter.get(
  '/me',
  asyncHandler(async (req, res) => {
    const latest = await Kyc.findOne({ userId: req.user!.id }).sort({ createdAt: -1 }).lean();
    res.json({ success: true, data: { status: req.user!.kycStatus, submission: latest } });
  }),
);
