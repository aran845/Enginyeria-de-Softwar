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


def get_all_users():
    """Obtiene todos los usuarios (para procesos automatizados)."""
    conn = get_db()
    cursor = conn.cursor(dictionary=True)
    cursor.execute('SELECT id, name, email FROM users ORDER BY id')
    users = cursor.fetchall()
    cursor.close()
    conn.close()
    return users


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


# ─── USER SETTINGS ──────────────────────────────────────────

def get_user_settings(user_id):
    """Obtiene la configuración del usuario."""
    conn = get_db()
    cursor = conn.cursor(dictionary=True)
    cursor.execute('SELECT * FROM user_settings WHERE user_id = %s', (user_id,))
    settings = cursor.fetchone()
    cursor.close()
    conn.close()

    if not settings:
        return {
            'email_notifications': True,
            'renewal_alerts': True,
            'monthly_report': False,
            'budget_alert': True,
            'budget_limit': 100.0,
            'currency': 'EUR',
            'theme': 'dark'
        }
    return settings


def save_user_settings(user_id, **kwargs):
    """Guarda la configuración del usuario."""
    conn = get_db()
    cursor = conn.cursor()

    try:
        cursor.execute('SELECT id FROM user_settings WHERE user_id = %s', (user_id,))
        exists = cursor.fetchone()

        allowed = ['email_notifications', 'renewal_alerts', 'monthly_report', 'budget_alert', 'budget_limit', 'currency', 'theme']
        fields = {k: v for k, v in kwargs.items() if k in allowed}

        if not fields:
            cursor.close()
            conn.close()
            return True

        if exists:
            set_clause = ', '.join(f'{k} = %s' for k in fields)
            values = list(fields.values()) + [user_id]
            sql = f'UPDATE user_settings SET {set_clause} WHERE user_id = %s'
            print(f"📝 SQL UPDATE: {sql}")
            print(f"   Valores: {values}")
            cursor.execute(sql, values)
        else:
            fields['user_id'] = user_id
            cols = ', '.join(fields.keys())
            vals = ', '.join(['%s'] * len(fields))
            sql = f'INSERT INTO user_settings ({cols}) VALUES ({vals})'
            print(f"📝 SQL INSERT: {sql}")
            print(f"   Valores: {list(fields.values())}")
            cursor.execute(sql, list(fields.values()))

        conn.commit()
        print(f"✓ Guardado exitosamente")
        return True
    except Exception as e:
        print(f"❌ ERROR CRITICAL en save_user_settings: {type(e).__name__}: {e}")
        import traceback
        traceback.print_exc()
        conn.rollback()
        return False
    finally:
        cursor.close()
        conn.close()


def check_budget_exceeded(user_id, new_price, billing_cycle='monthly'):
    """Verifica si agregar una suscripción excedería el presupuesto."""
    settings = get_user_settings(user_id)
    budget_limit = float(settings.get('budget_limit', 100))

    current_monthly = get_monthly_total(user_id)

    new_monthly_cost = float(new_price)
    if billing_cycle == 'yearly':
        new_monthly_cost = new_monthly_cost / 12

    total_after = current_monthly + new_monthly_cost

    return {
        'exceeded': total_after > budget_limit,
        'current': round(current_monthly, 2),
        'new_total': round(total_after, 2),
        'budget_limit': budget_limit,
        'difference': round(total_after - budget_limit, 2)
    }


def get_renewals_today(user_id):
    """Obtiene suscripciones que se renuevan hoy."""
    today = datetime.now().strftime('%Y-%m-%d')
    
    conn = get_db()
    cursor = conn.cursor(dictionary=True)
    cursor.execute(
        '''SELECT * FROM subscriptions 
           WHERE user_id = %s AND is_active = 1 
           AND next_renewal = %s
           ORDER BY next_renewal ASC''',
        (user_id, today)
    )
    subs = cursor.fetchall()
    cursor.close()
    conn.close()
    return subs


def get_reminders_7days(user_id):
    """Obtiene suscripciones que se renuevan en 7 días o menos."""
    today = datetime.now().strftime('%Y-%m-%d')
    deadline = (datetime.now() + timedelta(days=7)).strftime('%Y-%m-%d')
    tomorrow = (datetime.now() + timedelta(days=1)).strftime('%Y-%m-%d')
    
    conn = get_db()
    cursor = conn.cursor(dictionary=True)
    cursor.execute(
        '''SELECT * FROM subscriptions 
           WHERE user_id = %s AND is_active = 1 
           AND next_renewal BETWEEN %s AND %s
           ORDER BY next_renewal ASC''',
        (user_id, tomorrow, deadline)
    )
    subs = cursor.fetchall()
    cursor.close()
    conn.close()
    return subs


def check_notification_sent(user_id, sub_id, notification_type):
    """Verifica si una notificación ya fue enviada hoy para esta suscripción."""
    today = datetime.now().strftime('%Y-%m-%d')
    
    conn = get_db()
    cursor = conn.cursor(dictionary=True)
    cursor.execute(
        '''SELECT id FROM notification_log 
           WHERE user_id = %s AND subscription_id = %s 
           AND notification_type = %s AND sent_date = %s''',
        (user_id, sub_id, notification_type, today)
    )
    result = cursor.fetchone()
    cursor.close()
    conn.close()
    return result is not None


def log_notification(user_id, sub_id, notification_type):
    """Registra que una notificación fue enviada."""
    today = datetime.now().strftime('%Y-%m-%d')
    
    conn = get_db()
    cursor = conn.cursor()
    try:
        cursor.execute(
            '''INSERT INTO notification_log (user_id, subscription_id, notification_type, sent_date) 
               VALUES (%s, %s, %s, %s)''',
            (user_id, sub_id, notification_type, today)
        )
        conn.commit()
    except Exception:
        pass
    finally:
        cursor.close()
        conn.close()
