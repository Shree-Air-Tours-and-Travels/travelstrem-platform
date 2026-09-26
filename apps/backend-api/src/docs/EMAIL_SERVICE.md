# Email service

All application email is sent through `src/services/email.service.js`. Nodemailer
is isolated in `src/config/mail.js`, and templates only render content.

## Configuration

Set `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`,
`SMTP_FROM_NAME`, and `SMTP_FROM_EMAIL`. Use `SMTP_SECURE=true` for implicit TLS
(usually port 465) and `false` for STARTTLS (usually port 587).

The server verifies SMTP during startup. A failed verification is logged but does
not terminate the HTTP server.

## Local test

With `NODE_ENV` set to a non-production value, send:

```http
POST /api/test/email
Content-Type: application/json

{"email":"test@example.com"}
```

The temporary endpoint intentionally returns 404 in production to avoid becoming
an unauthenticated mail relay.

## Adding providers or white-label SMTP

Implement the provider contract (`verify()` and `send(message)`) and pass it to
an email-service function as `provider`. Client-specific SMTP can use
`createSmtpProvider(clientSmtpConfig)` without changing templates or domain code.
