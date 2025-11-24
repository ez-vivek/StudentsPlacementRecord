import nodemailer from "nodemailer";

const smtpUser = process.env.SMTP_USER;
const smtpPass = process.env.SMTP_PASSWORD || process.env.SMTP_PASS;

const smtpHost = process.env.SMTP_HOST || "smtp.gmail.com";
const smtpPort = parseInt(process.env.SMTP_PORT || "587");

// Use secure connection automatically for port 465 (SMTPS). For 587 we use
// STARTTLS (secure: false) which is common for submission ports.
const secure = smtpPort === 465;

const transporter = nodemailer.createTransport({
  host: smtpHost,
  port: smtpPort,
  secure,
  auth: {
    user: smtpUser,
    pass: smtpPass,
  },
  // Improve reliability when the remote server uses TLS and avoid long hangs
  // during verification in flaky networks.
  connectionTimeout: 10_000,
  greetingTimeout: 10_000,
  socketTimeout: 10_000,
  tls: {
    // Allow self-signed / internal certificates in development only if the
    // environment explicitly opts in by setting `SMTP_ALLOW_INSECURE_TLS=true`.
    rejectUnauthorized: process.env.SMTP_ALLOW_INSECURE_TLS !== "true",
  },
});

if (!smtpUser || !smtpPass) {
  console.warn("SMTP credentials not configured. Email sending will likely fail in development.");
  } else {
  transporter.verify().then(() => {
    console.log("SMTP transporter verified");
  }).catch((err) => {
    console.warn("SMTP transporter verification failed:", err && err.message ? err.message : err);
    // Log full error for debugging when available
    if (err && (err as any).stack) console.debug((err as any).stack);
    console.warn("Common causes: wrong host/port, blocked network/firewall, or TLS settings. For development use a test account (Ethereal) or set SMTP_ALLOW_INSECURE_TLS=true to allow self-signed certs.");
  });
}

export async function sendOTPEmail(email: string, otp: string, name: string): Promise<boolean> {
  const mailOptions = {
    from: process.env.SMTP_USER || "noreply@placement.system",
    to: email,
    subject: "Your OTP Code - Student Placement System",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #3b82f6;">Welcome to Student Placement System</h2>
        <p>Hello ${name},</p>
        <p>Your OTP code is:</p>
        <div style="background-color: #f3f4f6; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 8px; margin: 20px 0;">
          ${otp}
        </div>
        <p>This code will expire in 10 minutes.</p>
        <p>If you didn't request this code, please ignore this email.</p>
        <p>Best regards,<br>Student Placement Team</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log("OTP email sent to:", email);
    return true;
  } catch (error) {
    console.error("Error sending OTP email:", error);
    return false;
  }
}

export async function sendApplicationSubmittedEmail(
  studentEmail: string,
  studentName: string,
  jobTitle: string,
  company: string
): Promise<boolean> {
  const mailOptions = {
    from: process.env.SMTP_USER || "noreply@placement.system",
    to: studentEmail,
    subject: `Application Submitted - ${jobTitle}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #3b82f6;">Application Submitted Successfully</h2>
        <p>Hello ${studentName},</p>
        <p>Your application has been submitted successfully!</p>
        <div style="background-color: #f3f4f6; padding: 20px; margin: 20px 0; border-left: 4px solid #3b82f6;">
          <h3 style="margin: 0 0 10px 0;">Job Details:</h3>
          <p style="margin: 5px 0;"><strong>Position:</strong> ${jobTitle}</p>
          <p style="margin: 5px 0;"><strong>Company:</strong> ${company}</p>
          <p style="margin: 5px 0;"><strong>Status:</strong> Pending Review</p>
        </div>
        <p>We'll notify you once your application has been reviewed.</p>
        <p>Best regards,<br>Student Placement Team</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log("Application submitted email sent to:", studentEmail);
    return true;
  } catch (error) {
    console.error("Error sending application submitted email:", error);
    return false;
  }
}

export async function sendApplicationAcceptedEmail(
  studentEmail: string,
  studentName: string,
  jobTitle: string,
  company: string
): Promise<boolean> {
  const mailOptions = {
    from: process.env.SMTP_USER || "noreply@placement.system",
    to: studentEmail,
    subject: `🎉 Application Accepted - ${jobTitle}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #10b981;">Congratulations! Your Application Has Been Accepted</h2>
        <p>Hello ${studentName},</p>
        <p>Great news! Your application has been accepted.</p>
        <div style="background-color: #f0fdf4; padding: 20px; margin: 20px 0; border-left: 4px solid #10b981;">
          <h3 style="margin: 0 0 10px 0; color: #10b981;">Job Details:</h3>
          <p style="margin: 5px 0;"><strong>Position:</strong> ${jobTitle}</p>
          <p style="margin: 5px 0;"><strong>Company:</strong> ${company}</p>
          <p style="margin: 5px 0;"><strong>Status:</strong> ✅ Accepted</p>
        </div>
        <p>The company will contact you soon with next steps.</p>
        <p>Best of luck with your new opportunity!</p>
        <p>Best regards,<br>Student Placement Team</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log("Application accepted email sent to:", studentEmail);
    return true;
  } catch (error) {
    console.error("Error sending application accepted email:", error);
    return false;
  }
}

export async function sendApplicationDeclinedEmail(
  studentEmail: string,
  studentName: string,
  jobTitle: string,
  company: string
): Promise<boolean> {
  const mailOptions = {
    from: process.env.SMTP_USER || "noreply@placement.system",
    to: studentEmail,
    subject: `Application Update - ${jobTitle}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #ef4444;">Application Status Update</h2>
        <p>Hello ${studentName},</p>
        <p>Thank you for your interest in the position.</p>
        <div style="background-color: #fef2f2; padding: 20px; margin: 20px 0; border-left: 4px solid #ef4444;">
          <h3 style="margin: 0 0 10px 0;">Job Details:</h3>
          <p style="margin: 5px 0;"><strong>Position:</strong> ${jobTitle}</p>
          <p style="margin: 5px 0;"><strong>Company:</strong> ${company}</p>
          <p style="margin: 5px 0;"><strong>Status:</strong> Not Selected</p>
        </div>
        <p>While you weren't selected for this role, we encourage you to keep applying to other opportunities.</p>
        <p>Don't give up - the right opportunity is out there!</p>
        <p>Best regards,<br>Student Placement Team</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log("Application declined email sent to:", studentEmail);
    return true;
  } catch (error) {
    console.error("Error sending application declined email:", error);
    return false;
  }
}

export async function sendAdminNotificationEmail(
  adminEmail: string,
  studentName: string,
  jobTitle: string
): Promise<boolean> {
  const mailOptions = {
    from: process.env.SMTP_USER || "noreply@placement.system",
    to: adminEmail,
    subject: `New Application Received - ${jobTitle}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #3b82f6;">New Application Received</h2>
        <p>A new application has been submitted:</p>
        <div style="background-color: #f3f4f6; padding: 20px; margin: 20px 0;">
          <p style="margin: 5px 0;"><strong>Student:</strong> ${studentName}</p>
          <p style="margin: 5px 0;"><strong>Position:</strong> ${jobTitle}</p>
          <p style="margin: 5px 0;"><strong>Status:</strong> Pending Review</p>
        </div>
        <p>Please review the application in your admin dashboard.</p>
        <p>Best regards,<br>Student Placement System</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log("Admin notification email sent to:", adminEmail);
    return true;
  } catch (error) {
    console.error("Error sending admin notification email:", error);
    return false;
  }
}
