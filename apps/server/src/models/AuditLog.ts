import { Schema, model, type Document, type Types } from 'mongoose';

export type AuditSeverity = 'info' | 'warning' | 'critical';

export interface IAuditLog extends Document<Types.ObjectId> {
  _id: Types.ObjectId;
  actorId?: Types.ObjectId | null;
  actorRole?: string | null;
  action: string;
  targetType?: string | null;
  targetId?: Types.ObjectId | string | null;
  severity: AuditSeverity;
  ip?: string | null;
  meta?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const auditLogSchema = new Schema<IAuditLog>(
  {
    actorId: { type: Schema.Types.ObjectId, ref: 'User', default: null, index: true },
    actorRole: { type: String, default: null },
    action: { type: String, required: true, index: true },
    targetType: { type: String, default: null },
    targetId: { type: Schema.Types.Mixed, default: null },
    severity: { type: String, enum: ['info', 'warning', 'critical'], default: 'info', index: true },
    ip: { type: String, default: null },
    meta: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true, toJSON: { virtuals: true, versionKey: false } },
);

auditLogSchema.index({ createdAt: -1 });

export const AuditLog = model<IAuditLog>('AuditLog', auditLogSchema);
