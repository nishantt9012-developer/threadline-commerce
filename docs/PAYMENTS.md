# Payments and order lifecycle

## Cash on Delivery (works in local demo)

1. Checkout sends only customer details, product ID, size, quantity, and `paymentMethod=cod`.
2. Server validates address and products, and independently calculates price + shipping.
3. Server saves a `confirmed` order with `paymentStatus=unpaid`.
4. Payment is collected upon delivery and must later be reconciled by operations; this demo does not implement collection tracking.

## Razorpay (requires test credentials)

1. Set `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` on the server (never put the secret in React).
2. Server creates an internal pending order and a Razorpay order with amounts in paise.
3. Browser launches Razorpay Checkout using the public key and gateway order ID.
4. On checkout callback, React sends payment ID, order ID, and signature to the server.
5. Server verifies HMAC signature, fetches gateway payment, checks captured status, currency, amount and order ID.
6. Only then does it mark the internal order paid. Failed or dismissed payments remain pending.

## Before taking real money

- Replace JSON-file storage with a transactional database (PostgreSQL recommended).
- Add authenticated staff/admin APIs, stock reservations and atomic decrements.
- Add authenticated Razorpay webhook verification, idempotent event processing, and reconciliation for lost browser callbacks.
- Add order-status endpoints, customer notifications, refunds, cancellations and payment failure recovery.
- Implement HTTPS, deployment secrets, rate limiting, logging and monitoring, backups, and a customer-data retention policy.
- Test payment, webhook and refund paths in Razorpay test mode before live credentials.

**This repository is a development starter, not a production-ready payment service.**
