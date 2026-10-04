const nodemailer = require('nodemailer');

const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

/**
 * Send welcome email on registration
 */
const sendWelcomeEmail = async (user) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: `"${process.env.FROM_NAME}" <${process.env.FROM_EMAIL}>`,
      to: user.email,
      subject: `Welcome to ${process.env.FROM_NAME}! 🎉`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { margin: 0; padding: 0; background: #0f0f23; font-family: 'Segoe UI', Arial, sans-serif; }
            .container { max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border-radius: 16px; overflow: hidden; border: 1px solid rgba(139, 92, 246, 0.3); }
            .header { background: linear-gradient(135deg, #8b5cf6, #6366f1, #3b82f6); padding: 40px 30px; text-align: center; }
            .header h1 { color: #fff; margin: 0; font-size: 28px; letter-spacing: 1px; }
            .header p { color: rgba(255,255,255,0.85); margin: 8px 0 0; font-size: 14px; }
            .body { padding: 40px 30px; color: #e2e8f0; }
            .body h2 { color: #a78bfa; margin-top: 0; }
            .body p { line-height: 1.7; color: #cbd5e1; }
            .features { background: rgba(139, 92, 246, 0.08); border-radius: 12px; padding: 20px; margin: 20px 0; border: 1px solid rgba(139, 92, 246, 0.15); }
            .features li { color: #94a3b8; padding: 6px 0; }
            .footer { text-align: center; padding: 20px 30px; border-top: 1px solid rgba(139, 92, 246, 0.15); }
            .footer p { color: #64748b; font-size: 12px; margin: 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>${process.env.FROM_NAME}</h1>
              <p>Your account has been created successfully</p>
            </div>
            <div class="body">
              <h2>Hello, ${user.name}! 👋</h2>
              <p>Welcome aboard! Your account has been successfully created. Here's what you can do now:</p>
              <div class="features">
                <ul>
                  <li>Complete your profile with a bio and avatar</li>
                  <li>Explore all features of the platform</li>
                  <li>Connect with other members</li>
                </ul>
              </div>
              <p>If you didn't create this account, please ignore this email or contact our support team.</p>
              <p style="color: #a78bfa;">— The ${process.env.FROM_NAME} Team</p>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} ${process.env.FROM_NAME}. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`✉️  Welcome email sent to ${user.email}`);
  } catch (error) {
    console.error(`❌ Email send failed: ${error.message}`);
    // Don't throw - email failure shouldn't block registration
  }
};

/**
 * Send password changed confirmation email
 */
const sendPasswordChangedEmail = async (user) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: `"${process.env.FROM_NAME}" <${process.env.FROM_EMAIL}>`,
      to: user.email,
      subject: `Password Changed - ${process.env.FROM_NAME}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { margin: 0; padding: 0; background: #0f0f23; font-family: 'Segoe UI', Arial, sans-serif; }
            .container { max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border-radius: 16px; overflow: hidden; border: 1px solid rgba(239, 68, 68, 0.3); }
            .header { background: linear-gradient(135deg, #ef4444, #f97316); padding: 40px 30px; text-align: center; }
            .header h1 { color: #fff; margin: 0; font-size: 28px; }
            .body { padding: 40px 30px; color: #e2e8f0; }
            .body h2 { color: #fbbf24; margin-top: 0; }
            .body p { line-height: 1.7; color: #cbd5e1; }
            .alert { background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3); border-radius: 12px; padding: 16px; margin: 20px 0; }
            .alert p { color: #fca5a5; margin: 0; }
            .footer { text-align: center; padding: 20px 30px; border-top: 1px solid rgba(239, 68, 68, 0.15); }
            .footer p { color: #64748b; font-size: 12px; margin: 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔒 Password Changed</h1>
            </div>
            <div class="body">
              <h2>Hello, ${user.name}</h2>
              <p>Your password was successfully changed on <strong>${new Date().toLocaleString()}</strong>.</p>
              <div class="alert">
                <p>⚠️ If you did not make this change, please contact our support team immediately and secure your account.</p>
              </div>
              <p style="color: #a78bfa;">— The ${process.env.FROM_NAME} Team</p>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} ${process.env.FROM_NAME}. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`✉️  Password change email sent to ${user.email}`);
  } catch (error) {
    console.error(`❌ Email send failed: ${error.message}`);
  }
};

module.exports = { sendWelcomeEmail, sendPasswordChangedEmail };
