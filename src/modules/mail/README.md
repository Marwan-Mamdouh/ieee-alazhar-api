# Mail Module 📧

A centralized service module for managing email communications, primarily used for authentication (OTPs) and system notifications.

## 🛠 Features

- **OTP Management:** Specialized methods for generating and sending sign-in, verification, and password reset OTPs.
- **Transporter Configuration:** Uses `nodemailer` with a pre-configured transporter (see `src/config/mailer.ts`).
- **Environment Driven:** Mailer credentials and sender information are managed via environment variables.

## ⚙️ Service Methods

The `mailService` provides several high-level methods:

### `sendSignInOTP(to, otp)`

Sends a 6-digit code to the user for secure login.

### `sendVerificationOTP(to, otp)`

Sends a verification code for new account registration or email changes.

### `sendResetPasswordOTP(to, otp)`

Sends a recovery code for password reset requests.

### `sendMail({ to, subject, message })`

A generic method for sending custom text-based emails.

## 🔌 Integration

The Mail module is a core dependency for the authentication system (`Better-Auth` integration) and other modules requiring user notifications. It ensures that all outgoing emails follow a consistent format and use a shared connection pool.
