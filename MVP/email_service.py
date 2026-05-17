import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime

def send_email(to_email, subject, html_content):
    """
    Envía un correo electrónico utilizando la configuración SMTP del archivo .env.
    """
    smtp_server = os.environ.get('MAIL_SERVER')
    smtp_port = os.environ.get('MAIL_PORT')
    smtp_user = os.environ.get('MAIL_USERNAME')
    smtp_password = os.environ.get('MAIL_PASSWORD')
    sender = os.environ.get('MAIL_DEFAULT_SENDER')

    if not all([smtp_server, smtp_port, smtp_user, smtp_password, sender]):
        print(f"⚠️ No se pudo enviar el correo a {to_email}. Faltan credenciales SMTP en el .env.")
        print(f"   [SIMULACIÓN] Asunto: {subject}")
        return False

    msg = MIMEMultipart("alternative")
    msg['Subject'] = subject
    msg['From'] = sender
    msg['To'] = to_email

    part = MIMEText(html_content, 'html')
    msg.attach(part)

    try:
        server = smtplib.SMTP(smtp_server, int(smtp_port))
        server.starttls()
        server.login(smtp_user, smtp_password)
        server.sendmail(sender, to_email, msg.as_string())
        server.quit()
        print(f"✅ Correo enviado exitosamente a {to_email} ({subject})")
        return True
    except Exception as e:
        print(f"❌ Error enviando correo a {to_email}: {e}")
        return False

def send_renewal_alert(user, upcoming_subs):
    """Envía alerta de renovaciones próximas."""
    if not upcoming_subs:
        return
    
    subject = "Alerta Subly: Tienes renovaciones próximas"
    
    html = f"<h2>Hola {user['name']},</h2>"
    html += "<p>Estas son tus próximas renovaciones para los siguientes 7 días:</p><ul>"
    
    for sub in upcoming_subs:
        html += f"<li><strong>{sub['service_name']}</strong>: {sub['price']} el {sub['next_renewal']}</li>"
    
    html += "</ul><p>¡Revisa si necesitas cancelar alguna!</p>"
    
    send_email(user['email'], subject, html)

def send_renewal_today(user, today_subs):
    """Envía notificación de renovaciones que ocurren hoy."""
    if not today_subs:
        return
    
    subject = "🔔 Subly: Tus suscripciones se renuevan hoy"
    
    html = f"<h2>Hola {user['name']},</h2>"
    html += "<p>Hoy se renuevan las siguientes suscripciones:</p><ul>"
    
    for sub in today_subs:
        html += f"<li><strong>{sub['service_name']}</strong>: {sub['price']} ({sub['billing_cycle']})</li>"
    
    html += "</ul><p>¡Verifica que todo esté correcto en tu cuenta!</p>"
    
    send_email(user['email'], subject, html)

def send_weekly_reminder(user, upcoming_subs):
    """Envía un email grupal con todas las renovaciones en los próximos 7 días."""
    if not upcoming_subs:
        return

    subject = "📋 Subly: Renovaciones Próximas (Próximos 7 días)"

    html = f"<h2>Hola {user['name']},</h2>"
    html += "<p>Aquí tienes un resumen de tus próximas renovaciones en los siguientes <strong>7 días</strong>:</p>"
    html += "<table style='width: 100%; border-collapse: collapse; margin: 20px 0;'>"
    html += "<tr style='background-color: #f5f5f5; border-bottom: 2px solid #ddd;'>"
    html += "<th style='padding: 10px; text-align: left;'><strong>Servicio</strong></th>"
    html += "<th style='padding: 10px; text-align: left;'><strong>Precio</strong></th>"
    html += "<th style='padding: 10px; text-align: left;'><strong>Fecha</strong></th>"
    html += "<th style='padding: 10px; text-align: center;'><strong>Días Restantes</strong></th>"
    html += "</tr>"

    today = datetime.now().date()
    for sub in upcoming_subs:
        renewal_date = sub['next_renewal']
        days_remaining = (renewal_date - today).days

        html += "<tr style='border-bottom: 1px solid #eee;'>"
        html += f"<td style='padding: 10px;'><strong>{sub['service_name']}</strong></td>"
        html += f"<td style='padding: 10px;'>{sub['price']} ({sub['billing_cycle']})</td>"
        html += f"<td style='padding: 10px;'>{renewal_date}</td>"

        if days_remaining == 0:
            html += f"<td style='padding: 10px; text-align: center; color: #dc2626;'><strong>¡HOY!</strong></td>"
        elif days_remaining == 1:
            html += f"<td style='padding: 10px; text-align: center; color: #ea580c;'><strong>Mañana</strong></td>"
        else:
            html += f"<td style='padding: 10px; text-align: center; color: #16a34a;'><strong>{days_remaining} días</strong></td>"

        html += "</tr>"

    html += "</table>"
    html += "<p style='color: #666; font-size: 0.9em;'>Si necesitas cancelar o modificar alguna suscripción, ahora es un buen momento.</p>"

    send_email(user['email'], subject, html)

def send_renewal_reminder_7days(user, reminder_subs):
    """Envía recordatorios diarios de renovaciones en los próximos 7 días."""
    if not reminder_subs:
        return
    
    subject = "⏰ Subly: Recordatorio de renovación próxima"
    
    html = f"<h2>Hola {user['name']},</h2>"
    html += "<p>Te recordamos que las siguientes suscripciones se renovarán pronto:</p><ul>"
    
    today = datetime.now().date()
    for sub in reminder_subs:
        renewal_date = sub['next_renewal']
        days_remaining = (renewal_date - today).days
        
        html += f"<li>"
        html += f"<strong>{sub['service_name']}</strong><br/>"
        html += f"Precio: {sub['price']} ({sub['billing_cycle']})<br/>"
        html += f"Se renovará en <strong>{days_remaining} día(s)</strong><br/>"
        html += f"Fecha: <strong>{renewal_date}</strong>"
        html += f"</li>"
    
    html += "</ul><p>Si deseas cancelar o modificar alguna suscripción, ahora es un buen momento para hacerlo.</p>"
    
    send_email(user['email'], subject, html)

def send_monthly_report(user, monthly_total, active_subs):
    """Envía un reporte mensual del gasto."""
    subject = "Subly: Tu Reporte Mensual de Gastos"
    
    html = f"<h2>Hola {user['name']}, aquí tienes tu reporte mensual</h2>"
    html += f"<p>Actualmente tienes <strong>{len(active_subs)} suscripciones activas</strong>.</p>"
    html += f"<h3>Gasto Mensual Estimado: {monthly_total}</h3>"
    
    html += "<ul>"
    for sub in active_subs:
        html += f"<li>{sub['service_name']} - {sub['price']} ({sub['billing_cycle']})</li>"
    html += "</ul>"
    
    html += "<p>¡Gracias por usar Subly!</p>"
    
    send_email(user['email'], subject, html)

def send_budget_alert(user, new_sub_name, diff):
    """Envía alerta por superar límite de presupuesto."""
    subject = "⚠️ Alerta Subly: Presupuesto Excedido"
    
    html = f"<h2>¡Cuidado {user['name']}!</h2>"
    html += f"<p>Has añadido la suscripción <strong>{new_sub_name}</strong> y esto ha hecho que superes tu límite de presupuesto mensual.</p>"
    html += f"<p>Actualmente superas tu límite por <strong>{diff}</strong>.</p>"
    html += "<p>Te recomendamos revisar tus suscripciones activas.</p>"
    
    send_email(user['email'], subject, html)
