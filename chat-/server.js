import { Server } from "socket.io";
import mongoose from "mongoose";
const connectDB = async () => {
  try {
    await mongoose.connect("mongodb://localhost:27017", {
      dbName: "chat-app--",
    });
    console.log("MongoDB connected (socket server)");
  } catch (err) {
    console.error(err);
  }
};

connectDB();
const io = new Server(3001, {
  cors: {
    origin: "http://localhost:3000", 
    methods: ["GET", "POST"],
  },
});

const users = {};


io.on("connection", (socket) => {
  console.log("Connected:", socket.id);

  socket.on("join", (userId) => {
    socket.userId = userId;    
    if (users[userId]) {
      const oldSocketId = users[userId];
      const oldSocket = io.sockets.sockets.get(oldSocketId);
      if (oldSocket) {
        oldSocket.disconnect(true); 
      }
    }    
    users[userId] = socket.id;
    console.log("Users:", users);
  });

  socket.on("call-user", ({ to, signalData, from, name, isVideo }) => {
    console.log("[BACKEND:CALL-USER] Received call-user event");
    console.log("[BACKEND:CALL-USER] From:", from);
    console.log("[BACKEND:CALL-USER] To:", to);
    console.log("[BACKEND:CALL-USER] Caller name:", name);
    console.log("[BACKEND:CALL-USER] Video call:", isVideo);
    
    if (!to || !signalData || !from) {
      console.error("[BACKEND:CALL-USER] ERROR: Missing required fields - to, signalData, or from");
      return;
    }
    
    const targetSocket = users[to];
    console.log("[BACKEND:CALL-USER] Target socket ID:", targetSocket);
    
    if (!targetSocket) {
      console.error("[BACKEND:CALL-USER] ERROR: Target user not connected or not found");
      return;
    }

    console.log("[BACKEND:CALL-USER] Forwarding call to target user");
    io.to(targetSocket).emit("incoming-call", {
      from,
      name,
      signal: signalData,
      isVideo: Boolean(isVideo),
    });
    console.log("[BACKEND:CALL-USER] Call forwarded successfully");
  });

  socket.on("answer-call", ({ to, signal }) => {
    console.log("[BACKEND:ANSWER-CALL] Received answer-call event");
    console.log("[BACKEND:ANSWER-CALL] To (caller):", to);
    
    if (!to || !signal) {
      console.error("[BACKEND:ANSWER-CALL] ERROR: Missing required fields - to or signal");
      return;
    }
    
    const targetSocket = users[to];
    console.log("[BACKEND:ANSWER-CALL] Target socket ID:", targetSocket);
    
    if (!targetSocket) {
      console.error("[BACKEND:ANSWER-CALL] ERROR: Caller not connected or not found");
      return;
    }

    console.log("[BACKEND:ANSWER-CALL] Forwarding acceptance signal back to caller");
    io.to(targetSocket).emit("call-accepted", { signal });
    console.log("[BACKEND:ANSWER-CALL] Acceptance forwarded successfully");
  });

  socket.on("end-call", ({ to }) => {
    console.log("[BACKEND:END-CALL] Received end-call event");
    console.log("[BACKEND:END-CALL] To (remote user):", to);
    
    if (!to) {
      console.error("[BACKEND:END-CALL] ERROR: Missing required field - to");
      return;
    }
    
    const targetSocket = users[to];
    console.log("[BACKEND:END-CALL] Target socket ID:", targetSocket);
    
    if (!targetSocket) {
      console.error("[BACKEND:END-CALL] ERROR: Remote user not connected or not found");
      return;
    }

    console.log("[BACKEND:END-CALL] Forwarding call-ended signal to remote user");
    io.to(targetSocket).emit("call-ended");
    console.log("[BACKEND:END-CALL] Call-ended signal sent successfully");
  });
  
  socket.on("join_context", ({ chatId, channelId }) => {
    if (chatId) {
      socket.join(`chat:${chatId}`);
    }

    if (channelId) {
      socket.join(`channel:${channelId}`);
    }
  });

  socket.on("send_message", ({ to, message, from, chatId, channelId, senderId }) => {
    console.log("send_message payload:", { to, from, chatId, channelId });

    if (!from || !message) {
      console.error("Invalid message payload", { to, from, message, chatId, channelId });
      return;
    }

    const payload = {
      message,
      from,
      senderId,
      chatId: chatId || null,
      channelId: channelId || null,
    };

    // Channel mode: broadcast to everyone in this channel room except sender
    if (channelId) {
      socket.to(`channel:${channelId}`).emit("receive_message", payload);
      return;
    }

    // DM / group-chat mode: broadcast in chat room
    if (chatId) {
      socket.to(`chat:${chatId}`).emit("receive_message", payload);
    }

    // Direct DM fallback by receiver email
    if (to) {
      const targetSocket = users[to];
      if (targetSocket) {
        io.to(targetSocket).emit("receive_message", payload);
      }
    }
  });

  socket.on("typing", ({ to, from }) => {
    if (!to || !from) return;

    const targetSocket = users[to];
    if (targetSocket) {
      io.to(targetSocket).emit("typing", { from });
    }
  });

  socket.on("stop_typing", ({ to, from }) => {
    if (!to || !from) return;

    const targetSocket = users[to];
    if (targetSocket) {
      io.to(targetSocket).emit("stop_typing", { from });
    }
  });

  
  socket.on("disconnect", () => {
    const userId = socket.userId;
    if (users[userId] === socket.id) {
      delete users[userId];
    }
  });
});