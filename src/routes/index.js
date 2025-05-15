// routes/index.js
const userRoutes = require('./userRoutes');
const authRoutes = require('./authRoutes');
const uploadRoutes = require('./uploadRoutes');
const sendMessageRoute = require('./sendMessageRoute');



module.exports = (app) => {

  // Authentication routes for all roles
  app.use('/api/users', userRoutes);
  app.use('/api/auth', authRoutes);
  app.use('/api', uploadRoutes);
  app.use('/api', sendMessageRoute);


};
