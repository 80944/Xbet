const { getStore } = require('@netlify/blobs');
const crypto = require('crypto');

exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ success: false, message: 'Method not allowed' })
        };
    }

    try {
        const { username, email, phoneNumber, password } = JSON.parse(event.body);

        if (!username || !email || !password) {
            return {
                statusCode: 400,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ success: false, message: 'Missing required fields' })
            };
        }

        // This will AUTO-CREATE the blob store
        const store = getStore('users');

        // Check if user exists
        const existingUser = await store.get(email);
        if (existingUser) {
            return {
                statusCode: 400,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ success: false, message: 'User already exists' })
            };
        }

        // Hash password
        const salt = crypto.randomBytes(16).toString('hex');
        const hash = crypto.scryptSync(password, salt, 64).toString('hex');
        
        // Store user
        await store.set(email, {
            username,
            email,
            phoneNumber: phoneNumber || '',
            passwordHash: `${salt}:${hash}`,
            createdAt: new Date().toISOString()
        });

        console.log('User registered:', email);

        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ success: true, message: 'Registration successful!' })
        };

    } catch (error) {
        console.error('Registration error:', error);
        return {
            statusCode: 500,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ success: false, message: error.message })
        };
    }
};