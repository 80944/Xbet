// public/register.js
document.addEventListener('DOMContentLoaded', function() {
    const registerForm = document.getElementById('registerForm');
    const usernameInput = document.getElementById('username');
    const phoneNumberInput = document.getElementById('phoneNumber'); // Input for 9 digits
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirmPassword');
    const termsCheckbox = document.getElementById('terms');

    const registerErrorMessage = document.getElementById('register-error-message');

    registerForm.addEventListener('submit', async function(event) {
        event.preventDefault(); // Prevent default form submission

        // Clear previous error messages
        registerErrorMessage.textContent = '';
        registerErrorMessage.style.display = 'none';

        // Get trimmed values from inputs
        const username = usernameInput.value.trim();
        const phoneNumberDigits = phoneNumberInput.value.trim();
        const email = emailInput.value.trim();
        const password = passwordInput.value;
        const confirmPassword = confirmPasswordInput.value;

        let isValid = true;

        // --- Client-side Validations ---
        if (username === '') {
            registerErrorMessage.textContent = 'Username cannot be empty.';
            isValid = false;
        } else if (!/^[0-9]{9}$/.test(phoneNumberDigits)) {
            registerErrorMessage.textContent = 'Phone number must be exactly 9 digits (e.g., 712345678).';
            isValid = false;
        } else if (!email.includes('@') || !email.includes('.')) { // Basic email format check
            registerErrorMessage.textContent = 'Please enter a valid email address.';
            isValid = false;
        } else if (password.length < 8) {
            registerErrorMessage.textContent = 'Password must be at least 8 characters long.';
            isValid = false;
        } else if (password !== confirmPassword) {
            registerErrorMessage.textContent = 'Passwords do not match.';
            isValid = false;
        } else if (!termsCheckbox.checked) {
            registerErrorMessage.textContent = 'You must agree to the Terms and Conditions.';
            isValid = false;
        }

        if (!isValid) {
            registerErrorMessage.style.display = 'block';
            // Focus on the first invalid field for better user experience
            if (username === '') usernameInput.focus();
            else if (!/^[0-9]{9}$/.test(phoneNumberDigits)) phoneNumberInput.focus();
            else if (!email.includes('@') || !email.includes('.')) emailInput.focus();
            else if (password.length < 8) passwordInput.focus();
            else if (password !== confirmPassword) confirmPasswordInput.focus();
            return; // Stop the function if validation fails
        }

        // --- Prepare Data for Server ---
        const fullPhoneNumber = '+254' + phoneNumberDigits; // Construct the full phone number
        const registrationData = {
            username: username,
            phoneNumber: fullPhoneNumber, // Send the full number to the server
            email: email,
            password: password // Send password to the server for hashing and storage
        };

        // --- Send Data to Server using Fetch API (via Ngrok) ---
        try {
            // Updated Ngrok URL as requested. Ensured no trailing spaces.
            const serverUrl = 'https://b7e526d99d41.ngrok-free.app'; 
            
            const response = await fetch(`${serverUrl}/register`, { 
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json', // Indicate that we're sending JSON
                },
                body: JSON.stringify(registrationData) // Convert JavaScript object to JSON string
            });

            const responseData = await response.json(); // Parse the JSON response from the server

            if (response.ok) { // Check if the HTTP status code is in the 2xx range (success)
                console.log('Server registration successful (via Ngrok):', responseData);

                // --- Store data in localStorage (for client-side display on index.html after redirect) ---
                localStorage.setItem('loggedInUsername', username);
                localStorage.setItem('loggedInPhoneNumber', fullPhoneNumber);
                localStorage.setItem('loggedInEmail', email);

                alert('Registration successful! Redirecting to your dashboard.');
                window.location.href = 'index.html'; // Redirect to your dashboard page (index.html)

            } else {
                // Server responded with an error status (e.g., 400 Bad Request, 409 Conflict, 500 Internal Server Error)
                console.error('Server registration failed:', response.status, responseData);
                // Display the error message from the server or a generic one
                registerErrorMessage.textContent = responseData.message || 'Registration failed. Please try again.';
                registerErrorMessage.style.display = 'block';
            }
        } catch (error) {
            // This 'catch' block handles network errors (e.g., server not running, Ngrok not active, internet issues)
            console.error('Error connecting to Ngrok/server:', error);
            registerErrorMessage.textContent = 'Could not connect to the server. Please ensure Ngrok and your Node.js server are running.';
            registerErrorMessage.style.display = 'block';
        }
    });
});