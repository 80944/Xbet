document.addEventListener('DOMContentLoaded', () => {
    // Get references to the form and the message display area
    const loginForm = document.getElementById('loginForm');
    const messageDiv = document.getElementById('message');

    // Check if the login form element exists before adding event listener
    if (loginForm) {
        loginForm.addEventListener('submit', async (event) => {
            event.preventDefault(); // Prevent the default form submission behavior (page reload)

            // Get username and password values from the input fields
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;

            // Clear any previous messages
            messageDiv.textContent = '';
            messageDiv.style.color = ''; // Reset color

            try {
                // Send a POST request to your backend's /login endpoint
                const response = await fetch('http://localhost:3000/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json', // Tell the server we're sending JSON
                    },
                    body: JSON.stringify({ username, password }), // Convert data to JSON string
                });

                // Parse the JSON response from the server
                const data = await response.json();

                if (response.ok) { // Check if the HTTP status is in the 200 range (e.g., 200 OK)
                    // Login successful
                    messageDiv.textContent = data.message;
                    messageDiv.style.color = 'green';

                    // Log success and redirect to index.html
                    console.log('Login successful! Redirecting to index.html...');
                    window.location.href = 'index.html'; // Redirect the user
                } else {
                    // Login failed (e.g., 400 Bad Request, 401 Unauthorized, etc.)
                    messageDiv.textContent = data.message || 'Login failed. Please try again.';
                    messageDiv.style.color = 'red';
                    console.error('Login error:', data.message);
                }
            } catch (error) {
                // Handle network errors or issues with the fetch request itself
                console.error('Error during login fetch:', error);
                messageDiv.textContent = 'A network error occurred. Please try again later.';
                messageDiv.style.color = 'red';
            }
        });
    } else {
        console.error("Login form with ID 'loginForm' not found.");
    }
});