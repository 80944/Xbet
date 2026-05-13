const { getStore } = require('@netlify/blobs');
const crypto = require('crypto');

exports.handler = async (event) => {
    // Only allow POST requests
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            headers: { 
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({ success: false, message: 'Method not allowed' })
        };
    }

    try {
        // Parse request body
        const { username, email, phoneNumber, countryCode, password } = JSON.parse(event.body);

        console.log('Registration attempt for:', email);

        // Validate required fields
        if (!username || !email || !password) {
            return {
                statusCode: 400,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    success: false, 
                    message: 'Missing required fields: username, email, and password are required' 
                })
            };
        }

        // Email format validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return {
                statusCode: 400,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ success: false, message: 'Invalid email format' })
            };
        }

        // Username validation
        if (username.length < 3) {
            return {
                statusCode: 400,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ success: false, message: 'Username must be at least 3 characters' })
            };
        }

        // Password validation
        if (password.length < 8) {
            return {
                statusCode: 400,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ success: false, message: 'Password must be at least 8 characters long' })
            };
        }

        // Initialize blob store
        const store = getStore({
            name: 'users',
            siteID: process.env.SITE_ID
        });

        // Check if user already exists
        const existingUser = await store.get(email);
        if (existingUser) {
            console.log('User already exists:', email);
            return {
                statusCode: 400,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    success: false, 
                    message: 'User already exists. Please login instead.' 
                })
            };
        }

        // Hash the password
        const salt = crypto.randomBytes(16).toString('hex');
        const hash = crypto.scryptSync(password, salt, 64).toString('hex');
        const passwordHash = `${salt}:${hash}`;
        
        // Prepare user data object
        const userData = {
            username: username,
            email: email,
            phoneNumber: phoneNumber || '',
            countryCode: countryCode || '',
            passwordHash: passwordHash,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            isActive: true,
            balance: 0,
            depositHistory: [],
            withdrawalHistory: [],
            betHistory: []
        };
        
        // Store user data in blob storage
        await store.set(email, userData);
        
        console.log('✅ User registered successfully:', email);

        // Return success response (don't send password hash back)
        const { passwordHash: _, ...userWithoutPassword } = userData;
        
        return {
            statusCode: 200,
            headers: { 
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({ 
                success: true, 
                message: 'Registration successful! Please login.',
                user: userWithoutPassword
            })
        };

    } catch (error) {
        console.error('❌ Registration error:', error);
        return {
            statusCode: 500,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                success: false, 
                message: 'Internal server error: ' + error.message 
            })
        };
    }
};