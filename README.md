# EDUGUARD 360
### AI-Powered Student Success, Smart Campus Support & Emergency Response Platform
> *"Identify • Support • Resolve • Protect"*

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/devs00123/EduGuard-360)

---

## 🌟 Overview
**EduGuard 360** is a full-stack, enterprise-grade educational ecosystem built for modern universities and colleges. It tackles academic vulnerability early, resolves physical and digital campus bottlenecks, and provides immediate life-safety campus emergency response.

### 1. AI Academic Risk Predictor
- Analyzes multi-dimensional academic signals:
  - **Attendance** (overall and subject-wise, measured against 75% threshold)
  - **Internal Assessment Marks** (weighted performance across coursework)
  - **Assignments Backlog** (completion rates and submission punctuality)
  - **Historical GPA Progression** (multi-semester trajectory)
- Computes an **Explainable Deterministic Risk Score (0-100)**: `LOW`, `MEDIUM`, `HIGH`, `CRITICAL`.
- Generates **Personalized Action Plans** and provides a comprehensive **Faculty Intervention Management** workflow with before/after progress tracking.

### 2. Smart Campus Complaint & Resolution System
- Student reporting for Wi-Fi, classroom equipment, electrical, plumbing, sanitation, infrastructure, and safety.
- **AI NLP Pre-Analysis**: Instant category detection, priority prediction (`CRITICAL`, `HIGH`, `MEDIUM`, `LOW`), department assignment (`IT`, `IT_AV`, `ELECTRICAL`, `MAINTENANCE`, `SANITATION`, `SECURITY`), and academic impact assessment.
- **Incident Duplicate Clustering Engine**: Detects semantic and geographic similarities to group related reports into unified incidents.
- **SLA Countdown & Enforcement**: Automatic target resolution deadlines with real-time breach detection.
- **Complete Status Lifecycle**: `SUBMITTED` ➔ `AI_ANALYZED` ➔ `ASSIGNED` ➔ `IN_PROGRESS` ➔ `RESOLVED` (with proof) ➔ `STUDENT_CONFIRMED` (1-5★ rating) / `REOPENED` / `ESCALATED`.

### 3. EduGuard AI Assistant
- Integrated conversational bot supporting **English, Hindi, and Hinglish** (e.g. *"Block B mein Wi-Fi nahi chal raha"*).
- **Web Speech API** voice input with live recording visualization.
- **Controlled Server Tool Calling**: Strict authenticated execution without direct database query injection.
- Interactive complaint confirmation cards directly in chat.

### 4. AI Emergency Response & Campus Safety (SOS)
- **Dedicated Floating Emergency Button**: Accessible throughout authenticated pages alongside the AI Assistant.
- **4 Primary Emergency Responders**:
  - 🚨 **National Emergency (112)**: India's unified emergency number covering Police, Fire, and Medical.
  - 🏥 **Campus Doctor & Ambulance**: One-tap calling to verified campus medical officers (`Dr. Ananya Sen`) and rapid ambulance.
  - 🔥 **Fire & Rescue**: Direct connection to emergency fire dispatch (112) and Campus Fire Marshall.
  - 🚔 **Police & Campus Security**: Direct connection to 112 and 24/7 Gate Patrol / Quick Response Team.
- **Location-Aware Display**: Real-time GPS detection and campus quadrant identification.
- **Strict Safety Confirmation**: Confirmation modals with explicit warnings to avoid accidental emergency dispatches.
- **Admin Safety Configuration**: Real-time management interface to configure campus doctors, phone numbers, and availability.

---

## 👥 Demo Personas & Credentials

All demo accounts use password: **`EduGuard@123`**

| Role | Name | Email | Persona Focus |
|---|---|---|---|
| **Student** | Rahul Sharma | `rahul@eduguard.edu` | **High Risk (Score: 70/100)**: 62% attendance, 48% marks, declining trend |
| **Student** | Ananya Verma | `ananya@eduguard.edu` | **Low Risk (Score: 12/100)**: 89% attendance, 84% marks |
| **Student** | Rohan Das | `rohan@eduguard.edu` | **Critical Risk (Score: 89/100)**: 45% attendance, immediate intervention needed |
| **Faculty** | Dr. Ramesh Kumar | `ramesh@eduguard.edu` | CSE Professor (DBMS & OS), mentorship watchlist, intervention builder |
| **Dept Staff** | Suresh Patel | `suresh@eduguard.edu` | Senior Network Technician: ticket resolution, SLA dispatch |
| **Dept Head** | Priya Nair | `priya@eduguard.edu` | IT Operations Head: monitor workload, escalations |
| **Admin** | Dean / Admin Console | `admin@eduguard.edu` | Institutional executive command, clearance verification, audit logs, safety config |

---

## 🚀 Deployment on Render.com

This repository is pre-configured with **`render.yaml`** for zero-configuration deployment on [Render](https://render.com).

### Steps to Deploy on Render:
1. Fork or push this repository to your GitHub account (`devs00123/EduGuard-360`).
2. Log into [Render Dashboard](https://dashboard.render.com/).
3. Click **New +** ➔ **Web Service** (or **Blueprint**).
4. Connect this GitHub repository.
5. Set the Environment Variables:
   - `NODE_ENV`: `production`
   - `DEMO_MODE`: `true`
   - `MONGODB_URI`: Your MongoDB Atlas connection URI string (`mongodb+srv://...`)
   - `JWT_SECRET`: A secure random string (Render generates automatically if using Blueprint)
6. Build Command: `npm install`
7. Start Command: `npm start`
8. Click **Deploy Web Service**. Render will build and deploy the app with automatic HTTPS.

---

## 💻 Local Development

### 1. Installation
```bash
git clone https://github.com/devs00123/EduGuard-360.git
cd EduGuard-360
npm install
```

### 2. Environment Configuration
Create a `.env` file in the root directory:
```env
PORT=5050
NODE_ENV=development
DEMO_MODE=true
MONGODB_URI=your_mongodb_atlas_connection_string
JWT_SECRET=your_jwt_secret_key_here
```

### 3. Seed Realistic Test Data
```bash
npm run seed
```

### 4. Run Development Server
```bash
npm start
```
Open **`http://localhost:5050`** in your browser.

### 5. Run Verification Suites
```bash
node server/test/authPortalSecurityTest.js
node server/test/testApi.js
node server/test/finalVerification.js
```
*(All 131 automated tests pass 100%)*

---

## 🏗️ Technology Stack

- **Frontend**: HTML5, Vanilla CSS3 (Custom Glassmorphic Design System), Vanilla JavaScript, PWA (`manifest.json`, `sw.js`), Chart.js 4.4, Web Speech API.
- **Backend**: Node.js, Express.js REST API, Helmet, CORS, Express-Rate-Limit.
- **Database**: MongoDB Atlas Cloud with Mongoose strict schemas and compound indexes.
- **Real-Time**: Socket.IO for live incident broadcast and SLA countdown updates.
- **Authentication**: JWT Auth with role-based authorization (STUDENT, FACULTY, DEPARTMENT_STAFF, DEPARTMENT_HEAD, ADMIN).
