#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script para probar la conexión SMTP y el envío de emails.
"""
import os
from dotenv import load_dotenv
from email_service import send_email

load_dotenv()

smtp_server = os.environ.get('MAIL_SERVER')
smtp_port = os.environ.get('MAIL_PORT')
smtp_user = os.environ.get('MAIL_USERNAME')
sender = os.environ.get('MAIL_DEFAULT_SENDER')

print("=" * 60)
print("TEST DE CONFIGURACIÓN SMTP")
print("=" * 60)
print(f"Servidor: {smtp_server}")
print(f"Puerto: {smtp_port}")
print(f"Usuario: {smtp_user}")
print(f"Remitente: {sender}")
print()

if not all([smtp_server, smtp_port, smtp_user, sender]):
    print("ERROR: Faltan variables de entorno SMTP en el .env")
    exit(1)

test_user = {
    'name': 'Test User',
    'email': 'subly.app.info@gmail.com'
}

html_content = """
<h2>¡Hola Test User!</h2>
<p>Este es un email de prueba del sistema Subly.</p>
<p>Si recibes este mensaje, el sistema de emails está funcionando correctamente.</p>
<p style='color: #16a34a;'><strong>TODO FUNCIONA!</strong></p>
"""

print("Enviando email de prueba...")
result = send_email(test_user['email'], "Subly - Email de Prueba", html_content)

if result:
    print("Email enviado exitosamente")
else:
    print("Error al enviar el email")
