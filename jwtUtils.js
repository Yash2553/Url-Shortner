const jwt = require("jsonwebtoken");

// Load the secret from environment variables
const JWT_SECRET = process.env.JWT_SECRET;

// Function to generate a JWT token
function generateToken(user) {
    // Define the payload
    const payload = {
        id: user.id, // Unique identifier for the user
        email: user.emails[0].value, // Email from Google profile
    };

    // Generate the token
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "60m" }); // Adjust `expiresIn` as needed
    return token;
}

// Function to verify and decode a JWT token
function verifyToken(token) {
    try {
        // Verify the token using the secret
        const decoded = jwt.verify(token, JWT_SECRET);
        return { valid: true, decoded };
    } catch (error) {
        // Handle invalid or expired token
        return { valid: false, error: error.message };
    }
}

module.exports = { generateToken, verifyToken };
