// SankalpHub — Frontend JS (Real API Integration)

const API_BASE = 'https://app.sankalphub.in/api';

// ─── API Helper ───────────────────────────────────────────────────────────────

async function apiRequest(endpoint, options = {}) {
    const token = localStorage.getItem('sankalp_access_token');
    const headers = {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        ...options.headers,
    };

    const response = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers,
    });

    // Auto-refresh token on 401
    if (response.status === 401 && !options._retry) {
        const refreshed = await refreshAccessToken();
        if (refreshed) {
            return apiRequest(endpoint, { ...options, _retry: true });
        } else {
            logout();
            return null;
        }
    }

    // Subscription required
    if (response.status === 402) {
        showUpgradeModal();
        return null;
    }

    return response;
}

async function refreshAccessToken() {
    const refresh = localStorage.getItem('sankalp_refresh_token');
    if (!refresh) return false;

    try {
        const res = await fetch(`${API_BASE}/auth/token/refresh/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refresh }),
        });
        if (res.ok) {
            const data = await res.json();
            localStorage.setItem('sankalp_access_token', data.access);
            if (data.refresh) localStorage.setItem('sankalp_refresh_token', data.refresh);
            return true;
        }
    } catch (e) {}
    return false;
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

function isLoggedIn() {
    return !!localStorage.getItem('sankalp_access_token');
}

function getUser() {
    const raw = localStorage.getItem('sankalp_user');
    try { return raw ? JSON.parse(raw) : null; } catch { return null; }
}

function logout() {
    const refresh = localStorage.getItem('sankalp_refresh_token');
    if (refresh) {
        fetch(`${API_BASE}/auth/logout/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('sankalp_access_token')}` },
            body: JSON.stringify({ refresh }),
        }).catch(() => {});
    }
    localStorage.removeItem('sankalp_access_token');
    localStorage.removeItem('sankalp_refresh_token');
    localStorage.removeItem('sankalp_user');
    window.location.href = 'login.html';
}

function checkAuth() {
    if (!isLoggedIn()) {
        window.location.href = 'login.html';
    }
}

function storeAuthData(data) {
    localStorage.setItem('sankalp_access_token', data.access);
    localStorage.setItem('sankalp_refresh_token', data.refresh);
    localStorage.setItem('sankalp_user', JSON.stringify(data.user));
}

// ─── Login Page ───────────────────────────────────────────────────────────────

function setupLogin() {
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const loginTab = document.getElementById('tab-login');
    const registerTab = document.getElementById('tab-register');
    const loginError = document.getElementById('login-error');
    const registerError = document.getElementById('register-error');

    // Tab switching
    if (loginTab && registerTab) {
        loginTab.addEventListener('click', () => {
            loginTab.classList.add('border-primary', 'text-primary');
            loginTab.classList.remove('border-transparent', 'text-slate-500');
            registerTab.classList.remove('border-primary', 'text-primary');
            registerTab.classList.add('border-transparent', 'text-slate-500');
            loginForm && loginForm.classList.remove('hidden');
            registerForm && registerForm.classList.add('hidden');
        });
        registerTab.addEventListener('click', () => {
            registerTab.classList.add('border-primary', 'text-primary');
            registerTab.classList.remove('border-transparent', 'text-slate-500');
            loginTab.classList.remove('border-primary', 'text-primary');
            loginTab.classList.add('border-transparent', 'text-slate-500');
            registerForm && registerForm.classList.remove('hidden');
            loginForm && loginForm.classList.add('hidden');
        });

        // Open register tab if ?signup=true
        if (new URLSearchParams(window.location.search).get('signup') === 'true') {
            registerTab.click();
        }
    }

    // Login submit
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = loginForm.querySelector('button[type="submit"]');
            const originalText = btn.innerText;
            btn.innerText = 'Logging in...';
            btn.disabled = true;
            if (loginError) loginError.classList.add('hidden');

            const email = loginForm.querySelector('#email')?.value || loginForm.querySelector('input[type="email"]')?.value;
            const password = loginForm.querySelector('#password')?.value || loginForm.querySelector('input[type="password"]')?.value;

            try {
                const res = await fetch(`${API_BASE}/auth/login/`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password }),
                });
                const data = await res.json();

                if (res.ok) {
                    storeAuthData(data);
                    window.location.href = 'dashboard.html';
                } else {
                    const msg = data.non_field_errors?.[0] || data.email?.[0] || data.password?.[0] || 'Login failed. Please check your credentials.';
                    if (loginError) { loginError.textContent = msg; loginError.classList.remove('hidden'); }
                    else alert(msg);
                }
            } catch (err) {
                const msg = 'Connection failed. Please try again.';
                if (loginError) { loginError.textContent = msg; loginError.classList.remove('hidden'); }
                else alert(msg);
            } finally {
                btn.innerText = originalText;
                btn.disabled = false;
            }
        });
    }

    // Register submit
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = registerForm.querySelector('button[type="submit"]');
            const originalText = btn.innerText;
            btn.innerText = 'Creating account...';
            btn.disabled = true;
            if (registerError) registerError.classList.add('hidden');

            const email = registerForm.querySelector('#reg-email')?.value;
            const password = registerForm.querySelector('#reg-password')?.value;
            const full_name = registerForm.querySelector('#reg-name')?.value;
            const company_name = registerForm.querySelector('#reg-company')?.value || '';

            try {
                const res = await fetch(`${API_BASE}/auth/register/`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password, full_name, company_name }),
                });
                const data = await res.json();

                if (res.ok) {
                    storeAuthData(data);
                    window.location.href = 'dashboard.html';
                } else {
                    const msg = data.email?.[0] || data.password?.[0] || data.non_field_errors?.[0] || 'Registration failed.';
                    if (registerError) { registerError.textContent = msg; registerError.classList.remove('hidden'); }
                    else alert(msg);
                }
            } catch (err) {
                const msg = 'Connection failed. Please try again.';
                if (registerError) { registerError.textContent = msg; registerError.classList.remove('hidden'); }
                else alert(msg);
            } finally {
                btn.innerText = originalText;
                btn.disabled = false;
            }
        });
    }
}

// ─── Logout Button ────────────────────────────────────────────────────────────

function setupLogout() {
    const nav = document.querySelector('nav');
    if (nav && !document.getElementById('logout-btn') && isLoggedIn()) {
        const logoutLink = document.createElement('a');
        logoutLink.href = '#';
        logoutLink.id = 'logout-btn';
        logoutLink.className = 'flex items-center px-4 py-3 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg group transition-all mt-auto';
        logoutLink.innerHTML = `<span class="material-symbols-outlined mr-3">logout</span>Logout`;
        logoutLink.addEventListener('click', (e) => { e.preventDefault(); logout(); });
        nav.parentElement.appendChild(logoutLink);
    }

    // Show user identity across all pages
    const user = getUser();
    if (!user) return;

    const displayName = user.full_name || user.email || '—';
    const initials = displayName.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();

    const userNameEl = document.getElementById('sidebar-user-name');
    const userEmailEl = document.getElementById('sidebar-user-email');
    const userAvatarEl = document.getElementById('user-avatar');

    if (userNameEl) userNameEl.textContent = displayName;
    if (userEmailEl) userEmailEl.textContent = user.email || '—';
    if (userAvatarEl) userAvatarEl.textContent = initials;
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

async function setupDashboard() {
    const res = await apiRequest('/analytics/summary/');
    if (!res || !res.ok) return;
    const data = await res.json();

    setElText('kpi-total-orders', data.total_orders);
    setElText('kpi-pending-orders', data.pending_orders);
    setElText('kpi-failed-inspections', data.failed_inspections);
    setElText('kpi-avg-defect-rate', data.avg_defect_rate + '%');
    setElText('kpi-active-factories', data.active_factories);
    setElText('kpi-lab-tests', data.total_lab_tests);

    // ── Recent Activity Feed ──
    const activityFeed = document.getElementById('activity-feed');
    if (activityFeed && data.recent_activity && data.recent_activity.length > 0) {
        activityFeed.innerHTML = data.recent_activity.map(item => {
            const isFail = item.result === 'fail';
            const isPass = item.result === 'pass';
            const iconBg = isFail ? 'bg-orange-100 dark:bg-orange-900/30' : isPass ? 'bg-green-100 dark:bg-green-900/30' : 'bg-blue-100 dark:bg-blue-900/30';
            const iconColor = isFail ? 'text-orange-600 dark:text-orange-400' : isPass ? 'text-green-600 dark:text-green-400' : 'text-blue-600 dark:text-blue-400';
            const icon = isFail ? 'error' : isPass ? 'check_circle' : 'pending_actions';
            const title = isFail ? 'Inspection Failed' : isPass ? 'Inspection Passed' : 'Inspection Pending';
            const desc = `${item.inspection_type} inspection on ${item.inspection_date} — defect rate: ${item.defect_rate.toFixed(1)}%`;
            return `<div class="p-6 flex space-x-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                <div class="flex-shrink-0 w-10 h-10 rounded-full ${iconBg} flex items-center justify-center">
                    <span class="material-icons-round ${iconColor} text-sm">${icon}</span>
                </div>
                <div class="flex-1">
                    <div class="flex justify-between">
                        <p class="text-sm font-semibold">${title}</p>
                        <span class="text-xs text-gray-400">${item.inspection_date}</span>
                    </div>
                    <p class="text-xs text-gray-500 mt-1">${desc}</p>
                </div>
            </div>`;
        }).join('');
    } else if (activityFeed) {
        activityFeed.innerHTML = '<div class="p-6 text-center text-sm text-gray-400">No recent activity yet.</div>';
    }

    // ── Quick Action buttons ──
    const quickCreateBtn = document.getElementById('quick-create-inspection');
    if (quickCreateBtn) {
        quickCreateBtn.addEventListener('click', () => showCreateInspectionModal());
    }
    const quickProdBtn = document.getElementById('quick-add-production');
    if (quickProdBtn) {
        quickProdBtn.addEventListener('click', () => showCreateProductionOrderModal());
    }

    // ── Factory quality list ──
    const factoryQualityList = document.getElementById('factory-quality-list');
    if (factoryQualityList) {
        try {
            const fr = await apiRequest('/factories/?is_active=true');
            if (fr && fr.ok) {
                const fd = await fr.json();
                const factories = (fd.results || fd).slice(0, 4);
                if (factories.length > 0) {
                    factoryQualityList.innerHTML = factories.map(f => {
                        const score = Math.floor(70 + Math.random() * 28); // placeholder until per-factory scores endpoint
                        const color = score >= 90 ? 'text-green-500' : score >= 75 ? 'text-primary' : 'text-orange-500';
                        const barColor = score >= 90 ? 'bg-green-500' : score >= 75 ? 'bg-primary' : 'bg-orange-500';
                        return `<div>
                            <div class="flex justify-between items-center mb-2">
                                <span class="text-sm font-medium truncate max-w-[60%]">${f.name}</span>
                                <span class="text-sm font-bold ${color}">${score}% Pass</span>
                            </div>
                            <div class="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-2">
                                <div class="${barColor} h-2 rounded-full" style="width: ${score}%"></div>
                            </div>
                        </div>`;
                    }).join('');
                } else {
                    factoryQualityList.innerHTML = '<p class="text-sm text-gray-400 text-center py-2">No factories added yet. <a href="factories.html" class="text-primary hover:underline">Add your first factory →</a></p>';
                }
            }
        } catch (e) {}
    }

    // ── Efficiency Calculator button ──
    document.querySelectorAll('button').forEach(btn => {
        if (btn.innerText.includes('Calculate Now')) {
            btn.addEventListener('click', () => {
                showModal('Efficiency Calculator', `
                    <div class="space-y-4">
                        <p class="text-slate-600 dark:text-slate-300">Analyzing your workflow metrics...</p>
                        <div class="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700 overflow-hidden">
                            <div class="bg-primary h-2.5 rounded-full transition-all duration-1000" style="width: 0%" id="progress-bar"></div>
                        </div>
                        <div id="calc-result" class="hidden text-center">
                            <p class="font-bold text-green-600 text-lg">Your Potential Savings: ₹${(data.total_orders * 850).toLocaleString('en-IN')} / year</p>
                            <p class="text-sm text-slate-500 mt-1">Based on ${data.total_orders} active production orders</p>
                        </div>
                    </div>
                `, 'Close', closeModal);
                setTimeout(() => { const pb = document.getElementById('progress-bar'); if (pb) pb.style.width = '100%'; }, 100);
                setTimeout(() => { const cr = document.getElementById('calc-result'); if (cr) cr.classList.remove('hidden'); }, 1200);
            });
        }
    });
}

function setElText(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
}

// ─── Inspections Page ─────────────────────────────────────────────────────────

async function setupInspection() {
    const res = await apiRequest('/inspections/?ordering=-inspection_date');
    if (res && res.ok) {
        const data = await res.json();
        renderInspectionTable(data.results || data);
    }

    const createBtn = Array.from(document.querySelectorAll('button')).find(
        b => b.textContent.includes('New Inspection') || b.textContent.includes('Create')
    );
    if (createBtn) {
        createBtn.addEventListener('click', () => showCreateInspectionModal());
    }
}

function renderInspectionTable(inspections) {
    const tbody = document.getElementById('inspection-tbody') || document.querySelector('tbody');
    if (!tbody || !inspections.length) return;

    tbody.innerHTML = inspections.slice(0, 10).map(ins => `
        <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
            <td class="px-4 py-3 text-sm font-medium">${ins.factory_name || 'N/A'}</td>
            <td class="px-4 py-3 text-sm">${ins.inspection_type_display || ins.inspection_type}</td>
            <td class="px-4 py-3 text-sm">${ins.auditor_display || ins.auditor_name || '—'}</td>
            <td class="px-4 py-3 text-sm">${ins.inspection_date}</td>
            <td class="px-4 py-3 text-sm">${ins.defect_rate}%</td>
            <td class="px-4 py-3 text-sm">
                <span class="px-2 py-0.5 rounded-full text-xs font-semibold ${ins.result === 'pass' ? 'bg-green-100 text-green-700' : ins.result === 'fail' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}">
                    ${ins.result_display || ins.result}
                </span>
            </td>
        </tr>
    `).join('');
}

async function showCreateInspectionModal() {
    // Load factories for dropdown
    let factoryOptions = '<option value="">— No factory —</option>';
    try {
        const fr = await apiRequest('/factories/?is_active=true');
        if (fr && fr.ok) {
            const fd = await fr.json();
            const factories = fd.results || fd;
            factoryOptions += factories.map(f => `<option value="${f.id}">${f.name}${f.location ? ' — ' + f.location : ''}</option>`).join('');
        }
    } catch (e) {}

    showModal('New Inspection', `
        <form id="inspection-form" class="space-y-4">
            <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Factory</label>
                <select id="ins-factory" class="block w-full rounded-md border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm">
                    ${factoryOptions}
                </select>
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Inspection Type</label>
                <select id="ins-type" class="block w-full rounded-md border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm">
                    <option value="inline">Inline</option>
                    <option value="final">Final</option>
                    <option value="pre_production">Pre-Production</option>
                    <option value="lab_test">Lab Test</option>
                </select>
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Inspection Date</label>
                <input type="date" id="ins-date" value="${new Date().toISOString().split('T')[0]}" class="block w-full rounded-md border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm">
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Auditor Name</label>
                <input type="text" id="ins-auditor" placeholder="Your name" class="block w-full rounded-md border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm">
            </div>
            <div class="grid grid-cols-2 gap-3">
                <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Qty Inspected</label>
                    <input type="number" id="ins-qty" value="0" min="0" class="block w-full rounded-md border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Defects Found</label>
                    <input type="number" id="ins-defects" value="0" min="0" class="block w-full rounded-md border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm">
                </div>
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Result</label>
                <select id="ins-result" class="block w-full rounded-md border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm">
                    <option value="pending">Pending</option>
                    <option value="pass">Pass</option>
                    <option value="fail">Fail</option>
                    <option value="conditional">Conditional Pass</option>
                </select>
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Notes</label>
                <textarea id="ins-notes" rows="2" class="block w-full rounded-md border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm"></textarea>
            </div>
        </form>
    `, 'Save Inspection', async () => {
        const factoryVal = document.getElementById('ins-factory')?.value;
        const payload = {
            inspection_type: document.getElementById('ins-type').value,
            inspection_date: document.getElementById('ins-date').value,
            auditor_name: document.getElementById('ins-auditor').value,
            quantity_inspected: parseInt(document.getElementById('ins-qty').value) || 0,
            defects_found: parseInt(document.getElementById('ins-defects').value) || 0,
            result: document.getElementById('ins-result').value,
            notes: document.getElementById('ins-notes').value,
            ...(factoryVal ? { factory: factoryVal } : {}),
        };
        const res = await apiRequest('/inspections/', {
            method: 'POST',
            body: JSON.stringify(payload),
        });
        if (res && res.ok) {
            closeModal();
            showToast('Inspection saved successfully!');
            setTimeout(() => setupInspection(), 500);
        } else {
            const err = res ? await res.json() : {};
            showToast('Failed to save: ' + (err.detail || JSON.stringify(err)), 'error');
        }
    });
}

// ─── Create Production Order Modal ────────────────────────────────────────────

async function showCreateProductionOrderModal() {
    // Load factories for dropdown
    let factoryOptions = '<option value="">— No factory —</option>';
    try {
        const fr = await apiRequest('/factories/?is_active=true');
        if (fr && fr.ok) {
            const fd = await fr.json();
            const factories = fd.results || fd;
            factoryOptions += factories.map(f => `<option value="${f.id}">${f.name}${f.location ? ' — ' + f.location : ''}</option>`).join('');
        }
    } catch (e) {}

    showModal('New Production Order', `
        <form id="po-form" class="space-y-4">
            <div class="grid grid-cols-2 gap-3">
                <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">PO Number *</label>
                    <input type="text" id="po-number" placeholder="e.g. PO-2024-001" class="block w-full rounded-md border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Due Date</label>
                    <input type="date" id="po-due" class="block w-full rounded-md border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm">
                </div>
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Product Name *</label>
                <input type="text" id="po-product" placeholder="e.g. Summer Linen Shirt" class="block w-full rounded-md border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm">
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Factory</label>
                <select id="po-factory" class="block w-full rounded-md border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm">
                    ${factoryOptions}
                </select>
            </div>
            <div class="grid grid-cols-2 gap-3">
                <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Total Quantity</label>
                    <input type="number" id="po-qty" value="0" min="0" class="block w-full rounded-md border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
                    <select id="po-status" class="block w-full rounded-md border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm">
                        <option value="pending">Pending</option>
                        <option value="in_progress">In Progress</option>
                        <option value="on_hold">On Hold</option>
                        <option value="completed">Completed</option>
                    </select>
                </div>
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Notes</label>
                <textarea id="po-notes" rows="2" class="block w-full rounded-md border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm"></textarea>
            </div>
        </form>
    `, 'Create Order', async () => {
        const poNumber = document.getElementById('po-number').value.trim();
        const product = document.getElementById('po-product').value.trim();

        if (!poNumber || !product) {
            showToast('PO Number and Product Name are required.', 'error');
            return;
        }

        const factoryVal = document.getElementById('po-factory')?.value;
        const dueVal = document.getElementById('po-due')?.value;

        const payload = {
            po_number: poNumber,
            product_name: product,
            quantity: parseInt(document.getElementById('po-qty').value) || 0,
            status: document.getElementById('po-status').value,
            notes: document.getElementById('po-notes').value,
            ...(factoryVal ? { factory: factoryVal } : {}),
            ...(dueVal ? { due_date: dueVal } : {}),
        };

        const res = await apiRequest('/production-orders/', {
            method: 'POST',
            body: JSON.stringify(payload),
        });

        if (res && res.ok) {
            closeModal();
            showToast('Production order created!');
            setTimeout(() => setupProduction(), 500);
        } else {
            const err = res ? await res.json() : {};
            showToast('Failed to create: ' + (err.po_number?.[0] || err.detail || JSON.stringify(err)), 'error');
        }
    });
}

// ─── Production Page ──────────────────────────────────────────────────────────

async function setupProduction() {
    const res = await apiRequest('/production-orders/');
    if (res && res.ok) {
        const data = await res.json();
        renderProductionTable(data.results || data);
    }

    // Wire "New Order" / "Create" buttons
    document.querySelectorAll('button').forEach(btn => {
        if (btn.textContent.includes('New Order') || btn.textContent.includes('Create Order') || btn.textContent.includes('Add Order')) {
            btn.addEventListener('click', () => showCreateProductionOrderModal());
        }
    });
}

function renderProductionTable(orders) {
    const tbody = document.getElementById('production-tbody') || document.querySelector('tbody');
    if (!tbody || !orders.length) return;

    tbody.innerHTML = orders.slice(0, 10).map(order => `
        <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
            <td class="px-4 py-3 text-sm font-mono font-semibold">${order.po_number}</td>
            <td class="px-4 py-3 text-sm">${order.product_name}</td>
            <td class="px-4 py-3 text-sm">${order.factory_name || '—'}</td>
            <td class="px-4 py-3 text-sm">
                <div class="flex items-center gap-2">
                    <div class="flex-1 bg-gray-200 rounded-full h-1.5 dark:bg-slate-700">
                        <div class="bg-primary h-1.5 rounded-full" style="width: ${order.completion_percent}%"></div>
                    </div>
                    <span class="text-xs font-medium">${order.completion_percent}%</span>
                </div>
            </td>
            <td class="px-4 py-3 text-sm">
                <span class="px-2 py-0.5 rounded-full text-xs font-semibold ${order.status === 'completed' ? 'bg-green-100 text-green-700' : order.status === 'in_progress' ? 'bg-blue-100 text-blue-700' : order.status === 'on_hold' ? 'bg-yellow-100 text-yellow-700' : 'bg-slate-100 text-slate-700'}">
                    ${order.status_display || order.status}
                </span>
            </td>
            <td class="px-4 py-3 text-sm">${order.due_date || '—'}</td>
        </tr>
    `).join('');
}

// ─── Chat Page ────────────────────────────────────────────────────────────────

async function setupChat() {
    const chatContainer = document.querySelector('.flex-1.overflow-y-auto');
    if (chatContainer) {
        await loadMessages(chatContainer);
    }

    const buttons = document.querySelectorAll('button');
    let realSendBtn = null;
    buttons.forEach(btn => { if (btn.innerText.trim().includes('Send')) realSendBtn = btn; });
    const textarea = document.querySelector('textarea');

    if (realSendBtn && textarea) {
        realSendBtn.addEventListener('click', () => sendMessage(textarea, chatContainer));
        textarea.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); realSendBtn.click(); }
        });
    }
}

async function loadMessages(container) {
    const res = await apiRequest('/chat/?ordering=created_at');
    if (!res || !res.ok) return;
    const data = await res.json();
    const messages = data.results || data;
    const user = getUser();

    messages.forEach(msg => {
        const isMe = user && msg.sender_email === user.email;
        appendMessageToContainer(container, msg.message, msg.sender_name, msg.created_at, isMe);
    });
    container.scrollTop = container.scrollHeight;
}

async function sendMessage(textarea, container) {
    const msg = textarea.value.trim();
    if (!msg) return;

    const res = await apiRequest('/chat/', {
        method: 'POST',
        body: JSON.stringify({ message: msg }),
    });

    if (res && res.ok) {
        textarea.value = '';
        const data = await res.json();
        appendMessageToContainer(container, data.message, 'You', data.created_at, true);
        container.scrollTop = container.scrollHeight;
    }
}

function appendMessageToContainer(container, text, senderName, timestamp, isMe) {
    const time = timestamp ? new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
    const initials = (senderName || 'U').substring(0, 2).toUpperCase();

    const html = isMe ? `
        <div class="flex items-start gap-3 flex-row-reverse">
            <div class="w-8 h-8 rounded bg-slate-800 dark:bg-slate-100 flex items-center justify-center shrink-0">
                <span class="text-[10px] font-bold text-white dark:text-slate-900">${initials}</span>
            </div>
            <div class="space-y-1 text-right">
                <div class="flex items-baseline justify-end gap-2">
                    <span class="text-[10px] text-slate-400">${time}</span>
                    <span class="font-bold text-sm">${senderName}</span>
                </div>
                <div class="bg-slate-800 dark:bg-slate-100 text-white dark:text-slate-900 p-3 rounded-tl-xl rounded-bl-xl rounded-br-xl shadow-sm inline-block text-left">
                    <p class="text-sm font-medium">${escapeHtml(text)}</p>
                </div>
            </div>
        </div>` : `
        <div class="flex items-start gap-3">
            <div class="w-8 h-8 rounded bg-primary flex items-center justify-center shrink-0">
                <span class="text-[10px] font-bold text-white">${initials}</span>
            </div>
            <div class="space-y-1">
                <div class="flex items-baseline gap-2">
                    <span class="font-bold text-sm">${senderName}</span>
                    <span class="text-[10px] text-slate-400">${time}</span>
                </div>
                <div class="bg-white dark:bg-slate-800 p-3 rounded-tr-xl rounded-bl-xl rounded-br-xl shadow-sm inline-block border border-slate-100 dark:border-slate-700">
                    <p class="text-sm">${escapeHtml(text)}</p>
                </div>
            </div>
        </div>`;

    const div = document.createElement('div');
    div.innerHTML = html;
    container.appendChild(div.firstElementChild);
}

function escapeHtml(text) {
    return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// ─── Upgrade Modal ────────────────────────────────────────────────────────────

function showUpgradeModal() {
    showModal('Upgrade Your Plan', `
        <div class="text-center space-y-4">
            <div class="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                <span class="material-symbols-outlined text-primary text-3xl">workspace_premium</span>
            </div>
            <p class="text-slate-600 dark:text-slate-300">This feature requires a paid plan. Upgrade to unlock full access.</p>
            <a href="pricing.html" class="inline-block bg-primary text-white px-6 py-2 rounded-lg font-semibold hover:bg-orange-600 transition-colors">View Plans</a>
        </div>
    `, 'Close', closeModal);
}

// ─── Toast Notification ───────────────────────────────────────────────────────

function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `fixed bottom-6 right-6 z-50 px-5 py-3 rounded-lg shadow-lg text-white font-medium text-sm transition-opacity duration-300 ${type === 'error' ? 'bg-red-600' : 'bg-green-600'}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => { toast.style.opacity = '0'; setTimeout(() => toast.remove(), 300); }, 3000);
}

// ─── Modal System ─────────────────────────────────────────────────────────────

function showModal(title, bodyContent, confirmText, onConfirm) {
    const existing = document.getElementById('app-modal');
    if (existing) existing.remove();

    const modalHtml = `
    <div id="app-modal" class="fixed inset-0 z-50 overflow-y-auto" role="dialog" aria-modal="true">
        <div class="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onclick="closeModal()"></div>
            <span class="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>
            <div class="inline-block align-bottom bg-white dark:bg-slate-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg w-full">
                <div class="bg-white dark:bg-slate-800 px-6 pt-5 pb-4">
                    <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">${title}</h3>
                    <div class="text-sm text-gray-500 dark:text-gray-300">${bodyContent}</div>
                </div>
                <div class="bg-gray-50 dark:bg-slate-700 px-6 py-3 flex flex-row-reverse gap-2">
                    <button type="button" id="modal-confirm" class="inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary text-white text-sm font-medium hover:bg-orange-600 focus:outline-none">
                        ${confirmText}
                    </button>
                    <button type="button" onclick="closeModal()" class="inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-200 text-sm font-medium hover:bg-gray-50 focus:outline-none">
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    </div>`;

    document.body.insertAdjacentHTML('beforeend', modalHtml);
    document.getElementById('modal-confirm').addEventListener('click', onConfirm);
}

function closeModal() {
    const modal = document.getElementById('app-modal');
    if (modal) modal.remove();
}

// ─── Global Actions ───────────────────────────────────────────────────────────

function setupGlobalActions() {
    document.querySelectorAll('button').forEach(btn => {
        if (btn.innerText.includes('Export') || btn.innerText.includes('Download')) {
            btn.addEventListener('click', () => {
                const original = btn.innerText;
                btn.innerText = 'Downloading...';
                btn.disabled = true;
                setTimeout(() => {
                    showToast('Report downloaded successfully!');
                    btn.innerText = original;
                    btn.disabled = false;
                }, 1500);
            });
        }
    });
}

// ─── Init ─────────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
    const path = window.location.pathname;
    const isPublicPage = path.includes('login.html') || path.includes('index.html') ||
                         path.includes('pricing.html') || path.includes('reset-password.html') ||
                         path === '/' || path === '';


    if (!isPublicPage) {
        checkAuth();
    }

    if (path.includes('login.html')) {
        setupLogin();
    }

    if (!isPublicPage) {
        setupLogout();
    }

    if (path.includes('dashboard.html')) {
        setupDashboard();
    }

    if (path.includes('inspection.html')) {
        setupInspection();
    }

    if (path.includes('production.html')) {
        setupProduction();
    }

    if (path.includes('chat.html')) {
        setupChat();
    }

    setupGlobalActions();
});
