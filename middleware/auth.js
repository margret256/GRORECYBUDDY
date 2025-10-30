// Middleware to protect private routes
function isAuthenticated(req, res, next) {
  if (req.session && req.session.user) {
    // User is logged in
    return next();
  } else {
    // User is not logged in
    return res.status(401).json({ message: 'Unauthorized. Please log in first.' });
  }
}

module.exports = { isAuthenticated };
