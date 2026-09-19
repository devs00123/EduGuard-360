# EduGuard 360 — Institutional Live Deployment & Operations Guide

This guide provides institutional IT directors, campus system administrators, and infrastructure engineers with complete end-to-end instructions for deploying, configuring, securing, and maintaining **EduGuard 360** for universities, colleges, and higher education institutes.

---

## 1. System Architecture & Tech Stack

| Layer | Technology | Functionality |
| :--- | :--- | :--- |
| **Runtime** | Node.js (v18.x or v20.x LTS) | Scalable asynchronous event-driven application runtime |
| **Application Framework** | Express.js 4.x | RESTful API routing, institutional middleware, rate limiting, and security headers |
| **Database** | MongoDB Atlas (or Replica Set) | Document database for students, faculty, tickets, emergency logs, and audit trails |
| **Real-Time Engine** | Socket.io (WebSocket) | Live notification dispatch, emergency SOS alerts, and complaint SLA tracking |
| **AI Diagnostics** | Google Gemini AI (`gemini-1.5-flash`) | Automated student drop-out risk prediction, ticket categorization, and sentiment analysis |
| **Security Layer** | Helmet, Rate Limiter, JWT, bcryptjs | Cryptographic password hashing, brute-force defense, and sanitization |

---

## 2. Infrastructure Prerequisites

Before deploying to production, ensure you have:
1. **Host Server / Cloud Container**:
   - Minimum: 1 vCPU, 1 GB RAM (handles up to ~1,500 concurrent sessions)
   - Recommended for University Campus (5,000+ students): 2-4 vCPUs, 4-8 GB RAM
2. **MongoDB Database**:
   - MongoDB Atlas M0 (free sandbox for staging) or M10+ (dedicated cluster with automated snapshots for production)
   - Whitelist your server's public IP address in MongoDB Atlas Network Access.
3. **Google Gemini API Key** (Optional but recommended):
   - Obtain from [Google AI Studio](https://aistudio.google.com/) for automated ticket classification and student academic risk intervention.
4. **Domain Name & SSL Certificate**:
   - E.g., `campus.youruniversity.edu` or `support.yourcollege.ac.in`.

---

## 3. Quickstart Deployment (4 Steps)

### Step 1: Clone Repository & Install Dependencies
```bash
git clone https://github.com/devs00123/EduGuard-360.git
cd EduGuard-360
npm install --production=false
```

### Step 2: Configure Campus Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Edit `.env` with your institution's specific settings:
```env
PORT=5050
NODE_ENV=production
CLIENT_URL=https://campus.youruniversity.edu
MONGODB_URI=mongodb+srv://<db_user>:<db_password>@cluster0.example.mongodb.net/eduguard360?retryWrites=true&w=majority

# Security
JWT_SECRET=use_a_strong_64_character_random_hex_string_here
JWT_EXPIRES_IN=7d

# Institutional Identity & Branding
INSTITUTION_NAME="National Institute of Technology & Management"
INSTITUTION_CODE="NITM"
INSTITUTION_DOMAIN="nitm.edu"
CAMPUS_HELPLINE="+91 11 2345 6789"
SUPPORT_EMAIL="support@nitm.edu"

# Initial Root Institutional Administrator
ADMIN_NAME="Dr. IT Director"
ADMIN_EMAIL="admin@nitm.edu"
ADMIN_INITIAL_PASSWORD="ChangeMeOnFirstLogin2026!"

# Turn off Demo Mode for Institutional Production
DEMO_MODE=false

# AI Integration
GEMINI_API_KEY=your_gemini_api_key_here
AI_MODEL=gemini-1.5-flash
```

### Step 3: Initialize Master Institutional Data
Run the idempotent institutional initializer:
```bash
npm run init:institution
```
> **Non-Destructive Guarantee**: `npm run init:institution` safely populates core campus departments, academic courses, complaint categories, SLA policies, and emergency contacts **without** deleting or modifying existing student and faculty accounts.

### Step 4: Launch Application Server
```bash
# Direct startup
npm start

# Or using PM2 process manager for continuous 24/7 uptime:
pm2 start server/server.js --name "eduguard-360" -i max
pm2 save
pm2 startup
```

---

## 4. Access Gateways & Institutional Routing

The system includes pre-configured gateways for distinct campus personas:

| Gateway Route | Target Audience | Primary Functionality |
| :--- | :--- | :--- |
| `/` or `/portal` | **All Visitors / Campus Directory** | Unified Institutional Gateway with role-based routing cards |
| `/student/login` | **Undergraduates & Postgraduates** | Attendance, course marks, academic risk diagnostics, AI chatbot |
| `/staff/login` | **Faculty, Staff & Administrators** | Department ticket resolution, SLA tracking, student advisory |
| `/admin/dashboard` | **Deans, IT Directors & Heads** | Campus-wide analytics, staff assignments, SLA escalation rules |
| `/api/config/institution` | **System Integrations** | Public JSON endpoint providing dynamic institutional metadata |

---

## 5. Master Data Structure

When `npm run init:institution` is executed, the following baseline infrastructure is established:

1. **Departments**:
   - Computer Science & Engineering (CSE)
   - Information Technology (IT)
   - Electronics & Communication (ECE)
   - Mechanical Engineering (ME)
   - Civil Engineering (CE)
   - Campus IT & Networking Infrastructure
   - Facilities & Electrical Maintenance
   - Student Welfare & Academic Affairs
   - Hostel & Residential Administration

2. **Standard Academic Degree Programs**:
   - Bachelor of Technology (B.Tech - Computer Science)
   - Bachelor of Technology (B.Tech - Information Technology)
   - Master of Computer Applications (MCA)

3. **Complaint Categories & Default SLAs**:
   - Wi-Fi & Campus Internet (High Priority — 12 hr SLA)
   - Hostel & Water / Electricity Maintenance (Critical Priority — 4 hr SLA)
   - Classroom & Smart Projector Audio-Visual (Medium Priority — 24 hr SLA)
   - Library Services & Digital Access (Low Priority — 48 hr SLA)
   - Academic Queries & Examination Issues (Medium Priority — 24 hr SLA)
   - Campus Security & ID Card Issues (High Priority — 12 hr SLA)

4. **Emergency Helplines (SOS)**:
   - 24/7 Campus Security Control Room
   - Medical Emergency & Health Center
   - Women's Safety & Anti-Harassment Cell
   - Mental Wellness & Psychological Counseling
   - Anti-Ragging Helpline

---

## 6. Production Security Checklist

Ensure the following security practices are in place before public launch:

- [x] **`DEMO_MODE=false`**: Disables demo persona shortcuts and locks `/api/auth/demo-login` (returns HTTP 403 Forbidden).
- [x] **Cryptographic Secret**: Ensure `JWT_SECRET` is generated using `openssl rand -hex 64` and kept confidential.
- [x] **Change Root Admin Password**: Log in immediately to `/staff/login` using `ADMIN_EMAIL` and `ADMIN_INITIAL_PASSWORD`, then change the password from the account settings.
- [x] **MongoDB Authentication**: Utilize dedicated database users with least-privilege `readWrite` access scoped exclusively to the `eduguard360` database.
- [x] **SSL / HTTPS**: Enforce HTTPS for all web traffic to encrypt passwords, session cookies, and student records in transit.
- [x] **Rate Limiting**: Built-in IP rate limiter protects `/api/auth/*` against credential stuffing and brute-force attacks.

---

## 7. Nginx Reverse Proxy Configuration (Sample)

For deployments on Ubuntu/Debian Linux VPS using Nginx:

```nginx
server {
    listen 80;
    server_name campus.youruniversity.edu;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name campus.youruniversity.edu;

    ssl_certificate /etc/letsencrypt/live/campus.youruniversity.edu/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/campus.youruniversity.edu/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    location / {
        proxy_pass http://127.0.0.1:5050;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## 8. Backup & Maintenance Operations

### Automated Database Backups
When using MongoDB Atlas:
- Navigate to **Backup** tab in the Atlas Console.
- Enable Cloud Backup with retention policy (recommended: daily snapshots with 30-day retention).

### Manual Backup (mongodump)
```bash
mongodump --uri="mongodb+srv://<db_user>:<db_password>@cluster0.example.mongodb.net/eduguard360" --out=/backups/$(date +%F)
```

---

## 9. Technical Support & Institutional Assistance
For system customization, SIS/ERP integration (e.g., SAP, Ellucian, or PeopleSoft), contact your institution's software engineering division or submit an issue via the campus IT repository.
