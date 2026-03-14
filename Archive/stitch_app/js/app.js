
// Auth and Interaction Logic for Stitch App

document.addEventListener('DOMContentLoaded', () => {
    // Determine current page
    const path = window.location.pathname;

    // Auth Check (skip for login and index)
    if (!path.includes('login.html') && !path.includes('index.html') && path !== '/') {
        checkAuth();
    }

    // Login Page Logic
    if (path.includes('login.html')) {
        setupLogin();
    }

    // Logout Logic (global)
    setupLogout();

    // Chat Page Logic
    if (path.includes('chat.html')) {
        setupChat();
    }

    // Inspection Page Logic
    if (path.includes('inspection.html')) {
        setupInspection();
    }

    // Dashboard Logic
    if (path.includes('dashboard.html')) {
        setupDashboard();
    }

    // Global "Mock" Action Handlers
    setupGlobalActions();
});

// --- Auth Functions ---

function checkAuth() {
    const token = localStorage.getItem('sankalp_token');
    if (!token) {
        // Redirect to login if no token
        window.location.href = 'login.html';
    }
}

function setupLogin() {
    const loginForm = document.querySelector('form');
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;

            if (email && password) {
                // Mock Authentication
                localStorage.setItem('sankalp_token', 'mock_token_' + Date.now());
                localStorage.setItem('sankalp_user', email);

                // Show success feedback (optional)
                const btn = loginForm.querySelector('button[type="submit"]');
                const originalText = btn.innerText;
                btn.innerText = 'Loggin in...';

                setTimeout(() => {
                    window.location.href = 'dashboard.html';
                }, 800);
            }
        });
    }
}

function setupLogout() {
    // Inject Logout button into sidebar for convenience
    const nav = document.querySelector('nav');
    if (nav && !document.getElementById('logout-btn')) {
        const logoutLink = document.createElement('a');
        logoutLink.href = '#';
        logoutLink.id = 'logout-btn';
        logoutLink.className = 'flex items-center px-4 py-3 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg group transition-all mt-auto';
        logoutLink.innerHTML = `
            <span class="material-symbols-outlined mr-3">logout</span>
            Logout
        `;
        logoutLink.addEventListener('click', (e) => {
            e.preventDefault();
            logout();
        });

        // Append to the end of nav or sidebar
        nav.parentElement.appendChild(logoutLink);
    }
}

function logout() {
    localStorage.removeItem('sankalp_token');
    window.location.href = 'login.html';
}


// --- Interaction Functions ---

function setupChat() {
    const sendBtn = document.querySelector('button span.material-symbols-outlined:first-child').parentElement; // Finding the send button
    // Better selector: find button that contains "Send"
    const buttons = document.querySelectorAll('button');
    let realSendBtn = null;
    buttons.forEach(btn => {
        if (btn.innerText.includes('Send')) realSendBtn = btn;
    });

    const textarea = document.querySelector('textarea');
    const chatContainer = document.querySelector('.flex-1.overflow-y-auto.p-6.custom-scrollbar.space-y-6'); // The chat history container

    if (realSendBtn && textarea && chatContainer) {
        realSendBtn.addEventListener('click', () => {
            const msg = textarea.value.trim();
            if (msg) {
                appendMessage(chatContainer, msg, 'You');
                textarea.value = '';
                // Scroll to bottom
                chatContainer.scrollTop = chatContainer.scrollHeight;
            }
        });

        // Also enter key
        textarea.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                realSendBtn.click();
            }
        });
    }
}

function appendMessage(container, text, user) {
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const html = `
    <div class="flex items-start gap-3 flex-row-reverse animate-fade-in">
        <div class="w-8 h-8 rounded bg-slate-800 dark:bg-slate-100 flex items-center justify-center shrink-0">
            <span class="text-[10px] font-bold text-white dark:text-slate-900">ME</span>
        </div>
        <div class="space-y-1 text-right">
            <div class="flex items-baseline justify-end gap-2">
                <span class="text-[10px] text-slate-400">${time}</span>
                <span class="font-bold text-sm">You</span>
            </div>
            <div class="bg-slate-800 dark:bg-slate-100 text-white dark:text-slate-900 p-3 rounded-tl-xl rounded-bl-xl rounded-br-xl shadow-sm inline-block text-left">
                <p class="text-sm font-medium">${text}</p>
            </div>
        </div>
    </div>`;

    // Create a temp container to turn string into DOM
    const div = document.createElement('div');
    div.innerHTML = html;
    container.appendChild(div.firstElementChild);
}

function setupInspection() {
    // Create Inspection Modal
    const createBtn = document.querySelector('button.bg-primary.hover\\:bg-secondary'); // "Create New Inspection" button

    if (createBtn) {
        createBtn.addEventListener('click', () => {
            showModal('New Inspection', `
                <form id="inspection-form" class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Factory</label>
                        <select class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-slate-800 dark:border-slate-600">
                            <option>Evergreen Textiles</option>
                            <option>Oceanic Garments</option>
                            <option>Global Sourcing A1</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Inspection Type</label>
                        <select class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-slate-800 dark:border-slate-600">
                            <option>Inline</option>
                            <option>Final</option>
                            <option>Pre-Production</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Auditor Notes</label>
                        <textarea class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-slate-800 dark:border-slate-600"></textarea>
                    </div>
                </form>
            `, 'Start Inspection', () => {
                // On confirm
                alert('Inspection initialized! Redirecting to digital checklist...');
                closeModal();
                // Simulation of adding row or redirecting
            });
        });
    }
}

function setupDashboard() {
    // "Calculate Now" Button
    const calcBtns = document.querySelectorAll('button');
    calcBtns.forEach(btn => {
        if (btn.innerText.includes('Calculate Now')) {
            btn.addEventListener('click', () => {
                showModal('Efficiency Calculator', `
                    <div class="space-y-4 text-center">
                        <p>Analyzing current workflow metrics...</p>
                        <div class="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700 overflow-hidden">
                            <div class="bg-primary h-2.5 rounded-full" style="width: 0%" id="progress-bar"></div>
                        </div>
                        <p id="calc-result" class="hidden font-bold text-green-600">Potential Savings: $12,500 / month</p>
                    </div>
                `, 'Close', closeModal);

                // Animate progress
                setTimeout(() => { document.getElementById('progress-bar').style.width = '100%'; }, 100);
                setTimeout(() => { document.getElementById('calc-result').classList.remove('hidden'); }, 1000);
            });
        }
    });
}

function setupGlobalActions() {
    // Export Buttons
    const buttons = document.querySelectorAll('button');
    buttons.forEach(btn => {
        if (btn.innerText.includes('Export') || btn.innerText.includes('Download')) {
            btn.addEventListener('click', () => {
                const originalText = btn.innerText;
                btn.innerText = 'Downloading...';
                btn.disabled = true;
                setTimeout(() => {
                    alert('Report downloaded successfully!');
                    btn.innerText = originalText;
                    btn.disabled = false;
                }, 1500);
            });
        }
    });

    // Theme Toggle persistence
    // (Existing inline script handles toggle, but let's ensure it persists across pages if missing)
}

// --- Modal System (Simple) ---

function showModal(title, bodyContent, confirmText, onConfirm) {
    // Remove existing modal if any
    const existing = document.getElementById('app-modal');
    if (existing) existing.remove();

    const modalHtml = `
    <div id="app-modal" class="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
        <div class="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onclick="closeModal()"></div>
            <span class="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div class="inline-block align-bottom bg-white dark:bg-slate-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg w-full">
                <div class="bg-white dark:bg-slate-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                    <div class="sm:flex sm:items-start">
                        <div class="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                            <h3 class="text-lg leading-6 font-medium text-gray-900 dark:text-white" id="modal-title">${title}</h3>
                            <div class="mt-2">
                                <div class="text-sm text-gray-500 dark:text-gray-300">
                                    ${bodyContent}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="bg-gray-50 dark:bg-slate-700 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                    <button type="button" id="modal-confirm" class="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary text-base font-medium text-white hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary sm:ml-3 sm:w-auto sm:text-sm">
                        ${confirmText}
                    </button>
                    <button type="button" onclick="closeModal()" class="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm">
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHtml);

    document.getElementById('modal-confirm').addEventListener('click', onConfirm);
}

function closeModal() {
    const modal = document.getElementById('app-modal');
    if (modal) modal.remove();
}
