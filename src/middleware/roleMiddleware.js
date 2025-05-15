// Middleware to check if the user is an admin
const authenticateAdmin = (req, res, next) => {
    if (req.user.role !== 'Admin') {
      return res.status(403).json({ message: 'Access Denied: Admins Only' });
    }
    next();
  };
  
  // Middleware to check if the user is an advertiser
  const authenticateAdvertiser = (req, res, next) => {
    if (req.user.role !== 'Advertiser') {
      return res.status(403).json({ message: 'Access Denied: Advertisers Only' });
    }
    next();
  };
  
  // Middleware to check if the user is a client
  const authenticateClient = (req, res, next) => {
    if (req.user.role !== 'Client') {
      return res.status(403).json({ message: 'Access Denied: Clients Only' });
    }
    next();
  };
  
  
  module.exports = { 
    authenticateAdmin, 
    authenticateAdvertiser, 
    authenticateClient, 
  };
  