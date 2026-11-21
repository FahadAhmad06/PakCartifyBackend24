import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
  conversation: { type: mongoose.Schema.Types.ObjectId, ref: "Conversation", required: true },
  sender: { type: mongoose.Schema.Types.ObjectId, required: true },
  senderRole: { type: String, enum: ["user", "admin"], required: true },
  message: { type: String, default: "" },
  image: {
    public_id: String,
    url: String,
  },
  isRead: { type: Boolean, default: false },
}, { timestamps: true });

export default mongoose.model("Message", messageSchema);