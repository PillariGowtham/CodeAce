const Team = require('./models/Team');

module.exports = (io) => {
  io.on('connection', (socket) => {
    console.log('A user connected');

    // Join team chat room
    socket.on('join-team', (teamId) => {
      socket.join(`team-${teamId}`);
    });

    // Handle team chat messages
    socket.on('team-message', async ({ teamId, message }) => {
      try {
        const team = await Team.findById(teamId);
        if (!team) return;

        io.to(`team-${teamId}`).emit('team-message', {
          userId: socket.user._id,
          userName: socket.user.name,
          message,
          timestamp: new Date()
        });
      } catch (err) {
        console.error('Error sending team message:', err);
      }
    });

    // Handle hackathon announcements
    socket.on('hackathon-announcement', ({ hackathonId, announcement }) => {
      io.to(`hackathon-${hackathonId}`).emit('announcement', {
        message: announcement,
        timestamp: new Date()
      });
    });

    socket.on('disconnect', () => {
      console.log('User disconnected');
    });
  });
};