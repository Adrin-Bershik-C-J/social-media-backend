// socket.js
const { Server } = require("socket.io");

let io; // will hold the singleton instance

exports.init = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || "*", // frontend URL
      methods: ["GET", "POST", "PATCH"],
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    /*  
       ↳ The client should connect like:
         const socket = io(API_URL, { query: { userId } });
       ↓ Every user sits in their own private “room”
    */
    const { userId } = socket.handshake.query;
    if (userId) socket.join(userId);

    socket.on("disconnect", () => {
      // keep here if you later want to track presence
    });
  });

  return io;
};

exports.io = () => {
  if (!io) throw new Error("Socket.io not initialised");
  return io;
};
