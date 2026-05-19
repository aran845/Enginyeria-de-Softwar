"""
models.py - Funciones de acceso a datos para Subly (MySQL).
"""

from database import get_db
import bcrypt
from datetime import datetime, timedelta


# ─── USERS ──────────────────────────────────────────────────────

def create_user(name, email, password):
    """Crea un nuevo usuario. Retorna el ID o None si el email ya existe."""
    conn = get_db()
    cursor = conn.cursor()
    try:
        password_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        cursor.execute(
            'INSERT INTO users (name, email, password_hash) VALUES (%s, %s, %s)',
            (name, email, password_hash)
        )
        conn.commit()
        return cursor.lastrowid
    except Exception:
        return None
    finally:
        cursor.close()
        conn.close()


def authenticate_user(email, password):
    """Autentica un usuario. Retorna el usuario o None."""
    conn = get_db()
    cursor = conn.cursor(dictionary=True)
    cursor.execute('SELECT * FROM users WHERE email = %s', (email,))
    user = cursor.fetchone()
    cursor.close()
    conn.close()

    if user and bcrypt.checkpw(password.encode('utf-8'), user['password_hash'].encode('utf-8')):
        return user
    return None


def get_user_by_id(user_id):
    """Obtiene un usuario por su ID."""
    conn = get_db()
    cursor = conn.cursor(dictionary=True)
    cursor.execute('SELECT id, name, email, created_at FROM users WHERE id = %s', (user_id,))
    user = cursor.fetchone()
    cursor.close()
    conn.close()
    return user


# ─── SUBSCRIPTIONS ──────────────────────────────────────────────

def get_subscriptions(user_id):
    """Obtiene todas las suscripciones de un usuario."""
    conn = get_db()
    cursor = conn.cursor(dictionary=True)
    cursor.execute(
        'SELECT * FROM subscriptions WHERE user_id = %s ORDER BY next_renewal ASC',
        (user_id,)
    )
    subs = cursor.fetchall()
    cursor.close()
    conn.close()
    return subs


def get_subscription(sub_id, user_id):
    """Obtiene una suscripción específica."""
    conn = get_db()
    cursor = conn.cursor(dictionary=True)
    cursor.execute(
        'SELECT * FROM subscriptions WHERE id = %s AND user_id = %s',
        (sub_id, user_id)
    )
    sub = cursor.fetchone()
    cursor.close()
    conn.close()
    return sub


def add_subscription(user_id, service_name, category, price, billing_cycle, next_renewal, icon='📦', color='#6366f1'):
    """Añade una nueva suscripción."""
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute(
        '''INSERT INTO subscriptions 
           (user_id, service_name, category, price, billing_cycle, next_renewal, icon, color) 
           VALUES (%s, %s, %s, %s, %s, %s, %s, %s)''',
        (user_id, service_name, category, price, billing_cycle, next_renewal, icon, color)
    )
    conn.commit()
    sub_id = cursor.lastrowid
    cursor.close()
    conn.close()
    return sub_id


def update_subscription(sub_id, user_id, **kwargs):
    """Actualiza campos de una suscripción."""
    allowed = ['service_name', 'category', 'price', 'billing_cycle', 'next_renewal', 'is_active', 'icon', 'color']
    fields = {k: v for k, v in kwargs.items() if k in allowed}

    if not fields:
        return False

    set_clause = ', '.join(f'{k} = %s' for k in fields)
    values = list(fields.values()) + [sub_id, user_id]

    conn = get_db()
    cursor = conn.cursor()
    cursor.execute(
        f'UPDATE subscriptions SET {set_clause} WHERE id = %s AND user_id = %s',
        values
    )
    conn.commit()
    cursor.close()
    conn.close()
    return True


def delete_subscription(sub_id, user_id):
    """Elimina una suscripción."""
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute(
        'DELETE FROM subscriptions WHERE id = %s AND user_id = %s',
        (sub_id, user_id)
    )
    conn.commit()
    cursor.close()
    conn.close()
    return True


def get_upcoming_renewals(user_id, days=7):
    """Obtiene suscripciones que se renuevan en los próximos X días."""
    deadline = (datetime.now() + timedelta(days=days)).strftime('%Y-%m-%d')
    today = datetime.now().strftime('%Y-%m-%d')

    conn = get_db()
    cursor = conn.cursor(dictionary=True)
    cursor.execute(
        '''SELECT * FROM subscriptions 
           WHERE user_id = %s AND is_active = 1 
           AND next_renewal BETWEEN %s AND %s
           ORDER BY next_renewal ASC''',
        (user_id, today, deadline)
    )
    subs = cursor.fetchall()
    cursor.close()
    conn.close()
    return subs


def get_monthly_total(user_id):
    """Calcula el coste mensual total de las suscripciones activas."""
    subs = get_subscriptions(user_id)
    total = 0.0
    for s in subs:
        if s['is_active']:
            price = float(s['price'])
            if s['billing_cycle'] == 'monthly':
                total += price
            elif s['billing_cycle'] == 'yearly':
                total += price / 12
    return round(total, 2)


def get_yearly_total(user_id):
    """Calcula el coste anual total de las suscripciones activas."""
    subs = get_subscriptions(user_id)
    total = 0.0
    for s in subs:
        if s['is_active']:
            price = float(s['price'])
            if s['billing_cycle'] == 'monthly':
                total += price * 12
            elif s['billing_cycle'] == 'yearly':
                total += price
    return round(total, 2)


# ─── COMPANIES ──────────────────────────────────────────────────

def create_company(user_id, name):
    """Crea una nueva empresa para el usuario."""
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute(
        'INSERT INTO companies (user_id, name) VALUES (%s, %s)',
        (user_id, name)
    )
    conn.commit()
    company_id = cursor.lastrowid
    cursor.close()
    conn.close()
    return company_id


def get_companies(user_id):
    """Obtiene todas las empresas de un usuario."""
    conn = get_db()
    cursor = conn.cursor(dictionary=True)
    cursor.execute(
        'SELECT * FROM companies WHERE user_id = %s ORDER BY created_at DESC',
        (user_id,)
    )
    companies = cursor.fetchall()
    cursor.close()
    conn.close()
    return companies


def get_company(company_id, user_id):
    """Obtiene una empresa específica verificando que pertenece al usuario."""
    conn = get_db()
    cursor = conn.cursor(dictionary=True)
    cursor.execute(
        'SELECT * FROM companies WHERE id = %s AND user_id = %s',
        (company_id, user_id)
    )
    company = cursor.fetchone()
    cursor.close()
    conn.close()
    return company


def delete_company(company_id, user_id):
    """Elimina una empresa y todos sus datos asociados (cascade)."""
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute(
        'DELETE FROM companies WHERE id = %s AND user_id = %s',
        (company_id, user_id)
    )
    conn.commit()
    cursor.close()
    conn.close()
    return True


# ─── COMPANY EXPENSES ──────────────────────────────────────────

def add_company_expense(company_id, name, amount, category, expense_date):
    """Añade un gasto a una empresa."""
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute(
        '''INSERT INTO company_expenses (company_id, name, amount, category, expense_date)
           VALUES (%s, %s, %s, %s, %s)''',
        (company_id, name, amount, category, expense_date)
    )
    conn.commit()
    expense_id = cursor.lastrowid
    cursor.close()
    conn.close()
    return expense_id


def get_company_expenses(company_id):
    """Obtiene todos los gastos de una empresa."""
    conn = get_db()
    cursor = conn.cursor(dictionary=True)
    cursor.execute(
        'SELECT * FROM company_expenses WHERE company_id = %s ORDER BY expense_date DESC',
        (company_id,)
    )
    expenses = cursor.fetchall()
    cursor.close()
    conn.close()
    return expenses


def delete_company_expense(expense_id, company_id):
    """Elimina un gasto de una empresa."""
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute(
        'DELETE FROM company_expenses WHERE id = %s AND company_id = %s',
        (expense_id, company_id)
    )
    conn.commit()
    cursor.close()
    conn.close()
    return True


# ─── COMPANY SUBSCRIPTIONS ─────────────────────────────────────

def add_company_subscription(company_id, service_name, category, price, billing_cycle, next_renewal, icon='📦', color='#6366f1'):
    """Añade una suscripción a una empresa."""
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute(
        '''INSERT INTO company_subscriptions
           (company_id, service_name, category, price, billing_cycle, next_renewal, icon, color)
           VALUES (%s, %s, %s, %s, %s, %s, %s, %s)''',
        (company_id, service_name, category, price, billing_cycle, next_renewal, icon, color)
    )
    conn.commit()
    sub_id = cursor.lastrowid
    cursor.close()
    conn.close()
    return sub_id


def get_company_subscriptions(company_id):
    """Obtiene todas las suscripciones de una empresa."""
    conn = get_db()
    cursor = conn.cursor(dictionary=True)
    cursor.execute(
        'SELECT * FROM company_subscriptions WHERE company_id = %s ORDER BY next_renewal ASC',
        (company_id,)
    )
    subs = cursor.fetchall()
    cursor.close()
    conn.close()
    return subs


def get_company_subscription(sub_id, company_id):
    """Obtiene una suscripción específica de una empresa."""
    conn = get_db()
    cursor = conn.cursor(dictionary=True)
    cursor.execute(
        'SELECT * FROM company_subscriptions WHERE id = %s AND company_id = %s',
        (sub_id, company_id)
    )
    sub = cursor.fetchone()
    cursor.close()
    conn.close()
    return sub


def update_company_subscription(sub_id, company_id, **kwargs):
    """Actualiza campos de una suscripción de empresa."""
    allowed = ['service_name', 'category', 'price', 'billing_cycle', 'next_renewal', 'is_active', 'icon', 'color']
    fields = {k: v for k, v in kwargs.items() if k in allowed}

    if not fields:
        return False

    set_clause = ', '.join(f'{k} = %s' for k in fields)
    values = list(fields.values()) + [sub_id, company_id]

    conn = get_db()
    cursor = conn.cursor()
    cursor.execute(
        f'UPDATE company_subscriptions SET {set_clause} WHERE id = %s AND company_id = %s',
        values
    )
    conn.commit()
    cursor.close()
    conn.close()
    return True


def delete_company_subscription(sub_id, company_id):
    """Elimina una suscripción de una empresa."""
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute(
        'DELETE FROM company_subscriptions WHERE id = %s AND company_id = %s',
        (sub_id, company_id)
    )
    conn.commit()
    cursor.close()
    conn.close()
    return True
