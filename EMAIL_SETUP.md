# Email Setup Guide

This guide explains how to configure email functionality for the School Attendance System, specifically for password reset emails.

## Required Environment Variables

Add the following variables to your `.env` file:

```bash
# Email Configuration
SMTP_HOST=your-smtp-server.com
SMTP_PORT=587
SMTP_USER=your-email@your-domain.com
SMTP_PASSWORD=your-password
SMTP_TLS=true
EMAIL_RESET_TOKEN_EXPIRE_HOURS=24
```

## Email Provider Examples

### Gmail
```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password  # Use App Password, not regular password
SMTP_TLS=true
```

**Note for Gmail:** You need to:
1. Enable 2-factor authentication
2. Generate an App Password (Google Account → Security → App Passwords)
3. Use the App Password instead of your regular password

### Outlook/Hotmail
```bash
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_USER=your-email@outlook.com
SMTP_PASSWORD=your-password
SMTP_TLS=true
```

### Yahoo
```bash
SMTP_HOST=smtp.mail.yahoo.com
SMTP_PORT=587
SMTP_USER=your-email@yahoo.com
SMTP_PASSWORD=your-app-password  # Use App Password
SMTP_TLS=true
```

### Custom SMTP Server
```bash
SMTP_HOST=your-smtp-server.com
SMTP_PORT=587
SMTP_USER=your-email@your-domain.com
SMTP_PASSWORD=your-password
SMTP_TLS=true
```

## Testing Email Configuration

Run the test script to verify your email configuration:

```bash
python scripts/test_email.py
```

This will:
1. Check if all required email settings are configured
2. Test reset token generation
3. Optionally test email sending (edit the script to add your test email)

## Password Reset Flow

1. **User requests password reset** (`POST /api/v1/auth/forgot-password`)
   - Provides email address
   - System generates secure reset token
   - Token is stored in database with expiration time
   - Email is sent with reset link

2. **User clicks reset link**
   - Frontend extracts token from URL
   - User enters new password
   - Frontend calls reset endpoint

3. **Password is reset** (`POST /api/v1/auth/reset-password`)
   - System validates token and expiration
   - Updates user password
   - Clears reset token

## Security Features

- **Secure token generation**: 32-character random string
- **Token expiration**: 24 hours by default (configurable)
- **Email enumeration protection**: Always returns success message
- **Multi-tenant isolation**: Tokens are scoped to school
- **Automatic cleanup**: Expired tokens are cleared

## Troubleshooting

### Common Issues

1. **"SMTP configuration is incomplete"**
   - Check that all SMTP_* variables are set in your .env file

2. **"Authentication failed"**
   - Verify your email and password are correct
   - For Gmail/Yahoo, make sure you're using an App Password

3. **"Connection timeout"**
   - Check your internet connection
   - Verify SMTP_HOST and SMTP_PORT are correct
   - Some networks block SMTP ports

4. **"SSL/TLS error"**
   - Try setting SMTP_TLS=false for some providers
   - Check if your provider requires specific SSL settings

### Testing with Different Providers

Edit `scripts/test_email.py` and replace `test@example.com` with your actual email address to test the full email flow.

## Production Considerations

1. **Use environment variables**: Never hardcode email credentials
2. **Use App Passwords**: For Gmail/Yahoo, use App Passwords instead of regular passwords
3. **Monitor email delivery**: Set up monitoring for failed email sends
4. **Rate limiting**: Consider implementing rate limiting for password reset requests
5. **Email templates**: Customize email templates for your school branding
