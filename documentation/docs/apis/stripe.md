---
sidebar_position: 9
---

# Stripe Payment API

This page documents the Stripe payment-related endpoints available in the LUA Platform API. These endpoints allow you to create payment intents for subscription upgrades.

## Overview

The Stripe Payment API provides endpoints to handle payments for different subscription tiers on the LUA Platform. The API integrates with Stripe to process secure payments.

## Create Payment Intent

### Description

This endpoint creates a Stripe payment intent for upgrading to different subscription tiers. It returns a client secret that can be used with Stripe's client-side libraries to complete the payment.

### Endpoint Details

- **URL**: `/api/stripe/create-payment-intent`
- **Method**: `POST`
- **Tags**: Stripe, Payments
- **Authentication**: None required
- **Rate Limit**: Standard rate limits apply

### Request Body

```json
{
  "username": "johndoe",
  "identifier": "myorg123",
  "tier": "pro"
}
```

**Notes:**

- `username` is required - the username of the user making the payment
- `identifier` is required - the organization identifier
- `tier` is required - must be either "pro" or "enterprise"

### Pricing Tiers

| Tier       | Price (USD) | Description                              |
| ---------- | ----------- | ---------------------------------------- |
| pro        | $10.00      | Professional tier with enhanced features |
| enterprise | $50.00      | Enterprise tier with full access         |

### Responses

| Status Code | Description                                    | Response Body        |
| ----------- | ---------------------------------------------- | -------------------- |
| 200         | Payment intent created successfully            | Client secret object |
| 400         | Invalid tier specified                         | Error message        |
| 500         | Stripe not configured or payment intent failed | Error message        |

### Example Request

```bash
curl -X POST \
  'http://backend/api/stripe/create-payment-intent' \
  -H 'Content-Type: application/json' \
  -d '{
    "username": "johndoe",
    "identifier": "myorg123",
    "tier": "pro"
  }'
```

### Example Response

```json
{
  "clientSecret": "pi_3N1234567890abcdef_secret_1234567890abcdef1234567890"
}
```

## Using the Payment Intent

The client secret returned from this endpoint should be used with Stripe's client-side libraries (such as Stripe.js) to complete the payment on the frontend. The payment intent includes metadata with the username, identifier, and tier information for processing after successful payment.

## Error Handling

- If Stripe is not properly configured (missing `STRIPE_SECRET_KEY` environment variable), the endpoint will return a 500 error
- Invalid tiers will result in a 400 error
- All payment attempts and errors are logged for monitoring and debugging purposes

## Security Notes

- The Stripe secret key is securely stored as an environment variable
- Payment metadata includes organization and user information for proper subscription management
- All payment events are logged for audit purposes
