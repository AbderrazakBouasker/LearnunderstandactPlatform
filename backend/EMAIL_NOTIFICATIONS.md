# Email Notification System Documentation

## Overview

The email notification system automatically sends alerts to organizations when user feedback clusters exceed the configured sentiment threshold. This helps organizations quickly identify and address critical user experience issues.

## Features

- **Automatic Notifications**: Emails are sent when negative sentiment percentage exceeds the organization's notification threshold
- **Rich HTML Templates**: Professional email templates with cluster analysis, AI recommendations, and priority indicators
- **Jira Integration**: Includes Jira ticket information when automatically created
- **Customizable Thresholds**: Each organization can configure their own notification threshold
- **Tracking**: System tracks when emails are sent to prevent spam

## Configuration

### Environment Variables

Add these variables to your `.env` file:

```env
SENDGRID_API_KEY=your_sendgrid_api_key_here
FROM_EMAIL=notifications@luaplatform.com
```

### Organization Settings

Each organization can configure:

- `email`: The email address to receive notifications
- `notificationThreshold`: Percentage threshold (0-1) for triggering notifications
  - Default: 0.7 (70%)
  - Example: 0.8 = notifications when 80% or more feedback is negative

### Example Organization Configuration

```javascript
{
  "name": "Acme Corp",
  "identifier": "acme-corp",
  "email": "alerts@acme.com",
  "notificationThreshold": 0.75, // 75% threshold
  "recommendationThreshold": 0.5, // 50% threshold for AI recommendations
  "ticketCreationDelay": 7 // days
}
```

## Email Triggers

### When Emails Are Sent

1. **Cluster Analysis**: After clustering feedback for a form
2. **Sentiment Check**: When negative sentiment percentage >= notification threshold
3. **Email Configured**: Organization must have an email address configured
4. **No Duplicate Prevention**: System tracks sent emails to prevent spam

### Sentiment Calculation

```javascript
const negativeCount = insights.filter(
  (insight) =>
    insight.sentiment === "very dissatisfied" ||
    insight.sentiment === "dissatisfied"
).length;
const sentimentPercentage = (negativeCount / insights.length) * 100;
```

## Email Content

### Subject Line

```
🚨 High Sentiment Alert: [Cluster Topic] ([X]% negative)
```

### Email Includes

- **Cluster Summary**: Topic, number of insights, sentiment percentage
- **AI Recommendations**: When available (based on recommendation threshold)
- **Priority Indicators**: Impact (high/medium/low) and urgency (immediate/soon/later)
- **Jira Ticket Info**: When automatically created
- **Action Items**: Clear next steps for the organization

### Email Template Preview

```html
🚨 High Sentiment Alert - Acme Corp Cluster Analysis Summary: - Cluster Topic:
Login Issues - Number of Insights: 8 - Negative Sentiment: 85.5% AI
Recommendation: Improve login flow by adding better error messages and reducing
required fields Priority: High Impact, Immediate Urgency Jira Ticket: PROJ-123
(Open)
```

## API Endpoints

### Test Email Endpoint

```
POST /api/organization/:identifier/test-email
```

**Request Body:**

```json
{
  "testEmail": "test@example.com" // Optional: uses org email if not provided
}
```

**Response:**

```json
{
  "message": "Test email sent successfully",
  "email": "test@example.com"
}
```

## Database Schema Updates

### ClusterAnalysis Model

Added email tracking fields:

```javascript
{
  emailNotificationSent: {
    type: Boolean,
    default: false
  },
  emailNotificationDate: {
    type: Date,
    required: false
  }
}
```

## Usage Examples

### Testing Email Integration

```javascript
// Run the test script
node test-email.js
```

### Manual Email Sending

```javascript
import emailService from "./services/emailService.js";

const clusterData = {
  clusterLabel: "Login Issues",
  clusterSize: 8,
  recommendation: "Improve login flow...",
  impact: "high",
  urgency: "immediate",
};

await emailService.sendClusterNotificationEmail(
  "alerts@company.com",
  "Company Name",
  clusterData,
  85.5
);
```

## Monitoring and Logging

### Log Events

- Email sending attempts (success/failure)
- Threshold exceedances
- Missing email configurations
- SendGrid API errors

### Log Example

```javascript
logger.info("Cluster notification email sent successfully", {
  to: "alerts@company.com",
  organizationName: "Acme Corp",
  clusterLabel: "Login Issues",
  sentimentPercentage: 85.5,
});
```

## Troubleshooting

### Common Issues

1. **Emails Not Sending**

   - Check SENDGRID_API_KEY is set correctly
   - Verify FROM_EMAIL is configured
   - Check SendGrid account status and quotas

2. **Missing Notifications**

   - Ensure organization has email configured
   - Check notification threshold settings
   - Verify sentiment calculation is correct

3. **Email Formatting Issues**
   - Check HTML template rendering
   - Verify data is properly escaped
   - Test with different email clients

### Debug Commands

```bash
# Check environment variables
echo $SENDGRID_API_KEY

# Test email sending
node test-email.js

# Check organization configuration
curl -X GET /api/organization/identifier/your-org-id
```

## Security Considerations

1. **API Key Security**: Store SendGrid API key securely in environment variables
2. **Email Validation**: Validate email addresses before sending
3. **Rate Limiting**: Prevent email spam through rate limiting
4. **Data Privacy**: Ensure email content complies with privacy regulations

## Future Enhancements

1. **Email Templates**: Support for multiple template designs
2. **Email Preferences**: Allow users to configure notification types
3. **Digest Emails**: Daily/weekly summary emails
4. **Email Analytics**: Track open rates and click-through rates
5. **Multi-language Support**: Localized email templates
