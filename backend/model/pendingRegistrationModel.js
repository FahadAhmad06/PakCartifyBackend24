import mongoose from "mongoose";

const pendingRegistrationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    phone: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      required: true,
    },
    avatar: {
      type: String,
      default: "",
    },
    otp: {
      type: String,
      required: true,
    },
    otpExpire: {
      type: Date,
      required: true,
    },
    otpSentAt: {
      type: Date,
      required: true,
    },
  },
  { timestamps: true },
);

pendingRegistrationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 900 });

export default mongoose.model("PendingRegistration", pendingRegistrationSchema);
