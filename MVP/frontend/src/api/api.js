const API_BASE = '/api';

function getToken() {
    return localStorage.getItem('token');
}

function authHeaders() {
    const token = getToken();
    return {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };
}

// ─── Auth ──────────────────────────────────────────────────────

export async function loginUser(email, password) {
    const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Error al iniciar sesión');
    return data;
}

export async function registerUser(name, email, password) {
    const res = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Error al registrar');
    return data;
}

export async function getMe() {
    const res = await fetch(`${API_BASE}/auth/me`, { headers: authHeaders() });
    if (!res.ok) throw new Error('No autenticado');
    return res.json();
}

// ─── Dashboard ─────────────────────────────────────────────────

export async function getDashboard() {
    const res = await fetch(`${API_BASE}/dashboard`, { headers: authHeaders() });
    if (!res.ok) throw new Error('Error al cargar dashboard');
    return res.json();
}

// ─── Subscriptions ─────────────────────────────────────────────

export async function createSubscription(data) {
    const res = await fetch(`${API_BASE}/subscriptions`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(data)
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Error al crear');
    return result;
}

export async function getSubscription(id) {
    const res = await fetch(`${API_BASE}/subscriptions/${id}`, { headers: authHeaders() });
    if (!res.ok) throw new Error('No encontrada');
    return res.json();
}

export async function updateSubscription(id, data) {
    const res = await fetch(`${API_BASE}/subscriptions/${id}`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify(data)
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Error al actualizar');
    return result;
}

export async function deleteSubscriptionApi(id) {
    const res = await fetch(`${API_BASE}/subscriptions/${id}`, {
        method: 'DELETE',
        headers: authHeaders()
    });
    if (!res.ok) throw new Error('Error al eliminar');
    return res.json();
}

// ─── Settings ──────────────────────────────────────────────

export async function getSettings() {
    const res = await fetch(`${API_BASE}/settings`, { headers: authHeaders() });
    if (!res.ok) throw new Error('Error al obtener configuración');
    return res.json();
}

export async function saveSettings(data) {
    const res = await fetch(`${API_BASE}/settings`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify(data)
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Error al guardar');
    return result;
}

export async function checkBudget(price, billing_cycle = 'monthly') {
    const res = await fetch(`${API_BASE}/check-budget`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ price, billing_cycle })
    });
    if (!res.ok) throw new Error('Error al validar presupuesto');
    return res.json();
}

export async function triggerNotifications() {
    const res = await fetch(`${API_BASE}/trigger-notifications`, {
        method: 'POST',
        headers: authHeaders()
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Error al enviar notificaciones');
    return result;
}
