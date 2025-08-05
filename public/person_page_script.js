// index_script.js
document.addEventListener('DOMContentLoaded', function() {
    // Get stored data from localStorage
    const username = localStorage.getItem('loggedInUsername');
    const phoneNumber = localStorage.getItem('loggedInPhoneNumber');
    const email = localStorage.getItem('loggedInEmail');

    // Get references to the HTML elements where data will be displayed
    // These IDs must match those in your index.html
    const displayUsernameElement = document.getElementById('displayUsername');
    const displayPhoneNumberElement = document.getElementById('displayPhoneNumber');
    const displayEmailElement = document.getElementById('displayEmail');
    
    const usernameInputElement = document.getElementById('usernameInput');
    const phoneNumberInputElement = document.getElementById('phoneNumberInput');
    const emailInputElement = document.getElementById('emailInput');

    // Populate the HTML elements with the retrieved data
    if (displayUsernameElement && username) {
        displayUsernameElement.textContent = username;
    } 

    if (displayPhoneNumberElement && phoneNumber) {
        displayPhoneNumberElement.textContent = phoneNumber; // Corrected: should be displayPhoneNumberElement
    } 

    if (displayEmailElement && email) {
        displayEmailElement.textContent = email;
    } 

    // Also populate the input fields if they exist
    if (usernameInputElement && username) {
        usernameInputElement.value = username;
    }
    if (phoneNumberInputElement && phoneNumber) {
        phoneNumberInputElement.value = phoneNumber;
    }
    if (emailInputElement && email) {
        emailInputElement.value = email;
    }

    // --- CODE FOR DEPOSIT BUTTONS (from previous interaction) ---
    // Get all buttons with the class 'deposit-amount-btn'
    const depositAmountButtons = document.querySelectorAll('.deposit-amount-btn');
    // Get the input field where the amount will be displayed
    const customAmountInput = document.getElementById('custom-amount');

    // Loop through each button and add an event listener
    depositAmountButtons.forEach(button => {
      button.addEventListener('click', () => {
        // Get the 'data-amount' attribute value from the clicked button
        const amount = button.dataset.amount; 
        
        // Set the value of the input field to the amount
        customAmountInput.value = amount;
      });
    });
    // --- END DEPOSIT BUTTONS CODE ---

    // --- NEW CODE FOR "Deposit" BUTTON AND NGrok Notification ---
    const proceedDepositBtn = document.getElementById('proceed-deposit-btn');

    if (proceedDepositBtn) {
        proceedDepositBtn.addEventListener('click', async () => {
            const enteredAmount = customAmountInput.value;
            const currentUsername = usernameInputElement.value || displayUsernameElement.textContent; // Use input value if available, else displayed username

            if (!currentUsername) {
                alert('Username not found. Please log in or ensure username is displayed.');
                return;
            }

            // Define your Ngrok webhook URL here
            // REPLACE THIS WITH YOUR ACTUAL NGROK URL AND ENDPOINT!
            const ngrokWebhookUrl = 'https://b7e526d99d41.ngrok-free.app'; 
            // Example: 'https://a1b2c3d4e5f6.ngrok-free.app/send_notification'

            // Data to send to your Ngrok webhook (optional, but good practice)
            const payload = {
                username: currentUsername,
                amount: enteredAmount,
                message: `Hello ${currentUsername}, try depositing manually`
            };

            try {
                const response = await fetch(ngrokWebhookUrl, {
                    method: 'POST', // Or 'GET' if your webhook expects it, but POST is common for data submission
                    headers: {
                        'Content-Type': 'application/json',
                        // You might need an API key or other headers depending on your backend
                    },
                    body: JSON.stringify(payload)
                });

                if (response.ok) {
                    const result = await response.json(); // If your webhook returns JSON
                    console.log('Ngrok webhook triggered successfully:', result);
                    alert(`STK Push initiated for ${currentUsername}! (Check your phone for a prompt)`);
                    // You might want to clear the amount input or disable the button here
                } else {
                    console.error('Failed to trigger Ngrok webhook:', response.status, response.statusText);
                    alert(`hello ${currentUsername}! we are currently experiencing delays with the prompt Kindly Try depositing manually....Thankyou!. Please fund the account via M-PESA Paybill 542542 account number 03207346616150 `);
                }
            } catch (error) {
                console.error('Error sending request to Ngrok webhook:', error);
                alert('An error occurred while trying to initiate STK Push.');
            }
        });
    }
    // --- END NEW CODE ---

    // --- NEW CODE FOR COPY BUTTONS (Paybill and Account Number) ---
    const copyButtons = document.querySelectorAll('.copy-btn');

    copyButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetId = button.dataset.target;
            const targetElement = document.getElementById(targetId);

            if (targetElement) {
                // Create a temporary textarea element to copy from
                const textarea = document.createElement('textarea');
                textarea.value = targetElement.textContent; // Get the text content
                // Style to hide the textarea but keep it in the DOM for copying
                textarea.style.position = 'fixed';
                textarea.style.top = '0';
                textarea.style.left = '0';
                textarea.style.width = '1px';
                textarea.style.height = '1px';
                textarea.style.padding = '0';
                textarea.style.border = 'none';
                textarea.style.outline = 'none';
                textarea.style.boxShadow = 'none';
                textarea.style.background = 'transparent';
                document.body.appendChild(textarea); // Append to body
                
                textarea.select(); // Select the text

                try {
                    document.execCommand('copy'); // Execute the copy command
                    alert(`${targetElement.textContent} copied to clipboard!`); // User feedback
                } catch (err) {
                    console.error('Failed to copy text: ', err);
                    alert('Failed to copy. Please manually select and copy.');
                } finally {
                    document.body.removeChild(textarea); // Clean up the temporary element
                }
            }
        });
    });
    // --- END NEW CODE FOR COPY BUTTONS ---

}); 