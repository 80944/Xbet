/**
 * bets-scroll-animation.js
 *
 * This script handles the continuous upward scrolling animation for the bets table.
 * It duplicates table rows to create a seamless loop and dynamically injects
 * a CSS @keyframes rule for the animation.
 */

/**
 * Sets up the continuous scrolling animation for the bets table body.
 * This function should be called when the page containing the bets table is active.
 */
function setupContinuousScroll() {
    // Get references to the table body and its scrolling container
    const betsTableBody = document.getElementById('bets-table-body');
    const scrollingBetsContainer = document.getElementById('scrolling-bets-container');

    // Check if both elements exist in the DOM
    if (!betsTableBody || !scrollingBetsContainer) {
        console.warn("Bets table elements (bets-table-body or scrolling-bets-container) not found for scrolling setup.");
        return; // Exit if elements are missing
    }

    // Get the initial set of table rows. We'll use these to duplicate content.
    const initialRows = Array.from(betsTableBody.children);

    // If there are no initial rows, there's nothing to scroll.
    if (initialRows.length === 0) {
        console.warn("No initial rows found in bets table body to scroll.");
        return;
    }

    // --- Prepare for Duplication and Animation Reset ---
    // Remove any existing animation property to reset the state before recalculating.
    betsTableBody.style.animation = 'none';
    // Reset transform to 0 to ensure accurate height calculation after removing animation.
    betsTableBody.style.transform = 'translateY(0)';

    // Clear existing content to avoid appending to already duplicated content if this function is called multiple times.
    betsTableBody.innerHTML = '';
    // Append a fresh set of initial rows to start with.
    initialRows.forEach(row => betsTableBody.appendChild(row.cloneNode(true)));

    // --- Duplicate Rows for Seamless Looping ---
    // Calculate the current height of the content within the tbody.
    let contentHeight = betsTableBody.scrollHeight;
    // Get the fixed height of the container that clips the scrolling content.
    const containerHeight = scrollingBetsContainer.clientHeight;

    // Continuously duplicate the initial rows until the total content height
    // is at least twice the height of the visible container.
    // This ensures there's always enough content to scroll seamlessly
    // before the animation loops back, preventing a blank space.
    while (contentHeight < containerHeight * 2) {
        initialRows.forEach(row => {
            betsTableBody.appendChild(row.cloneNode(true));
        });
        // Recalculate content height after appending new rows.
        contentHeight = betsTableBody.scrollHeight;
    }

    // --- Calculate Animation Properties ---
    // The 'singleBlockHeight' is the height of one full set of the original rows.
    // This is the distance the animation needs to travel before looping.
    let singleBlockHeight = 0;
    initialRows.forEach(row => {
        singleBlockHeight += row.offsetHeight;
    });

    // --- Dynamically Inject CSS @keyframes ---
    // Create a new <style> element to hold our dynamic CSS.
    const styleSheet = document.createElement('style');
    // Define the @keyframes rule for the 'scrollUp' animation.
    // It moves the element from its original position (0) up by 'singleBlockHeight'.
    styleSheet.innerHTML = `
        @keyframes scrollUp {
            from { transform: translateY(0); }
            to { transform: translateY(-${singleBlockHeight}px); } /* Scroll up by one block's height */
        }
    `;
    // Append the new style sheet to the document's <head>.
    document.head.appendChild(styleSheet);

    // --- Apply the Animation to the tbody ---
    // Define the animation speed in pixels per second. Adjust this value to change how fast the rows scroll.
    const animationSpeedFactor = 50; // For example, 50 pixels per second.
    // Calculate the total duration of the animation based on the content height and desired speed.
    // Convert to milliseconds as CSS animation-duration expects milliseconds.
    const animationDuration = (singleBlockHeight / animationSpeedFactor) * 1000;

    // Apply the CSS animation properties to the betsTableBody.
    // - `scrollUp`: The name of our defined keyframes animation.
    // - `${animationDuration}ms`: The calculated duration in milliseconds.
    // - `linear`: Ensures a constant speed throughout the animation.
    // - `infinite`: Makes the animation repeat indefinitely.
    betsTableBody.style.animation = `scrollUp ${animationDuration}ms linear infinite`;
}

// Optional: If you want the scrolling to start immediately when this script loads
// (assuming the elements are already in the DOM), you can call it here.
// However, if it's part of a multi-page app, it's better to call it when the specific page is shown.
// document.addEventListener('DOMContentLoaded', setupContinuousScroll);