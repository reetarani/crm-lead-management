
import nodemailer from "nodemailer";

export const sendPasswordResetEmail = async (email, resetUrl) => {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  return transporter.sendMail({
    from: `"CRM Lead Management" <${process.env.SMTP_USER}>`,
    to: email,
    subject: "Reset Your CRM Password",

    text: `Reset your password using this link: ${resetUrl}. This link expires in 15 minutes.`,

    html: `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;padding:30px;color:#1f2937">
        <h2>Password Reset Request</h2>
        <p>We received a request to reset your CRM account password.</p>
        <p>Click below to choose a new password. This link expires in 15 minutes.</p>
        <a href="${resetUrl}"
           style="display:inline-block;padding:13px 22px;background:#2563eb;color:#fff;text-decoration:none;border-radius:6px">
          Reset Password
        </a>
        <p>If you did not request this, ignore this email.</p>
      </div>
    `,
  });
};
