const { getStore } = require('@netlify/blobs');
const crypto = require('crypto');

exports.handler = async (event) => {
    // Only allow POST requests
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ success: false, message: 'Method not allowed' })
        };
    }

    try {
        const { email, password } = JSON.parse(event.body);

        // Validate required fields
        if (!email || !password) {
            return {
                statusCode: 400,
                body: JSON.stringify({ success: false, message: 'Email and password required' })
            };
        }

        // Get the users store
        const store = getStore('users');

        // Find user by email
        const user = await store.get(email);
        if (!user) {
            return {
                statusCode: 401,
                body: JSON.stringify({ success: false, message: 'Invalid email or password' })
            };
        }

        // Verify password
        const [salt, storedHash] = user.passwordHash.split(':');
        const hash = crypto.scryptSync(password, salt, 64).toString('hex');

        if (hash === storedHash) {
            // Don't send password hash back to client
            const { passwordHash, ...userWithoutPassword } = user;
            return {
                statusCode: 200,
                body: JSON.stringify({
                    success: true,
                    message: 'Login successful!',
                    user: userWithoutPassword
                })
            };
        } else {
            return {
                statusCode: 401,
                body: JSON.stringify({ success: false, message: 'Invalid email or password' })
            };
        }

    } catch (error) {
        console.error('Login error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ success: false, message: error.message })
        };
    }
};