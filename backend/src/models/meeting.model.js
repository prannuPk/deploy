import mongoose, { Schema } from "mongoose";

const meetingSchema = new Schema({
  user_id: { 
    type: String, 
    required: true 
  },
  meetingCode: { 
    type: String, 
    required: true 
  },
  password: { 
    type: String, 
    required: true 
  },
  isScheduled: {
    type: Boolean,
    default: false
  },
  scheduledDateTime: {
    type: Date,
    required: function() { 
      return this.isScheduled; 
    }
  },
  scheduledTitle: {
    type: String,
    required: function() {
      return this.isScheduled;
    }
  },
  status: {
    type: String,
    enum: ['pending', 'active', 'completed', 'cancelled'],
    default: 'pending'
  },
  // Keep original date field for creation timestamp
  date: { 
    type: Date, 
    default: Date.now, 
    required: true 
  }
});

// Compound index to prevent conflicts between scheduled and immediate meetings
meetingSchema.index({ meetingCode: 1, isScheduled: 1 }, { unique: true });

// Pre-save middleware to generate unique meeting code if not provided
meetingSchema.pre('save', async function(next) {
  if (!this.meetingCode) {
    // Generate a unique code based on timestamp and random string
    const timestamp = Date.now().toString(36);
    const randomStr = Math.random().toString(36).substring(2, 7);
    this.meetingCode = `${timestamp}-${randomStr}`;
  }
  next();
});

const Meeting = mongoose.model("Meeting", meetingSchema);

export { Meeting };
