import { Meeting } from "../models/meeting.model.js";
import cron from "node-cron";

const checkAndUpdateMeetings = async () => {
  try {
    const now = new Date();
    // Find meetings that are scheduled and should be starting
    const upcomingMeetings = await Meeting.find({
      isScheduled: true,
      status: 'pending',
      scheduledDateTime: {
        $lte: now,
      }
    });

    for (const meeting of upcomingMeetings) {
      // Update meeting status to active when it's time
      meeting.status = 'active';
      await meeting.save();

      // Optional: Clean up meetings that are more than 24 hours old
      await Meeting.updateMany(
        {
          isScheduled: true,
          status: 'active',
          scheduledDateTime: {
            $lt: new Date(now.getTime() - 24 * 60 * 60 * 1000)
          }
        },
        {
          $set: { status: 'completed' }
        }
      );
    }
  } catch (error) {
    console.error('Scheduler error:', error);
  }
};

const startScheduler = () => {
  // Run every minute
  cron.schedule('* * * * *', checkAndUpdateMeetings);
  
  // Optional: Run cleanup job daily at midnight
  cron.schedule('0 0 * * *', async () => {
    try {
      const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
      await Meeting.deleteMany({
        isScheduled: true,
        status: 'completed',
        scheduledDateTime: { $lt: twoDaysAgo }
      });
    } catch (error) {
      console.error('Cleanup error:', error);
    }
  });
};

export { startScheduler };
