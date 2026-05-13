import { getStore } from '@netlify/blobs';
import { randomBytes, scryptSync } from 'crypto';

export const handler = async (event) => {
    // Only accept POST requests
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ success: false, message: 'Method not allowed' })
        };
    }
    
    try {
        const { username, email, phoneNumber, password } = JSON.parse(event.body);
        
        // Basic validation
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
        const salt = randomBytes(16).toString('hex');
        const hash = scryptSync(password, salt, 64).toString('hex');
        const passwordHash = `${salt}:${hash}`;
        
        // Store user data
        const userData = {
            username,
            email,
            phoneNumber: phoneNumber || '',
            passwordHash,
            createdAt: new Date().toISOString()
        };
        
        await store.set(email, userData);
        
        return {
            statusCode: 200,
            body: JSON.stringify({ 
                success: true, 
                message: 'User registered successfully' 
            })
        };
        
    } catch (error) {
        console.error('Registration error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ 
                success: false, 
                message: 'Internal server error' 
            })
        };
    }
};