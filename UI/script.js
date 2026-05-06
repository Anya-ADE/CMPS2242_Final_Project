// API Base URL
const API_BASE = '/api/holidays';

// Debug flag to see console logs
const DEBUG = true;

// Helper function for debugging
function log(message, data) {
    if (DEBUG) {
        if (data) {
            console.log(`[Belize Holidays] ${message}`, data);
        } else {
            console.log(`[Belize Holidays] ${message}`);
        }
    }
}

// Fetch API helper with better error handling
async function fetchAPI(endpoint) {
    try {
        log(`Fetching: ${API_BASE}${endpoint}`);
        const response = await fetch(`${API_BASE}${endpoint}`);
        
        log(`Response status: ${response.status}`);
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `HTTP ${response.status}`);
        }
        
        const data = await response.json();
        log(`Received data:`, data);
        return data;
    } catch (error) {
        console.error(`API Error [${endpoint}]:`, error);
        return null;
    }
}

// Show error message in a specific container
function showError(containerId, message) {
    const container = document.getElementById(containerId);
    if (container) {
        container.innerHTML = `<div class="error">⚠️ Error: ${message}</div>`;
    }
}

// Show loading state
function showLoading(containerId) {
    const container = document.getElementById(containerId);
    if (container) {
        container.innerHTML = '<div class="loading">📅 Loading...</div>';
    }
}

// Load today's status
async function loadTodayStatus() {
    log('Loading today\'s status...');
    
    try {
        const data = await fetchAPI('/today');
        const statusDiv = document.getElementById('todayStatus');
        
        if (statusDiv) {
            if (data && data.isHoliday) {
                const holidayClass = data.isHoliday === 'yes' ? 'holiday-yes' : 'holiday-no';
                const holidayText = data.isHoliday === 'yes' ? '🎉 TODAY IS A HOLIDAY! 🎉' : '📅 TODAY IS NOT A HOLIDAY';
                
                statusDiv.innerHTML = `
                    <div class="holiday-status ${holidayClass}">
                        <strong>${holidayText}</strong>
                        ${data.occasion ? `<br><span style="font-size: 0.9em;">${data.occasion}</span>` : ''}
                    </div>
                    <div class="message">${data.message || ''}</div>
                `;
                log('Today status loaded successfully');
            } else {
                statusDiv.innerHTML = '<div class="error">Failed to load today\'s status</div>';
            }
        }
    } catch (error) {
        console.error('Error loading today status:', error);
        const statusDiv = document.getElementById('todayStatus');
        if (statusDiv) {
            statusDiv.innerHTML = '<div class="error">Failed to load today\'s status</div>';
        }
    }
    
    // Load next holiday
    try {
        const nextData = await fetchAPI('/next');
        const statusDiv = document.getElementById('todayStatus');
        
        if (statusDiv && nextData && nextData.occasion) {
            statusDiv.innerHTML += `
                <div class="next-holiday">
                    <strong>➡️ Upcoming Holiday:</strong> ${nextData.occasion}<br>
                    ${nextData.day || ''}, ${nextData.date || ''}
                    ${nextData.message ? `<br><small>${nextData.message}</small>` : ''}
                </div>
            `;
            log('Next holiday loaded successfully');
        }
    } catch (error) {
        console.error('Error loading next holiday:', error);
    }
}

// Load all occasions (this populates the right card)
async function loadAllOccasions() {
    log('Loading all occasions...');
    showLoading('content2');
    
    const data = await fetchAPI('/occasions');
    const container = document.getElementById('content2');
    
    if (container) {
        if (data && data.occasions && data.occasions.length > 0) {
            container.innerHTML = `
                <div style="margin-bottom: 15px; padding: 10px; background: #f3e5f5; border-radius: 8px; text-align: center;">
                    <strong>${data.year || 2026}</strong> | ${data.occasions.length} Total Holidays
                </div>
                <ul class="holiday-list">
                    ${data.occasions.map(occasion => `
                        <li>
                            <div class="holiday-occasion">🎊 ${occasion}</div>
                        </li>
                    `).join('')}
                </ul>
            `;
            log(`Loaded ${data.occasions.length} occasions`);
        } else {
            container.innerHTML = '<div class="error">No occasions found. Please run migrations first.</div>';
            console.error('No occasions data received:', data);
        }
    }
}

// Load this month's holidays
async function loadThisMonth() {
    log('Loading this month\'s holidays...');
    showLoading('content1');
    
    document.getElementById('card1Title').innerHTML = "📅 Holidays This Month";
    document.getElementById('card2Title').innerHTML = "🎊 All Occasions 2026";
    
    const data = await fetchAPI('/this-month');
    const container = document.getElementById('content1');
    
    if (container) {
        if (data && data.holidays && data.holidays.length > 0) {
            container.innerHTML = `
                <div style="margin-bottom: 15px; padding: 10px; background: #f3e5f5; border-radius: 8px; text-align: center;">
                    <strong>${data.month || 'Unknown'} ${data.year || 2026}</strong> | ${data.holidays.length} Holiday${data.holidays.length > 1 ? 's' : ''}
                </div>
                <ul class="holiday-list">
                    ${data.holidays.map(h => `
                        <li>
                            <div class="holiday-day">${h.day || ''}</div>
                            <div class="holiday-occasion">${h.occasion || ''}</div>
                            <div class="holiday-date">${h.date || ''}</div>
                        </li>
                    `).join('')}
                </ul>
            `;
            log(`Loaded ${data.holidays.length} holidays for this month`);
        } else if (data && data.holidays && data.holidays.length === 0) {
            container.innerHTML = '<div class="loading">No holidays this month 📅</div>';
            log('No holidays this month');
        } else {
            container.innerHTML = '<div class="error">Failed to load holiday data. Make sure the server is running and database has data.</div>';
            console.error('Invalid data received:', data);
        }
    }
    
    // Also load occasions in the right panel
    await loadAllOccasions();
}

// Load next month's holidays
async function loadNextMonth() {
    log('Loading next month\'s holidays...');
    showLoading('content1');
    
    document.getElementById('card1Title').innerHTML = "📆 Holidays Next Month";
    document.getElementById('card2Title').innerHTML = "🎊 All Occasions 2026";
    
    const data = await fetchAPI('/next-month');
    const container = document.getElementById('content1');
    
    if (container) {
        if (data && data.holidays && data.holidays.length > 0) {
            container.innerHTML = `
                <div style="margin-bottom: 15px; padding: 10px; background: #f3e5f5; border-radius: 8px; text-align: center;">
                    <strong>${data.month || 'Unknown'} ${data.year || 2026}</strong> | ${data.holidays.length} Holiday${data.holidays.length > 1 ? 's' : ''}
                </div>
                <ul class="holiday-list">
                    ${data.holidays.map(h => `
                        <li>
                            <div class="holiday-day">${h.day || ''}</div>
                            <div class="holiday-occasion">${h.occasion || ''}</div>
                            <div class="holiday-date">${h.date || ''}</div>
                        </li>
                    `).join('')}
                </ul>
            `;
            log(`Loaded ${data.holidays.length} holidays for next month`);
        } else if (data && data.holidays && data.holidays.length === 0) {
            container.innerHTML = '<div class="loading">No holidays next month 📅</div>';
        } else if (data && data.message) {
            container.innerHTML = `<div class="loading">${data.message}</div>`;
        } else {
            container.innerHTML = '<div class="error">Failed to load holiday data</div>';
        }
    }
    
    await loadAllOccasions();
}

// Load all dates
async function loadAllDates() {
    log('Loading all dates...');
    showLoading('content1');
    
    document.getElementById('card1Title').innerHTML = "📝 All Holiday Dates";
    document.getElementById('card2Title').innerHTML = "🎊 All Occasions 2026";
    
    const data = await fetchAPI('/dates');
    const container = document.getElementById('content1');
    
    if (container) {
        if (data && Array.isArray(data) && data.length > 0) {
            container.innerHTML = `
                <div style="margin-bottom: 15px; padding: 10px; background: #f3e5f5; border-radius: 8px; text-align: center;">
                    <strong>${data.length} Holiday Dates in 2026</strong>
                </div>
                <ul class="holiday-list">
                    ${data.map(item => `
                        <li>
                            <div class="holiday-date">📅 ${item.date || ''}</div>
                            <div class="holiday-occasion">${item.occasion || ''}</div>
                        </li>
                    `).join('')}
                </ul>
            `;
            log(`Loaded ${data.length} dates`);
        } else {
            container.innerHTML = '<div class="error">No dates found</div>';
        }
    }
    
    await loadAllOccasions();
}

// Load all days
async function loadAllDays() {
    log('Loading all days...');
    showLoading('content1');
    
    document.getElementById('card1Title').innerHTML = "📌 Holidays by Day";
    document.getElementById('card2Title').innerHTML = "🎊 All Occasions 2026";
    
    const data = await fetchAPI('/days');
    const container = document.getElementById('content1');
    
    if (container) {
        if (data && Array.isArray(data) && data.length > 0) {
            container.innerHTML = `
                <div style="margin-bottom: 15px; padding: 10px; background: #f3e5f5; border-radius: 8px; text-align: center;">
                    <strong>${data.length} Holidays in 2026</strong>
                </div>
                <ul class="holiday-list">
                    ${data.map(item => `
                        <li>
                            <div class="holiday-day">${item.day || ''}</div>
                            <div class="holiday-occasion">${item.occasion || ''}</div>
                            <div class="holiday-date">${item.date || ''}</div>
                        </li>
                    `).join('')}
                </ul>
            `;
            log(`Loaded ${data.length} days`);
        } else {
            container.innerHTML = '<div class="error">No days found</div>';
        }
    }
    
    await loadAllOccasions();
}

// Load full year 2026
async function loadYear2026() {
    log('Loading full year 2026...');
    showLoading('content1');
    
    document.getElementById('card1Title').innerHTML = "📅 Full Year 2026 Holidays";
    document.getElementById('card2Title').innerHTML = "🎊 All Occasions 2026";
    
    const data = await fetchAPI('/year/2026');
    const container = document.getElementById('content1');
    
    if (container) {
        if (data && data.holidays && data.holidays.length > 0) {
            container.innerHTML = `
                <div style="margin-bottom: 15px; padding: 10px; background: #f3e5f5; border-radius: 8px; text-align: center;">
                    <strong>${data.year || 2026}</strong> | ${data.holidays.length} Total Holidays
                </div>
                <ul class="holiday-list">
                    ${data.holidays.map(h => `
                        <li>
                            <div class="holiday-day">${h.day || ''}</div>
                            <div class="holiday-occasion">${h.occasion || ''}</div>
                            <div class="holiday-date">${h.date || ''}</div>
                        </li>
                    `).join('')}
                </ul>
            `;
            log(`Loaded ${data.holidays.length} holidays for full year`);
        } else {
            container.innerHTML = '<div class="error">No holiday data found for 2026</div>';
        }
    }
    
    await loadAllOccasions();
}

// Test API connection
async function testAPIConnection() {
    log('Testing API connection...');
    try {
        const response = await fetch('/health');
        const data = await response.json();
        log('API health check:', data);
        
        if (data && data.status === 'available') {
            log('✅ API is running properly');
            return true;
        } else {
            log('⚠️ API returned unexpected response');
            return false;
        }
    } catch (error) {
        console.error('❌ API connection failed:', error);
        return false;
    }
}

// Initialize page
async function initialize() {
    log('Initializing Belize Holidays UI...');
    
    // Check if API is reachable
    const isApiRunning = await testAPIConnection();
    
    if (!isApiRunning) {
        const statusDiv = document.getElementById('todayStatus');
        if (statusDiv) {
            statusDiv.innerHTML = `
                <div class="error">
                    ⚠️ Cannot connect to API server.<br>
                    Make sure to run: <strong>go run .</strong><br>
                    Then refresh this page.
                </div>
            `;
        }
        return;
    }
    
    // Load all data
    await loadTodayStatus();
    await loadThisMonth();
}

// Make functions available globally
window.loadThisMonth = loadThisMonth;
window.loadNextMonth = loadNextMonth;
window.loadAllOccasions = loadAllOccasions;
window.loadAllDates = loadAllDates;
window.loadAllDays = loadAllDays;
window.loadYear2026 = loadYear2026;

// Start when page loads
document.addEventListener('DOMContentLoaded', initialize);