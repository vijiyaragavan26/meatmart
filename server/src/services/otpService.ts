import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { memDb, prisma, isPostgresConnected } from '../config/db';

const OTP_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes
const RESEND_COOLDOWN_MS = 60 * 1000; // 60 seconds
const MAX_VERIFICATION_ATTEMPTS = 3;

export interface OtpRecordData {
  id: string;
  userId?: string | null;
  target: string;
  type: 'MOBILE' | 'EMAIL';
  purpose: 'LOGIN' | 'REGISTER' | 'PASSWORD_RESET' | 'VERIFY_EMAIL';
  hashedOtp: string;
  salt: string;
  attempts: number;
  isUsed: boolean;
  expiresAt: string;
  resendCooldownUntil: string;
  createdAt: string;
}

function hashOtp(otp: string, salt: string): string {
  return crypto.createHash('sha256').update(`${otp}:${salt}`).digest('hex');
}

function generateCryptographicOtp(): string {
  // 6-digit cryptographically secure number
  return crypto.randomInt(100000, 999999).toString();
}

/**
 * Creates and stores a hashed OTP record with rate limiting checks
 */
export async function createOtp(
  target: string,
  type: 'MOBILE' | 'EMAIL',
  purpose: 'LOGIN' | 'REGISTER' | 'PASSWORD_RESET' | 'VERIFY_EMAIL',
  userId?: string | null
): Promise<{ otp: string; record: OtpRecordData } | { error: string; cooldownSeconds?: number }> {
  const normalizedTarget = target.trim().toLowerCase();
  const now = Date.now();

  // 1. Rate Limit & Cooldown Check
  let activeRecord: OtpRecordData | null = null;
  if (isPostgresConnected) {
    const found = await prisma.otpRecord.findFirst({
      where: {
        target: normalizedTarget,
        type,
        isUsed: false,
      },
      orderBy: { createdAt: 'desc' },
    });
    if (found) {
      activeRecord = {
        ...found,
        type: found.type as 'MOBILE' | 'EMAIL',
        purpose: found.purpose as any,
        expiresAt: found.expiresAt.toISOString(),
        resendCooldownUntil: found.resendCooldownUntil.toISOString(),
        createdAt: found.createdAt.toISOString(),
      };
    }
  } else {
    activeRecord =
      memDb.otpRecords
        .filter(r => r.target === normalizedTarget && r.type === type && !r.isUsed)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0] || null;
  }

  if (activeRecord) {
    const cooldownEnd = new Date(activeRecord.resendCooldownUntil).getTime();
    if (now < cooldownEnd) {
      const waitSeconds = Math.ceil((cooldownEnd - now) / 1000);
      return {
        error: `Please wait ${waitSeconds} seconds before requesting a new OTP.`,
        cooldownSeconds: waitSeconds,
      };
    }
  }

  // 2. Generate OTP and salt
  const otp = generateCryptographicOtp();
  const salt = crypto.randomBytes(16).toString('hex');
  const hashedOtp = hashOtp(otp, salt);

  const expiresAt = new Date(now + OTP_EXPIRY_MS).toISOString();
  const resendCooldownUntil = new Date(now + RESEND_COOLDOWN_MS).toISOString();

  const record: OtpRecordData = {
    id: `otp-${uuidv4().substring(0, 8)}`,
    userId: userId || null,
    target: normalizedTarget,
    type,
    purpose,
    hashedOtp,
    salt,
    attempts: 0,
    isUsed: false,
    expiresAt,
    resendCooldownUntil,
    createdAt: new Date().toISOString(),
  };

  if (isPostgresConnected) {
    await prisma.otpRecord.create({
      data: {
        id: record.id,
        userId: record.userId || undefined,
        target: record.target,
        type: record.type,
        purpose: record.purpose,
        hashedOtp: record.hashedOtp,
        salt: record.salt,
        attempts: record.attempts,
        isUsed: record.isUsed,
        expiresAt: new Date(record.expiresAt),
        resendCooldownUntil: new Date(record.resendCooldownUntil),
      },
    });
  } else {
    memDb.otpRecords.push(record);
  }

  return { otp, record };
}

/**
 * Verifies an OTP against stored hash with attempt throttling
 */
export async function verifyStoredOtp(
  target: string,
  type: 'MOBILE' | 'EMAIL',
  enteredOtp: string,
  purpose?: string
): Promise<{ success: boolean; message: string; record?: OtpRecordData }> {
  const normalizedTarget = target.trim().toLowerCase();
  const trimmedOtp = enteredOtp.trim();
  const now = Date.now();

  let record: OtpRecordData | null = null;
  if (isPostgresConnected) {
    const found = await prisma.otpRecord.findFirst({
      where: {
        target: normalizedTarget,
        type,
        isUsed: false,
        ...(purpose ? { purpose } : {}),
      },
      orderBy: { createdAt: 'desc' },
    });
    if (found) {
      record = {
        ...found,
        type: found.type as 'MOBILE' | 'EMAIL',
        purpose: found.purpose as any,
        expiresAt: found.expiresAt.toISOString(),
        resendCooldownUntil: found.resendCooldownUntil.toISOString(),
        createdAt: found.createdAt.toISOString(),
      };
    }
  } else {
    record =
      memDb.otpRecords
        .filter(r => r.target === normalizedTarget && r.type === type && !r.isUsed && (!purpose || r.purpose === purpose))
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0] || null;
  }

  if (!record) {
    return {
      success: false,
      message: 'No active OTP found for this contact. Please request a new OTP.',
    };
  }

  // Check Expiry (5 minutes)
  if (now > new Date(record.expiresAt).getTime()) {
    record.isUsed = true;
    return {
      success: false,
      message: 'This OTP has expired. Please request a new verification code.',
    };
  }

  // Check Attempt Limits (Max 3)
  if (record.attempts >= MAX_VERIFICATION_ATTEMPTS) {
    record.isUsed = true;
    return {
      success: false,
      message: 'Maximum verification attempts exceeded. For your security, this OTP is invalidated. Please request a new code.',
    };
  }

  // Dev bypass support for testing: 123456 in dev/test environment
  const isDevBypass = process.env.NODE_ENV !== 'production' && trimmedOtp === '123456';
  const computedHash = hashOtp(trimmedOtp, record.salt);
  const isMatch = isDevBypass || computedHash === record.hashedOtp;

  if (!isMatch) {
    record.attempts += 1;
    const remaining = MAX_VERIFICATION_ATTEMPTS - record.attempts;

    if (isPostgresConnected) {
      await prisma.otpRecord.update({
        where: { id: record.id },
        data: { attempts: record.attempts, isUsed: record.attempts >= MAX_VERIFICATION_ATTEMPTS },
      });
    }

    if (remaining <= 0) {
      return {
        success: false,
        message: 'Invalid OTP. Maximum attempts reached. Please request a new code.',
      };
    }

    return {
      success: false,
      message: `Invalid OTP code. You have ${remaining} attempt${remaining > 1 ? 's' : ''} remaining.`,
    };
  }

  // Mark OTP as used (prevents replay attacks)
  record.isUsed = true;
  if (isPostgresConnected) {
    await prisma.otpRecord.update({
      where: { id: record.id },
      data: { isUsed: true },
    });
  }

  return {
    success: true,
    message: 'OTP verified successfully!',
    record,
  };
}
