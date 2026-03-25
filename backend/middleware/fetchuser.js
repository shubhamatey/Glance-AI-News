const jwt = require('jsonwebtoken');

// Middleware to authenticate and verify user via JWT
const fetchuser = (req, res, next) => {
    // Get token from 'auth-token' header
    const token = req.header('auth-token');
    
    // Check if token exists
    if (!token) {
        return res.status(401).json({ error: "Access Denied! No authentication token provided." });
    }

    try {
        // Verify token with the secret key used during login
        const data = jwt.verify(token, 'glance_secret_key'); 
        req.user = data; 
        
        // Pass control to the next middleware or route handler
        next(); 
    } catch (error) {
        // Handle invalid or expired tokens
        res.status(401).json({ error: "Invalid Token! Access unauthorized." });
    }
}

module.exports = fetchuser;