import mongoose from "mongoose";

const conversationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
  lastMessage: { type: String, default: "" },
  unreadByAdmin: { type: Number, default: 0 },
  unreadByUser: { type: Number, default: 0 },
}, { timestamps: true });

export default mongoose.model("Conversation", conversationSchema);