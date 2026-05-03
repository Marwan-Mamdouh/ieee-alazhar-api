// const jwt = require('jsonwebtoken');

// const JWT_SECRET = process.env.JWT_SECRET; 

// const authenticateToken = (req, res, next) => {
//     const authHeader = req.headers['authorization'];
//     const token = authHeader && authHeader.split(' ')[1]; 
    
//     if (token == null) {
//         return res.status(401).json({ message: 'Authentication Access Token is required.' });
//     }

//     jwt.verify(token, JWT_SECRET, (err, user) => {
//         if (err) {
//             console.log('Access Token Verification Failed:', err.message);
//             return res.status(403).json({ message: 'Access Token is invalid or expired.' });
//         }
        
//         req.user = user;
//         next();
//     });
// };

// module.exports = {
//     authenticateToken
// };