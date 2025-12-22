/**
 * Demo OTP Service - Production-Ready Architecture
 * 
 * This is a DEMO implementation that simulates real OTP services without paid APIs.
 * It follows industry-standard OTP security patterns and is ready for seamless
 * integration with real SMS services like Firebase Phone Auth or Indian SMS gateways.
 * 
 * Security Features:
 * - 6-digit random OTP generation
 * - Session-based temporary storage (no permanent database)
 * - 60-second automatic expiration
 * - Maximum 3 verification attempts
 * - Single-use OTP (destroyed after verification)
 * - No personal data stored permanently
 */

interface OTPSession {
  phone: string;
  otp: string;
  expiresAt: number;
  attempts: number;
  maxAttempts: number;
}

const OTP_EXPIRY_SECONDS = 60;
const MAX_ATTEMPTS = 3;
const SESSION_KEY_PREFIX = 'demo_otp_';

/**
 * Generates a secure random 6-digit OTP
 */
export function generateOTP(): string {
  // Use cryptographically secure random number generation
  const array = new Uint32Array(1);
  crypto.getRandomValues(array);
  const randomNum = array[0] % 1000000;
  return randomNum.toString().padStart(6, '0');
}

/**
 * Sends OTP to phone number (DEMO MODE)
 * In production, integrate with:
 * - Firebase Phone Authentication
 * - Twilio SMS API
 * - Indian SMS gateways (MSG91, TextLocal, etc.)
 */
export function sendDemoOTP(phone: string): { 
  success: boolean; 
  otp?: string; 
  message: string;
  expiresIn?: number;
} {
  try {
    // Validate phone number format
    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      return {
        success: false,
        message: 'Invalid phone number format'
      };
    }

    // Check if OTP already exists and is not expired
    const existingSession = getOTPSession(phone);
    if (existingSession && existingSession.expiresAt > Date.now()) {
      const remainingTime = Math.ceil((existingSession.expiresAt - Date.now()) / 1000);
      return {
        success: false,
        message: `OTP already sent. Please wait ${remainingTime} seconds before requesting again.`
      };
    }

    // Generate new OTP
    const otp = generateOTP();
    const expiresAt = Date.now() + (OTP_EXPIRY_SECONDS * 1000);

    // Store in session storage (temporary, browser-specific)
    const session: OTPSession = {
      phone: cleanPhone,
      otp,
      expiresAt,
      attempts: 0,
      maxAttempts: MAX_ATTEMPTS
    };

    sessionStorage.setItem(
      `${SESSION_KEY_PREFIX}${cleanPhone}`,
      JSON.stringify(session)
    );

    // DEMO: In production, this OTP would be sent via SMS
    // For demo purposes, we return it for display
    console.log(`[DEMO OTP] Phone: ${phone}, OTP: ${otp}, Expires in: ${OTP_EXPIRY_SECONDS}s`);

    return {
      success: true,
      otp, // ONLY for demo purposes
      message: 'OTP sent successfully',
      expiresIn: OTP_EXPIRY_SECONDS
    };
  } catch (error) {
    console.error('Error sending OTP:', error);
    return {
      success: false,
      message: 'Failed to send OTP. Please try again.'
    };
  }
}

/**
 * Retrieves OTP session from storage
 */
function getOTPSession(phone: string): OTPSession | null {
  try {
    const cleanPhone = phone.replace(/\D/g, '');
    const sessionData = sessionStorage.getItem(`${SESSION_KEY_PREFIX}${cleanPhone}`);
    
    if (!sessionData) {
      return null;
    }

    const session: OTPSession = JSON.parse(sessionData);
    
    // Check if expired
    if (session.expiresAt < Date.now()) {
      // Auto-cleanup expired session
      clearOTPSession(phone);
      return null;
    }

    return session;
  } catch (error) {
    console.error('Error retrieving OTP session:', error);
    return null;
  }
}

/**
 * Verifies OTP entered by user
 */
export function verifyDemoOTP(phone: string, enteredOTP: string): {
  success: boolean;
  message: string;
  attemptsRemaining?: number;
} {
  try {
    const cleanPhone = phone.replace(/\D/g, '');
    const session = getOTPSession(cleanPhone);

    if (!session) {
      return {
        success: false,
        message: 'OTP expired or not found. Please request a new OTP.'
      };
    }

    // Check if max attempts exceeded
    if (session.attempts >= session.maxAttempts) {
      clearOTPSession(phone);
      return {
        success: false,
        message: 'Maximum verification attempts exceeded. Please request a new OTP.'
      };
    }

    // Increment attempt counter
    session.attempts += 1;
    sessionStorage.setItem(
      `${SESSION_KEY_PREFIX}${cleanPhone}`,
      JSON.stringify(session)
    );

    // Verify OTP
    if (enteredOTP === session.otp) {
      // SUCCESS: Clear OTP immediately (single-use)
      clearOTPSession(phone);
      return {
        success: true,
        message: 'Phone number verified successfully!'
      };
    } else {
      // FAILED: Wrong OTP
      const attemptsRemaining = session.maxAttempts - session.attempts;
      
      if (attemptsRemaining === 0) {
        clearOTPSession(phone);
        return {
          success: false,
          message: 'Invalid OTP. Maximum attempts exceeded. Please request a new OTP.'
        };
      }

      return {
        success: false,
        message: `Invalid OTP. ${attemptsRemaining} attempt(s) remaining.`,
        attemptsRemaining
      };
    }
  } catch (error) {
    console.error('Error verifying OTP:', error);
    return {
      success: false,
      message: 'Verification failed. Please try again.'
    };
  }
}

/**
 * Clears OTP session (called after successful verification or expiry)
 */
export function clearOTPSession(phone: string): void {
  try {
    const cleanPhone = phone.replace(/\D/g, '');
    sessionStorage.removeItem(`${SESSION_KEY_PREFIX}${cleanPhone}`);
  } catch (error) {
    console.error('Error clearing OTP session:', error);
  }
}

/**
 * Gets remaining time for OTP expiry
 */
export function getOTPRemainingTime(phone: string): number {
  const session = getOTPSession(phone);
  if (!session) {
    return 0;
  }

  const remaining = Math.ceil((session.expiresAt - Date.now()) / 1000);
  return Math.max(0, remaining);
}

/**
 * Checks if OTP session exists and is valid
 */
export function hasValidOTPSession(phone: string): boolean {
  const session = getOTPSession(phone);
  return session !== null && session.expiresAt > Date.now();
}

/**
 * PRODUCTION INTEGRATION GUIDE:
 * 
 * To integrate with real SMS services, replace the sendDemoOTP function with:
 * 
 * 1. Firebase Phone Authentication:
 *    - Import firebase/auth
 *    - Use signInWithPhoneNumber()
 *    - Handle RecaptchaVerifier
 * 
 * 2. Twilio SMS API:
 *    - Install @twilio/runtime
 *    - Use Twilio client to send SMS
 *    - Store OTP in secure backend
 * 
 * 3. Indian SMS Gateways (MSG91, TextLocal):
 *    - Make HTTP request to gateway API
 *    - Pass phone number and OTP message
 *    - Handle delivery status callbacks
 * 
 * All other functions (verify, expiry, attempts) remain unchanged!
 */
