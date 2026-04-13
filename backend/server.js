import "dotenv/config";
import { Server } from "socket.io";
import mongoose from "mongoose";

const PORT = Number(process.env.SOCKET_PORT || 3001);
const CORS_ORIGIN = process.env.CORS_ORIGIN || "http://localhost:3000";
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017";
const MONGO_DB_NAME = process.env.MONGO_DB_NAME || "chat-app--";

const connectDB = async () => {
  try {
    await mongoose.connect(MONGO_URI, {
      dbName: MONGO_DB_NAME,
    }).then(()=>{
      console.log("Connected to MongoDB");
    })
  } catch (err) {
    console.error(err);
  }
};

connectDB();
const io = new Server(PORT, {
  cors: {
    origin: CORS_ORIGIN,
    methods: ["GET", "POST"],
  },
});

console.log(`Socket server running on port ${PORT}`);

const users = {};

const normalizeUserKey = (value) => String(value || "").trim().toLowerCase();


io.on("connection", (socket) => {
  socket.on("join", (userId) => {
    const userKey = normalizeUserKey(userId);
    if (!userKey) return;

    socket.userId = userKey;
    if (users[userKey]) {
      const oldSocketId = users[userKey];
      const oldSocket = io.sockets.sockets.get(oldSocketId);
      if (oldSocket) {
        oldSocket.disconnect(true); 
      }
    }
    users[userKey] = socket.id;
  });

  socket.on("call-user", ({ to, signalData, from, name, isVideo }) => {
    if (!to || !signalData || !from) {
      console.error("[BACKEND:CALL-USER] ERROR: Missing required fields - to, signalData, or from");
      return;
    }
    
    const targetSocket = users[normalizeUserKey(to)];
    
    if (!targetSocket) {
      console.error("[BACKEND:CALL-USER] ERROR: Target user not connected or not found");
      return;
    }

    io.to(targetSocket).emit("incoming-call", {
      from,
      name,
      signal: signalData,
      isVideo: Boolean(isVideo),
    });
  });

  socket.on("answer-call", ({ to, signal }) => {
    if (!to || !signal) {
      console.error("[BACKEND:ANSWER-CALL] ERROR: Missing required fields - to or signal");
      return;
    }
    
    const targetSocket = users[normalizeUserKey(to)];
    
    if (!targetSocket) {
      console.error("[BACKEND:ANSWER-CALL] ERROR: Caller not connected or not found");
      return;
    }

    io.to(targetSocket).emit("call-accepted", { signal });
  });

  socket.on("end-call", ({ to }) => {
    if (!to) {
      console.error("[BACKEND:END-CALL] ERROR: Missing required field - to");
      return;
    }
    
    const targetSocket = users[normalizeUserKey(to)];
    
    if (!targetSocket) {
      console.error("[BACKEND:END-CALL] ERROR: Remote user not connected or not found");
      return;
    }

    io.to(targetSocket).emit("call-ended");
  });
  
  socket.on("join_context", ({ chatId, channelId }) => {
    if (chatId) {
      socket.join(`chat:${chatId}`);
    }

    if (channelId) {
      socket.join(`channel:${channelId}`);
    }
  });

  socket.on("send_message", ({ _id, to, message, from, chatId, channelId, senderId, createdAt, isDeleted, contentType, fileUrl, fileName, mimeType, replyTo }) => {
    if (!from || !message) {
      console.error("Invalid message payload", { to, from, message, chatId, channelId });
      return;
    }

    const payload = {
      _id,
      message,
      from,
      senderId,
      chatId: chatId || null,
      channelId: channelId || null,
      createdAt: createdAt || null,
      isDeleted: Boolean(isDeleted),
      contentType: contentType || "text",
      fileUrl: fileUrl || "",
      fileName: fileName || "",
      mimeType: mimeType || "",
      replyTo: replyTo || null,
    };

    // Channel mode: broadcast to everyone in this channel room except sender
    if (channelId) {
      socket.to(`channel:${channelId}`).emit("receive_message", payload);
      return;
    }

    // 1:1 DM mode: if receiver email is present, deliver directly for lowest latency.
    if (chatId && to) {
      const targetSocket = users[normalizeUserKey(to)];
      if (targetSocket) {
        io.to(targetSocket).emit("receive_message", payload);
      }
      return;
    }

    // Group-chat mode: broadcast in chat room.
    if (chatId) {
      socket.to(`chat:${chatId}`).emit("receive_message", payload);
      return;
    }

    // Direct DM fallback by receiver email (when no chat room context exists)
    if (to) {
      const targetSocket = users[normalizeUserKey(to)];
      if (targetSocket) {
        io.to(targetSocket).emit("receive_message", payload);
      }
    }
  });

  socket.on("delete_message", ({ to, messageId, chatId, channelId }) => {
    if (!messageId) {
      console.error("Invalid delete_message payload", { to, messageId, chatId, channelId });
      return;
    }

    const payload = {
      messageId,
      chatId: chatId || null,
      channelId: channelId || null,
    };

    if (channelId) {
      socket.to(`channel:${channelId}`).emit("receive_message_deleted", payload);
      return;
    }

    if (chatId && to) {
      const targetSocket = users[normalizeUserKey(to)];
      if (targetSocket) {
        io.to(targetSocket).emit("receive_message_deleted", payload);
      }
      return;
    }

    if (chatId) {
      socket.to(`chat:${chatId}`).emit("receive_message_deleted", payload);
      return;
    }

    if (to) {
      const targetSocket = users[normalizeUserKey(to)];
      if (targetSocket) {
        io.to(targetSocket).emit("receive_message_deleted", payload);
      }
    }
  });

  
  socket.on("disconnect", () => {
    const userId = socket.userId;
    if (userId && users[userId] === socket.id) {
      delete users[userId];
    }
  });
});