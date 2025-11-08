const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173", // Your React app URL
    methods: ["GET", "POST"]
  }
});

// Store active users and their locations
const activeUsers = new Map();

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // User joins with their ID
  socket.on('join', (userId) => {
    activeUsers.set(socket.id, { userId, location: null });
    socket.join(userId);
  });

  // Update user location
  socket.on('updateLocation', (data) => {
    const { userId, latitude, longitude } = data;
    
    activeUsers.set(socket.id, {
      userId,
      location: { latitude, longitude, timestamp: Date.now() }
    });

    // Broadcast to all clients tracking this user
    io.emit('locationUpdate', {
      userId,
      latitude,
      longitude,
      timestamp: Date.now()
    });
  });

  // Request current location of a user
  socket.on('trackUser', (targetUserId) => {
    const user = Array.from(activeUsers.values())
      .find(u => u.userId === targetUserId);
    
    if (user && user.location) {
      socket.emit('locationUpdate', {
        userId: targetUserId,
        ...user.location
      });
    }
  });

  socket.on('disconnect', () => {
    activeUsers.delete(socket.id);
    console.log('User disconnected:', socket.id);
  });
});

// REST endpoint to get user location
app.get('/api/location/:userId', (req, res) => {
  const user = Array.from(activeUsers.values())
    .find(u => u.userId === req.params.userId);
  
  if (user && user.location) {
    res.json(user.location);
  } else {
    res.status(404).json({ error: 'User not found or location unavailable' });
  }
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});