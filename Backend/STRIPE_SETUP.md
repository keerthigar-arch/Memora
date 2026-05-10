# Stripe Setup for Life Events Hub

## 1. Get Stripe API Keys

1. Create a [Stripe account](https://dashboard.stripe.com/register)
2. Go to **Developers > API keys**
3. Copy your **Secret key** (starts with `sk_test_` for test mode)

## 2. Configure appsettings

In `appsettings.Development.json` (or `appsettings.json`):

```json
{
  "Stripe": {
    "SecretKey": "sk_test_your_secret_key_here",
    "WebhookSecret": ""
  },
  "Frontend": {
    "BaseUrl": "http://localhost:4200"
  }
}
```

For production, use your live key (`sk_live_...`) and set `Frontend:BaseUrl` to your app URL.

## 3. Webhook (Optional, for production)

Webhooks notify your server when payment succeeds, even if the user closes the browser. For local dev, the success redirect + `verify-session` is enough.

To enable webhooks:

1. Install [Stripe CLI](https://stripe.com/docs/stripe-cli)
2. Run: `stripe listen --forward-to localhost:5000/api/payments/webhook`
3. Copy the webhook signing secret (starts with `whsec_`) into `Stripe:WebhookSecret`
4. For production: add webhook endpoint in Stripe Dashboard → Developers → Webhooks → Add endpoint  
   URL: `https://yourdomain.com/api/payments/webhook`  
   Events: `checkout.session.completed`

## 4. Test Cards (Test mode)

- Success: `4242 4242 4242 4242`
- Decline: `4000 0000 0000 0002`
- More: https://stripe.com/docs/testing

## 5. Flow

1. User fills event form and selects display duration (7, 30, or 90 days)
2. Clicks "Proceed to Payment" → draft saved
3. Clicks "Pay with Card (Stripe)" → redirects to Stripe Checkout
4. User pays with card on Stripe
5. Stripe redirects to `/create-event/success?session_id=...`
6. Frontend calls `POST /api/payments/verify-session` with sessionId
7. Backend verifies payment with Stripe and creates the event

If Stripe is not configured (empty `SecretKey`), clicking "Pay with Card" will automatically fall back to mock payment for local development.
