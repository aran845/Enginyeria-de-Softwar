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
        CREATE TABLE IF NOT EXISTS companies (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            name VARCHAR(150) NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        ) ENGINE=InnoDB
    ''')

    cursor.execute('''
        CREATE TABLE IF NOT EXISTS company_expenses (
            id INT AUTO_INCREMENT PRIMARY KEY,
            company_id INT NOT NULL,
            name VARCHAR(150) NOT NULL,
            amount DECIMAL(10,2) NOT NULL,
            category VARCHAR(50) DEFAULT 'general',
            expense_date DATE NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
        ) ENGINE=InnoDB
    ''')

    cursor.execute('''
        CREATE TABLE IF NOT EXISTS company_subscriptions (
            id INT AUTO_INCREMENT PRIMARY KEY,
            company_id INT NOT NULL,
            service_name VARCHAR(100) NOT NULL,
            category VARCHAR(50) DEFAULT 'other',
            price DECIMAL(10,2) NOT NULL,
            billing_cycle VARCHAR(20) NOT NULL DEFAULT 'monthly',
            next_renewal DATE NOT NULL,
            is_active TINYINT(1) DEFAULT 1,
            icon VARCHAR(10) DEFAULT '📦',
            color VARCHAR(20) DEFAULT '#6366f1',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
        ) ENGINE=InnoDB
    ''')

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
