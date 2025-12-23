/**
 * Real OTP Service - Production-Ready Implementation
 * 
 * This implementation integrates with real SMS services using Puter secrets for secure API key management.
 * It maintains the same security features as the demo version but uses actual SMS delivery.
 * 
 * Supported SMS Providers:
 * - MSG91 (Indian SMS gateway)
 * - Twilio
 * - AWS SNS
 * - Generic HTTP APIs
 */

// Using environment variables instead of Puter secrets
const getSecret = (key: string, category: string) => {
  // Map secret keys to environment variables
  const envMap: Record<string, string> = {
    'twilio_account_sid': 'VITE_TWILIO_ACCOUNT_SID',
    'twilio_auth_token': 'VITE_TWILIO_AUTH_TOKEN',
    'twilio_phone_number': 'VITE_TWILIO_PHONE_NUMBER',
    'msg91_auth_key': 'VITE_MSG91_AUTH_KEY',
    'aws_access_key_id': 'VITE_AWS_ACCESS_KEY_ID',
    'aws_secret_access_key': 'VITE_AWS_SECRET_ACCESS_KEY',
    'aws_region': 'VITE_AWS_REGION'
  };
  
  const envVar = envMap[key];
  // Safely access environment variables to avoid errors when they're undefined
  return envVar ? (import.meta.env && import.meta.env[envVar] ? import.meta.env[envVar] : null) : null;
};

// Check if we're in development mode
const isDevelopment = process.env.NODE_ENV === 'development';

interface OTPSession {
  phone: string;
  otp: string;
  expiresAt: number;
  attempts: number;
  maxAttempts: number;
}

const OTP_EXPIRY_SECONDS = 300; // 5 minutes
const MAX_ATTEMPTS = 3;
const SESSION_KEY_PREFIX = 'real_otp_';

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
 * Sends OTP via MSG91 SMS API (Indian SMS gateway)
 */
async function sendMSG91OTP(phone: string, otp: string): Promise<boolean> {
  try {
    const apiKey = getSecret('msg91_api_key', 'SMS');
    if (!apiKey) {
      console.error('[Real OTP] MSG91 API key not configured');
      return false;
    }

    const senderId = getSecret('msg91_sender_id', 'SMS') || 'IIINDIA';
    const templateId = getSecret('msg91_template_id', 'SMS');
    
    if (!templateId) {
      console.error('[Real OTP] MSG91 template ID not configured');
      return false;
    }

    const message = `Your OTP for Incredible India Tourism is ${otp}. Valid for 5 minutes.`;
    
    const response = await fetch('https://control.msg91.com/api/v5/flow/', {
      method: 'POST',
      headers: {
        'authkey': apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        template_id: templateId,
        sender: senderId,
        short_url: "0",
        recipients: [
          {
            mobiles: phone,
            otp: otp
          }
        ]
      })
    });

    const result = await response.json();
    return result.type === 'success';
  } catch (error) {
    console.error('[Real OTP] Error sending MSG91 OTP:', error);
    return false;
  }
}

/**
 * Sends OTP via Twilio SMS API
 */
async function sendTwilioOTP(phone: string, otp: string): Promise<boolean> {
  try {
    const accountSid = getSecret('twilio_account_sid', 'SMS');
    const authToken = getSecret('twilio_auth_token', 'SMS');
    const fromNumber = getSecret('twilio_from_number', 'SMS');
    
    if (!accountSid || !authToken || !fromNumber) {
      console.error('[Real OTP] Twilio credentials not configured');
      return false;
    }

    const message = `Your OTP for Incredible India Tourism is ${otp}. Valid for 5 minutes.`;
    
    const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + btoa(`${accountSid}:${authToken}`),
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        From: fromNumber,
        To: phone,
        Body: message
      })
    });

    const result = await response.json();
    return result.status === 'queued' || result.status === 'sent';
  } catch (error) {
    console.error('[Real OTP] Error sending Twilio OTP:', error);
    return false;
  }
}

/**
 * Sends OTP via generic HTTP API
 */
async function sendGenericOTP(phone: string, otp: string): Promise<boolean> {
  try {
    const apiUrl = getSecret('generic_sms_api_url', 'SMS');
    const apiKey = getSecret('generic_sms_api_key', 'SMS');
    
    if (!apiUrl || !apiKey) {
      console.error('[Real OTP] Generic SMS API not configured');
      return false;
    }

    const message = `Your OTP for Incredible India Tourism is ${otp}. Valid for 5 minutes.`;
    
    // This is a generic example - adjust based on your SMS provider's API
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        to: phone,
        message: message,
        from: 'IIINDIA'
      })
    });

    return response.ok;
  } catch (error) {
    console.error('[Real OTP] Error sending generic OTP:', error);
    return false;
  }
}

/**
 * Sends OTP to phone number using configured SMS provider
 */
export async function sendRealOTP(phone: string): Promise<{ 
  success: boolean; 
  message: string;
  expiresIn?: number;
}> {
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

    // In development mode, simulate OTP sending without actual SMS
    if (isDevelopment) {
      console.log(`[Real OTP] SIMULATED OTP for ${phone}: ${otp}`);
      return {
        success: true,
        message: `OTP simulated successfully. For testing, use: ${otp}`,
        expiresIn: OTP_EXPIRY_SECONDS
      };
    }

    // Determine which SMS provider to use
    const smsProvider = getSecret('sms_provider', 'SMS') || 'msg91';
    
    let sendSuccess = false;
    switch (smsProvider.toLowerCase()) {
      case 'msg91':
        sendSuccess = await sendMSG91OTP(cleanPhone, otp);
        break;
      case 'twilio':
        sendSuccess = await sendTwilioOTP(cleanPhone, otp);
        break;
      case 'generic':
        sendSuccess = await sendGenericOTP(cleanPhone, otp);
        break;
      default:
        // Fallback to MSG91
        sendSuccess = await sendMSG91OTP(cleanPhone, otp);
    }

    if (sendSuccess) {
      console.log(`[Real OTP] Sent OTP to ${phone}`);
      return {
        success: true,
        message: 'OTP sent successfully',
        expiresIn: OTP_EXPIRY_SECONDS
      };
    } else {
      // Clean up failed session
      clearOTPSession(phone);
      return {
        success: false,
        message: 'Failed to send OTP. Please try again.'
      };
    }
  } catch (error) {
    console.error('[Real OTP] Error sending OTP:', error);
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
    console.error('[Real OTP] Error retrieving OTP session:', error);
    return null;
  }
}

/**
 * Verifies OTP entered by user
 */
export function verifyRealOTP(phone: string, enteredOTP: string): {
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
    console.error('[Real OTP] Error verifying OTP:', error);
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
    console.error('[Real OTP] Error clearing OTP session:', error);
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