import smtplib
import ssl
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional
import secrets
import string
from datetime import datetime, timedelta

from app.core.config import settings


class EmailService:
    """Email service for sending notifications and password reset emails."""
    
    def __init__(self):
        self.smtp_host = settings.SMTP_HOST
        self.smtp_port = settings.SMTP_PORT
        self.smtp_user = settings.SMTP_USER
        self.smtp_password = settings.SMTP_PASSWORD
        self.smtp_tls = settings.SMTP_TLS
        
    def _create_smtp_connection(self):
        """Create SMTP connection."""
        if not all([self.smtp_host, self.smtp_port, self.smtp_user, self.smtp_password]):
            raise ValueError("SMTP configuration is incomplete")
        
        context = ssl.create_default_context()
        
        if self.smtp_tls:
            server = smtplib.SMTP(self.smtp_host, self.smtp_port)
            server.starttls(context=context)
        else:
            server = smtplib.SMTP_SSL(self.smtp_host, self.smtp_port, context=context)
        
        server.login(self.smtp_user, self.smtp_password)
        return server
    
    def send_email(self, to_email: str, subject: str, html_content: str, text_content: Optional[str] = None):
        """Send an email."""
        try:
            # Create message
            message = MIMEMultipart("alternative")
            message["Subject"] = subject
            message["From"] = self.smtp_user
            message["To"] = to_email
            
            # Add content
            if text_content:
                text_part = MIMEText(text_content, "plain")
                message.attach(text_part)
            
            html_part = MIMEText(html_content, "html")
            message.attach(html_part)
            
            # Send email
            with self._create_smtp_connection() as server:
                server.send_message(message)
                
            return True
            
        except Exception as e:
            print(f"Failed to send email: {str(e)}")
            return False
    
    def generate_reset_token(self) -> str:
        """Generate a secure reset token."""
        return ''.join(secrets.choice(string.ascii_letters + string.digits) for _ in range(32))
    
    def send_password_reset_email(self, to_email: str, reset_token: str, user_name: str, school_name: str = "School", tenant_id: str = None):
        """Send password reset email."""
        # Create reset URL with tenant information
        if tenant_id:
            reset_url = f"{settings.FRONTEND_URL}/reset-password?token={reset_token}&tenant={tenant_id}"
        else:
            reset_url = f"{settings.FRONTEND_URL}/reset-password?token={reset_token}"
        
        subject = f"Password Reset Request - {school_name}"
        
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <title>Password Reset</title>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background-color: #4f46e5; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }}
                .content {{ background-color: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }}
                .button {{ display: inline-block; background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }}
                .footer {{ text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }}
                .warning {{ background-color: #fef3c7; border: 1px solid #f59e0b; padding: 15px; border-radius: 6px; margin: 20px 0; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Password Reset Request</h1>
                    <p>{school_name}</p>
                </div>
                <div class="content">
                    <p>Hello {user_name},</p>
                    
                    <p>We received a request to reset your password for your {school_name} account. If you didn't make this request, you can safely ignore this email.</p>
                    
                    <p>To reset your password, click the button below:</p>
                    
                    <div style="text-align: center;">
                        <a href="{reset_url}" class="button" style="color: #ffffff;">Reset Password</a>
                    </div>
                    
                    <p>Or copy and paste this link into your browser:</p>
                    <p style="word-break: break-all; color: #4f46e5;">{reset_url}</p>
                    
                    <div class="warning">
                        <strong>Important:</strong> This link will expire in 24 hours for security reasons.
                    </div>
                    
                    <p>If you have any questions, please contact your school administrator.</p>
                    
                    <p>Best regards,<br>
                    {school_name} Team</p>
                </div>
                <div class="footer">
                    <p>This is an automated message. Please do not reply to this email.</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        text_content = f"""
        Password Reset Request - {school_name}
        
        Hello {user_name},
        
        We received a request to reset your password for your {school_name} account. If you didn't make this request, you can safely ignore this email.
        
        To reset your password, visit this link:
        {reset_url}
        
        This link will expire in 24 hours for security reasons.
        
        If you have any questions, please contact your school administrator.
        
        Best regards,
        {school_name} Team
        
        This is an automated message. Please do not reply to this email.
        """
        
        return self.send_email(to_email, subject, html_content, text_content)
    
    def send_visitor_notification_email(self, to_email: str, visitor_name: str, host_name: str, 
                                      visit_purpose: str, entry_time: str, school_name: str = "School"):
        """Send visitor notification email to host."""
        subject = f"Visitor Arrival Notification - {school_name}"
        
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <title>Visitor Arrival</title>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background-color: #059669; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }}
                .content {{ background-color: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }}
                .info-box {{ background-color: #dbeafe; border: 1px solid #3b82f6; padding: 15px; border-radius: 6px; margin: 20px 0; }}
                .footer {{ text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Visitor Arrival Notification</h1>
                    <p>{school_name}</p>
                </div>
                <div class="content">
                    <p>Hello {host_name},</p>
                    
                    <p>A visitor has arrived and is waiting for you at the reception.</p>
                    
                    <div class="info-box">
                        <h3>Visitor Details:</h3>
                        <p><strong>Name:</strong> {visitor_name}</p>
                        <p><strong>Purpose:</strong> {visit_purpose}</p>
                        <p><strong>Arrival Time:</strong> {entry_time}</p>
                    </div>
                    
                    <p>Please proceed to the reception area to meet your visitor.</p>
                    
                    <p>If you are not available, please contact the reception desk to reschedule the visit.</p>
                    
                    <p>Best regards,<br>
                    {school_name} Security Team</p>
                </div>
                <div class="footer">
                    <p>This is an automated notification. Please do not reply to this email.</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        text_content = f"""
        Visitor Arrival Notification - {school_name}
        
        Hello {host_name},
        
        A visitor has arrived and is waiting for you at the reception.
        
        Visitor Details:
        - Name: {visitor_name}
        - Purpose: {visit_purpose}
        - Arrival Time: {entry_time}
        
        Please proceed to the reception area to meet your visitor.
        
        If you are not available, please contact the reception desk to reschedule the visit.
        
        Best regards,
        {school_name} Security Team
        
        This is an automated notification. Please do not reply to this email.
        """
        
        return self.send_email(to_email, subject, html_content, text_content)
    
    def send_visitor_qr_code_email(self, to_email: str, visitor_name: str, qr_code: str, 
                                 visit_date: str, visit_time: str, school_name: str = "School"):
        """Send QR code email to pre-registered visitor."""
        subject = f"Your Visit QR Code - {school_name}"
        
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <title>Visit QR Code</title>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background-color: #4f46e5; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }}
                .content {{ background-color: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }}
                .qr-box {{ background-color: #ffffff; border: 2px solid #e5e7eb; padding: 20px; border-radius: 6px; margin: 20px 0; text-align: center; }}
                .qr-code {{ font-family: monospace; font-size: 18px; background-color: #f3f4f6; padding: 10px; border-radius: 4px; }}
                .footer {{ text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Your Visit QR Code</h1>
                    <p>{school_name}</p>
                </div>
                <div class="content">
                    <p>Hello {visitor_name},</p>
                    
                    <p>Your visit to {school_name} has been pre-registered for {visit_date} at {visit_time}.</p>
                    
                    <p>Please present this QR code at the reception desk when you arrive:</p>
                    
                    <div class="qr-box">
                        <div class="qr-code">{qr_code}</div>
                        <p style="margin-top: 10px; font-size: 14px; color: #6b7280;">
                            Show this code to the security guard for quick check-in
                        </p>
                    </div>
                    
                    <p><strong>Important:</strong></p>
                    <ul>
                        <li>Please arrive 5 minutes before your scheduled time</li>
                        <li>Bring a valid photo ID for verification</li>
                        <li>This QR code is valid only for your scheduled visit</li>
                    </ul>
                    
                    <p>If you need to reschedule or cancel your visit, please contact the school office.</p>
                    
                    <p>Best regards,<br>
                    {school_name} Team</p>
                </div>
                <div class="footer">
                    <p>This is an automated message. Please do not reply to this email.</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        text_content = f"""
        Your Visit QR Code - {school_name}
        
        Hello {visitor_name},
        
        Your visit to {school_name} has been pre-registered for {visit_date} at {visit_time}.
        
        Please present this QR code at the reception desk when you arrive:
        
        {qr_code}
        
        Important:
        - Please arrive 5 minutes before your scheduled time
        - Bring a valid photo ID for verification
        - This QR code is valid only for your scheduled visit
        
        If you need to reschedule or cancel your visit, please contact the school office.
        
        Best regards,
        {school_name} Team
        
        This is an automated message. Please do not reply to this email.
        """
        
        return self.send_email(to_email, subject, html_content, text_content)


# Create singleton instance
email_service = EmailService()

# Standalone functions for backward compatibility
def send_visitor_notification_email(to_email: str, visitor_name: str, host_name: str, 
                                  visit_purpose: str, entry_time: str, school_name: str = "School"):
    """Send visitor notification email to host."""
    return email_service.send_visitor_notification_email(to_email, visitor_name, host_name, 
                                                        visit_purpose, entry_time, school_name)

def send_visitor_qr_code_email(to_email: str, visitor_name: str, qr_code: str, 
                             visit_date: str, visit_time: str, school_name: str = "School"):
    """Send QR code email to pre-registered visitor."""
    return email_service.send_visitor_qr_code_email(to_email, visitor_name, qr_code, 
                                                   visit_date, visit_time, school_name)
