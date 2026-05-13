const crypto = require('crypto');

// Temporary in-memory storage for demo
// In production, this should use Netlify Blobs
const users = {};

exports.handler = async (event) => {
    // Only allow POST requests
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ success: false, message: 'Method not allowed' })
        };
    }

    try {
        const { email, password } = JSON.parse(event.body);

        // Validate required fields
        if (!email || !password) {
            return {
                statusCode: 400,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ success: false, message: 'Email and password required' })
            };
        }

        console.log('Login attempt:', { email });

        // TEMPORARY: Demo login - accept any credentials
        // In production, you'd check against stored users
        
        // For demo purposes, accept anything
        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                success: true, 
                message: 'Login successful! (Demo mode)',
                user: { username: email.split('@')[0], email: email }
            })
        };

    } catch (error) {
        console.error('Login error:', error);
        return {
            statusCode: 500,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ success: false, message: error.message })
        };
    }
};