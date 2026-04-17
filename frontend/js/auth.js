const API_URL = 'http://localhost:5000/api';

// State
let currentUser = JSON.parse(localStorage.getItem('user')) || null;
let currentToken = localStorage.getItem('token') || null;

// DOM Elements
const authButtons = document.getElementById('auth-buttons');
const userProfile = document.getElementById('user-profile');
const userGreeting = document.getElementById('user-greeting');
const navAdmin = document.getElementById('nav-admin');
const navHome = document.getElementById('nav-home');
const homeSection = document.getElementById('home-section');
const adminSection = document.getElementById('admin-section');
const navSaved = document.getElementById('nav-saved');
const notifBtnContainer = document.getElementById('notif-btn');

const authModal = document.getElementById('auth-modal');
const authForm = document.getElementById('auth-form');
const authTitle = document.getElementById('auth-title');
const authType = document.getElementById('auth-type');
const authSubmitBtn = document.getElementById('auth-submit-btn');
const toggleText = document.getElementById('toggle-auth-text');
const usernameGroup = document.getElementById('username-group');
const roleGroup = document.getElementById('role-group');

// Init
function initAuth() {
    updateUI();
    
    authForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const type = authType.value;
        const email = document.getElementById('auth-email').value;
        const password = document.getElementById('auth-password').value;
        
        let payload = { email, password };
        if(type === 'register') {
            payload.username = document.getElementById('auth-username').value;
            payload.role = document.getElementById('auth-role').value;
        }

        try {
            const res = await aFetch(`${API_URL}/auth/${type}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            }, false);

            if (res.token) {
                localStorage.setItem('token', res.token);
                localStorage.setItem('user', JSON.stringify({
                    id: res._id, username: res.username, role: res.role
                }));
                currentUser = JSON.parse(localStorage.getItem('user'));
                currentToken = res.token;
                closeModal('auth-modal');
                updateUI();
                if(window.fetchTerms) fetchTerms(); // Refresh terms
            } else {
                alert(res.message || 'Authentication failed');
            }
        } catch (err) {
            console.error(err);
            alert('An error occurred');
        }
    });

    navHome.addEventListener('click', (e) => {
        e.preventDefault();
        switchTab('home');
    });

    navAdmin.addEventListener('click', (e) => {
        e.preventDefault();
        switchTab('admin');
        if(window.fetchPendingTerms) fetchPendingTerms();
    });
}

function updateUI() {
    if (currentUser) {
        authButtons.style.display = 'none';
        userProfile.style.display = 'flex';
        userGreeting.textContent = `Hi, ${currentUser.username}`;
        navSaved.style.display = 'inline-block';
        notifBtnContainer.style.display = 'block';
        
        if (currentUser.role === 'moderator') {
            navAdmin.style.display = 'inline-block';
        } else {
            navAdmin.style.display = 'none';
        }
    } else {
        authButtons.style.display = 'flex';
        userProfile.style.display = 'none';
        navAdmin.style.display = 'none';
        navSaved.style.display = 'none';
        notifBtnContainer.style.display = 'none';
        switchTab('home');
    }
}

function switchTab(tab) {
    if (tab === 'home') {
        homeSection.style.display = 'block';
        adminSection.style.display = 'none';
        navHome.classList.add('active');
        navAdmin.classList.remove('active');
    } else if (tab === 'admin') {
        homeSection.style.display = 'none';
        adminSection.style.display = 'block';
        navHome.classList.remove('active');
        navAdmin.classList.add('active');
    }
}

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    currentUser = null;
    currentToken = null;
    updateUI();
    if(window.fetchTerms) fetchTerms();
}

function toggleAuthMode() {
    if (authType.value === 'login') {
        authType.value = 'register';
        authTitle.innerText = 'Sign Up';
        authSubmitBtn.innerText = 'Sign Up';
        usernameGroup.style.display = 'block';
        roleGroup.style.display = 'block';
        toggleText.innerHTML = `Already have an account? <a href="#" onclick="toggleAuthMode()">Login</a>`;
    } else {
        authType.value = 'login';
        authTitle.innerText = 'Login';
        authSubmitBtn.innerText = 'Login';
        usernameGroup.style.display = 'none';
        roleGroup.style.display = 'none';
        toggleText.innerHTML = `Don't have an account? <a href="#" onclick="toggleAuthMode()">Sign up</a>`;
    }
}

function openModal(id, mode) {
    const modal = document.getElementById(id);
    if(id === 'auth-modal') {
        if(mode === 'register' && authType.value !== 'register') toggleAuthMode();
        if(mode === 'login' && authType.value !== 'login') toggleAuthMode();
    }
    modal.classList.add('active');
}

function closeModal(id) {
    document.getElementById(id).classList.remove('active');
}

// Fetch wrapper with Auth header
async function aFetch(url, options = {}, withAuth = true) {
    if (withAuth && currentToken) {
        options.headers = {
            ...options.headers,
            'Authorization': `Bearer ${currentToken}`
        };
    }
    const response = await fetch(url, options);
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'API Error');
    return data;
}

initAuth();
