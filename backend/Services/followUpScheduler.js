
import cron from "node-cron";

import FollowUp from "../models/FollowUp.js";
import User from "../models/User.js";
import {
  sendFollowUpReminderEmail,
} from "./emailService.js";

let isRunning = false;

const runFollowUpReminders = async () => {
  if (isRunning) return;

  isRunning = true;

  try {
    // Send reminders 15 minutes before the scheduled time.
    const reminderDeadline = new Date(
      Date.now() + 15 * 60 * 1000
    );

    const dueFollowUps = await FollowUp.find({
      status: "pending",
      scheduledAt: { $lte: reminderDeadline },
      reminderSentAt: null,
    })
      .populate("lead")
      .populate("createdBy", "username email role isActive");

    if (!dueFollowUps.length) return;

    // Fetch all active Admin accounts once.
    const admins = await User.find({
      role: "admin",
      isActive: true,
    }).select("username email");

    for (const followUp of dueFollowUps) {
      try {
        // Skip if the lead has been deleted.
        if (!followUp.lead || followUp.lead.isDeleted) {
          continue;
        }

        const recipients = admins.map((admin) => admin.email);

        // Include the active Staff/Admin creator.
        if (
          followUp.createdBy?.isActive &&
          followUp.createdBy.email
        ) {
          recipients.push(followUp.createdBy.email);
        }

        // Remove duplicate email addresses.
        const uniqueRecipients = [
          ...new Set(recipients.map((email) => email.toLowerCase())),
        ];

        if (!uniqueRecipients.length) {
          console.warn(
            `No active email recipients for follow-up ${followUp._id}`
          );
          continue;
        }

        await sendFollowUpReminderEmail(
          uniqueRecipients,
          followUp,
          followUp.lead,
          followUp.createdBy || {
            username: "CRM User",
          }
        );

        // Mark as sent only after email succeeds.
        const result = await FollowUp.updateOne(
          {
            _id: followUp._id,
            status: "pending",
            reminderSentAt: null,
          },
          {
            $set: {
              reminderSentAt: new Date(),
            },
          }
        );

        if (result.modifiedCount) {
          console.log(
            `Follow-up reminder sent: ${followUp._id}`
          );
        }
      } catch (error) {
        console.error(
          `Failed reminder for follow-up ${followUp._id}:`,
          error.message
        );
      }
    }
  } catch (error) {
    console.error("Follow-up scheduler error:", error);
  } finally {
    isRunning = false;
  }
};

export const startFollowUpScheduler = () => {
  console.log("Follow-up email scheduler started.");

  // Check for reminders every minute.
  cron.schedule("* * * * *", runFollowUpReminders);

  // Also check immediately when the server starts.
  runFollowUpReminders();
};
