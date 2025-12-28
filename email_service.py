import os
import psycopg
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail
from dotenv import load_dotenv
from psycopg.rows import dict_row

# Load environment variables
if getattr(os, 'frozen', False):
    base_dir = os.path.dirname(os.sys.executable)
    load_dotenv(os.path.join(base_dir, '.env'))
else:
    load_dotenv()

def get_db_connection():
    try:
        conn = psycopg.connect(
            os.environ.get('DATABASE_URL'), 
            row_factory=dict_row,
            autocommit=True
        )
        return conn
    except Exception as e:
        print(f"Error connecting to database: {e}")
        return None

def log_email_attempt(user_id, recipient, subject, status, error_message=None):
    """Log email attempt to database"""
    conn = get_db_connection()
    if not conn:
        return
    
    try:
        cursor = conn.cursor()
        cursor.execute(
            """
            INSERT INTO email_logs (user_id, recipient_email, subject, status, error_message)
            VALUES (%s, %s, %s, %s, %s)
            """,
            (user_id, recipient, subject, status, str(error_message) if error_message else None)
        )
    except Exception as e:
        print(f"Failed to log email: {e}")
    finally:
        conn.close()

def send_email(to_email, subject, html_content, user_id=None):
    """
    Send an email using SendGrid and log the result.
    """
    api_key = os.environ.get('SENDGRID_API_KEY')
    from_email = os.environ.get('SENDGRID_FROM_EMAIL')

    if not api_key or not from_email:
        print("SendGrid not configured. Logging failure.")
        log_email_attempt(user_id, to_email, subject, 'failed', 'SendGrid API Key or From Email missing in .env')
        return False, "SendGrid not configured"

    message = Mail(
        from_email=from_email,
        to_emails=to_email,
        subject=subject,
        html_content=html_content
    )

    try:
        sg = SendGridAPIClient(api_key)
        response = sg.send(message)
        
        if 200 <= response.status_code < 300:
            log_email_attempt(user_id, to_email, subject, 'sent')
            return True, "Email sent successfully"
        else:
            error_msg = f"SendGrid returned status {response.status_code}"
            log_email_attempt(user_id, to_email, subject, 'failed', error_msg)
            return False, error_msg
            
    except Exception as e:
        error_msg = str(e)
        print(f"Error sending email: {error_msg}")
        log_email_attempt(user_id, to_email, subject, 'failed', error_msg)
        return False, error_msg

def send_welcome_email(to_email, user_id=None):
    """Send welcome email with 30-day trial information"""
    subject = "Välkommen till WestBudget - Din provperiod har startat!"
    html_content = """
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #4f46e5;">Välkommen till WestBudget!</h1>
        <p>Hej,</p>
        <p>Tack för att du registrerade dig hos WestBudget. Vi är glada att ha dig med oss.</p>
        
        <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #1f2937;">30 Dagars Provperiod</h3>
            <p style="margin-bottom: 0;">Du har nu full tillgång till WestBudget Premium i 30 dagar, helt kostnadsfritt. Utforska alla funktioner för att få full koll på din ekonomi.</p>
        </div>
        
        <p>Om du har några frågor, tveka inte att kontakta vår support.</p>
        <p>Med vänliga hälsningar,<br>WestBudget-teamet</p>
    </div>
    """
    return send_email(to_email, subject, html_content, user_id)

def send_credentials_email(to_email, password, user_id=None):
    """Send login credentials to user"""
    subject = "Dina inloggningsuppgifter till WestBudget"
    html_content = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #4f46e5;">Inloggningsuppgifter</h1>
        <p>Hej,</p>
        <p>Här är dina inloggningsuppgifter för WestBudget:</p>
        
        <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p><strong>E-post:</strong> {to_email}</p>
            <p><strong>Lösenord:</strong> {password}</p>
        </div>
        
        <p>Vi rekommenderar att du byter lösenord första gången du loggar in.</p>
        <p><a href="http://localhost:5173" style="background-color: #4f46e5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Logga in nu</a></p>
        
        <p>Med vänliga hälsningar,<br>WestBudget-teamet</p>
    </div>
    """
    return send_email(to_email, subject, html_content, user_id)

def send_trial_expiring_email(to_email, days_left, user_id=None):
    """Send email warning about expiring trial"""
    subject = "Din provperiod på WestBudget går ut snart!"
    html_content = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #4f46e5;">Din provperiod går ut snart!</h1>
        <p>Hej,</p>
        <p>Vi vill bara påminna om att din provperiod på WestBudget går ut om <strong>{days_left} dagar</strong>.</p>
        
        <div style="background-color: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 5px solid #d97706;">
            <p style="margin: 0; color: #92400e;">För att fortsätta använda alla premiumfunktioner utan avbrott, vänligen uppgradera till en prenumeration innan tiden går ut.</p>
        </div>
        
        <p>Du kan enkelt uppgradera direkt i appen under Inställningar -> Betalningar.</p>
        
        <p>Med vänliga hälsningar,<br>WestBudget-teamet</p>
    </div>
    """
    return send_email(to_email, subject, html_content, user_id)
