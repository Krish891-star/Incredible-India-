/**
 * Email Service for sending notifications
 * Supports multiple email providers with fallback options
 */

// Using environment variables instead of Puter secrets
const getSecret = (key: string, category: string) => {
  // Map secret keys to environment variables
  const envMap: Record<string, string> = {
    'sendgrid_api_key': 'VITE_SENDGRID_API_KEY',
    'sendgrid_from_address': 'VITE_SENDGRID_FROM_ADDRESS',
    'gmail_username': 'VITE_GMAIL_USERNAME',
    'gmail_app_password': 'VITE_GMAIL_APP_PASSWORD',
    'gmail_from_address': 'VITE_GMAIL_FROM_ADDRESS',
    'smtp_server': 'VITE_SMTP_SERVER',
    'smtp_port': 'VITE_SMTP_PORT',
    'smtp_username': 'VITE_SMTP_USERNAME',
    'smtp_password': 'VITE_SMTP_PASSWORD',
    'smtp_from_address': 'VITE_SMTP_FROM_ADDRESS'
  };
  
  const envVar = envMap[key];
  // Safely access environment variables to avoid errors when they're undefined
  return envVar ? (import.meta.env && import.meta.env[envVar] ? import.meta.env[envVar] : null) : null;
};

// Email provider interfaces
interface EmailProvider {
  sendEmail(to: string, subject: string, body: string): Promise<boolean>;
}

// Demo email provider (for development/testing)
class DemoEmailProvider implements EmailProvider {
  async sendEmail(to: string, subject: string, body: string): Promise<boolean> {
    console.log('[Demo Email Provider]');
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Body: ${body}`);
    console.log('---');
    
    // Simulate email sending delay
    await new Promise(resolve => setTimeout(resolve, 100));
    return true;
  }
}

// SMTP email provider
class SMTPEmailProvider implements EmailProvider {
  private smtpServer: string;
  private smtpPort: number;
  private username: string;
  private password: string;
  private fromAddress: string;

  constructor(smtpServer: string, smtpPort: number, username: string, password: string, fromAddress: string) {
    this.smtpServer = smtpServer;
    this.smtpPort = smtpPort;
    this.username = username;
    this.password = password;
    this.fromAddress = fromAddress;
  }

  async sendEmail(to: string, subject: string, body: string): Promise<boolean> {
    try {
      // In a real implementation, we would use an SMTP library like nodemailer
      // For now, we'll simulate the process
      console.log(`[SMTP Email] Sending email via ${this.smtpServer}:${this.smtpPort}`);
      console.log(`From: ${this.fromAddress}`);
      console.log(`To: ${to}`);
      console.log(`Subject: ${subject}`);
      console.log(`Body: ${body}`);
      
      // Simulate SMTP sending
      await new Promise(resolve => setTimeout(resolve, 200));
      return true;
    } catch (error) {
      console.error('[SMTP Email] Failed to send email:', error);
      return false;
    }
  }
}

// Gmail App Password email provider (specific implementation of SMTP)
class GmailEmailProvider implements EmailProvider {
  private username: string;
  private appPassword: string;
  private fromAddress: string;

  constructor(username: string, appPassword: string, fromAddress: string) {
    this.username = username;
    this.appPassword = appPassword;
    this.fromAddress = fromAddress;
  }

  async sendEmail(to: string, subject: string, body: string): Promise<boolean> {
    try {
      // In a real implementation, we would use Gmail's SMTP settings
      // Gmail SMTP: smtp.gmail.com:587 (TLS) or smtp.gmail.com:465 (SSL)
      console.log(`[Gmail Email] Sending email via Gmail SMTP`);
      console.log(`From: ${this.fromAddress}`);
      console.log(`To: ${to}`);
      console.log(`Subject: ${subject}`);
      console.log(`Body: ${body}`);
      
      // Simulate Gmail SMTP sending
      await new Promise(resolve => setTimeout(resolve, 180));
      return true;
    } catch (error) {
      console.error('[Gmail Email] Failed to send email:', error);
      return false;
    }
  }
}

// SendGrid email provider
class SendGridEmailProvider implements EmailProvider {
  private apiKey: string;
  private fromAddress: string;

  constructor(apiKey: string, fromAddress: string) {
    this.apiKey = apiKey;
    this.fromAddress = fromAddress;
  }

  async sendEmail(to: string, subject: string, body: string): Promise<boolean> {
    try {
      // In a real implementation, we would use the SendGrid API
      console.log(`[SendGrid Email] Sending email via SendGrid API`);
      console.log(`From: ${this.fromAddress}`);
      console.log(`To: ${to}`);
      console.log(`Subject: ${subject}`);
      console.log(`Body: ${body}`);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 150));
      return true;
    } catch (error) {
      console.error('[SendGrid Email] Failed to send email:', error);
      return false;
    }
  }
}

// Main email service class
class EmailService {
  private providers: EmailProvider[] = [];
  private currentProviderIndex = 0;

  constructor() {
    this.initializeProviders();
  }

  private async initializeProviders() {
    // Try to configure providers based on available secrets
    try {
      // Check for SendGrid configuration
      const sendGridApiKey = getSecret('sendgrid_api_key', 'EMAIL');
      const sendGridFromAddress = getSecret('sendgrid_from_address', 'EMAIL');
      
      if (sendGridApiKey && sendGridFromAddress) {
        this.providers.push(new SendGridEmailProvider(sendGridApiKey, sendGridFromAddress));
        console.log('[Email Service] Configured SendGrid provider');
      }
      
      // Check for Gmail App Password configuration
      const gmailUsername = getSecret('gmail_username', 'EMAIL');
      const gmailAppPassword = getSecret('gmail_app_password', 'EMAIL');
      const gmailFromAddress = getSecret('gmail_from_address', 'EMAIL');
      
      if (gmailUsername && gmailAppPassword && gmailFromAddress) {
        this.providers.push(new GmailEmailProvider(
          gmailUsername,
          gmailAppPassword,
          gmailFromAddress
        ));
        console.log('[Email Service] Configured Gmail provider');
      }
      
      // Check for general SMTP configuration
      const smtpServer = getSecret('smtp_server', 'EMAIL');
      const smtpPort = getSecret('smtp_port', 'EMAIL');
      const smtpUsername = getSecret('smtp_username', 'EMAIL');
      const smtpPassword = getSecret('smtp_password', 'EMAIL');
      const smtpFromAddress = getSecret('smtp_from_address', 'EMAIL');
      
      if (smtpServer && smtpPort && smtpUsername && smtpPassword && smtpFromAddress) {
        this.providers.push(new SMTPEmailProvider(
          smtpServer,
          parseInt(smtpPort),
          smtpUsername,
          smtpPassword,
          smtpFromAddress
        ));
        console.log('[Email Service] Configured SMTP provider');
      }
      
      // Always add demo provider as fallback
      this.providers.push(new DemoEmailProvider());
      console.log('[Email Service] Configured Demo provider as fallback');
      
    } catch (error) {
      console.error('[Email Service] Error initializing providers:', error);
      // Add demo provider as fallback
      this.providers.push(new DemoEmailProvider());
    }
  }

  async sendEmail(to: string, subject: string, body: string): Promise<boolean> {
    if (this.providers.length === 0) {
      console.error('[Email Service] No email providers configured');
      return false;
    }

    // Try each provider in order until one succeeds
    for (let i = 0; i < this.providers.length; i++) {
      const providerIndex = (this.currentProviderIndex + i) % this.providers.length;
      const provider = this.providers[providerIndex];
      
      try {
        const success = await provider.sendEmail(to, subject, body);
        if (success) {
          // Move successful provider to front for next time
          this.currentProviderIndex = providerIndex;
          return true;
        }
      } catch (error) {
        console.error(`[Email Service] Provider ${provider.constructor.name} failed:`, error);
        continue;
      }
    }
    
    console.error('[Email Service] All email providers failed');
    return false;
  }

  // Send welcome email to new users
  async sendWelcomeEmail(to: string, userName: string): Promise<boolean> {
    const subject = 'Welcome to Incredible India Tourism!';
    const body = `
Dear ${userName},

Welcome to Incredible India Tourism! We're excited to have you join our community.

You can now explore amazing destinations across India, book hotels, and connect with local tour guides.

Start your journey today by browsing our collection of hotels and tourist attractions.

Best regards,
The Incredible India Tourism Team
    `.trim();
    
    return await this.sendEmail(to, subject, body);
  }

  // Send booking confirmation email
  async sendBookingConfirmation(
    to: string, 
    userName: string, 
    hotelName: string, 
    checkInDate: string, 
    checkOutDate: string,
    totalPrice: number
  ): Promise<boolean> {
    const subject = `Booking Confirmation - ${hotelName}`;
    const body = `
Dear ${userName},

Thank you for booking with Incredible India Tourism!

Your booking details:
- Hotel: ${hotelName}
- Check-in Date: ${checkInDate}
- Check-out Date: ${checkOutDate}
- Total Amount: ₹${totalPrice.toFixed(2)}

Our team will confirm your booking shortly. You will receive another email with confirmation details.

If you have any questions, please contact our support team.

Best regards,
The Incredible India Tourism Team
    `.trim();
    
    return await this.sendEmail(to, subject, body);
  }

  // Send hotel registration confirmation
  async sendHotelRegistrationConfirmation(
    to: string, 
    hotelName: string, 
    ownerName: string
  ): Promise<boolean> {
    const subject = `Hotel Registration Submitted - ${hotelName}`;
    const body = `
Dear ${ownerName},

Thank you for registering your hotel "${hotelName}" with Incredible India Tourism!

Your hotel registration has been submitted successfully and is now pending approval from our team. 
We will review your submission and notify you once your hotel is approved and published.

This usually takes 1-2 business days.

If you have any questions, please contact our support team.

Best regards,
The Incredible India Tourism Team
    `.trim();
    
    return await this.sendEmail(to, subject, body);
  }

  // Send hotel approval notification
  async sendHotelApprovalNotification(
    to: string, 
    hotelName: string, 
    ownerName: string
  ): Promise<boolean> {
    const subject = `Hotel Approved - ${hotelName}`;
    const body = `
Dear ${ownerName},

Great news! Your hotel "${hotelName}" has been approved and is now live on Incredible India Tourism!

Travelers can now discover and book your hotel through our platform.

If you have any questions or need assistance, please contact our support team.

Best regards,
The Incredible India Tourism Team
    `.trim();
    
    return await this.sendEmail(to, subject, body);
  }

  // Send notification to admin about new hotel registration
  async sendNewHotelNotificationToAdmin(
    hotelName: string, 
    ownerName: string,
    ownerEmail: string
  ): Promise<boolean> {
    const subject = `New Hotel Registration - ${hotelName}`;
    const body = `
Hello Admin,

A new hotel has been registered and requires your review:

Hotel Name: ${hotelName}
Owner Name: ${ownerName}
Owner Email: ${ownerEmail}

Please log in to the admin panel to review and approve this hotel.

Best regards,
The Incredible India Tourism System
    `.trim();
    
    // Use the super admin email from environment variables or default
    const adminEmail = import.meta.env.VITE_SUPER_ADMIN_EMAIL || 'krish141213@gmail.com';
    return await this.sendEmail(adminEmail, subject, body);
  }

  // Send security notification for login activity
  async sendSecurityNotification(
    userEmail: string,
    userName: string,
    loginTime: string,
    ipAddress: string
  ): Promise<boolean> {
    const subject = 'Security Alert - New Login to Your Account';
    const body = `
Dear ${userName},

We noticed a new login to your Incredible India Tourism account.

Login Details:
- Time: ${loginTime}
- IP Address: ${ipAddress}
- Device: Unknown (browser information not captured)

If this was you, you can disregard this email. If you suspect unauthorized access to your account, please change your password immediately or contact our support team.

Best regards,
The Incredible India Tourism Security Team
    `.trim();
    
    return await this.sendEmail(userEmail, subject, body);
  }

  // Send notification to admin about new tour guide registration
  async sendNewTourGuideNotificationToAdmin(
    guideName: string,
    guideEmail: string
  ): Promise<boolean> {
    const subject = `New Tour Guide Registration - ${guideName}`;
    const body = `
Hello Admin,

A new tour guide has been registered and requires your verification:

Guide Name: ${guideName}
Guide Email: ${guideEmail}

Please log in to the admin panel to review and verify this tour guide.

Best regards,
The Incredible India Tourism System
    `.trim();
    
    // Use the super admin email from environment variables or default
    const adminEmail = (import.meta.env && import.meta.env.VITE_SUPER_ADMIN_EMAIL) ? import.meta.env.VITE_SUPER_ADMIN_EMAIL : 'krish141213@gmail.com';
    return await this.sendEmail(adminEmail, subject, body);
  }

  // Send tour guide approval notification
  async sendTourGuideApprovalNotification(
    guideEmail: string,
    guideName: string
  ): Promise<boolean> {
    const subject = 'Tour Guide Profile Approved - Incredible India Tourism';
    const body = `
Dear ${guideName},

Great news! Your tour guide profile has been approved and is now live on Incredible India Tourism!

Travelers can now discover and book your services through our platform.

If you have any questions or need assistance, please contact our support team.

Best regards,
The Incredible India Tourism Team
    `.trim();
    
    return await this.sendEmail(guideEmail, subject, body);
  }

  // Send tour guide rejection notification
  async sendTourGuideRejectionNotification(
    guideEmail: string,
    guideName: string
  ): Promise<boolean> {
    const subject = `Tour Guide Registration Rejected - ${guideName}`;
    const body = `
Dear ${guideName},

We regret to inform you that your tour guide registration has been rejected.

Reason: Our team found that the submitted information does not meet our quality standards or guidelines.

If you believe this decision was made in error, or if you would like to resubmit with improved information, please contact our support team.

Best regards,
The Incredible India Tourism Team
    `.trim();
    
    return await this.sendEmail(guideEmail, subject, body);
  }

  // Send hotel rejection notification
  async sendHotelRejectionNotification(
    hotelEmail: string,
    hotelName: string
  ): Promise<boolean> {
    const subject = `Hotel Registration Rejected - ${hotelName}`;
    const body = `
Dear Hotel Owner,

We regret to inform you that your hotel registration for "${hotelName}" has been rejected.

Reason: Our team found that the submitted information does not meet our quality standards or guidelines.

If you believe this decision was made in error, or if you would like to resubmit with improved information, please contact our support team.

Best regards,
The Incredible India Tourism Team
    `.trim();
    
    return await this.sendEmail(hotelEmail, subject, body);
  }
}

// Export singleton instance
export const emailService = new EmailService();

export default emailService;