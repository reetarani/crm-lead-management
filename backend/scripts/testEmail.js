import "dotenv/config";
import { sendPasswordResetEmail } from "../services/emailService.js";

const testEmail = async () => {
  try {
    await sendPasswordResetEmail(
      process.env.SMTP_USER,
      "http://localhost:5173/reset-password/test-token"
    );

    console.log("Test email sent successfully!");
  } catch (error) {
    console.error("Email sending failed:", error.message);
  }
};

testEmail();