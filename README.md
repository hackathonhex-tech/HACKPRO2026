# HACKPRO — Hackathon Management & Evaluation Platform

An end-to-end, enterprise-ready hackathon management platform built for organizing, evaluating, and tracking multi-track hackathons. Features role-based portals for **Admins**, **Judges**, and **Participants (Teams)**, dynamic registration forms with custom fields, hardware-accelerated QR code check-in ticketing, rubric-based evaluations, and live leaderboards.

---

## 🚀 Tech Stack & Frameworks

### 1. Frontend
- **Framework:** [Next.js](https://nextjs.org/) `16.2.x` (App Router architecture with Turbopack)
- **UI Library:** [React](https://react.dev/) `19.2.x`
- **Language:** [TypeScript](https://www.typescriptlang.org/) `5.x` (Strict type safety)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/) `v4` (`@tailwindcss/postcss`)
- **Animations:** [Framer Motion](https://www.framer.com/motion/) `v12`
- **Icons:** [Lucide React](https://lucide.dev/)
- **Theme Support:** `next-themes` (Dark mode and Light mode)
- **QR Code & Camera Scanning:** `html5-qrcode` (HTML5 camera-based QR scanner) & `qrcode.react` (SVG/Canvas QR generation)
- **Canvas & PDF Export:** HTML5 Canvas API (dynamic badge/ticket pass generation) & `jspdf` / `jspdf-autotable`

### 2. Backend & API
- **Runtime:** [Node.js](https://nodejs.org/) `18+` / `20+`
- **Architecture:** Next.js Server Actions (`"use server"`) with Layered N-Tier Design (Actions → Services → Repositories → Models)
- **Authentication & Security:** 
  - [jose](https://github.com/panva/jose) & `jsonwebtoken` (JWT token signing and verification)
  - HTTP-Only secure cookies for session persistence
  - `bcrypt` for one-way password hashing
  - Next.js Edge Middleware (`src/middleware.ts`) for route-level role-based protection
  - Function-level API RBAC (`verifyApiAuth`) supporting custom sub-admin permissions
- **Email Service:** [Brevo](https://www.brevo.com/) (formerly Sendinblue) REST API v3 for automated ticketing and login delivery

### 3. Database
- **Engine:** [MongoDB](https://www.mongodb.com/) (MongoDB Atlas Cloud Cluster)
- **ODM (Object-Document Modeling):** [Mongoose](https://mongoosejs.com/) `9.x` with connection caching/pooling for serverless environments

---

## 🏛️ Project Architecture

```
src/
├── app/                                # Next.js App Router (Pages & Layouts)
│   ├── (auth)/                         # Login & Authentication routes
│   ├── admin/                          # Admin Portal
│   │   ├── dashboard/                  # Platform metrics & overview
│   │   ├── scanner/                    # Camera-based QR ticket scanner
│   │   ├── users/                      # User, Judge, Team, Sub-Admin, and Role management
│   │   ├── registration-fields/        # Dynamic custom registration form builder
│   │   ├── assign/                     # Judge-to-team assignments
│   │   ├── attendance/                 # Check-in and attendance records
│   │   ├── round-qualification/        # Round advancement & qualifications
│   │   ├── deliverables/               # Submission reviews
│   │   ├── evaluations/                # Live evaluation scoring progress
│   │   ├── rubric/                     # Rubric criterion configuration
│   │   ├── setup/                      # Problem statement & track configuration
│   │   └── settings/                   # Global settings (timers, leaderboard filters)
│   ├── judge/                          # Judge Portal
│   │   ├── dashboard/                  # Assigned teams list
│   │   ├── scanner/                    # Dedicated judge QR scanner for team check-in
│   │   └── score/[id]/                 # Rubric-based scoring & feedback interface
│   ├── team/                           # Participant/Team Portal
│   │   ├── dashboard/                  # Ticket pass, QR code & status overview
│   │   ├── problem-statement/          # Problem statement selection
│   │   └── submit/                     # Project deliverables submission
│   ├── register/                       # Public registration form
│   ├── leaderboard/                    # Live public leaderboard
│   ├── layout.tsx                      # Root HTML layout with providers
│   └── page.tsx                        # Root login portal
│
├── components/                         # Atomic Design System
│   ├── atoms/                          # Buttons, Inputs, Labels, Badges, Cards
│   ├── molecules/                      # Modals, FormFields, SearchInput, Tabs, StatCard
│   ├── organisms/                      # Full boards (UserManagement, ScannerBoard, etc.)
│   └── templates/                      # DashboardTemplate (reusable sidebar/header layout)
│
├── server/                             # Layered Backend Architecture
│   ├── actions/                        # Next.js Server Actions ("use server" endpoints)
│   ├── services/                       # Business logic, email triggers, computations
│   ├── repositories/                   # Database queries (CRUD operations via Mongoose)
│   ├── models/                         # Mongoose Models (User, Team, Evaluation, Round, etc.)
│   ├── middleware/                     # JWT authentication & API RBAC checks
│   └── config/                         # MongoDB connection pool (db.ts)
│
└── middleware.ts                       # Next.js edge route protection
```

---

## ✨ Key Features

1. **Role-Based Portals:**
   - **Admin & Sub-Admin:** Full hackathon configuration, problem statement management, team oversight, CSV/PDF exports, and granular RBAC.
   - **Judge:** Focused interface showing assigned teams, rubric criteria evaluation, scoring, comments, and on-site check-in scanning.
   - **Participants:** Digital team pass with QR ticket, live status updates, problem statement picker, and project submissions.

2. **Custom Registration Form Builder:**
   - Admins can customize the public `/register` form in real time.
   - Support for custom fields for **Teams** (e.g. Project Category, GitHub Org) and **Team Members** (e.g. T-Shirt Size, GitHub Profile, LinkedIn, Gender).
   - Supported field types: Short Text, Number, Email, Phone/Mobile, Dropdown Select (with dynamic options), and Textarea.

3. **QR Code Attendance System:**
   - Real-time camera scanner with fallback manual entry for both Admins and Judges.
   - Immediate toggle for team-level or individual member-level check-ins.

4. **Rubric-Based Evaluation Engine:**
   - Weighted scoring system with customizable criteria (e.g., Innovation, Feasibility, Technical Depth, Presentation).
   - Lockable evaluations to prevent edits once submitted.

5. **Email Delivery via Brevo:**
   - Automated registration confirmation tickets with embedded credentials sent directly to team leads.
   - Resend capability from the Admin Portal.

---

## 🛠️ Getting Started

### Prerequisites
- **Node.js** `18.18+` or `20.x+`
- **npm**, **yarn**, or **pnpm**
- **MongoDB** cluster (local or MongoDB Atlas)

---

### 1. Installation

Clone the repository and install the dependencies:

```bash
git clone https://github.com/hackathonhex-tech/HACKPRO2026.git
cd HACKPRO2026
npm install
```

---

### 2. Environment Variables Setup

Create a `.env.local` file in the root directory (refer to `.env.example`):

```bash
cp .env.example .env.local
```

Configure the following variables in `.env.local`:

```env
# MongoDB Connection String (Atlas Replica-Set or local URI)
MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/hackpro?retryWrites=true&w=majority

# JWT Secret for Session Encryption
JWT_SECRET=your_super_secret_jwt_key_here

# Environment
NODE_ENV=development

# Brevo (Sendinblue) Email API Configuration
BREVO_API_KEY=xkeysib-your_brevo_api_key_here
BREVO_SENDER_EMAIL=your_verified_sender@domain.com
BREVO_SENDER_NAME=HACKPRO Platform

# Default Super Admin Seed Credentials
ADMIN_EMAIL=admin@hackathon.com
ADMIN_UNIQUE_ID=admin
ADMIN_PASSWORD=admin1234
```

---

### 3. Running Locally

Start the development server with Turbopack:

```bash
npm run dev
```

Open your browser and navigate to:
- **Main Portal / Login:** `http://localhost:3000`
- **Public Registration:** `http://localhost:3000/register`
- **Live Leaderboard:** `http://localhost:3000/leaderboard`

---

### 4. Default Login Credentials

| Role | Login Identifier | Default Password | Portal Access |
|---|---|---|---|
| **Super Admin** | `admin@hackathon.com` or `admin` | `admin1234` | `/admin/dashboard` |
| **Judge** | Created via Admin Portal (`/admin/users`) | Configured by Admin | `/judge/dashboard` |
| **Participant / Team** | Team Lead Email (e.g. `lead@college.edu`) | Auto-generated Team ID (e.g. `TM-XXXXXX`) | `/team/dashboard` |

---

## 📦 Production Build & Deployment

### Build Locally
To verify type safety and build production assets:

```bash
# Type check
npx tsc --noEmit

# Production build
npm run build

# Start production server
npm start
```

### Deploy on Vercel
1. Connect the GitHub repository to [Vercel](https://vercel.com).
2. Add all environment variables from `.env.local` to **Project Settings → Environment Variables** on Vercel.
3. Deploy. Production deployments automatically handle caching, Edge Middleware, and SSL certificates.

---

## 📄 License
This project is proprietary and built for hackathon event management. All rights reserved.
