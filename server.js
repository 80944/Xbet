const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const cors = require('cors');

const app = express();
const port = 3000;

// --- Middleware ---
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// --- Routes ---

// <--- IMPORTANT CHANGE: Place this route BEFORE express.static() ---
// Redirect root URL to register.html
app.get('/', (req, res) => {
    res.redirect('/register.html');
});

// Serve static files from your 'public' directory
// This should come AFTER any specific routes you want to handle first (like the redirect)
app.use(express.static('public'));

// --- In-Memory Storage ---
const users = [];

// --- Registration Route ---
app.post('/register', async (req, res) => {
    const { username, password, phoneNumber, email } = req.body; 

    if (!username || !password || !phoneNumber || !email) {
        return res.status(400).json({ success: false, message: 'Username, password, phone number, and email are required.' });
    }

    const existingUser = users.find(u => u.username === username || u.email === email);
    if (existingUser) {
        return res.status(409).json({ success: false, message: 'Username or email already taken.    Kinly try and login' });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        users.push({ username, password: hashedPassword, phoneNumber, email });

        console.log('\n--- NEW USER REGISTRATION ---');
        console.log(`Username: ${username}`);
        console.log(`Phone Number: ${phoneNumber}`);
        console.log(`Email: ${email}`);
        console.log(`Hashed Password: ${hashedPassword}`);
        console.log(`Total Users in Memory: ${users.length}`);
        console.log('-----------------------------\n');

        res.status(201).json({ 
            success: true, 
            message: 'Registration successful. Data received and logged on server.',
            user: { username, phoneNumber, email }
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ success: false, message: 'Error registering user.' });
    }
});

// --- Login Route ---
app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ success: false, message: 'Username and password are required.' });
    }

    const user = users.find(u => u.username === username);

    if (!user) {
        console.log(`\n--- LOGIN ATTEMPT FAILED ---`);
        console.log(`Username: ${username}`);
        console.log(`Reason: User not found.`);
        console.log('---------------------------\n');
        return res.status(400).json({ success: false, message: 'Invalid username or password.' });
    }

    try {
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            console.log(`\n--- LOGIN ATTEMPT FAILED ---`);
            console.log(`Username: ${username}`);
            console.log(`Reason: Incorrect password.`);
            console.log('---------------------------\n');
            return res.status(400).json({ success: false, message: 'Invalid username or password.' });
        }

        console.log('\n--- USER LOGIN ---');
        console.log(`Username: ${username}`);
        console.log('Login Successful!');
        console.log('------------------\n');

        res.status(200).json({ 
            success: true, 
            message: 'Login successful.',
            user: { username: user.username, phoneNumber: user.phoneNumber, email: user.email }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ success: false, message: 'Error logging in.' });
    }
});

// --- Start the server ---
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
    console.log(`Access your website at http://localhost:${port}/ (will redirect to register.html)`);
    console.log('\n*** IMPORTANT: User data is stored IN-MEMORY and will be LOST on server restart. ***');
    console.log('*** All registration and login attempts will be logged to this command interface. ***\n');
});