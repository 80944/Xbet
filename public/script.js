// --- Global Element References ---
const navItems = document.querySelectorAll('.nav-item');
const pageSections = document.querySelectorAll('.page-section');

// Sidebar elements
const sidebar = document.getElementById('sidebar-menu');
const closeSidebarBtn = document.getElementById('close-sidebar-btn');
const overlay = document.getElementById('overlay');

// Ad Slideshow elements (for the mini carousel)
const adMiniSlides = document.querySelectorAll('.ad-mini-slide'); // Selects all mini ad image elements
let currentMiniAdIndex = 0; // Tracks the currently active mini ad
let adMiniInterval; // Stores the interval ID for the mini ad rotation

// Betting Slip Elements
const betSlipModal = document.getElementById('bet-slip-modal');
const closeBetSlipBtn = document.getElementById('close-bet-slip');
const selectedBetsList = document.getElementById('selected-bets-list');
const totalOddsSpan = document.getElementById('total-odds');
const stakeAmountInput = document.getElementById('stake-amount');
const potentialPayoutSpan = document.getElementById('potential-payout');
const placeBetButton = document.getElementById('place-bet-button');
const oddCells = document.querySelectorAll('.odd-cell'); // Select all clickable odd cells

// --- Betting Slip Data ---
// Array to store selected bet objects {id, match, odd, cellElement}
let selectedBets = [];

// --- Aviator Game Elements ---
// IMPORTANT: Get canvas and context ONLY if gameCanvas exists
const gameCanvas = document.getElementById('gameCanvas');
const gameCtx = gameCanvas ? gameCanvas.getContext('2d') : null; // Added check for gameCanvas

const multiplierDisplay = document.getElementById('multiplier-display');
const statusMessage = document.getElementById('status-message');
// Note: betAmountInputAviator, startButtonAviator, cashOutButtonAviator are now decorative
// as the game runs continuously. Their event listeners have been removed.
// We still define them as constants to avoid 'not defined' errors if they exist in HTML.
const betAmountInputAviator = document.getElementById('bet-amount');
const startButtonAviator = document.getElementById('start-button');
const cashOutButtonAviator = document.getElementById('cash-out-button');

// --- Aviator Game State Variables ---
const aviatorGame = {
    status: 'idle', // 'idle', 'playing', 'crashed'
    multiplier: 1.00,
    crashPoint: 0, // The multiplier at which the game will crash
    animationFrameId: null, // Stores the requestAnimationFrame ID
    startTime: 0, // Timestamp when the game started
    speedFactor: 0.0008, // How fast the multiplier increases (adjusted for smoother/longer play)
    // Single Aeroplane's position and size
    aeroplaneX: 0,
    aeroplaneY: 0,
    aeroplaneSize: 60, // Size for the SVG drawing (you might need to fine-tune this)
    // Line's end point and control point for curve
    currentLineX: 0, // Current X position of the line's end
    currentLineY: 0, // Current Y position of the line's end
    lineControlX: 0, // Control point X for the quadratic curve
    lineControlY: 0, // Control point Y for the quadratic curve
    predefinedCrashPoints: [15, 8.34, 25.34, 25.23, 18, 32.5, 39], // Fixed sequence of crash points
    currentCrashPointIndex: 0 // Index for the predefined crash points
};

// --- Scrolling Bets Table Elements ---
// Ensure this selector correctly targets the tbody within your bets table
const betsTableBody = document.querySelector('.bets-table tbody');
const scrollingBetsContainer = document.getElementById('scrolling-bets-container');


// --- Page Navigation Functions ---
/**
 * Shows a specific page section and updates the active state of its corresponding navigation item.
 * @param {string} pageId - The ID of the page section to show (e.g., 'home-page').
 */
function showPage(pageId) {
    // Get the currently active page before hiding everything
    const currentActivePage = document.querySelector('.page-section.active');

    // If we are navigating away from the Aviator page, stop its game loop
    // and reset its state completely.
    if (currentActivePage && currentActivePage.id === 'aviator-page' && pageId !== 'aviator-page') {
        // Ensure gameCtx and gameCanvas are available before trying to clear
        if (gameCanvas && gameCtx) {
            if (aviatorGame.animationFrameId) {
                cancelAnimationFrame(aviatorGame.animationFrameId);
                aviatorGame.animationFrameId = null; // Clear the animation frame ID
            }
            aviatorGame.status = 'idle'; // Reset game status
            aviatorGame.startTime = 0; // Reset start time for a fresh start later
            gameCtx.clearRect(0, 0, gameCanvas.width, gameCanvas.height); // Clear the canvas
            if (multiplierDisplay) multiplierDisplay.textContent = '1.00x'; // Reset display
            if (statusMessage) statusMessage.textContent = 'Game stopped.'; // Reset status
            console.log("Aviator game stopped and reset."); // Debugging
        }
    }

    // 1. Hide all page sections by removing the 'active' class
    pageSections.forEach(section => {
        section.classList.remove('active');
    });

    // 2. Show the selected page section by adding the 'active' class
    const targetPage = document.getElementById(pageId);
    if (targetPage) {
        targetPage.classList.add('active');
        console.log(`Showing page: ${pageId}`); // Debugging
    }

    // 3. Update active state for main navigation items (at the bottom of the screen)
    // Remove 'active-nav-item' from all navigation items
    navItems.forEach(item => {
        item.classList.remove('active-nav-item');
    });

    // Add 'active-nav-item' to the navigation item corresponding to the active page
    const clickedNavItem = document.querySelector(`.nav-item[data-page="${pageId}"]`);
    if (clickedNavItem) {
        clickedNavItem.classList.add('active-nav-item');
    } else if (pageId === 'home-page') { // Fallback for 'Menu' item or if no direct nav item matches the clicked element, ensure home is active
        const homeNavItem = document.querySelector('.nav-item[data-page="home-page"]');
        if (homeNavItem) homeNavItem.classList.add('active-nav-item');
    }

    // If the Aviator page is being shown, resize its canvas and start the game cycle
    if (pageId === 'aviator-page') {
        // Ensure gameCanvas and gameCtx are available before proceeding
        if (gameCanvas && gameCtx) {
            resizeAviatorCanvas(); // Ensure canvas dimensions are correct when it becomes visible
            // Only start the game cycle if it's not already running or explicitly stopped
            if (aviatorGame.status === 'idle' || aviatorGame.animationFrameId === null) {
                startAviatorRound(); // Start the game automatically
                console.log("Aviator game started."); // Debugging
            }
        }
    } else {
        // This 'else' block ensures that if we navigate *away* from Aviator,
        // its display is explicitly reset, even if the game loop was already stopped.
        // This guards against visual artifacts if the page transition is very fast
        // or if the stop logic had a slight delay.
        if (gameCanvas && gameCtx) { // Ensure elements exist before trying to clear
            gameCtx.clearRect(0, 0, gameCanvas.width, gameCanvas.height);
            if (multiplierDisplay) multiplierDisplay.textContent = '1.00x';
            if (statusMessage) statusMessage.textContent = 'Place your bet to start!';
        }
    }

    // If a page is selected (especially from the sidebar), close the sidebar
    closeSidebar();
}

// --- Sidebar Functions ---
/**
 * Opens the slide-out sidebar menu.
 */
function openSidebar() {
    sidebar.classList.add('open');
    overlay.classList.add('visible');
    document.body.classList.add('sidebar-open'); // Adds class to body for content shift effect
}

/**
 * Closes the slide-out sidebar menu.
 */
function closeSidebar() {
    sidebar.classList.remove('open');
    overlay.classList.remove('visible');
    document.body.classList.remove('sidebar-open'); // Removes class from body to reset content position
}

// --- Mini Ad Slideshow Functions ---
/**
 * Displays the next ad in the mini ad carousel.
 */
function showNextMiniAd() {
    // Only proceed if there are ads available
    if (adMiniSlides.length === 0) return;

    // Remove 'active-mini-slide' class from the currently visible ad
    adMiniSlides[currentMiniAdIndex].classList.remove('active-mini-slide');

    // Calculate the index for the next ad, looping back to the start if at the end
    currentMiniAdIndex = (currentMiniAdIndex + 1) % adMiniSlides.length;

    // Add 'active-mini-slide' class to the next ad to make it visible
    adMiniSlides[currentMiniAdIndex].classList.add('active-mini-slide');
}

/**
 * Starts the automatic rotation of the mini ad carousel.
 * The ads will change every 3 seconds (3000 milliseconds).
 */
function startMiniAdSlideshow() {
    // Only start the slideshow if there's more than one ad to rotate
    if (adMiniSlides.length > 1) {
        // Clear any existing interval to prevent multiple slideshows running simultaneously
        if (adMiniInterval) {
            clearInterval(adMiniInterval);
        }
        adMiniInterval = setInterval(showNextMiniAd, 5000); // Set interval for 5 seconds
    }
}

// --- Betting Slip Functions ---

// Function to generate a unique ID for each bet
function generateUniqueId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

/**
 * Adds or removes a bet from the slip based on whether it's already selected.
 * @param {string} oddValue - The numerical value of the odd.
 * @param {string} matchDetails - A string describing the match and selection (e.g., "Man Utd vs Sevilla (Home)").
 * @param {HTMLElement} cellElement - The HTML table cell element that was clicked.
 */
function addBet(oddValue, matchDetails, cellElement) {
    // Check if a bet for this match already exists to prevent duplicates
    // We identify a bet by its matchDetails for simplicity, assuming one selection per match.
    const existingBetIndex = selectedBets.findIndex(bet => bet.match === matchDetails);

    if (existingBetIndex !== -1) {
        // If it exists, remove it (toggle functionality)
        removeBet(selectedBets[existingBetIndex].id);
        return; // Exit after removing
    }

    const newBet = {
        id: generateUniqueId(),
        match: matchDetails,
        odd: parseFloat(oddValue),
        cell: cellElement // Store reference to the HTML cell for styling
    };
    selectedBets.push(newBet);
    cellElement.classList.add('selected-odd'); // Add visual feedback to the clicked cell
    updateBetSlip();
    openBetSlip(); // Open the slip when a bet is added
}

/**
 * Removes a bet from the slip by its unique ID.
 * @param {string} betId - The unique ID of the bet to remove.
 */
function removeBet(betId) {
    const betIndex = selectedBets.findIndex(bet => bet.id === betId);
    if (betIndex > -1) {
        const removedBet = selectedBets.splice(betIndex, 1)[0];
        if (removedBet.cell) {
            removedBet.cell.classList.remove('selected-odd'); // Remove visual feedback from the cell
        }
        updateBetSlip();
    }
    // If no bets left, close the slip
    if (selectedBets.length === 0) {
        closeBetSlip();
    }
}

/**
 * Calculates the total odds by multiplying all selected odds.
 * @returns {string} The total odds formatted to two decimal places.
 */
function calculateTotalOdds() {
    if (selectedBets.length === 0) {
        return '1.00'; // Return 1.00 if no bets, so payout is just stake
    }
    let total = 1.00;
    selectedBets.forEach(bet => {
        total *= bet.odd;
    });
    return total.toFixed(2); // Format to 2 decimal places
}

/**
 * Calculates potential payout based on total odds and stake amount.
 * @returns {string} The potential payout formatted to two decimal places.
 */
function calculatePayout() {
    const totalOdds = parseFloat(totalOddsSpan.textContent);
    const stake = parseFloat(stakeAmountInput.value);
    if (isNaN(stake) || stake <= 0) {
        return '0.00';
    }
    return (totalOdds * stake).toFixed(2); // Format to 2 decimal places
}

/**
 * Updates the betting slip UI with current selected bets, total odds, and potential payout.
 */
function updateBetSlip() {
    selectedBetsList.innerHTML = ''; // Clear current list
    if (selectedBets.length === 0) {
        selectedBetsList.innerHTML = '<li class="no-bets">No bets selected.</li>';
    } else {
        selectedBets.forEach(bet => {
            const listItem = document.createElement('li');
            listItem.classList.add('bet-slip-item');
            listItem.innerHTML = `
                <span>${bet.match} @ <strong>${bet.odd.toFixed(2)}</strong></span>
                <button class="remove-bet-btn" data-bet-id="${bet.id}">&times;</button>
            `;
            selectedBetsList.appendChild(listItem);
        });
    }

    totalOddsSpan.textContent = calculateTotalOdds();
    potentialPayoutSpan.textContent = calculatePayout();

    // Add event listeners to newly created remove buttons (important for dynamic content)
    document.querySelectorAll('.remove-bet-btn').forEach(button => {
        button.addEventListener('click', (event) => {
            const betIdToRemove = event.target.dataset.betId;
            removeBet(betIdToRemove);
        });
    });
}

/**
 * Shows the betting slip modal.
 */
function openBetSlip() {
    betSlipModal.classList.add('visible');
}

/**
 * Hides the betting slip modal.
 */
function closeBetSlip() {
    betSlipModal.classList.remove('visible');
}

// --- Aviator Game Drawing Functions ---

/**
 * Adjusts Aviator game canvas size for responsiveness.
 */
function resizeAviatorCanvas() {
    if (!gameCanvas || !gameCtx) return; // Added safety check

    gameCanvas.width = gameCanvas.offsetWidth;
    gameCanvas.height = gameCanvas.offsetHeight;
    console.log('Canvas resized:', gameCanvas.width, 'x', gameCanvas.height); // Debugging
    // Re-initialize positions based on new canvas size for a clean start
    aviatorGame.currentLineX = 0;
    aviatorGame.currentLineY = gameCanvas.height; // Line starts at bottom edge
    aviatorGame.aeroplaneX = 0; // Aeroplane starts at the very left
    aviatorGame.aeroplaneY = gameCanvas.height; // Aeroplane starts on the bottom edge
    aviatorGame.lineControlX = gameCanvas.width / 4; // Initial control point X
    aviatorGame.lineControlY = gameCanvas.height; // Initial control point Y (at bottom for curve)

    if (aviatorGame.status !== 'idle') {
        drawAviatorGame();
    }
}

/**
 * Draws the background elements on the Aviator canvas.
 */
function drawAviatorBackground() {
    if (!gameCtx) return; // Added safety check

    gameCtx.clearRect(0, 0, gameCanvas.width, gameCanvas.height);

    // Draw radial gradient background (dark to red, mimicking the image)
    const gradient = gameCtx.createRadialGradient(
        gameCanvas.width / 2, gameCanvas.height / 2, 10, // Inner circle (start of red)
        gameCanvas.width / 2, gameCanvas.height / 2, Math.max(gameCanvas.width, gameCanvas.height) * 0.7 // Outer circle (end of dark)
    );
    gradient.addColorStop(0, '#3700ffff'); // Red at center
    gradient.addColorStop(1, '#1A1A1A'); // Very dark gray/almost black at edges

    gameCtx.fillStyle = gradient;
    gameCtx.fillRect(0, 0, gameCanvas.width, gameCanvas.height);

    // Draw radial rays (white transparent lines)
    gameCtx.save();
    gameCtx.translate(gameCanvas.width / 2, gameCanvas.height / 2); // Center for rotation
    const numRays = 36; // Number of sunburst rays
    const rayLength = Math.max(gameCanvas.width, gameCanvas.height) * 0.7; // Extend rays to edge
    gameCtx.strokeStyle = 'rgba(255, 255, 255, 0.1)'; // White transparent rays
    gameCtx.lineWidth = 1;
    for (let i = 0; i < numRays; i++) {
        gameCtx.beginPath();
        gameCtx.moveTo(0, 0);
        gameCtx.rotate((Math.PI * 2) / numRays);
        gameCtx.lineTo(rayLength, 0);
        gameCtx.stroke();
    }
    gameCtx.restore();
}

/**
 * Draws the aeroplane based on the SVG sketch using canvas primitives.
 * @param {number} x - The X-coordinate for the center of the aeroplane.
 * @param {number} y - The Y-coordinate for the center of the aeroplane.
 * @param {number} size - A scaling factor for the aeroplane's size.
 */
function drawAeroplane(x, y, size) {
    if (!gameCtx) return; // Added safety check

    gameCtx.save(); // Save the current canvas state

    gameCtx.translate(x, y); // Move origin to aeroplane's position

    // Apply overall plane rotation from SVG (-10 degrees)
    const planeTiltAngle = -10 * Math.PI / 180;
    gameCtx.rotate(planeTiltAngle);

    // Apply aeroplane shadow (yellow glow)
    gameCtx.shadowColor = 'rgba(247, 247, 240, 0.9)';
    gameCtx.shadowBlur = 10;
    gameCtx.shadowOffsetX = 0;
    gameCtx.shadowOffsetY = 0;

    // Set plane fill and stroke colors from SVG style
    gameCtx.fillStyle = '#FFFFFF'; // White color for the plane
    gameCtx.strokeStyle = '#CCCCCC'; // Light gray for stroke
    gameCtx.lineWidth = 1; // Stroke width from SVG

    // Scale factor to map SVG's 200x150 viewBox to desired 'size'
    // Let's assume 'size' roughly corresponds to the height of the plane in SVG (e.g., 150 units)
    const scale = size / 150; // Adjust based on how 'size' relates to your SVG dimensions

    gameCtx.scale(scale, scale); // Apply scaling

    // Fuselage (adjusting coordinates and control points for canvas)
    gameCtx.beginPath();
    // M0 0 C 10 20, 100 20, 120 0 C 100 -20, 10 -20, 0 0 Z
    gameCtx.moveTo(0, 0);
    gameCtx.bezierCurveTo(10, 20, 100, 20, 120, 0);
    gameCtx.bezierCurveTo(100, -20, 10, -20, 0, 0);
    gameCtx.closePath();
    gameCtx.fill();
    gameCtx.stroke();

    // Cockpit/Canopy
    gameCtx.beginPath();
    // M60 -10 C 70 -25, 90 -25, 100 -10 L 60 -10 Z
    gameCtx.moveTo(60, -10);
    gameCtx.bezierCurveTo(70, -25, 90, -25, 100, -10);
    gameCtx.lineTo(60, -10);
    gameCtx.closePath();
    gameCtx.fill();
    gameCtx.stroke();

    // Main Wing
    gameCtx.beginPath();
    // M40 0 L 80 40 L 70 50 L 30 10 Z
    gameCtx.moveTo(40, 0);
    gameCtx.lineTo(80, 40);
    gameCtx.lineTo(70, 50);
    gameCtx.lineTo(30, 10);
    gameCtx.closePath();
    gameCtx.fill();
    gameCtx.stroke();

    // Tail Fin (vertical)
    gameCtx.beginPath();
    // M-10 0 L -30 -20 L -30 0 Z
    gameCtx.moveTo(-10, 0);
    gameCtx.lineTo(-30, -20);
    gameCtx.lineTo(-30, 0);
    gameCtx.closePath();
    gameCtx.fill();
    gameCtx.stroke();

    // Horizontal Stabilizer (at the tail)
    gameCtx.beginPath();
    // M-20 0 L -40 5 L -40 -5 L -20 0 Z
    gameCtx.moveTo(-20, 0);
    gameCtx.lineTo(-40, 5);
    gameCtx.lineTo(-40, -5);
    gameCtx.lineTo(-20, 0);
    gameCtx.closePath();
    gameCtx.fill();
    gameCtx.stroke();

    // Propeller (simplified, positioned at the front, white fill)
    gameCtx.fillStyle = '#FFFFFF'; // White for propeller
    gameCtx.fillRect(125 - 5, 0 - 15, 10, 30); // Vertical blade
    gameCtx.fillRect(125 - 15, 0 - 5, 30, 10); // Horizontal blade

    // Red 'X' on the body
    gameCtx.fillStyle = '#FF0000'; // Red X
    gameCtx.font = `bold ${20}px Arial`; // Font size from SVG
    gameCtx.textAlign = 'center';
    gameCtx.textBaseline = 'middle';
    gameCtx.fillText('X', 60, 5); // Position from SVG

    gameCtx.restore(); // Restore the canvas state (undo scaling, rotation, translation, shadow)
}

/**
 * Draws the current multiplier or "Crashed!!!" message on the Aviator canvas.
 */
function drawMultiplierOnAviatorCanvas() {
    if (!gameCtx) return; // Added safety check

    gameCtx.fillStyle = '#61dafb'; // Light blue color for multiplier
    gameCtx.font = 'bold 30px Arial';
    gameCtx.textAlign = 'center';
    gameCtx.textBaseline = 'middle';

    if (aviatorGame.status === 'crashed') {
        gameCtx.fillStyle = '#3d0303ff'; // Gold color for "Crashed!!!"
        gameCtx.font = 'bold 50px Arial'; // Larger font for "Crashed!!!"
        gameCtx.fillText('Crashed!!!', gameCanvas.width / 2, gameCanvas.height / 2 + 50);
    }
}

/**
 * Draws the curved line path and the filled area below it.
 */
function drawPathLine() {
    if (!gameCtx) return; // Added safety check

    const lineStartX = 0;
    const lineStartY = gameCanvas.height; // Start from the very bottom edge

    // Draw filled area below the line (shadow of color)
    gameCtx.save(); // Save state for fill
    gameCtx.beginPath();
    gameCtx.moveTo(lineStartX, lineStartY); // Start from bottom-left corner
    gameCtx.quadraticCurveTo(
        aviatorGame.lineControlX,
        aviatorGame.lineControlY,
        aviatorGame.currentLineX,
        aviatorGame.currentLineY
    );
    gameCtx.lineTo(aviatorGame.currentLineX, gameCanvas.height); // Down to bottom of canvas from line end X
    gameCtx.lineTo(lineStartX, gameCanvas.height); // Across to bottom-left of canvas
    gameCtx.closePath();
    gameCtx.fillStyle = 'rgba(255, 0, 0, 0.1)'; // Light red transparent fill
    gameCtx.fill();
    gameCtx.restore(); // Restore state (removes fill style)

    // Draw the curved line itself (stroke) with its shadow
    gameCtx.save(); // Save state for stroke shadow
    gameCtx.shadowColor = 'rgba(5, 132, 182, 0.7)'; // Blue glow for line
    gameCtx.shadowBlur = 10; // Blur for the glow
    gameCtx.shadowOffsetX = 2;
    gameCtx.shadowOffsetY = 2;

    gameCtx.beginPath();
    gameCtx.moveTo(lineStartX, lineStartY);
    gameCtx.quadraticCurveTo(
        aviatorGame.lineControlX,
        aviatorGame.lineControlY,
        aviatorGame.currentLineX,
        aviatorGame.currentLineY
    );
    gameCtx.strokeStyle = '#0584B6'; // Blue line for path
    gameCtx.lineWidth = 3;
    gameCtx.stroke();
    gameCtx.restore(); // Restore state (removes stroke shadow)
}

/**
 * Main drawing function to render all Aviator game elements.
 */
function drawAviatorGame() {
    if (!gameCanvas || !gameCtx) return; // Added safety check

    drawAviatorBackground(); // Always draw background

    if (aviatorGame.status === 'playing') {
        drawPathLine(); // Draw the path line and its filled area
        drawAeroplane(aviatorGame.aeroplaneX, aviatorGame.aeroplaneY, aviatorGame.aeroplaneSize); // Draw the single aeroplane
    }
    // If status is 'crashed', only background and message are drawn.
    drawMultiplierOnAviatorCanvas(); // This now handles "Crashed!!!" display
}

// --- Aviator Game Logic Functions ---

/**
 * Starts a new round of the Aviator game (for continuous play).
 */
function startAviatorRound() {
    if (!gameCanvas || !gameCtx) { // Added safety check
        console.warn("Cannot start Aviator round: gameCanvas or gameCtx is not available.");
        return;
    }

    // Reset game state for a new round
    aviatorGame.status = 'playing';
    aviatorGame.multiplier = 1.00;
    // Set crash point from the predefined sequence
    aviatorGame.crashPoint = aviatorGame.predefinedCrashPoints[aviatorGame.currentCrashPointIndex];
    aviatorGame.startTime = performance.now(); // Record start time for multiplier calculation

    // Reset aeroplane and line positions for the new round
    aviatorGame.currentLineX = 0;
    aviatorGame.currentLineY = gameCanvas.height; // Line starts at bottom edge
    aviatorGame.aeroplaneX = 0; // Aeroplane starts at the very left
    aviatorGame.aeroplaneY = gameCanvas.height; // Aeroplane starts on the bottom edge
    aviatorGame.lineControlX = gameCanvas.width / 4; // Reset initial control point X
    aviatorGame.lineControlY = gameCanvas.height; // Reset initial control point Y (at bottom for curve)

    // Update UI status message
    if (statusMessage) statusMessage.textContent = ''; // Added safety check
    if (multiplierDisplay) multiplierDisplay.textContent = '1.00x'; // Added safety check // Ensure multiplier display is reset

    // Start the animation loop
    if (aviatorGame.animationFrameId) {
        cancelAnimationFrame(aviatorGame.animationFrameId);
    }
    aviatorGame.animationFrameId = requestAnimationFrame(aviatorGameLoop);
}

/**
 * Ends the current Aviator game round (by crash).
 */
function endAviatorRound() {
    if (aviatorGame.animationFrameId) {
        cancelAnimationFrame(aviatorGame.animationFrameId);
        aviatorGame.animationFrameId = null; // Clear the animation frame ID
    }

    // Set status to crashed and display message
    aviatorGame.status = 'crashed';
    // The drawMultiplierOnAviatorCanvas will handle displaying "Crashed!!!"

    // Advance to the next crash point in the sequence
    aviatorGame.currentCrashPointIndex = (aviatorGame.currentCrashPointIndex + 1) % aviatorGame.predefinedCrashPoints.length;

    // After a short delay, start the next round automatically
    setTimeout(() => {
        // Only start a new round if the aviator page is still active AND canvas exists
        if (document.getElementById('aviator-page') && document.getElementById('aviator-page').classList.contains('active')) {
            startAviatorRound(); // Start the next round
        } else {
            // If the page is no longer active, ensure game is idle and canvas is clear
            aviatorGame.status = 'idle';
            if (gameCanvas && gameCtx) { // Added safety check
                gameCtx.clearRect(0, 0, gameCanvas.width, gameCanvas.height);
                if (multiplierDisplay) multiplierDisplay.textContent = '1.00x'; // Added safety check
                if (statusMessage) statusMessage.textContent = 'Place your bet to start!'; // Added safety check
            }
        }
    }, 2000); // Wait 2 seconds before potentially starting the next round
}

/**
 * The main Aviator game animation loop.
 * @param {DOMHighResTimeStamp} currentTime - The current time provided by requestAnimationFrame.
 */
function aviatorGameLoop(currentTime) {
    // Ensure canvas and context exist. If not, something is wrong, or page was removed.
    if (!gameCanvas || !gameCtx) { // Added safety check
        console.warn("Aviator game loop aborted: Canvas or context missing.");
        cancelAnimationFrame(aviatorGame.animationFrameId);
        aviatorGame.animationFrameId = null;
        return;
    }

    // Only continue the loop if the aviator page is active
    if (!document.getElementById('aviator-page').classList.contains('active')) {
        cancelAnimationFrame(aviatorGame.animationFrameId);
        aviatorGame.animationFrameId = null;
        aviatorGame.status = 'idle';
        if (gameCanvas && gameCtx) { // Added safety check
            gameCtx.clearRect(0, 0, gameCanvas.width, gameCanvas.height);
            if (multiplierDisplay) multiplierDisplay.textContent = '1.00x'; // Added safety check
            if (statusMessage) statusMessage.textContent = 'Game stopped.'; // Added safety check
        }
        return; // Stop the loop
    }

    if (!aviatorGame.startTime) {
        aviatorGame.startTime = currentTime;
    }

    const elapsedTime = currentTime - aviatorGame.startTime;

    // Calculate multiplier based on elapsed time (exponential growth)
    aviatorGame.multiplier = 1 + Math.pow(elapsedTime * aviatorGame.speedFactor, 1.5);
    aviatorGame.multiplier = parseFloat(aviatorGame.multiplier.toFixed(2)); // Keep it to 2 decimal places

    // --- Line and Aeroplane Movement Logic ---
    const lineSweepDuration = 15000; // Time in ms for the line to sweep across the screen
    let progressRatio = Math.min(1, elapsedTime / lineSweepDuration);
    if (progressRatio < 0) progressRatio = 0; // Ensure progress is not negative

    const lineStartX = 0;
    const lineStartY = gameCanvas.height; // Start from the very bottom edge

    // Calculate the base end point of the line (without oscillation)
    const baseLineEndX = lineStartX + progressRatio * (gameCanvas.width - lineStartX);
    const baseLineEndY = lineStartY - progressRatio * (lineStartY - 0); // Moves from bottom to top

    // Calculate vertical oscillation for both line and aeroplane
    const oscillationAmplitude = 20; // How much aeroplane/line moves up/down
    const oscillationFrequency = 0.004; // How fast aeroplane/line oscillates (slower for smoother)
    const oscillationOffset = oscillationAmplitude * Math.sin(elapsedTime * oscillationFrequency);

    // Apply oscillation to the line's end point
    aviatorGame.currentLineX = baseLineEndX;
    aviatorGame.currentLineY = baseLineEndY + oscillationOffset; // Line's Y now oscillates

    // Calculate control point for the quadratic Bezier curve
    const midPointX = (lineStartX + aviatorGame.currentLineX) / 2;
    const midPointY = (lineStartY + aviatorGame.currentLineY) / 2; // Midpoint Y now includes oscillation
    const curveDipAmount = 50; // How much the curve dips below the straight path
    aviatorGame.lineControlX = midPointX;
    aviatorGame.lineControlY = midPointY + curveDipAmount; // Add dip to Y coordinate, which is already oscillating

    // --- Aeroplane Position: directly follows the oscillating line's end point ---
    aviatorGame.aeroplaneX = aviatorGame.currentLineX;
    aviatorGame.aeroplaneY = aviatorGame.currentLineY; // Aeroplane's Y directly follows the oscillating line's Y

    // Ensure aeroplane stays within reasonable canvas vertical bounds
    // Adjust bounds based on SVG drawing's effective height, not just aeroplaneSize
    // The SVG is 150 units high, so its effective height in pixels is `aeroplaneSize`.
    const effectivePlaneHeight = aviatorGame.aeroplaneSize;
    const minAeroplaneY = effectivePlaneHeight / 2; // Top of canvas (considering half plane height)
    const maxAeroplaneY = gameCanvas.height - effectivePlaneHeight / 2; // Bottom of canvas (considering half plane height)
    aviatorGame.aeroplaneY = Math.max(minAeroplaneY, Math.min(maxAeroplaneY, aviatorGame.aeroplaneY));

    // Update UI display
    if (multiplierDisplay) multiplierDisplay.textContent = `${aviatorGame.multiplier.toFixed(2)}x`; // Added safety check

    // Check for crash condition
    if (aviatorGame.multiplier >= aviatorGame.crashPoint && aviatorGame.status === 'playing') {
        endAviatorRound(); // Trigger end of round (crash)
    } else if (aviatorGame.status === 'playing') {
        // Continue animation if still playing
        aviatorGame.animationFrameId = requestAnimationFrame(aviatorGameLoop);
    }

    // Redraw game elements
    drawAviatorGame();
}


// --- Scrolling Bets Table Animation Function ---
function setupContinuousScroll() {
    // Ensure betsTableBody and scrollingBetsContainer exist before proceeding
    if (!betsTableBody || !scrollingBetsContainer) {
        console.warn("Bets table elements not found for scrolling setup. Skipping continuous scroll.");
        return;
    }

    const initialRows = Array.from(betsTableBody.children);
    if (initialRows.length === 0) {
        console.warn("No initial rows in bets table body to scroll. Skipping continuous scroll.");
        return;
    }

    // Remove any existing animation to reset for duplication and new calculation
    betsTableBody.style.animation = 'none';
    betsTableBody.style.transform = 'translateY(0)'; // Reset position

    // Clear existing content to avoid appending to already duplicated content
    betsTableBody.innerHTML = '';
    initialRows.forEach(row => betsTableBody.appendChild(row.cloneNode(true))); // Add original rows back

    let contentHeight = betsTableBody.scrollHeight;
    const containerHeight = scrollingBetsContainer.clientHeight;

    // Duplicate rows until the content height is at least twice the container height
    // This ensures enough content for seamless looping
    while (contentHeight < containerHeight * 2) {
        initialRows.forEach(row => {
            betsTableBody.appendChild(row.cloneNode(true));
        });
        contentHeight = betsTableBody.scrollHeight; // Recalculate height after duplication
    }

    // Calculate the actual height of the content to be scrolled (one full cycle)
    // This is the height of the original content block before duplication
    let singleBlockHeight = 0;
    initialRows.forEach(row => {
        singleBlockHeight += row.offsetHeight;
    });

    // Remove existing style tag to avoid duplicates if setupContinuousScroll is called multiple times
    const existingStyleSheet = document.querySelector('style[data-scroll-keyframe]');
    if (existingStyleSheet) {
        existingStyleSheet.remove();
    }

    // Create and inject the dynamic CSS for the animation
    const styleSheet = document.createElement('style');
    styleSheet.setAttribute('data-scroll-keyframe', 'true'); // Add a marker attribute
    styleSheet.innerHTML = `
        @keyframes scrollUp {
            from { transform: translateY(0); }
            to { transform: translateY(-${singleBlockHeight}px); } /* Scroll up by one block's height */
        }
    `;
    document.head.appendChild(styleSheet);

    // Apply the animation
    // The duration should be relative to the height to maintain consistent speed
    const animationSpeedFactor = 50; // Pixels per second. Adjust this value to change speed.
    const animationDuration = (singleBlockHeight / animationSpeedFactor) * 1000; // Duration in milliseconds
    betsTableBody.style.animation = `scrollUp ${animationDuration}ms linear infinite`;
}


// --- Event Listeners ---
// Listener for clicks on the main navigation items (at the bottom)
navItems.forEach(item => {
    item.addEventListener('click', () => {
        // If the 'Menu' nav item is clicked, open the sidebar
        if (item.id === 'menu-nav-item') {
            openSidebar();
        } else {
            // For other nav items, show the corresponding page
            const pageId = item.dataset.page;
            if (pageId) { // Ensure pageId is not undefined
                showPage(pageId);
            }
        }
    });
});

// Listeners for closing the sidebar (via close button or clicking overlay)
closeSidebarBtn.addEventListener('click', closeSidebar);
overlay.addEventListener('click', closeSidebar);

// Listener for clicks on navigation links within the sidebar
const sidebarNavLinks = document.querySelectorAll('.sidebar-nav a');
sidebarNavLinks.forEach(link => {
    link.addEventListener('click', (event) => {
        event.preventDefault(); // Prevent default link behavior (e.g., page reload)
        const pageId = link.dataset.page;
        if (pageId) {
            showPage(pageId);
        }
    });
});

// Click listener for all odd cells (Betting Slip)
oddCells.forEach(cell => {
    cell.addEventListener('click', (event) => {
        const odd = event.target.dataset.odd;
        const match = event.target.dataset.match;
        if (odd && match) {
            addBet(odd, match, event.target); // Pass the cell element for styling
        }
    });
});

// Close betting slip button
if (closeBetSlipBtn) {
    closeBetSlipBtn.addEventListener('click', closeBetSlip);
}

// Stake amount input change listener (Betting Slip)
if (stakeAmountInput) {
    stakeAmountInput.addEventListener('input', updateBetSlip);
}

// Place Bet button (Betting Slip)
if (placeBetButton) {
    placeBetButton.addEventListener('click', () => {
        if (selectedBets.length === 0) {
            // Using alert for simplicity, replace with a custom modal for better UX
            alert('Please select at least one bet to place.');
            return;
        }
        const totalOdds = totalOddsSpan.textContent;
        const stake = stakeAmountInput.value;
        const potentialPayout = potentialPayoutSpan.textContent;

        // --- IMPORTANT: Implement your actual betting logic here ---
        console.log('Placing Bet:');
        console.log('Selected Bets:', selectedBets);
        console.log('Total Odds:', totalOdds);
        console.log('Stake:', stake);
        console.log('Potential Payout:', potentialPayout);

        alert(`Bet Placed!\nTotal Odds: ${totalOdds}\nStake: ${stake}\nPotential Payout: ${potentialPayout}`);

        // Optionally clear the slip after placing a bet
        selectedBets = [];
        updateBetSlip();
        closeBetSlip();
    });
}

// --- DOM Content Loaded (Initial Setup) ---
// This ensures that JavaScript runs only after the entire HTML document has been loaded and parsed.
document.addEventListener('DOMContentLoaded', () => {
    // Set 'home-page' as the default active page on initial load
    showPage('home-page');

    // Initialize the first mini ad and start the slideshow if ads are present
    if (adMiniSlides.length > 0) {
        adMiniSlides[0].classList.add('active-mini-slide'); // Ensure the first ad is visible initially
        startMiniAdSlideshow(); // Start the ad rotation
    }

    // Initial update of the betting slip (will show "No bets selected" initially)
    updateBetSlip();

    // Initial setup for Aviator game canvas (only draw initial state, don't start loop)
    // This now only runs if gameCanvas actually exists (i.e., on the Aviator page or if it's there but hidden)
    if (gameCanvas && gameCtx) { // Ensure gameCanvas and gameCtx exist before calling
        resizeAviatorCanvas(); // Call resize to set canvas dimensions and initial aeroplane Y
        // Do NOT call startAviatorRound() here. It's called when showPage('aviator-page') is triggered.
        drawAviatorGame(); // Draw initial idle state for Aviator game (background, initial multiplier)
    }

    // Setup continuous scroll for bets table
    setupContinuousScroll();
});

/*
// User's provided snippet for continuous cloning.
// This snippet looks for an element with ID 'bets-scroll'.
// In your current HTML, the scrolling container for the bets table is 'scrolling-bets-container'.
// The existing `setupContinuousScroll()` function already handles continuous scrolling
// for the table rows using a CSS animation, which is generally preferred for performance
// and smooth looping without directly manipulating DOM for every scroll step.

// If you intended to use this snippet to replace or augment the existing scrolling logic,
// please clarify which HTML element you want to apply this to (e.g., if you add
// id="bets-scroll" to your 'scrolling-bets-container' or another element),
// and how you want it to interact with the current `setupContinuousScroll` function.

// const scrollContainer = document.getElementById('bets-scroll');
// if (scrollContainer) {
//     const clone = scrollContainer.cloneNode(true);
//     scrollContainer.parentNode.appendChild(clone);
// } else {
//     console.warn("Element with ID 'bets-scroll' not found. Cannot apply cloning snippet.");
// }
*/