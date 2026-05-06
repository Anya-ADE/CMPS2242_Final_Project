// API Base URL
const API_BASE = '/api/holidays';

// Current selected month (starts with current month)
let currentDisplayMonth = new Date().getMonth() + 1; // 1-12
let currentDisplayYear = 2026;

// Debug flag
const DEBUG = true;

function log(message, data) {
    if (DEBUG) {
        if (data) {
            console.log(`[Belize Holidays] ${message}`, data);
        } else {
            console.log(`[Belize Holidays] ${message}`);
        }
    }
}

// Fetch API helper
async function fetchAPI(endpoint) {
    try {
        log(`Fetching: ${API_BASE}${endpoint}`);
        const response = await fetch(`${API_BASE}${endpoint}`);
        
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

// Fetch holidays for a specific month
async function fetchHolidaysByMonth(month, year) {
    try {
        const response = await fetch(`${API_BASE}/month/${year}/${month}`);
        if (!response.ok) {
            return null;
        }
        return await response.json();
    } catch (error) {
        console.error('Error fetching month holidays:', error);
        return null;
    }
}

// Show loading state
function showLoading(containerId) {
    const container = document.getElementById(containerId);
    if (container) {
        container.innerHTML = '<div class="loading">📅 Loading...</div>';
    }
}

// Load holidays for a specific month
async function loadHolidaysForMonth(month, year) {
    log(`Loading holidays for ${year}-${month}`);
    showLoading('content1');
    
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                        'July', 'August', 'September', 'October', 'November', 'December'];
    const monthName = monthNames[month - 1];
    
    document.getElementById('card1Title').innerHTML = `📅 ${monthName} ${year} Holidays`;
    document.getElementById('card2Title').innerHTML = "🎊 All Occasions 2026";
    
    try {
        const response = await fetch(`${API_BASE}/month/${year}/${month}`);
        const data = await response.json();
        const container = document.getElementById('content1');
        
        if (container) {
            if (data && data.holidays && data.holidays.length > 0) {
                container.innerHTML = `
                    <div style="margin-bottom: 15px; padding: 10px; background: #f3e5f5; border-radius: 8px; text-align: center;">
                        <strong>${monthName} ${year}</strong> | ${data.holidays.length} Holiday${data.holidays.length > 1 ? 's' : ''}
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
                log(`Loaded ${data.holidays.length} holidays for ${monthName}`);
            } else if (data && data.holidays && data.holidays.length === 0) {
                container.innerHTML = '<div class="loading">No holidays this month 📅</div>';
            } else if (data && data.message) {
                container.innerHTML = `<div class="loading">${data.message}</div>`;
            } else {
                container.innerHTML = '<div class="error">No holiday data available for this month</div>';
            }
        }
    } catch (error) {
        console.error('Error:', error);
        document.getElementById('content1').innerHTML = '<div class="error">Failed to load holidays</div>';
    }
    
    await loadAllOccasions();
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
            } else {
                statusDiv.innerHTML = '<div class="error">Failed to load today\'s status</div>';
            }
        }
    } catch (error) {
        console.error('Error loading today status:', error);
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
        }
    } catch (error) {
        console.error('Error loading next holiday:', error);
    }
}

// Load all occasions
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
            container.innerHTML = '<div class="error">No occasions found</div>';
        }
    }
}

// Load current month
async function loadCurrentMonth() {
    const now = new Date();
    currentDisplayMonth = now.getMonth() + 1;
    currentDisplayYear = 2026;
    await loadHolidaysForMonth(currentDisplayMonth, currentDisplayYear);
}

// Load next month (increment by 1)
async function loadNextMonth() {
    currentDisplayMonth++;
    if (currentDisplayMonth > 12) {
        currentDisplayMonth = 1;
        currentDisplayYear++;
    }
    
    if (currentDisplayYear > 2026) {
        document.getElementById('content1').innerHTML = '<div class="loading">Holidays for 2027 are not yet available in the database</div>';
        return;
    }
    
    await loadHolidaysForMonth(currentDisplayMonth, currentDisplayYear);
}

// Load previous month (decrement by 1)
async function loadPreviousMonth() {
    currentDisplayMonth--;
    if (currentDisplayMonth < 1) {
        currentDisplayMonth = 12;
        currentDisplayYear--;
    }
    
    if (currentDisplayYear < 2026) {
        document.getElementById('content1').innerHTML = '<div class="loading">No holiday data available before 2026</div>';
        return;
    }
    
    await loadHolidaysForMonth(currentDisplayMonth, currentDisplayYear);
}

// Load a specific month (January = 1, December = 12)
async function loadSpecificMonth(month) {
    if (month < 1 || month > 12) {
        console.error('Invalid month:', month);
        return;
    }
    currentDisplayMonth = month;
    currentDisplayYear = 2026;
    await loadHolidaysForMonth(currentDisplayMonth, currentDisplayYear);
}

// Load all dates
async function loadAllDates() {
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
        if (data && data.status === 'available') {
            log('✅ API is running properly');
            return true;
        }
        return false;
    } catch (error) {
        console.error('❌ API connection failed:', error);
        return false;
    }
}

// Initialize page
async function initialize() {
    log('Initializing Belize Holidays UI...');
    
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
    
    await loadTodayStatus();
    await loadCurrentMonth();
}

// Make functions available globally
window.loadCurrentMonth = loadCurrentMonth;
window.loadNextMonth = loadNextMonth;
window.loadPreviousMonth = loadPreviousMonth;
window.loadSpecificMonth = loadSpecificMonth;
window.loadAllOccasions = loadAllOccasions;
window.loadAllDates = loadAllDates;
window.loadAllDays = loadAllDays;
window.loadYear2026 = loadYear2026;

// Start when page loads
document.addEventListener('DOMContentLoaded', initialize);