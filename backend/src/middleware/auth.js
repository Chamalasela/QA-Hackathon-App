const jwt = require('jsonwebtoken');

const JWT_SECRET = 'hackathon-secret-key-2026';
const JWT_EXPIRY = '7d';
const VALID_TEAMS = [1, 2, 3, 4, 5, 6];

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Something went wrong' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Something went wrong' });
  }
}

function authorizeRoles(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Something went wrong' });
    }
    next();
  };
}

module.exports = { authenticateToken, authorizeRoles, JWT_SECRET, JWT_EXPIRY, VALID_TEAMS };
