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
        const { username, email, phoneNumber, password } = JSON.parse(event.body);

        // Validate required fields
        if (!username || !email || !password) {
            return {
                statusCode: 400,
                body: JSON.stringify({ success: false, message: 'Missing required fields' })
            };
        }

        // Get the users store
        const store = getStore('users');

        // Check if user already exists
        const existingUser = await store.get(email);
        if (existingUser) {
            return {
                statusCode: 400,
                body: JSON.stringify({ success: false, message: 'User already exists' })
            };
        }

        // Hash the password
        const salt = crypto.randomBytes(16).toString('hex');
        const hash = crypto.scryptSync(password, salt, 64).toString('hex');
        const passwordHash = `${salt}:${hash}`;

        // Store user data
        await store.set(email, {
            username,
            email,
            phoneNumber: phoneNumber || '',
            passwordHash,
            createdAt: new Date().toISOString()
        });

        return {
            statusCode: 200,
            body: JSON.stringify({ success: true, message: 'Registration successful!' })
        };

    } catch (error) {
        console.error('Registration error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ success: false, message: error.message })
        };
    }
};