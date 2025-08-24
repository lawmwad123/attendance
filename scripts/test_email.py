#!/usr/bin/env python3
"""
Test script for email functionality.
Run this script to test if email configuration is working.
"""

import asyncio
import sys
import os

# Add the app directory to the Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from app.core.email import email_service
from app.core.config import settings


def test_email_configuration():
    """Test email configuration."""
    print("Testing email configuration...")
    
    # Check if SMTP settings are configured
    required_settings = [
        'SMTP_HOST',
        'SMTP_PORT', 
        'SMTP_USER',
        'SMTP_PASSWORD'
    ]
    
    missing_settings = []
    for setting in required_settings:
        if not getattr(settings, setting, None):
            missing_settings.append(setting)
    
    if missing_settings:
        print(f"❌ Missing email settings: {', '.join(missing_settings)}")
        print("\nPlease configure the following environment variables:")
        for setting in missing_settings:
            print(f"  - {setting}")
        return False
    
    print("✅ Email settings are configured")
    return True


def test_email_sending():
    """Test sending a test email."""
    print("\nTesting email sending...")
    
    try:
        # Test email sending
        success = email_service.send_email(
            to_email="lawmwad@gmail.com",  # Replace with your test email
            subject="Test Email - School Attendance System",
            html_content="""
            <html>
                <body>
                    <h1>Test Email</h1>
                    <p>This is a test email from the School Attendance System.</p>
                    <p>If you receive this email, the email configuration is working correctly.</p>
                </body>
            </html>
            """,
            text_content="Test Email - School Attendance System\n\nThis is a test email from the School Attendance System.\nIf you receive this email, the email configuration is working correctly."
        )
        
        if success:
            print("✅ Test email sent successfully")
            return True
        else:
            print("❌ Failed to send test email")
            return False
            
    except Exception as e:
        print(f"❌ Error sending test email: {str(e)}")
        return False


def test_reset_token_generation():
    """Test reset token generation."""
    print("\nTesting reset token generation...")
    
    try:
        token1 = email_service.generate_reset_token()
        token2 = email_service.generate_reset_token()
        
        if len(token1) == 32 and len(token2) == 32 and token1 != token2:
            print("✅ Reset token generation working correctly")
            return True
        else:
            print("❌ Reset token generation failed")
            return False
            
    except Exception as e:
        print(f"❌ Error generating reset token: {str(e)}")
        return False


def main():
    """Main test function."""
    print("🧪 Email Functionality Test")
    print("=" * 40)
    
    # Test configuration
    config_ok = test_email_configuration()
    
    if not config_ok:
        print("\n❌ Email configuration test failed. Please configure email settings first.")
        return
    
    # Test token generation
    token_ok = test_reset_token_generation()
    
    # Test email sending (only if user wants to)
    print("\n" + "=" * 40)
    print("To test email sending, edit this script and replace 'lawmwad@gmail.com'")
    print("with your actual email address, then run the script again.")
    print("=" * 40)
    
    # Test email sending
    email_ok = test_email_sending()
    
    if config_ok and token_ok:
        print("\n✅ Email functionality is ready!")
        print("\nTo enable email sending, make sure to:")
        print("1. Configure SMTP settings in your .env file")
        print("2. Test with a real email address")
    else:
        print("\n❌ Some email functionality tests failed")


if __name__ == "__main__":
    main()
