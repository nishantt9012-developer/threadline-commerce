# Order email setup — short guide

## Flow

- COD: persist confirmed order, then request customer receipt and owner notification.
- Online payment: request both emails only after the server verifies captured payment and saves the paid order.
- Receipts contain order reference, product/size/quantity, server-calculated totals, payment state and shipping address. Owner email also includes customer contact details.
- Email failure never cancels a saved order. Each recipient has a saved status: not_configured, failed or accepted. Accepted means the provider accepted the request, not that inbox delivery is proven.

## Activate

1. Create a Resend account and verify your sending domain using its DNS instructions.
2. Create a sending API key. Keep it on the server; never paste it in chat or put it in React.
3. Copy .env.example to .env only if .env does not already exist. Otherwise edit the existing file. Fill these server variables:

```dotenv
RESEND_API_KEY=your_actual_sending_key
EMAIL_FROM=Threadline <orders@your-verified-domain.com>
ORDER_NOTIFY_EMAIL=your-owner-email@example.com
EMAIL_REPLY_TO=support@your-domain.com
```

4. Restart the development server with npm run dev. On a hosted backend, set these as backend environment variables and redeploy/restart.
5. Place one test COD order with an inbox you control. Check both recipient inboxes and Resend dashboard. No real delivery has been verified by this implementation session.

Sender/domain setup: https://resend.com/docs/dashboard/domains/introduction
Sending API: https://resend.com/docs/api-reference/emails/send-email

## Failed email retry

Do not place the order again just to resend email. Use the saved order ID:

```powershell
npm run email:retry -- ORDER_ID
```

Stop the local dev server before running this command because development uses a single-process JSON store. The command only retries notifications not already marked accepted. It does not create an order or charge payment. It prints per-recipient status.

Provider idempotency keys are stable per order/recipient and retained by Resend for 24 hours: https://resend.com/docs/dashboard/emails/idempotency-keys . After an ambiguous timeout older than 24 hours, check the provider dashboard before a retry to avoid a duplicate. Do not change the sender/recipient settings while retrying an uncertain request.

## Current limits

No automatic background queue, delivery/bounce webhooks, shipment emails, SMS or WhatsApp integration. A production store needs a database-backed outbox/worker and delivery monitoring. Current local order storage is for development. Real API secrets are ignored during automated tests; provider sends in email tests are mocked.
