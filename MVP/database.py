"""
database.py - Inicialización y gestión de la base de datos MySQL para Subly.
"""

import mysql.connector
import bcrypt

DB_CONFIG = {
    'host': '127.0.0.1',
    'port': 3306,
    'user': 'root',
    'password': 'root',
    'database': 'subly'
}


def get_db():
    """Obtiene una conexión a la base de datos MySQL."""
    conn = mysql.connector.connect(**DB_CONFIG)
    return conn


def column_exists(cursor, table, column):
    """Verifica si una columna existe en una tabla."""
    try:
        cursor.execute(f"SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = %s AND COLUMN_NAME = %s", (table, column))
        return cursor.fetchone()[0] > 0
    except Exception:
        return False


def init_db():
    """Crea la base de datos y las tablas si no existen."""
    # Primero crear la base de datos si no existe
    conn = mysql.connector.connect(
        host=DB_CONFIG['host'],
        port=DB_CONFIG['port'],
        user=DB_CONFIG['user'],
        password=DB_CONFIG['password']
    )
    cursor = conn.cursor()
    cursor.execute('CREATE DATABASE IF NOT EXISTS subly CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci')
    cursor.close()
    conn.close()

    # Crear tablas
    conn = get_db()
    cursor = conn.cursor()

    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            email VARCHAR(255) UNIQUE NOT NULL,
            password_hash VARCHAR(255) NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB
    ''')

    cursor.execute('''
        CREATE TABLE IF NOT EXISTS subscriptions (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            service_name VARCHAR(100) NOT NULL,
            category VARCHAR(50) DEFAULT 'other',
            price DECIMAL(10,2) NOT NULL,
            billing_cycle VARCHAR(20) NOT NULL DEFAULT 'monthly',
            next_renewal DATE NOT NULL,
            is_active TINYINT(1) DEFAULT 1,
            icon VARCHAR(10) DEFAULT '📦',
            color VARCHAR(20) DEFAULT '#6366f1',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        ) ENGINE=InnoDB
    ''')

    cursor.execute('''
        CREATE TABLE IF NOT EXISTS user_settings (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT UNIQUE NOT NULL,
            email_notifications TINYINT(1) DEFAULT 1,
            renewal_alerts TINYINT(1) DEFAULT 1,
            monthly_report TINYINT(1) DEFAULT 0,
            budget_alert TINYINT(1) DEFAULT 1,
            budget_limit DECIMAL(10,2) DEFAULT 100.00,
            currency VARCHAR(10) DEFAULT 'EUR',
            theme VARCHAR(20) DEFAULT 'dark',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        ) ENGINE=InnoDB
    ''')

    cursor.execute('''
        CREATE TABLE IF NOT EXISTS notification_log (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            subscription_id INT NOT NULL,
            notification_type VARCHAR(50) NOT NULL,
            sent_date DATE NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            UNIQUE KEY unique_notification (user_id, subscription_id, notification_type, sent_date),
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (subscription_id) REFERENCES subscriptions(id) ON DELETE CASCADE
        ) ENGINE=InnoDB
    ''')

    # Migración: Añadir columnas faltantes en user_settings
    if not column_exists(cursor, 'user_settings', 'theme'):
        try:
            cursor.execute('ALTER TABLE user_settings ADD COLUMN theme VARCHAR(20) DEFAULT "dark"')
            print("✓ Columna 'theme' añadida a user_settings")
        except Exception as e:
            print(f"⚠ No se pudo añadir columna 'theme': {e}")

    if not column_exists(cursor, 'user_settings', 'currency'):
        try:
            cursor.execute('ALTER TABLE user_settings ADD COLUMN currency VARCHAR(10) DEFAULT "EUR"')
            print("✓ Columna 'currency' añadida a user_settings")
        except Exception as e:
            print(f"⚠ No se pudo añadir columna 'currency': {e}")

    conn.commit()
    cursor.close()
    conn.close()


def seed_test_user():
    """Crea un usuario de prueba si no existe."""
    conn = get_db()
    cursor = conn.cursor(dictionary=True)

    cursor.execute('SELECT id FROM users WHERE email = %s', ('test@test.com',))
    if not cursor.fetchone():
        password_hash = bcrypt.hashpw('1111'.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        cursor.execute(
            'INSERT INTO users (name, email, password_hash) VALUES (%s, %s, %s)',
            ('test', 'test@test.com', password_hash)
        )
        conn.commit()
        print("Usuario de prueba creado: test@test.com / 1111")

    cursor.close()
    conn.close()


if __name__ == '__main__':
    init_db()
    seed_test_user()
    print("Base de datos MySQL inicializada correctamente.")
