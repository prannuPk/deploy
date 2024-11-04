import mongoose, { Schema } from "mongoose";

const meetingSchema = new Schema({
  user_id: { type: String, required: true }, // Ensure user_id is required
  meetingCode: { type: String, required: true, unique: true }, // Unique constraint to prevent duplicates
  password: { type: String, required: true }, // Password field to store hashed password
  date: { type: Date, default: Date.now, required: true }
});

const Meeting = mongoose.model("Meeting", meetingSchema);

export { Meeting };
