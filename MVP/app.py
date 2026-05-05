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
    get_upcoming_renewals, get_monthly_total, get_yearly_total
)
from datetime import timedelta
import os

app = Flask(__name__)
app.config['JWT_SECRET_KEY'] = os.environ.get('JWT_SECRET_KEY', 'subly-secret-key-dev-2024')
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(days=7)

CORS(app, origins=['http://localhost:5173', 'http://127.0.0.1:5173'])
jwt = JWTManager(app)


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

    try:
        price = float(data['price'])
    except (ValueError, TypeError):
        return jsonify({'error': 'Precio inválido'}), 400

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

    return jsonify({'success': True, 'id': sub_id}), 201


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


# ─── MAIN ────────────────────────────────────────────────────────

if __name__ == '__main__':
    init_db()
    seed_test_user()
    app.run(debug=True, port=5000)
