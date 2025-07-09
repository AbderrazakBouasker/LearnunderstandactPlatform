# SendGrid Setup Guide

## Overview

This guide will help you set up SendGrid for sending email notifications in the LUA Platform.

## Step 1: Create a SendGrid Account

1. Go to [SendGrid](https://sendgrid.com/) and create a free account
2. Verify your email address
3. Complete the account setup process

## Step 2: Create an API Key

1. Log in to your SendGrid dashboard
2. Navigate to **Settings** → **API Keys**
3. Click **Create API Key**
4. Choose **Restricted Access** (recommended for security)
5. Set the following permissions:
   - **Mail Send**: Full Access
   - **Email Activity**: Read Access (optional, for tracking)
6. Name your API key (e.g., "LUA Platform Notifications")
7. Click **Create & View**
8. **Important**: Copy the API key immediately - you won't be able to see it again!

## Step 3: Verify Sender Email

1. In SendGrid dashboard, go to **Settings** → **Sender Authentication**
2. Choose one of these options:
   - **Domain Authentication** (recommended for production)
   - **Single Sender Verification** (quick setup for testing)

### Option A: Single Sender Verification (Quick Setup)

1. Click **Verify a Single Sender**
2. Enter your email details:
   - **From Name**: LUA Platform Notifications
   - **From Email**: notifications@yourdomain.com
   - **Reply To**: support@yourdomain.com
   - **Company**: Your Company Name
3. Click **Create**
4. Check your email and click the verification link

### Option B: Domain Authentication (Production)

1. Click **Authenticate Your Domain**
2. Enter your domain (e.g., yourdomain.com)
3. Follow the DNS configuration instructions
4. Wait for verification (can take up to 48 hours)

## Step 4: Configure Environment Variables

1. Open your `.env` file in the backend directory
2. Replace the placeholder values:

```env
# SendGrid Configuration
SENDGRID_API_KEY=SG.your_actual_api_key_here
FROM_EMAIL=notifications@yourdomain.com
```

**Important**: Make sure to use the exact API key from Step 2 and the verified email from Step 3.

## Step 5: Test the Integration

1. Run the test script:

```bash
cd /home/kira/Documents/PFE/luaplatform/backend
node test-email.js
```

2. Or test via API:

```bash
curl -X POST http://localhost:5000/api/organization/your-org-id/test-email \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token" \
  -d '{"testEmail": "your-email@example.com"}'
```

## Step 6: Configure Organization Email

Make sure your organization has an email configured:

```javascript
// Example: Update organization with email
{
  "name": "Your Company",
  "identifier": "your-company",
  "email": "alerts@yourcompany.com",
  "notificationThreshold": 0.7
}
```

## Troubleshooting

### Common Issues

1. **"API key does not start with 'SG.'"**

   - Ensure your API key starts with `SG.` and is properly formatted
   - Check for extra spaces or quotes in the .env file

2. **"Unauthorized" Error**

   - Verify the API key is correct and active
   - Check that the API key has "Mail Send" permissions
   - Ensure the API key hasn't expired

3. **"Forbidden" Error**

   - Verify your sender email is authenticated
   - Check that the FROM_EMAIL matches your verified sender

4. **Emails Not Received**
   - Check spam/junk folders
   - Verify the recipient email address
   - Check SendGrid activity logs in the dashboard

### Testing Commands

```bash
# Check environment variables
echo $SENDGRID_API_KEY
echo $FROM_EMAIL

# Test email sending
node test-email.js

# Check SendGrid API status
curl -H "Authorization: Bearer $SENDGRID_API_KEY" \
  https://api.sendgrid.com/v3/user/profile
```

## Security Best Practices

1. **API Key Security**

   - Never commit API keys to version control
   - Use environment variables for sensitive data
   - Rotate API keys regularly
   - Use restricted API keys with minimal permissions

2. **Email Validation**

   - Validate email addresses before sending
   - Implement rate limiting to prevent abuse
   - Monitor email sending volume

3. **Compliance**
   - Include unsubscribe links in promotional emails
   - Respect email preferences and regulations
   - Implement proper logging for audit trails

## Production Considerations

1. **Domain Authentication**

   - Set up proper domain authentication for better deliverability
   - Use a dedicated sending domain (e.g., mail.yourcompany.com)

2. **Email Templates**

   - Use SendGrid's template system for consistent branding
   - Implement A/B testing for better engagement

3. **Monitoring**

   - Set up webhook handlers for delivery events
   - Monitor bounce rates and spam reports
   - Implement email analytics and reporting

4. **Scaling**
   - Consider upgrading to a paid plan for higher volume
   - Implement email queues for high-traffic scenarios
   - Use SendGrid's IP warming features

## Free Tier Limitations

- 100 emails per day
- Limited to 2,000 contacts
- Basic email analytics
- Email support only

For production use, consider upgrading to a paid plan for:

- Higher sending limits
- Advanced analytics
- Priority support
- Additional features like A/B testing
