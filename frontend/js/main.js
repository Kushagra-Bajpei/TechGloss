// DOM Elements
const termsGrid = document.getElementById('terms-grid');
const searchInput = document.getElementById('search-input');
const categoryFilter = document.getElementById('category-filter');
const addTermForm = document.getElementById('add-term-form');
const suggestEditForm = document.getElementById('suggest-edit-form');
const pendingTermsBody = document.getElementById('pending-terms-body');
const pendingSuggestionsBody = document.getElementById('pending-suggestions-body');
const savedGrid = document.getElementById('saved-grid');
const notifBtn = document.getElementById('notif-btn');
const notifDropdown = document.getElementById('notif-dropdown');
const notifCount = document.getElementById('notif-count');
const langToggle = document.getElementById('lang-toggle');
const themeToggle = document.getElementById('theme-toggle');
const themeIcon = document.getElementById('theme-icon');

// Translation System
const translations = {
    en: {
        search_placeholder: "Search for terms (e.g. API, Middleware...)",
        all_terms: "All Technical Terms",
        trending: "🔥 Trending",
        leaderboard: "🏆 Top Contributors",
        saved_title: "Saved Terms",
        saved_subtitle: "Your personalized library of technical knowledge.",
        total_users: "Total Users",
        total_terms: "Total Terms",
        trending_cat: "Top Category",
        report_title: "Report Term",
        reason: "Reason for Reporting",
        submit_report: "Submit Report"
    },
    hi: {
        search_placeholder: "शब्द खोजें (उदा. API, Middleware...)",
        all_terms: "सभी तकनीकी शब्द",
        trending: "🔥 लोकप्रिय",
        leaderboard: "🏆 शीर्ष योगदानकर्ता",
        saved_title: "सहेजे गए शब्द",
        saved_subtitle: "आपका व्यक्तिगत तकनीकी ज्ञान पुस्तकालय।",
        total_users: "कुल उपयोगकर्ता",
        total_terms: "कुल शब्द",
        trending_cat: "शीर्ष श्रेणी",
        report_title: "शब्द की रिपोर्ट करें",
        reason: "रिपोर्ट करने का कारण",
        submit_report: "रिपोर्ट सबमिट करें"
    }
};

let currentLang = 'en';

// State
let allTerms = [];
let savedTermIds = []; // Will be fetched on init

// Init
document.addEventListener('DOMContentLoaded', async () => {
    if(currentUser) await fetchUserSavedIds();
    fetchTerms();
    fetchTrending();
    fetchLeaderboard();
    if(currentUser) {
        fetchNotifications();
    }
    initTheme();
});

function initTheme() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') {
        document.body.classList.add('light-mode');
        themeIcon.className = 'fa-solid fa-sun';
    } else {
        document.body.classList.remove('light-mode');
        themeIcon.className = 'fa-solid fa-moon';
    }
}

async function fetchUserSavedIds() {
    try {
        const user = await aFetch(`${API_URL}/auth/me`);
        savedTermIds = user.savedTerms || [];
    } catch (err) { console.error('Failed to fetch saved IDs'); }
}

// Tab Switching
document.getElementById('nav-saved').addEventListener('click', (e) => {
    e.preventDefault();
    switchTab('saved');
    fetchSavedTerms();
});

function switchTab(tab) {
    const sections = ['home-section', 'admin-section', 'saved-section'];
    sections.forEach(s => document.getElementById(s).style.display = 'none');
    document.getElementById(`${tab}-section`).style.display = 'block';
    
    document.querySelectorAll('.nav-links a').forEach(a => a.classList.remove('active'));
    document.getElementById(`nav-${tab}`).classList.add('active');
}

// Multi-language Toggle
langToggle.addEventListener('click', () => {
    currentLang = currentLang === 'en' ? 'hi' : 'en';
    applyTranslations();
});

// Theme Toggle
themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('light-mode');
    const isLight = document.body.classList.contains('light-mode');
    localStorage.setItem('theme', isLight ? 'light' : 'dark');
    themeIcon.className = isLight ? 'fa-solid fa-sun' : 'fa-solid fa-moon';
});

function applyTranslations() {
    document.querySelectorAll('[data-t]').forEach(el => {
        const key = el.getAttribute('data-t');
        if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
            el.placeholder = translations[currentLang][key];
        } else {
            el.innerText = translations[currentLang][key];
        }
    });
}

// Search & Filter Listeners
searchInput.addEventListener('input', debounce(() => fetchTerms(), 500));
categoryFilter.addEventListener('change', () => fetchTerms());

async function fetchTerms() {
    renderSkeletons(termsGrid);
    try {
        const search = searchInput.value;
        const category = categoryFilter.value;
        let url = `${API_URL}/terms?`;
        if (search) url += `search=${encodeURIComponent(search)}&`;
        if (category) url += `category=${encodeURIComponent(category)}`;

        const terms = await aFetch(url, {}, false);
        allTerms = terms;
        renderTerms(terms, termsGrid);
    } catch (err) {
        console.error('Failed to fetch terms:', err);
    }
}

function renderSkeletons(container) {
    container.innerHTML = '';
    for(let i=0; i<6; i++) {
        container.innerHTML += `<div class="term-card glass-panel skeleton" style="height: 200px;"></div>`;
    }
}

function renderTerms(terms, container) {
    container.innerHTML = '';
    if (terms.length === 0) {
        container.innerHTML = `<p style="color: var(--text-muted)">No terms found.</p>`;
        return;
    }

    terms.forEach(term => {
        const isSaved = savedTermIds.includes(term._id);
        const hasUpvoted = currentUser && currentUser.upvotedTerms && currentUser.upvotedTerms.includes(term._id);
        const hasDownvoted = currentUser && currentUser.downvotedTerms && currentUser.downvotedTerms.includes(term._id);
        
        let nameHtml = highlightText(term.name, searchInput.value);
        let defHtml = highlightText(term.definition, searchInput.value);

        const card = document.createElement('div');
        card.className = 'term-card glass-panel';
        card.innerHTML = `
            <div class="term-header">
                <h3>${nameHtml}</h3>
                <div style="display: flex; gap: 0.8rem; align-items: center;">
                    <span class="badge">${term.category}</span>
                    <button class="btn-icon bookmark-btn ${isSaved ? 'active-save' : ''}" onclick="toggleSave('${term._id}')" title="${isSaved ? 'Remove from Saved' : 'Save Term'}">
                        <i class="fa-${isSaved ? 'solid' : 'regular'} fa-bookmark"></i>
                    </button>
                    <button class="btn-icon" onclick="openReportModal('${term._id}')"><i class="fa-solid fa-flag"></i></button>
                </div>
            </div>
            <p class="term-def">${defHtml}</p>
            <div class="term-example">
                <strong>Example:</strong> ${term.example}
            </div>
            <div class="term-footer">
                <div class="author-info">Added by ${term.author ? term.author.username : 'Unknown'}</div>
                <div class="votes">
                    <button class="btn btn-outline btn-small" onclick="openComments('${term._id}')">
                        <i class="fa-regular fa-comment"></i>
                    </button>
                    <button class="btn btn-outline btn-small" onclick="openSuggestModal('${term._id}', '${term.definition.replace(/'/g, "\\'")}', '${term.example.replace(/'/g, "\\'")}')">Suggest Edit</button>
                    <div class="vote-item">
                        <button class="btn-icon ${hasUpvoted ? 'active-upvote' : ''}" onclick="voteTerm('${term._id}', 'up')"><i class="fa-solid fa-arrow-up"></i></button>
                        <span>${term.upvotes}</span>
                    </div>
                    <div class="vote-item">
                        <button class="btn-icon ${hasDownvoted ? 'active-downvote' : ''}" onclick="voteTerm('${term._id}', 'down')"><i class="fa-solid fa-arrow-down"></i></button>
                        <span>${term.downvotes}</span>
                    </div>
                </div>
            </div>
        `;
        container.appendChild(card);
    });
}

function highlightText(text, query) {
    if (!query) return text;
    const regex = new RegExp(`(${query})`, 'gi');
    return text.replace(regex, '<mark style="background: var(--primary); color: white; border-radius: 2px;">$1</mark>');
}

function checkAuthAndOpenAddModal() {
    if (!currentUser) {
        alert("Please login to add a term.");
        openModal('auth-modal', 'login');
        return;
    }
    openModal('add-term-modal');
}

addTermForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!currentUser) return;

    const termData = {
        name: document.getElementById('term-name').value,
        definition: document.getElementById('term-def').value,
        example: document.getElementById('term-example').value,
        category: document.getElementById('term-category').value
    };

    try {
        const res = await aFetch(`${API_URL}/terms`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(termData)
        });
        
        alert(currentUser.role === 'moderator' ? 'Term added successfully!' : 'Term submitted for review!');
        closeModal('add-term-modal');
        addTermForm.reset();
        fetchTerms();
        if(currentUser.role === 'moderator') fetchPendingTerms();
    } catch (err) {
        console.error('Submission Error:', err);
        alert(`Failed to submit term: ${err.message}`);
    }
});

window.openSuggestModal = (id, def, ex) => {
    if (!currentUser) {
        alert("Please login to suggest an improvement.");
        openModal('auth-modal', 'login');
        return;
    }
    document.getElementById('suggest-term-id').value = id;
    document.getElementById('suggest-def').value = def;
    document.getElementById('suggest-example').value = ex;
    openModal('suggest-edit-modal');
};

suggestEditForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('suggest-term-id').value;
    const body = {
        suggestedDefinition: document.getElementById('suggest-def').value,
        suggestedExample: document.getElementById('suggest-example').value
    };

    try {
        await aFetch(`${API_URL}/terms/${id}/suggest`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
        alert('Improvement suggested! A moderator will review it.');
        closeModal('suggest-edit-modal');
        if(currentUser.role === 'moderator') fetchPendingSuggestions();
    } catch (err) {
        alert('Failed to submit suggestion');
    }
});

window.voteTerm = async (id, type) => {
    if (!currentUser) {
        alert("Please login to vote.");
        openModal('auth-modal', 'login');
        return;
    }

    try {
        await aFetch(`${API_URL}/terms/${id}/vote`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type })
        });
        
        // Refresh currentUser's voted lists by re-fetching a simplified user object or just refreshing token
        // For simplicity in this demo, we'll just reload terms. 
        // In a real app, user model would be updated in localStorage.
        fetchTerms(); 
    } catch (err) {
        alert('Failed to vote');
    }
};

// Saved Terms Logic
window.toggleSave = async (id) => {
    if(!currentUser) return openModal('auth-modal', 'login');
    try {
        const saved = await aFetch(`${API_URL}/terms/${id}/save`, { method: 'POST' });
        savedTermIds = saved;
        fetchTerms(); // Refresh main feed
        if(document.getElementById('nav-saved').classList.contains('active')) fetchSavedTerms();
    } catch (err) { alert('Failed to save term'); }
};

async function fetchSavedTerms() {
    try {
        const terms = await aFetch(`${API_URL}/terms`, {}, false);
        const saved = terms.filter(t => savedTermIds.includes(t._id));
        renderTerms(saved, savedGrid);
    } catch (err) {}
}

// Comments Logic
window.openComments = async (id) => {
    document.getElementById('comment-term-id').value = id;
    openModal('comments-modal');
    fetchComments(id);
};

async function fetchComments(id) {
    try {
        const comments = await aFetch(`${API_URL}/terms/${id}/comments`, {}, false);
        const list = document.getElementById('comments-list');
        list.innerHTML = comments.map(c => `
            <div class="comment-item">
                <div class="comment-author">${c.author.username}</div>
                <div class="comment-text">${c.text}</div>
            </div>
        `).join('') || '<p>No comments yet.</p>';
    } catch (err) {}
}

document.getElementById('comment-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    if(!currentUser) return openModal('auth-modal', 'login');
    const id = document.getElementById('comment-term-id').value;
    const text = document.getElementById('comment-text').value;
    try {
        await aFetch(`${API_URL}/terms/${id}/comments`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text })
        });
        document.getElementById('comment-text').value = '';
        fetchComments(id);
    } catch (err) { alert('Failed to post comment'); }
});

// Reporting Logic
window.openReportModal = (id) => {
    if(!currentUser) return openModal('auth-modal', 'login');
    document.getElementById('report-term-id').value = id;
    openModal('report-modal');
};

document.getElementById('report-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('report-term-id').value;
    const reason = document.getElementById('report-reason').value;
    try {
        await aFetch(`${API_URL}/terms/${id}/report`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ reason })
        });
        alert('Report submitted for moderator review.');
        closeModal('report-modal');
    } catch (err) { alert('Failed to report'); }
});

// Trending & Leaderboard
async function fetchTrending() {
    try {
        const terms = await aFetch(`${API_URL}/terms`, {}, false);
        const trending = terms.sort((a,b) => b.upvotes - a.upvotes).slice(0, 5);
        document.getElementById('trending-list').innerHTML = trending.map(t => `
            <div class="trending-item">
                <span>${t.name}</span>
                <span style="color: var(--secondary)">${t.upvotes} ★</span>
            </div>
        `).join('');
    } catch (err) {}
}

async function fetchLeaderboard() {
    try {
        const users = await aFetch(`${API_URL}/terms/leaderboard`, {}, false);
        document.getElementById('leaderboard-list').innerHTML = users.map((u, i) => `
            <div class="lead-item">
                <span>#${i+1} ${u.username}</span>
                <span class="badge">${u.points} pts</span>
            </div>
        `).join('');
    } catch (err) {}
}

// Notifications Logic
async function fetchNotifications() {
    try {
        const notifs = await aFetch(`${API_URL}/terms/me/notifications`);
        const unread = notifs.filter(n => !n.read).length;
        notifCount.innerText = unread;
        notifCount.style.display = unread > 0 ? 'block' : 'none';
        
        notifDropdown.innerHTML = notifs.reverse().map(n => `
            <div class="notif-item">
                ${n.message}
                <div style="font-size: 0.7rem; color: var(--text-muted)">${new Date(n.createdAt).toLocaleDateString()}</div>
            </div>
        `).join('') || '<div class="notif-item">No notifications</div>';
    } catch (err) {}
}

notifBtn.addEventListener('click', () => {
    notifDropdown.classList.toggle('active');
    // Mark as read in a real app
});

// Admin Functions Upgrade
window.fetchPendingTerms = async function() {
    if (!currentUser || currentUser.role !== 'moderator') return;

    try {
        const terms = await aFetch(`${API_URL}/terms/pending`);
        renderPendingTerms(terms);
        fetchPendingSuggestions();
        fetchAnalytics();
    } catch (err) {
        console.error('Failed to fetch pending terms', err);
    }
};

async function fetchAnalytics() {
    try {
        const data = await aFetch(`${API_URL}/terms/moderator/analytics`);
        document.getElementById('stat-users').innerText = data.totalUsers;
        document.getElementById('stat-terms').innerText = data.totalTerms;
        document.getElementById('stat-category').innerText = data.popularCategory;
        
        // Render Reports
        renderReports(data.reports);
    } catch (err) {}
}

function renderReports(reports) {
    const list = document.getElementById('reports-body');
    list.innerHTML = '';
    if (!reports || reports.length === 0) {
        list.innerHTML = `<tr><td colspan="4">No active reports.</td></tr>`;
        return;
    }

    reports.forEach(r => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>${r.term ? r.term.name : 'Deleted'}</strong></td>
            <td>${r.reason}</td>
            <td>${r.reporter ? r.reporter.username : 'Unknown'}</td>
            <td>
                <button class="btn btn-small btn-success" onclick="resolveReport('${r._id}')">Check & Resolve</button>
            </td>
        `;
        list.appendChild(tr);
    });
}

window.resolveReport = async (id) => {
    try {
        await aFetch(`${API_URL}/terms/moderator/reports/${id}`, { method: 'PUT' });
        fetchAnalytics(); // Refresh
        alert('Report resolved.');
    } catch (err) { alert('Failed to resolve report'); }
};

window.fetchPendingSuggestions = async function() {
    try {
        const suggestions = await aFetch(`${API_URL}/terms/suggestions/pending`);
        renderPendingSuggestions(suggestions);
    } catch (err) {
        console.error('Failed to fetch suggestions', err);
    }
};

function renderPendingSuggestions(suggestions) {
    pendingSuggestionsBody.innerHTML = '';
    if (suggestions.length === 0) {
        pendingSuggestionsBody.innerHTML = `<tr><td colspan="4">No pending suggestions.</td></tr>`;
        return;
    }

    suggestions.forEach(s => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>${s.term ? s.term.name : 'Deleted'}</strong></td>
            <td>${s.suggestedDefinition}</td>
            <td>${s.author ? s.author.username : 'Unknown'}</td>
            <td class="action-btns">
                <button class="btn btn-small btn-success" onclick="updateSuggestionStatus('${s._id}', 'approved')">Approve</button>
                <button class="btn btn-small btn-danger" onclick="updateSuggestionStatus('${s._id}', 'rejected')">Reject</button>
            </td>
        `;
        pendingSuggestionsBody.appendChild(tr);
    });
}

window.updateSuggestionStatus = async function(id, status) {
    try {
        await aFetch(`${API_URL}/terms/suggestions/${id}/status`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status })
        });
        fetchPendingSuggestions();
        fetchTerms();
    } catch (err) {
        alert('Failed to update suggestion');
    }
};

function renderPendingTerms(terms) {
    pendingTermsBody.innerHTML = '';
    if (terms.length === 0) {
        pendingTermsBody.innerHTML = `<tr><td colspan="5">No pending terms to review.</td></tr>`;
        return;
    }

    terms.forEach(term => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>${term.name}</strong></td>
            <td>${term.definition}</td>
            <td><span class="badge">${term.category}</span></td>
            <td>${term.author ? term.author.username : 'Unknown'}</td>
            <td class="action-btns">
                <button class="btn btn-small btn-success" onclick="updateTermStatus('${term._id}', 'approved')"><i class="fa-solid fa-check"></i> Approve</button>
                <button class="btn btn-small btn-danger" onclick="updateTermStatus('${term._id}', 'rejected')"><i class="fa-solid fa-xmark"></i> Reject</button>
            </td>
        `;
        pendingTermsBody.appendChild(tr);
    });
}

window.updateTermStatus = async function(id, status) {
    try {
        await aFetch(`${API_URL}/terms/${id}/status`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status })
        });
        fetchPendingTerms(); // refresh dashboard
        fetchTerms(); // refresh home grid
    } catch (err) {
        alert('Failed to update status');
    }
}

// Utility debounce
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}
