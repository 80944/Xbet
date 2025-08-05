// aviatorBettingAndNotification.js (or directly in your HTML <script> tag)

document.addEventListener('DOMContentLoaded', function() {

    // --- Simulated User Balance ---
    // In a real application, this balance would be fetched from your backend.
    let userBalance = 500; // Starting balance for demonstration

    // --- Element References ---
    const aviatorBalanceDisplay = document.getElementById('aviatorBalanceDisplay');
    const bettingBlocks = document.querySelectorAll('.betting-block');

    // --- Utility Function for Ngrok Notification ---
    // This function is included here for self-containment as requested.
    // For larger applications, it's highly recommended to put this in a separate
    // 'ngrokNotification.js' module and import/call it.
    async function sendNgrokNotification(payload, successMessage, errorMessage) {
        // IMPORTANT: Replace this with your actual Ngrok URL!
        const ngrokWebhookUrl = 'https://b7e526d99d41.ngrok-free.app'; 

        try {
            const response = await fetch(ngrokWebhookUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                const result = await response.json(); // Assuming your webhook returns JSON
                console.log('Ngrok webhook triggered successfully:', result);
                // For insufficient funds, we still show the user-friendly alert,
                // the successMessage here is more for developer logging.
                // alert(successMessage); 
                return true;
            } else {
                console.error('Failed to trigger Ngrok webhook:', response.status, response.statusText);
                alert(errorMessage);
                return false;
            }
        } catch (error) {
            console.error('Error sending request to Ngrok webhook:', error);
            alert('An error occurred while trying to send the notification.');
            return false;
        }
    }

    // --- Update Balance Display ---
    function updateAviatorBalanceDisplay() {
        if (aviatorBalanceDisplay) {
            aviatorBalanceDisplay.textContent = userBalance.toFixed(2);
        }
    }

    // --- Setup Betting Controls for Each Block ---
    bettingBlocks.forEach(block => {
        const minusBtn = block.querySelector('.minus-btn');
        const plusBtn = block.querySelector('.plus-btn');
        const betInput = block.querySelector('input[type="number"]');
        const quickBetButtons = block.querySelectorAll('.quick-bet-amounts button');
        const placeBetButton = block.querySelector('.place-game-bet-button');

        // Function to update the "Bet X KES" button text dynamically
        function updatePlaceBetButtonText() {
            if (placeBetButton && betInput) {
                const currentBet = parseFloat(betInput.value);
                placeBetButton.textContent = `Bet ${isNaN(currentBet) ? '0.00' : currentBet.toFixed(2)} KES`;
            }
        }

        // Initialize button text when the page loads
        updatePlaceBetButtonText();

        // Event listener for the minus button
        if (minusBtn) {
            minusBtn.addEventListener('click', () => {
                let currentValue = parseFloat(betInput.value);
                if (!isNaN(currentValue)) {
                    // Decrement by 10, ensuring the minimum value is 10
                    currentValue = Math.max(10, currentValue - 10);
                    betInput.value = currentValue;
                    updatePlaceBetButtonText();
                }
            });
        }

        // Event listener for the plus button
        if (plusBtn) {
            plusBtn.addEventListener('click', () => {
                let currentValue = parseFloat(betInput.value);
                if (!isNaN(currentValue)) {
                    // Increment by 10
                    betInput.value = currentValue + 10;
                    updatePlaceBetButtonText();
                }
            });
        }

        // Event listeners for quick bet amount buttons (100, 200, 500, etc.)
        quickBetButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const amount = parseFloat(btn.dataset.amount);
                if (!isNaN(amount)) {
                    betInput.value = amount;
                    updatePlaceBetButtonText();
                }
            });
        });

        // Event listener for manual input changes in the bet amount field
        if (betInput) {
            betInput.addEventListener('input', () => {
                // Ensure minimum value is 10 if the user types a lower number
                let currentValue = parseFloat(betInput.value);
                if (isNaN(currentValue) || currentValue < 10) {
                    betInput.value = 10; // Default to 10 if invalid or too low
                }
                updatePlaceBetButtonText();
            });
        }

        // Event listener for the "Place Bet" button
        if (placeBetButton) {
            placeBetButton.addEventListener('click', async () => {
                const betAmount = parseFloat(betInput.value);
                // Get username from a common source (e.g., localStorage or a displayed element)
                const currentUsername = localStorage.getItem('loggedInUsername') || document.getElementById('displayUsername')?.textContent || 'Guest';

                if (isNaN(betAmount) || betAmount <= 0) {
                    alert('Please enter a valid bet amount.');
                    return;
                }

                if (!currentUsername) {
                    alert('Username not found. Please log in or ensure username is displayed.');
                    return;
                }

                // Check for insufficient balance
                if (betAmount > userBalance) {
                    const payload = {
                        type: 'insufficient_funds',
                        username: currentUsername,
                        attemptedBet: betAmount,
                        currentBalance: userBalance,
                        message: `Insufficient balance for ${currentUsername}. Attempted bet: ${betAmount.toFixed(2)} KES, Current balance: ${userBalance.toFixed(2)} KES.`
                    };
                    const successMsg = `Insufficient funds notification sent to server for ${currentUsername}.`;
                    const errorMsg = `Hello ${currentUsername}! Insufficient funds. Please deposit some amount to continue. Your current balance is ${userBalance.toFixed(2)} KES.`;
                    
                    await sendNgrokNotification(payload, successMsg, errorMsg);
                } else {
                    // If balance is sufficient, proceed with betting logic (simulated here)
                    alert(`   Insufficient funds  Bet of ${betAmount.toFixed(2)} KES cannot be placed. Dear, ${currentUsername}! kindly refresh the page or try depositing `);
                    userBalance -= betAmount; // Deduct bet amount from simulated balance
                    updateAviatorBalanceDisplay(); // Update displayed balance
                    console.log(`New balance: ${userBalance.toFixed(2)} KES`);
                    // In a real application, you would send this bet to a server
                    // and handle game state updates (e.g., waiting for next round).
                }
            });
        }
    });

    // --- Initial setup calls ---
    updateAviatorBalanceDisplay(); // Display initial balance when the page loads
});