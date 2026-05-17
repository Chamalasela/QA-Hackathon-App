const jwt = require('jsonwebtoken');

const JWT_SECRET = 'hackathon-secret-key-2026';
/* BUG S4: JWT expires in 7 days — way too long, no refresh token rotation */
const JWT_EXPIRY = '7d';

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Something went wrong' }); /* BUG U2: generic error message */
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Something went wrong' }); /* BUG U2: generic error */
  }
}

function authorizeRoles(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Something went wrong' }); /* BUG U2: generic error */
    }
    next();
  };
}

module.exports = { authenticateToken, authorizeRoles, JWT_SECRET, JWT_EXPIRY };
