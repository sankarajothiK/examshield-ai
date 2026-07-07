# ExamShield AI - SMTP Email Setup Guide

To enable the sending of real account verification codes and password reset emails to candidates, you need to configure your SMTP credentials inside `server/.env`. 

Here are step-by-step instructions for the most common email providers:

---

## 📧 Option A: Setting up Gmail SMTP (Most Popular)

Google requires **App Passwords** rather than your main account password to connect third-party applications.

### Step 1: Generate a Google App Password
1. Go to your [Google Account Settings](https://myaccount.google.com/).
2. On the left navigation panel, click **Security**.
3. Under *How you sign in to Google*, ensure **2-Step Verification** is turned **ON** (this is mandatory).
4. Click on **2-Step Verification**, scroll to the bottom, and click on **App passwords**.
5. Enter a name for the app (e.g., `ExamShield AI`), then click **Create**.
6. Google will display a **16-digit code** (e.g., `abcd efgh ijkl mnop`). Copy this code and remove any spaces.

### Step 2: Configure your `.env` File
Open `server/.env` and replace the SMTP placeholders:
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-gmail-username@gmail.com
SMTP_PASS=abcdefghijklmnop                 # The 16-digit app password (no spaces)
FROM_EMAIL="ExamShield AI <your-gmail-username@gmail.com>"
```

---

## ⚡ Option B: Setting up SendGrid SMTP

Dedicated transactional email services offer maximum delivery speed and stability.

1. Create a free account at [SendGrid](https://sendgrid.com).
2. Go to **Settings** > **Sender Authentication** and verify your domain or email address.
3. Go to **Email API** > **Integration Guide** > **SMTP** to generate an **API Key**.
4. Configure your `server/.env` file:
```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey                            # This must be literally the word "apikey"
SMTP_PASS=SG.your_actual_sendgrid_api_key   # Your SendGrid API Key
FROM_EMAIL="ExamShield AI <your-verified-sender@yourdomain.com>"
```

---

## 📤 Option C: Setting up Outlook / Office 365 SMTP

1. Open your `server/.env` file and use the following parameters:
```env
SMTP_HOST=smtp.office365.com
SMTP_PORT=587
SMTP_USER=your-outlook-email@outlook.com
SMTP_PASS=your_outlook_password_or_app_password
FROM_EMAIL="ExamShield AI <your-outlook-email@outlook.com>"
```

---

## 🛠️ Testing Your Configuration
Once you save the changes in `server/.env`:
1. Restart your backend server by saving the env file or executing `node server.js`.
2. Go to your browser and sign up a new test account using a real email.
3. The system will deliver the 6-digit verification code directly to that inbox!
