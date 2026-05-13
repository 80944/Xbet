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
        const { email, password } = JSON.parse(event.body);

        console.log('Login attempt for:', email);

        // Validate required fields
        if (!email || !password) {
            return {
                statusCode: 400,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    success: false, 
                    message: 'Email and password are required' 
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

        // Initialize blob store
        const store = getStore({
            name: 'users',
            siteID: process.env.SITE_ID
        });

        // Find user by email
        const user = await store.get(email);
        
        if (!user) {
            console.log('User not found:', email);
            return {
                statusCode: 401,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    success: false, 
                    message: 'Invalid email or password' 
                })
            };
        }

        // Check if account is active
        if (user.isActive === false) {
            console.log('Account disabled:', email);
            return {
                statusCode: 401,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    success: false, 
                    message: 'Account has been disabled. Please contact support.' 
                })
            };
        }

        // Verify password
        const [salt, storedHash] = user.passwordHash.split(':');
        const hash = crypto.scryptSync(password, salt, 64).toString('hex');

        if (hash === storedHash) {
            console.log('✅ Login successful:', email);
            
            // Update last login time
            user.lastLogin = new Date().toISOString();
            await store.set(email, user);
            
            // Don't send password hash back to client
            const { passwordHash, ...userWithoutPassword } = user;
            
            return {
                statusCode: 200,
                headers: { 
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify({
                    success: true,
                    message: 'Login successful!',
                    user: userWithoutPassword
                })
            };
        } else {
            console.log('❌ Invalid password for:', email);
            return {
                statusCode: 401,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    success: false, 
                    message: 'Invalid email or password' 
                })
            };
        }

    } catch (error) {
        console.error('❌ Login error:', error);
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