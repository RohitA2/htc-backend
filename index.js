const express = require('express');
const dotenv = require('dotenv');
const bodyParser = require('body-parser');
const http = require('http');
const path = require('path');
const sequelize = require('./src/config/database');
const fs = require('fs');
const defineAssociations = require('./src/config/associations'); 
const setupRoutes = require('./src/routes'); 
const Message = require('./src/models/Message');
const { Server } = require("socket.io");
const cors = require('cors');
const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(cors());

// app.use(express.static("public"));
app.use('/uploads', express.static(path.join(__dirname, 'src', 'uploads')));


app.use(bodyParser.json()); 
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());

dotenv.config();
defineAssociations(); 
setupRoutes(app);    

// Basic Route
app.get('/', (req, res) => {
    res.send('Server is up and running!');
});

app.use((req, res, next) => {
  req.io = io; // Attach io to the request object
  next();
});

// const userSockets = {};  // Track user socket connections

// // When a user connects, store their socket ID
// io.on("connection", (socket) => {
//   console.log(`User connected: ${socket.id}`);

//   socket.on("join", (userId) => {
//     userSockets[userId] = socket.id;
//     console.log(`User ${userId} joined with socket ID: ${socket.id}`);
//   });

//   socket.on("disconnect", () => {
//     for (let userId in userSockets) {
//       if (userSockets[userId] === socket.id) {
//         delete userSockets[userId];
//         console.log(`User ${userId} disconnected`);
//         break;
//       }
//     }
//   });
// });

io.on("connection", (socket) => {
  console.log(`User connected: ${socket.id}`);

  socket.on("join-group", ({ userId, groupId }) => {
    socket.join(groupId);
    console.log(`User ${userId} joined group ${groupId}`);

    // Notify group members
    io.to(groupId).emit("message", {
      user: "System",
      text: `User ${userId} joined the group.`,
    });
  });

  socket.on("message", ({ userId, groupId, message }) => {
    io.to(groupId).emit("message", { user: userId, text: message });
  });

  socket.on("disconnect", () => {
    console.log(`User disconnected: ${socket.id}`);
  });
});


// Start the server
const port = process.env.PORT || 3000;
server.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
