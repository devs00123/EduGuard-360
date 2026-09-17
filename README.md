# EDUGUARD 360
### AI-Powered Student Success & Smart Campus Support Platform
> *"Identify. Support. Resolve. Improve."*

---

## 🌟 Overview
**EduGuard 360** is a full-stack, enterprise-grade educational ecosystem built for modern higher-education institutions. It tackles academic vulnerability early while resolving physical and digital campus bottlenecks that affect student well-being.

### Primary Problem: AI Academic Risk Predictor
- Analyzes multi-dimensional academic signals:
  - **Attendance** (overall and subject-wise, measured against 75% threshold)
  - **Internal Assessment Marks** (weighted performance across coursework)
  - **Assignments Backlog** (completion rates and submission punctuality)
  - **Historical GPA Progression** (multi-semester trajectory)
- Computes an **Explainable Risk Score (0-100)**: `LOW`, `MEDIUM`, `HIGH`, `CRITICAL`.
- Generates **Personalized Action Plans** and provides a comprehensive **Faculty Intervention Management** workflow with before/after progress tracking.

### Integrated Secondary Module: Smart Campus Complaint & Resolution System
- Student reporting for Wi-Fi, classroom equipment, electrical, plumbing, sanitation, infrastructure, and safety.
- **AI NLP Pre-Analysis**: Instant category detection, priority prediction (`CRITICAL`, `HIGH`, `MEDIUM`, `LOW`), department assignment (`IT`, `IT_AV`, `ELECTRICAL`, `MAINTENANCE`, `SANITATION`, `SECURITY`), and academic impact assessment.
- **Incident Duplicate Clustering Engine**: Detects semantic and geographic similarities to group related reports into unified incidents.
- **SLA Countdown & Enforcement**: Automatic target resolution deadlines with real-time breach detection.
- **Complete Status Lifecycle**: `SUBMITTED` ➔ `AI_ANALYZED` ➔ `ASSIGNED` ➔ `IN_PROGRESS` ➔ `RESOLVED` (with proof) ➔ `STUDENT_CONFIRMED` (1-5★ rating) / `REOPENED` / `ESCALATED`.

### Cross-Module Synthesis: Student Success & Support
- Merges academic risk indicators with active campus facility conditions as neutral, contextual support data without unfounded causal assumptions.

### EduGuard AI Assistant
- Integrated conversational bot supporting **English, Hindi, and Hinglish** (e.g. *"Block B mein Wi-Fi nahi chal raha"*).
- **Web Speech API** voice input with live recording visualization.
- **Controlled Server Tool Calling**: Strict authenticated execution without direct database query injection.
- Interactive complaint confirmation cards directly in chat.

---

## 🚀 Quick Start Guide

### 1. Requirements
- Node.js (v18+)
- Local MongoDB or MongoDB Atlas URI (MongoDB v8.0 is pre-configured with auto-launcher for local development)

### 2. Installation
```bash
npm install
```

### 3. Seed Realistic Synthetic Data
```bash
npm run seed
```

### 4. Run Server
```bash
npm start
```
The application will launch on **`http://localhost:5050`**.

### 5. Run Automated Tests
```bash
npm run test:api
```

---

## 👥 Demo Personas (Evaluator Quick Switcher)

An interactive role bar is fixed at the top of the interface for one-click testing of all roles:

| Role | Name | Email | Password | Scenario Focus |
|---|---|---|---|---|
| **Student** | Rahul Sharma | `rahul@eduguard.edu` | `EduGuard@123` | **High Academic Risk (76/100)**: 62% attendance, 48% marks, declining trend, 1 campus Wi-Fi issue |
| **Faculty** | Dr. Ramesh Kumar | `ramesh@eduguard.edu` | `EduGuard@123` | Mentorship portal, at-risk student watchlist, 360° profile, intervention plan builder |
| **Dept Staff** | Suresh Patel | `suresh@eduguard.edu` | `EduGuard@123` | Field technician: accept assignment, mark in progress, upload resolution proof |
| **Dept Head** | Priya Nair | `priya@eduguard.edu` | `EduGuard@123` | IT Department Head: monitor workload, assign technicians, handle escalations |
| **Admin** | Dean / Admin | `admin@eduguard.edu` | `EduGuard@123` | Campus-wide analytics, SLA compliance, campus spatial visualizer, audit log, CSV exports |

---

## 🏗️ Architecture & Technology Stack

- **Frontend**: HTML5, CSS3 (Modern Glassmorphic Design System, Dark/Light Mode), Vanilla JavaScript, PWA (`manifest.json`, `sw.js`), Chart.js 4.4, Web Speech API.
- **Backend**: Node.js, Express.js RESTful API, Helmet, CORS, Rate Limiting.
- **Database**: MongoDB & Mongoose with strict schema validation and compound indexing.
- **Real-Time**: Socket.IO for live notification toasts and ticket status broadcasts.
- **File Uploads**: Multer with MIME verification and 5MB size limit.
- **Security**: JWT Authentication, bcrypt password hashing, Role-Based Access Control (RBAC), and persistent audit trails.
