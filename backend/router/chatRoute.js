import express from "express";
import { v2 as cloudinary } from "cloudinary";
import Conversation from "../model/Conversation.js";
import Message from "../model/Message.js";
import { verifyUserAuth, roleBaseAccess } from "../midleware/userAuth.js";

const router = express.Router();

// Customer: apni conversation get/create karo
router.get("/conversation", verifyUserAuth, async (req, res) => {
  try {
    let convo = await Conversation.findOne({ user: req.user._id });
    if (!convo) {
      convo = await Conversation.create({ user: req.user._id });
    }
    res.status(200).json(convo);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Admin: sab conversations (inbox list) — sirf admin access kare
router.get(
  "/admin/conversations",
  verifyUserAuth,
  roleBaseAccess("admin"),
  async (req, res) => {
    try {
      const convos = await Conversation.find()
        .populate("user", "name email avatar createdAt")
        .sort({ updatedAt: -1 });
      res.status(200).json(convos);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },
);

// Messages history (kisi bhi conversation ki)
router.get("/messages/:conversationId", verifyUserAuth, async (req, res) => {
  try {
    const messages = await Message.find({
      conversation: req.params.conversationId,
    }).sort({ createdAt: 1 });
    res.status(200).json(messages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Naya message save karo (text + optional image)
router.post("/messages", verifyUserAuth, async (req, res) => {
  try {
    const { conversationId, message, senderRole } = req.body;
    let imageData;

    if (req.files && req.files.image) {
      const file = req.files.image;
      const fileStr = `data:${file.mimetype};base64,${file.data.toString("base64")}`;
      const uploadResult = await cloudinary.uploader.upload(fileStr, {
        folder: "chat_images",
      });
      imageData = { public_id: uploadResult.public_id, url: uploadResult.secure_url };
    }

    const newMsg = await Message.create({
      conversation: conversationId,
      sender: req.user._id,
      senderRole,
      message: message || "",
      image: imageData,
    });

    await Conversation.findByIdAndUpdate(conversationId, {
      lastMessage: imageData ? "📷 Photo" : message,
      $inc: senderRole === "admin" ? { unreadByUser: 1 } : { unreadByAdmin: 1 },
    });

    res.status(201).json(newMsg);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Messages ko read mark karo
router.put("/read/:conversationId", verifyUserAuth, async (req, res) => {
  try {
    const callerRole = req.user.role === "admin" ? "admin" : "user";
    const otherRole = callerRole === "admin" ? "user" : "admin";

    await Message.updateMany(
      {
        conversation: req.params.conversationId,
        senderRole: otherRole,
        isRead: false,
      },
      { isRead: true },
    );

    await Conversation.findByIdAndUpdate(req.params.conversationId, {
      [callerRole === "admin" ? "unreadByAdmin" : "unreadByUser"]: 0,
    });

    res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


router.delete("/messages/:messageId", verifyUserAuth, async (req, res) => {
  try {
    const msg = await Message.findById(req.params.messageId);

    if (!msg) {
      return res.status(404).json({ message: "Message not found" });
    }

    const isOwner = msg.sender.toString() === req.user._id.toString();
    const isAdmin = req.user.role === "admin";

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: "Not authorized to delete this message" });
    }

    // Agar image thi to Cloudinary se bhi delete kar dein
    if (msg.image?.public_id) {
      await cloudinary.uploader.destroy(msg.image.public_id);
    }

    await Message.findByIdAndDelete(req.params.messageId);

    res.status(200).json({ success: true, messageId: req.params.messageId, conversationId: msg.conversation });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


// Delete complete conversation (Admin only)
router.delete(
  "/admin/conversation/:conversationId",
  verifyUserAuth,
  roleBaseAccess("admin"),
  async (req, res) => {
    try {
      const { conversationId } = req.params;

      const conversation = await Conversation.findById(conversationId);

      if (!conversation) {
        return res.status(404).json({
          message: "Conversation not found",
        });
      }

      // Delete all chat images from Cloudinary
      const messages = await Message.find({
        conversation: conversationId,
      });

      for (const msg of messages) {
        if (msg.image?.public_id) {
          await cloudinary.uploader.destroy(msg.image.public_id);
        }
      }

      // Delete all messages
      await Message.deleteMany({
        conversation: conversationId,
      });

      // Delete conversation
      await Conversation.findByIdAndDelete(conversationId);

      res.status(200).json({
        success: true,
        message: "Conversation deleted successfully",
      });
    } catch (error) {
      res.status(500).json({
        message: error.message,
      });
    }
  }
);

// Clear chat but keep conversation (Admin only)
router.delete(
  "/admin/conversation/:conversationId/messages",
  verifyUserAuth,
  roleBaseAccess("admin"),
  async (req, res) => {
    try {
      const { conversationId } = req.params;

      const messages = await Message.find({
        conversation: conversationId,
      });

      for (const msg of messages) {
        if (msg.image?.public_id) {
          await cloudinary.uploader.destroy(msg.image.public_id);
        }
      }

      await Message.deleteMany({
        conversation: conversationId,
      });

      await Conversation.findByIdAndUpdate(conversationId, {
        lastMessage: "",
        unreadByAdmin: 0,
        unreadByUser: 0,
      });

      res.status(200).json({
        success: true,
        message: "Chat cleared successfully",
      });
    } catch (error) {
      res.status(500).json({
        message: error.message,
      });
    }
  }
);



export default router;