"""
app.py - API REST de Subly (Flask + JWT + MySQL).
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from database import init_db, seed_test_user
from models import (
    create_user, authenticate_user, get_user_by_id,
    get_subscriptions, add_subscription, update_subscription,
    delete_subscription, get_subscription,
    get_upcoming_renewals, get_monthly_total, get_yearly_total,
    get_user_settings, save_user_settings, check_budget_exceeded,
    get_renewals_today, get_reminders_7days, check_notification_sent, log_notification
)
from datetime import timedelta, datetime
import os
from dotenv import load_dotenv
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
import atexit

# Cargar variables de entorno
load_dotenv()

from email_service import send_renewal_alert, send_monthly_report, send_budget_alert, send_renewal_today, send_renewal_reminder_7days, send_weekly_reminder

app = Flask(__name__)
app.config['JWT_SECRET_KEY'] = os.environ.get('JWT_SECRET_KEY', 'subly-secret-key-dev-2024')
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(days=7)

CORS(app, origins=['http://localhost:5173', 'http://127.0.0.1:5173'])
jwt = JWTManager(app)


# ─── Background Scheduler ────────────────────────────────────
def send_daily_notifications():
    """Envía notificaciones automáticas para todos los usuarios."""
    from models import get_all_users

    users = get_all_users()
    for user in users:
        user_id = user['id']
        settings = get_user_settings(user_id)

        if not settings.get('email_notifications'):
            continue

        # 1. Notificación de Renovación Hoy (email individual)
        if settings.get('renewal_alerts'):
            today_renewals = get_renewals_today(user_id)
            if today_renewals:
                for sub in today_renewals:
                    if not check_notification_sent(user_id, sub['id'], 'renewal_today'):
                        send_renewal_today(user, [sub])
                        log_notification(user_id, sub['id'], 'renewal_today')

        # 2. Recordatorio Semanal (email grupal con todas las renovaciones en 7 días)
        if settings.get('renewal_alerts'):
            upcoming_subs = get_upcoming_renewals(user_id, days=7)
            if upcoming_subs:
                # Verificar si ya se envió un email grupal hoy
                if not check_notification_sent(user_id, 0, 'weekly_reminder'):
                    send_weekly_reminder(user, upcoming_subs)
                    log_notification(user_id, 0, 'weekly_reminder')

        # 3. Reporte Mensual
        if settings.get('monthly_report'):
            today = datetime.now()
            if today.day == 1:
                active_subs = [s for s in get_subscriptions(user_id) if s['is_active']]
                monthly_total = get_monthly_total(user_id)
                currency_symbol = '€' if settings.get('currency') == 'EUR' else ('$' if settings.get('currency') == 'USD' else '£')
                total_str = f"{currency_symbol}{monthly_total}"
                send_monthly_report(user, total_str, active_subs)


scheduler = BackgroundScheduler()
scheduler.add_job(
    func=send_daily_notifications,
    trigger=CronTrigger(hour=9, minute=0),
    id='send_daily_notifications',
    name='Send daily notifications to users',
    replace_existing=True
)

atexit.register(lambda: scheduler.shutdown())

# Prevent duplicate scheduler starts in Flask debug mode
import os
if os.environ.get('WERKZEUG_RUN_MAIN') == 'true' or not os.environ.get('WERKZEUG_RUN_MAIN'):
    # Only one scheduler should run
    pass


# ─── Helpers ────────────────────────────────────────────────────

def serialize_sub(s):
    """Serializa una suscripción para JSON (convierte Decimal y date)."""
    return {
        'id': s['id'],
        'user_id': s['user_id'],
        'service_name': s['service_name'],
        'category': s['category'],
        'price': float(s['price']),
        'billing_cycle': s['billing_cycle'],
        'next_renewal': str(s['next_renewal']),
        'is_active': bool(s['is_active']),
        'icon': s['icon'],
        'color': s['color'],
    }


# ─── AUTH ENDPOINTS ─────────────────────────────────────────────

@app.route('/api/auth/register', methods=['POST'])
def register():
    """Registrar un nuevo usuario."""
    data = request.get_json()

    name = data.get('name', '').strip()
    email = data.get('email', '').strip()
    password = data.get('password', '')

    if not name or not email or not password:
        return jsonify({'error': 'Todos los campos son obligatorios'}), 400

    user_id = create_user(name, email, password)
    if user_id:
        token = create_access_token(identity=str(user_id))
        return jsonify({
            'token': token,
            'user': {'id': user_id, 'name': name, 'email': email}
        }), 201
    else:
        return jsonify({'error': 'Este email ya está registrado'}), 409


@app.route('/api/auth/login', methods=['POST'])
def login():
    """Iniciar sesión."""
    data = request.get_json()

    email = data.get('email', '').strip()
    password = data.get('password', '')

    if not email or not password:
        return jsonify({'error': 'Email y contraseña son obligatorios'}), 400

    user = authenticate_user(email, password)
    if user:
        token = create_access_token(identity=str(user['id']))
        return jsonify({
            'token': token,
            'user': {'id': user['id'], 'name': user['name'], 'email': user['email']}
        })
    else:
        return jsonify({'error': 'Email o contraseña incorrectos'}), 401


@app.route('/api/auth/me', methods=['GET'])
@jwt_required()
def get_me():
    """Obtener datos del usuario actual."""
    user_id = int(get_jwt_identity())
    user = get_user_by_id(user_id)
    if user:
        return jsonify({'id': user['id'], 'name': user['name'], 'email': user['email']})
    return jsonify({'error': 'Usuario no encontrado'}), 404


# ─── DASHBOARD ENDPOINT ────────────────────────────────────────

@app.route('/api/dashboard', methods=['GET'])
@jwt_required()
def dashboard():
    """Obtener resumen del dashboard."""
    user_id = int(get_jwt_identity())
    user = get_user_by_id(user_id)
    subscriptions = get_subscriptions(user_id)
    upcoming = get_upcoming_renewals(user_id)
    monthly_total = get_monthly_total(user_id)
    yearly_total = get_yearly_total(user_id)
    active_count = sum(1 for s in subscriptions if s['is_active'])

    return jsonify({
        'user': {'id': user['id'], 'name': user['name'], 'email': user['email']},
        'subscriptions': [serialize_sub(s) for s in subscriptions],
        'upcoming': [serialize_sub(s) for s in upcoming],
        'monthly_total': monthly_total,
        'yearly_total': yearly_total,
        'active_count': active_count
    })


# ─── SUBSCRIPTIONS API ─────────────────────────────────────────

@app.route('/api/subscriptions', methods=['POST'])
@jwt_required()
def api_add_subscription():
    """Añadir una nueva suscripción."""
    user_id = int(get_jwt_identity())
    data = request.get_json()

    required = ['service_name', 'price', 'billing_cycle', 'next_renewal']
    if not all(data.get(f) for f in required):
        return jsonify({'error': 'Faltan campos obligatorios'}), 400

    price = 0.0
    try:
        price = float(data['price'])
    except (ValueError, TypeError):
        return jsonify({'error': 'Precio inválido'}), 400

    # Comprobar límite de presupuesto ANTES de añadir (para enviar email)
    settings = get_user_settings(user_id)
    budget_result = check_budget_exceeded(user_id, price, data['billing_cycle'])

    sub_id = add_subscription(
        user_id=user_id,
        service_name=data['service_name'],
        category=data.get('category', 'other'),
        price=price,
        billing_cycle=data['billing_cycle'],
        next_renewal=data['next_renewal'],
        icon=data.get('icon', '📦'),
        color=data.get('color', '#6366f1')
    )

    # Si se excedió el presupuesto, enviar alerta automáticamente
    if budget_result['exceeded'] and settings.get('email_notifications') and settings.get('budget_alert'):
        user = get_user_by_id(user_id)
        currency_symbol = '€' if settings.get('currency') == 'EUR' else ('$' if settings.get('currency') == 'USD' else '£')
        diff_str = f"{currency_symbol}{budget_result['difference']:.2f}"
        print(f"📧 Enviando alerta de presupuesto a {user['email']}")
        send_budget_alert(user, data['service_name'], diff_str)

    return jsonify({'success': True, 'id': sub_id, 'budget_exceeded': budget_result['exceeded']}), 201


@app.route('/api/subscriptions/<int:sub_id>', methods=['GET'])
@jwt_required()
def api_get_subscription(sub_id):
    """Obtener una suscripción específica."""
    user_id = int(get_jwt_identity())
    sub = get_subscription(sub_id, user_id)
    if sub:
        return jsonify(serialize_sub(sub))
    return jsonify({'error': 'No encontrada'}), 404


@app.route('/api/subscriptions/<int:sub_id>', methods=['PUT'])
@jwt_required()
def api_update_subscription(sub_id):
    """Actualizar una suscripción existente."""
    user_id = int(get_jwt_identity())
    data = request.get_json()

    if 'price' in data:
        try:
            data['price'] = float(data['price'])
        except (ValueError, TypeError):
            return jsonify({'error': 'Precio inválido'}), 400

    success = update_subscription(sub_id, user_id, **data)
    if success:
        return jsonify({'success': True})
    return jsonify({'error': 'No se pudo actualizar'}), 400


@app.route('/api/subscriptions/<int:sub_id>', methods=['DELETE'])
@jwt_required()
def api_delete_subscription(sub_id):
    """Eliminar una suscripción."""
    user_id = int(get_jwt_identity())
    delete_subscription(sub_id, user_id)
    return jsonify({'success': True})


# ─── SETTINGS ENDPOINTS ────────────────────────────────────

@app.route('/api/settings', methods=['GET'])
@jwt_required()
def api_get_settings():
    """Obtener configuración del usuario."""
    user_id = int(get_jwt_identity())
    settings = get_user_settings(user_id)
    return jsonify(settings)


@app.route('/api/settings', methods=['PUT'])
@jwt_required()
def api_save_settings():
    """Guardar configuración del usuario."""
    user_id = int(get_jwt_identity())
    data = request.get_json()

    print(f"📝 Guardando settings para usuario {user_id}: {data}")
    success = save_user_settings(user_id, **data)
    if success:
        result = get_user_settings(user_id)
        print(f"✓ Guardado exitosamente: {result}")
        return jsonify({'success': True, 'settings': result})
    else:
        print(f"❌ Error guardando settings")
        return jsonify({'error': 'Error al guardar configuración'}), 400


# ─── BUDGET VALIDATION ────────────────────────────────────

@app.route('/api/check-budget', methods=['POST'])
@jwt_required()
def api_check_budget():
    """Verifica si una nueva suscripción excede el presupuesto."""
    user_id = int(get_jwt_identity())
    data = request.get_json()

    price = float(data.get('price', 0))
    billing_cycle = data.get('billing_cycle', 'monthly')

    result = check_budget_exceeded(user_id, price, billing_cycle)
    return jsonify(result)


# ─── CRON / NOTIFICATIONS TRIGGER ─────────────────────────────

@app.route('/api/trigger-notifications', methods=['POST'])
@jwt_required()
def api_trigger_notifications():
    """Endpoint manual para simular el cronjob de envío de emails."""
    user_id = int(get_jwt_identity())
    user = get_user_by_id(user_id)
    settings = get_user_settings(user_id)

    if not settings.get('email_notifications'):
        return jsonify({'message': 'El usuario tiene desactivadas las notificaciones por email.'})

    messages = []

    # 1. Notificaciones de Renovación Hoy
    if settings.get('renewal_alerts'):
        today_renewals = get_renewals_today(user_id)
        if today_renewals:
            for sub in today_renewals:
                if not check_notification_sent(user_id, sub['id'], 'renewal_today'):
                    send_renewal_today(user, [sub])
                    log_notification(user_id, sub['id'], 'renewal_today')
            messages.append(f"✓ Notificaciones de renovación hoy enviadas ({len(today_renewals)} subs).")

    # 2. Recordatorio Semanal (todas las renovaciones en 7 días)
    if settings.get('renewal_alerts'):
        upcoming_subs = get_upcoming_renewals(user_id, days=7)
        if upcoming_subs:
            if not check_notification_sent(user_id, 0, 'weekly_reminder'):
                send_weekly_reminder(user, upcoming_subs)
                log_notification(user_id, 0, 'weekly_reminder')
            messages.append(f"✓ Recordatorio semanal enviado ({len(upcoming_subs)} suscripciones próximas).")

    # 3. Reporte Mensual
    if settings.get('monthly_report'):
        active_subs = [s for s in get_subscriptions(user_id) if s['is_active']]
        monthly_total = get_monthly_total(user_id)

        currency_symbol = '€' if settings.get('currency') == 'EUR' else ('$' if settings.get('currency') == 'USD' else '£')
        total_str = f"{currency_symbol}{monthly_total}"

        send_monthly_report(user, total_str, active_subs)
        messages.append("✓ Reporte mensual enviado.")

    if not messages:
        messages.append("No hay notificaciones pendientes por enviar (sin renovaciones y/o configuración desactivada).")

    return jsonify({'success': True, 'messages': messages})


# ─── MAIN ────────────────────────────────────────────────────────

if __name__ == '__main__':
    init_db()
    seed_test_user()

    # Start scheduler only in main process (not in reloader)
    import os
    if os.environ.get('WERKZEUG_RUN_MAIN') == 'true':
        if not scheduler.running:
            scheduler.start()
            print("✓ APScheduler iniciado - Notificaciones diarias a las 09:00")

    app.run(debug=True, port=5000)
