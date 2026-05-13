const crypto = require('crypto');

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
        const { username, email, phoneNumber, password } = JSON.parse(event.body);

        // Validate required fields
        if (!username || !email || !password) {
            return {
                statusCode: 400,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ success: false, message: 'Missing required fields' })
            };
        }

        // For now, let's just return success without storing
        // This will help us test if the function is working at all
        
        console.log('Registration attempt:', { username, email, phoneNumber });

        // TEMPORARY: Just return success without database
        // Once this works, we'll add blob storage
        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                success: true, 
                message: 'Registration successful! (Demo mode - no storage yet)' 
            })
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