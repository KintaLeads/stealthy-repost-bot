
import { ApiAccount } from '@/types/channels';
import { connectToTelegram } from './connector';

/**
 * Verifies a Telegram verification code
 * This is now just a wrapper around connectToTelegram for consistency
 */
export const verifyTelegramCode = async (
  account: ApiAccount, 
  code: string, 
  options: { phoneCodeHash?: string } = {}
) => {
  try {
    // Simply pass through to connectToTelegram with the verification code
    const result = await connectToTelegram(account, {
      verificationCode: code,
      phoneCodeHash: options.phoneCodeHash
    });
    
    return result.success && !result.codeNeeded;
  } catch (error) {
    console.error('Error in verifyTelegramCode:', error);
    throw error;
  }
};
