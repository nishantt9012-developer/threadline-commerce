import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = join(dirname(fileURLToPath(import.meta.url)), '..');

// Load .env if present (Node >= 20.12). Real environment variables always win over the file.
if (typeof process.loadEnvFile === 'function') {
  try {
    process.loadEnvFile(join(rootDir, '.env'));
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
}

// Plain object on purpose: tests can override values (e.g. razorpay keys) without touching process.env.
export const config = {
  port: Number(process.env.API_PORT || 3001),
  razorpayKeyId: process.env.RAZORPAY_KEY_ID ?? '',
  razorpayKeySecret: process.env.RAZORPAY_KEY_SECRET ?? '',
  resendApiKey: process.env.NODE_ENV === 'test' ? '' : (process.env.RESEND_API_KEY ?? ''),
  emailFrom: process.env.EMAIL_FROM ?? '',
  orderNotifyEmail: process.env.ORDER_NOTIFY_EMAIL ?? '',
  emailReplyTo: process.env.EMAIL_REPLY_TO ?? '',
  dataDir: join(rootDir, 'server', 'data'),
};
