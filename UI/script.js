const API_BASE = '/api/holidays';

// Fetch API helper
async function fetchAPI(endpoint) {
    try {
        const response = await fetch(`${API_BASE}${endpoint}`);
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'API request failed');
        }
        return await response.json();
    } catch (error) {
        console.error('Error:', error);
        showError(error.message);
        return null;
    }
}

// Show error message
function showError(message) {
    const content1 = document.getElementById('content1');
    if (content1) {
        content1.innerHTML = `<div class="error">⚠️ Error: ${message}</div>`;
    }
}

// Load today's status
async function loadTodayStatus() {
    const data = await fetchAPI('/today');
    if (data) {
        const statusDiv = document.getElementById('todayStatus');
        const holidayClass = data.isHoliday === 'yes' ? 'holiday-yes' : 'holiday-no';
        const holidayText = data.isHoliday === 'yes' ? '🎉 TODAY IS A HOLIDAY! 🎉' : '📅 TODAY IS NOT A HOLIDAY';
        
        statusDiv.innerHTML = `
            <div class="holiday-status ${holidayClass}">
                <strong>${holidayText}</strong>
                ${data.occasion ? `<br><span style="font-size: 0.9em;">${data.occasion}</span>` : ''}
            </div>
            <div class="message">${data.message}</div>
        `;
    }

    const nextData = await fetchAPI('/next');
    if (nextData) {
        const statusDiv = document.getElementById('todayStatus');
        statusDiv.innerHTML += `
            <div class="next-holiday">
                <strong>➡️ Upcoming Holiday:</strong> ${nextData.occasion}<br>
                ${nextData.day}, ${nextData.date}
                ${nextData.message ? `<br><small>${nextData.message}</small>` : ''}
            </div>
        `;
    }
}

// Load this month's holidays
async function loadThisMonth() {
    document.getElementById('card1Title').innerHTML = "📅 Holidays This Month";
    document.getElementById('card2Title').innerHTML = "🎊 All Occasions 2026";
    
    const data = await fetchAPI('/this-month');
    const container = document.getElementById('content1');
    
    if (data && data.holidays && data.holidays.length > 0) {
        container.innerHTML = `
            <div style="margin-bottom: 15px; padding: 10px; background: #f3e5f5; border-radius: 8px; text-align: center;">
                <strong>${data.month} ${data.year}</strong> | ${data.holidays.length} Holiday${data.holidays.length > 1 ? 's' : ''}
            </div>
            <ul class="holiday-list">
                ${data.holidays.map(h => `
                    <li>
                        <div class="holiday-day">${h.day}</div>
                        <div class="holiday-occasion">${h.occasion}</div>
                        <div class="holiday-date">${h.date}</div>
                    </li>
                `).join('')}
            </ul>
        `;
    } else if (data && data.holidays && data.holidays.length === 0) {
        container.innerHTML = '<div class="loading">No holidays this month 📅</div>';
    } else {
        container.innerHTML = '<div class="error">Failed to load data</div>';
    }
    
    await loadAllOccasions();
}

// Load next month's holidays
async function loadNextMonth() {
    document.getElementById('card1Title').innerHTML = "📆 Holidays Next Month";
    document.getElementById('card2Title').innerHTML = "🎊 All Occasions 2026";
    
    const data = await fetchAPI('/next-month');
    const container = document.getElementById('content1');
    
    if (data && data.holidays && data.holidays.length > 0) {
        container.innerHTML = `
            <div style="margin-bottom: 15px; padding: 10px; background: #f3e5f5; border-radius: 8px; text-align: center;">
                <strong>${data.month} ${data.year}</strong> | ${data.holidays.length} Holiday${data.holidays.length > 1 ? 's' : ''}
            </div>
            <ul class="holiday-list">
                ${data.holidays.map(h => `
                    <li>
                        <div class="holiday-day">${h.day}</div>
                        <div class="holiday-occasion">${h.occasion}</div>
                        <div class="holiday-date">${h.date}</div>
                    </li>
                `).join('')}
            </ul>
        `;
    } else if (data && data.holidays && data.holidays.length === 0) {
        container.innerHTML = '<div class="loading">No holidays next month 📅</div>';
    } else {
        container.innerHTML = '<div class="error">Failed to load data</div>';
    }
    
    await loadAllOccasions();
}

// Load all occasions
async function loadAllOccasions() {
    const data = await fetchAPI('/occasions');
    const container = document.getElementById('content2');
    
    if (data && data.occasions) {
        container.innerHTML = `
            <div style="margin-bottom: 15px; padding: 10px; background: #f3e5f5; border-radius: 8px; text-align: center;">
                <strong>${data.year}</strong> | ${data.occasions.length} Total Holidays
            </div>
            <ul class="holiday-list">
                ${data.occasions.map(occasion => `
                    <li>
                        <div class="holiday-occasion">🎊 ${occasion}</div>
                    </li>
                `).join('')}
            </ul>
        `;
    } else {
        container.innerHTML = '<div class="error">Failed to load data</div>';
    }
}

// Load all dates
async function loadAllDates() {
    document.getElementById('card1Title').innerHTML = "📝 All Holiday Dates";
    document.getElementById('card2Title').innerHTML = "🎊 All Occasions 2026";
    
    const data = await fetchAPI('/dates');
    const container = document.getElementById('content1');
    
    if (data && Array.isArray(data)) {
        container.innerHTML = `
            <div style="margin-bottom: 15px; padding: 10px; background: #f3e5f5; border-radius: 8px; text-align: center;">
                <strong>${data.length} Holiday Dates in 2026</strong>
            </div>
            <ul class="holiday-list">
                ${data.map(item => `
                    <li>
                        <div class="holiday-date">📅 ${item.date}</div>
                        <div class="holiday-occasion">${item.occasion}</div>
                    </li>
                `).join('')}
            </ul>
        `;
    } else {
        container.innerHTML = '<div class="error">Failed to load data</div>';
    }
    
    await loadAllOccasions();
}

// Load all days
async function loadAllDays() {
    document.getElementById('card1Title').innerHTML = "📌 Holidays by Day";
    document.getElementById('card2Title').innerHTML = "🎊 All Occasions 2026";
    
    const data = await fetchAPI('/days');
    const container = document.getElementById('content1');
    
    if (data && Array.isArray(data)) {
        container.innerHTML = `
            <div style="margin-bottom: 15px; padding: 10px; background: #f3e5f5; border-radius: 8px; text-align: center;">
                <strong>${data.length} Holidays in 2026</strong>
            </div>
            <ul class="holiday-list">
                ${data.map(item => `
                    <li>
                        <div class="holiday-day">${item.day}</div>
                        <div class="holiday-occasion">${item.occasion}</div>
                        <div class="holiday-date">${item.date}</div>
                    </li>
                `).join('')}
            </ul>
        `;
    } else {
        container.innerHTML = '<div class="error">Failed to load data</div>';
    }
    
    await loadAllOccasions();
}

// Load full year 2026
async function loadYear2026() {
    document.getElementById('card1Title').innerHTML = "📅 Full Year 2026 Holidays";
    document.getElementById('card2Title').innerHTML = "🎊 All Occasions 2026";
    
    const data = await fetchAPI('/year/2026');
    const container = document.getElementById('content1');
    
    if (data && data.holidays && data.holidays.length > 0) {
        container.innerHTML = `
            <div style="margin-bottom: 15px; padding: 10px; background: #f3e5f5; border-radius: 8px; text-align: center;">
                <strong>${data.year}</strong> | ${data.holidays.length} Total Holidays
            </div>
            <ul class="holiday-list">
                ${data.holidays.map(h => `
                    <li>
                        <div class="holiday-day">${h.day}</div>
                        <div class="holiday-occasion">${h.occasion}</div>
                        <div class="holiday-date">${h.date}</div>
                    </li>
                `).join('')}
            </ul>
        `;
    } else {
        container.innerHTML = '<div class="error">Failed to load data</div>';
    }
    
    await loadAllOccasions();
}

// Load initial data when page loads
document.addEventListener('DOMContentLoaded', () => {
    loadTodayStatus();
    loadThisMonth();
});