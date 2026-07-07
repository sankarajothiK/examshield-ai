# ExamShield AI - Production Deployment Guide

This is a unified full-stack Node.js application. The backend serves the React SPA frontend statically from `server/public`. Therefore, you only need to deploy a single Node.js process to go live.

---

## ☁️ Option 1: Deploying to Render.com (Recommended & Free Tier)

1. Create a free account at [Render](https://render.com).
2. Click **New +** and select **Web Service**.
3. Connect your GitHub repository.
4. Set the following configurations:
   - **Name**: `examshield-ai`
   - **Language**: `Node`
   - **Root Directory**: `server` (or leave empty if deploying from the root folder where you'll run `npm install`)
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
5. Under **Environment Variables**, add:
   - `PORT` = `10000` (Render handles this, or defaults to 10000)
   - `NODE_ENV` = `production`
   - `JWT_SECRET` = `[ChooseAnySecureRandomString]`
   - `MONGO_URI` = `mongodb+srv://root:root@cluster0.rsszl.mongodb.net/examshield?retryWrites=true&w=majority&appName=Cluster0`
6. Click **Deploy Web Service**.

---

## 🚂 Option 2: Deploying to Railway.app

1. Register at [Railway.app](https://railway.app).
2. Click **New Project** and link your repository.
3. Railway automatically detects the `package.json` inside the root or `server` directory.
4. Go to **Variables** and add:
   - `PORT` = `8080`
   - `NODE_ENV` = `production`
   - `JWT_SECRET` = `[YourSecretString]`
   - `MONGO_URI` = `mongodb+srv://root:root@cluster0.rsszl.mongodb.net/examshield?retryWrites=true&w=majority&appName=Cluster0`
5. Railway will automatically deploy the application.

---

## 🖥️ Option 3: Deploying to a VPS (Ubuntu / Debian / DigitalOcean)

If deploying to your own server, use **PM2** to run the app as a background daemon:

1. **Connect to your server via SSH**:
   ```bash
   ssh root@your_server_ip
   ```
2. **Install Node.js and Git**:
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs git
   ```
3. **Install PM2 globally**:
   ```bash
   sudo npm install pm2 -g
   ```
4. **Clone the codebase & navigate to server folder**:
   ```bash
   git clone <your-repository-url>
   cd examshield-ai/server
   ```
5. **Install dependencies**:
   ```bash
   npm install --production
   ```
6. **Configure environment file**:
   Create a `.env` file inside `server/` containing:
   ```env
   PORT=5000
   MONGO_URI=mongodb+srv://root:root@cluster0.rsszl.mongodb.net/examshield?retryWrites=true&w=majority&appName=Cluster0
   JWT_SECRET=supersecuresecretkeyforexamshieldai
   NODE_ENV=production
   ```
7. **Start process with PM2**:
   ```bash
   pm2 start server.js --name examshield-portal
   pm2 save
   pm2 startup
   ```
8. The server is now running on port `5000`. You can configure Nginx as a reverse proxy to map port `80`/`443` to `5000`.

---

## 🔒 Post-Deployment Checklist

- [ ] **Delete Seeding Files (Optional)**: For maximum safety, delete the `server/utils/seed.js` and `server/utils/clearDb.js` files so that database scripts cannot be run accidentally in production.
- [ ] **First Sign-In**: Log in to the application using your admin details:
  - **URL**: `https://your-deployed-app.com`
  - **Email**: `admin@examshield.com`
  - **Password**: `admin123`
- [ ] **Change Password**: Go to your profile or use the forgot password tool to update the administrator password immediately to a strong, secure password.
