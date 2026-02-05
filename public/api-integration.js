// API Integration for Live Odds
const API_URL = 'https://api.the-odds-api.com/v4/sports/soccer/odds/?apiKey=c8e279c0b897b05aa5706ee42d9ccbd0&regions=uk&markets=h2h';
const PAGE_SIZE = 30; // number of matches to load per page
window.allMatches = [];
window.currentOffset = 0;
window.displayedLeagues = new Set();

/**
 * Fetch live soccer matches from the API
 */
async function fetchLiveMatches() {
    try {
        const response = await fetch(API_URL);
        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching matches:', error);
        return null;
    }
}

/**
 * Extract odds from bookmaker data
 * Returns { home: price, draw: price, away: price } or null
 */
function extractOdds(bookmakers, homeTeam, awayTeam) {
    if (!bookmakers || bookmakers.length === 0) return null;

    // Try all bookmakers and their markets to find a proper h2h market
    for (const bookmaker of bookmakers) {
        if (!bookmaker.markets || bookmaker.markets.length === 0) continue;

        for (const market of bookmaker.markets) {
            // prefer markets with key 'h2h'
            if (!market.outcomes || market.outcomes.length < 2) continue;

            // basic map
            const outcomes = market.outcomes;
            let drawOutcome = outcomes.find(o => o.name && o.name.toLowerCase() === 'draw');
            // if no explicit 'Draw', try common labels
            if (!drawOutcome) drawOutcome = outcomes.find(o => /draw|tie/i.test(o.name || ''));

            let homeOutcome = outcomes.find(o => o.name === homeTeam);
            let awayOutcome = outcomes.find(o => o.name === awayTeam);

            // fallback: if names don't match, attempt to infer by order
            if (!homeOutcome || !awayOutcome) {
                // If 3 outcomes and one is draw, map remaining two by position
                if (outcomes.length >= 3 && drawOutcome) {
                    const others = outcomes.filter(o => o !== drawOutcome);
                    if (others.length >= 2) {
                        homeOutcome = homeOutcome || others[0];
                        awayOutcome = awayOutcome || others[1];
                    }
                } else if (outcomes.length >= 2) {
                    // no draw listed — assume first=home second=away
                    homeOutcome = homeOutcome || outcomes[0];
                    awayOutcome = awayOutcome || outcomes[1];
                }
            }

            const odds = {};
            if (homeOutcome && typeof homeOutcome.price === 'number') odds.home = homeOutcome.price;
            if (awayOutcome && typeof awayOutcome.price === 'number') odds.away = awayOutcome.price;
            if (drawOutcome && typeof drawOutcome.price === 'number') odds.draw = drawOutcome.price;

            // return odds if at least home and away are present; draw is optional
            if (odds.home && odds.away) return odds;
            // continue searching other markets/bookmakers
        }
    }

    return null;
}

/**
 * Format time until match starts
 */
function getTimeUntilMatch(commenceTime) {
    const now = new Date();
    const matchTime = new Date(commenceTime);
    const diffMs = matchTime - now;
    
    if (diffMs < 0) {
        return "STARTED";
    }
    
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 60) {
        return `STARTS IN ${diffMins}'`;
    }
    
    const diffHours = Math.floor(diffMins / 60);
    return `STARTS IN ${diffHours}h`;
}

/**
 * Create a table row for a match
 */
function createMatchRow(match) {
    const odds = extractOdds(match.bookmakers, match.home_team, match.away_team);
    if (!odds) return null;
    
    const timeInfo = getTimeUntilMatch(match.commence_time);
    const matchDisplay = `${match.home_team}<br>vs ${match.away_team}`;
    
    const row = document.createElement('tr');
    row.innerHTML = `
        <td>${matchDisplay}  <span class="time-info">${timeInfo}</span></td>
        <td class="odd-cell" data-odd="${odds.home.toFixed(2)}" data-match="${match.home_team} vs ${match.away_team} (Home)">${odds.home.toFixed(2)}</td>
        <td class="odd-cell" data-odd="${odds.draw.toFixed(2)}" data-match="${match.home_team} vs ${match.away_team} (Draw)">${odds.draw.toFixed(2)}</td>
        <td class="odd-cell" data-odd="${odds.away.toFixed(2)}" data-match="${match.home_team} vs ${match.away_team} (Away)">${odds.away.toFixed(2)}</td>
    `;
    
    return row;
}

/**
 * Populate the home page with live matches
 */
async function populateLiveMatches() {
    const matchesData = await fetchLiveMatches();
    const container = document.getElementById('matches-container');
    const loader = document.getElementById('page-loader');
    if (loader) loader.style.display = 'flex';

    if (!matchesData || matchesData.length === 0) {
        console.warn('No matches available from API');
        if (loader) loader.style.display = 'none';
        if (container) container.innerHTML = '<p>No matches available at the moment.</p>';
        return;
    }
    if (!container) {
        console.error('matches-container not found');
        if (loader) loader.style.display = 'none';
        return;
    }

    // Clear container and prepare pagination state
    container.innerHTML = '';
    window.displayedLeagues.clear();

    // Sort matches by commence_time (earliest first)
    matchesData.sort((a, b) => new Date(a.commence_time) - new Date(b.commence_time));

    // Store all matches and reset offset
    window.allMatches = matchesData;
    window.currentOffset = 0;

    // Render first page
    renderNextPage();

    // Show/hide load more button
    const loadMoreWrapper = document.getElementById('load-more-wrapper');
    if (loadMoreWrapper) {
        if (window.allMatches.length > PAGE_SIZE) loadMoreWrapper.style.display = 'block';
        else loadMoreWrapper.style.display = 'none';
    }

    if (loader) loader.style.display = 'none';

    // Optional: expose total count at top
    const totalHeader = document.createElement('div');
    totalHeader.style.margin = '8px 0';
    totalHeader.style.fontWeight = '700';
    totalHeader.textContent = `Total matches: ${matchesData.length}`;
    container.insertBefore(totalHeader, container.firstChild);
}

/**
 * Render next page of matches (appends to container)
 */
function renderNextPage() {
    const container = document.getElementById('matches-container');
    const start = window.currentOffset;
    const end = Math.min(window.allMatches.length, start + PAGE_SIZE);
    const slice = window.allMatches.slice(start, end);
    renderMatchesSubset(slice, true);
    window.currentOffset = end;

    const loadMoreWrapper = document.getElementById('load-more-wrapper');
    if (loadMoreWrapper) {
        if (window.currentOffset >= window.allMatches.length) loadMoreWrapper.style.display = 'none';
        else loadMoreWrapper.style.display = 'block';
    }
}

/**
 * Render a subset array of matches; append if append=true
 */
function renderMatchesSubset(matchesSubset, append = true) {
    const container = document.getElementById('matches-container');
    if (!container) return;

    // Group the subset by league
    const grouped = {};
    matchesSubset.forEach(match => {
        const sportTitle = match.sport_title || 'Soccer';
        if (!grouped[sportTitle]) grouped[sportTitle] = [];
        grouped[sportTitle].push(match);
    });

    Object.entries(grouped).forEach(([league, matches]) => {
        let grid;
        // if league already displayed, append to its existing grid
        if (window.displayedLeagues.has(league)) {
            // try to find the last grid for this league
            const existingHeaders = Array.from(container.querySelectorAll('.league-header'));
            const headerEl = existingHeaders.reverse().find(h => h.textContent && h.textContent.startsWith(league));
            if (headerEl) {
                // next sibling should be grid
                grid = headerEl.nextElementSibling;
                if (!grid || !grid.classList.contains('matches-grid')) {
                    grid = document.createElement('div');
                    grid.className = 'matches-grid';
                    headerEl.parentNode.insertBefore(grid, headerEl.nextSibling);
                }
            }
        } else {
            // add header
            const header = document.createElement('div');
            header.className = 'league-header';
            header.textContent = `${league}`;
            container.appendChild(header);
            grid = document.createElement('div');
            grid.className = 'matches-grid';
            container.appendChild(grid);
            window.displayedLeagues.add(league);
        }

        matches.forEach(match => {
            const odds = extractOdds(match.bookmakers, match.home_team, match.away_team);
            if (!odds) return;

            // build odds buttons HTML depending on availability
            let oddsHtml = '';
            if (odds.home !== undefined) {
                oddsHtml += `<div class="odd-btn" data-odd="${odds.home.toFixed(2)}" data-match="${match.home_team} vs ${match.away_team} (Home)">${odds.home.toFixed(2)}</div>`;
            }
            if (odds.draw !== undefined) {
                oddsHtml += `<div class="odd-btn" data-odd="${odds.draw.toFixed(2)}" data-match="${match.home_team} vs ${match.away_team} (Draw)">${odds.draw.toFixed(2)}</div>`;
            }
            if (odds.away !== undefined) {
                oddsHtml += `<div class="odd-btn" data-odd="${odds.away.toFixed(2)}" data-match="${match.home_team} vs ${match.away_team} (Away)">${odds.away.toFixed(2)}</div>`;
            }

            const card = document.createElement('div');
            card.className = 'match-card';
            card.innerHTML = `
                <div class="match-top">
                    <div class="teams">${match.home_team} <span style="color:#9fb0c8">vs</span> ${match.away_team}</div>
                    <div class="time-info">${getTimeUntilMatch(match.commence_time)}</div>
                </div>
                <div class="odds-row">
                    ${oddsHtml}
                </div>
            `;

            // Attach click handlers to odd buttons
            const oddButtons = card.querySelectorAll('.odd-btn');
            oddButtons.forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const odd = parseFloat(btn.dataset.odd);
                    const matchText = btn.dataset.match;
                    if (odd && matchText) addBet(odd, matchText, btn);
                });
            });

            grid.appendChild(card);
        });
    });
}

/**
 * Attach click listeners to odd cells
 */
function attachOddCellListeners() {
    const oddCells = document.querySelectorAll('.odd-cell');
    oddCells.forEach(cell => {
        // Remove existing listeners by cloning
        const newCell = cell.cloneNode(true);
        cell.parentNode.replaceChild(newCell, cell);
        
        // Add new listener
        newCell.addEventListener('click', function() {
            const odd = this.dataset.odd;
            const match = this.dataset.match;
            if (odd && match) {
                addBet(parseFloat(odd), match, this);
            }
        });
    });
}

/**
 * Auto-refresh matches every 30 seconds
 */
function startAutoRefresh(intervalMs = 30000) {
    populateLiveMatches();
    setInterval(populateLiveMatches, intervalMs);
}

// Initialize when the home page is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Only load matches if we're on the home page
    const homePage = document.getElementById('home-page');
    if (homePage) {
        populateLiveMatches();
        startAutoRefresh(30000);

        // wire load more button
        const loadMoreBtn = document.getElementById('load-more-btn');
        if (loadMoreBtn) loadMoreBtn.addEventListener('click', () => renderNextPage());
    }
});
