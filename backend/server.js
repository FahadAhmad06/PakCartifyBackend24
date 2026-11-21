import app from "./app.js";
import dotenv from "dotenv";
import { connectMongoDB } from "./config/db.js";
import { v2 as cloudinary } from "cloudinary";
import http from "http";
import { Server } from "socket.io";

dotenv.config({ path: "./backend/config/config.env" });

connectMongoDB();

// ! Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
});

//  Handle Uncaught exception Error
process.on("uncaughtException", (err) => {
  console.log(`Error : ${err.message}`);
  console.log(`Server is Shutting Down, Due to uncaught exception`);

  process.exit(1);
});

// ! http server + socket.io setup
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
  },
});

const onlineUsers = new Map();
let adminSocketId = null;

io.on("connection", (socket) => {
  console.log("New socket connected:", socket.id);

  socket.on("register", ({ userId, role }) => {
    if (role === "admin") {
      adminSocketId = socket.id;
    } else {
      onlineUsers.set(userId, socket.id);
    }
  });

  socket.on("markAsRead", ({ conversationId, readerRole, receiverId }) => {
    const targetSocketId = readerRole === "admin"
        ? onlineUsers.get(receiverId)
        : adminSocketId;

    if (targetSocketId) {
        io.to(targetSocketId).emit("messagesSeen", { conversationId });
    }
});

  socket.on(
    "sendMessage",
    ({ conversationId, senderId, senderRole, message, receiverId }) => {
      const targetSocketId =
        senderRole === "admin" ? onlineUsers.get(receiverId) : adminSocketId;

      const payload = {
        conversationId,
        senderId,
        senderRole,
        message,
        createdAt: new Date(),
      };

      if (targetSocketId) {
        io.to(targetSocketId).emit("receiveMessage", payload);
      }

      socket.emit("receiveMessage", payload);
    },
  );

  socket.on("disconnect", () => {
    for (const [userId, sId] of onlineUsers.entries()) {
      if (sId === socket.id) onlineUsers.delete(userId);
    }
    if (adminSocketId === socket.id) adminSocketId = null;
    console.log("Socket disconnected:", socket.id);
  });
});

const port = process.env.PORT || 4000;
server.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

process.on("unhandledRejection", (err) => {
  console.log(`Error : ${err.message}`);
  console.log(`Server is Shutting Down, Due to unhandled promise rejection`);
  server.close(() => {
    process.exit(1);
  });
});
