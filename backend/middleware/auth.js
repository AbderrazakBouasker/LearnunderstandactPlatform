import jwt from "jsonwebtoken";
import logger from '../logger.js';

export const verifyToken = async (req, res, next) => {
  try {
    let token = req.header("Authorization");

    if (!token) {
      logger.warn('Authorization attempt with missing token', {
        path: req.path,
        method: req.method,
        ip: req.ip
      });
      return res.status(403).json("Not Authorized");
    }

    if (token.startsWith("Bearer ")) {
      token = token.slice(7, token.length).trimLeft();
    }

    const verified = jwt.verify(token, process.env.jwtSecret);
    req.user = verified;
    next();
  } catch (error) {
    logger.error('Error verifying token', {
      error: error.message,
      type: error.name, // JWT errors have specific names like 'TokenExpiredError'
      stack: error.stack,
      path: req.path,
      method: req.method,
      ip: req.ip
    });
    
    // More specific error responses based on error type
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token has expired' });
    } else if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token' });
    }
    
    res.status(500).json({ error: error.message });
  }
};
