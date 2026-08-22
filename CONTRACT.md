# Dayflow — Shared Development Contract

Welcome to the development contract for **Dayflow**. This document serves as the single source of truth for all team members and AI coding agents building features for Dayflow. Please read this contract carefully before creating branches or writing code.

---

## 1. Overview

**Dayflow** is a modern Human Resource Management System (HRMS) designed to streamline workplace administrative and employee operations. It supports two primary roles: **Admin** and **Employee**. Dayflow covers core capabilities including authentication, user profile management, daily attendance tracking (check-in/check-out), leave request processing and approvals, and basic payroll viewing.

---

## 2. Data Models (Supabase SQL Schema)

All database operations, relationships, and queries must strictly adhere to the following Supabase PostgreSQL tables and enum types.

### Enums

```sql
CREATE TYPE user_role AS ENUM ('admin', 'employee');
CREATE TYPE attendance_status AS ENUM ('present', 'absent', 'half-day', 'leave');
CREATE TYPE leave_type AS ENUM ('paid', 'sick', 'unpaid');
CREATE TYPE leave_status AS ENUM ('pending', 'approved', 'rejected');
```

### Table Schemas

#### 1. `users`
| Column Name | Type | Constraints / Description |
| :--- | :--- | :--- |
| `id` | `uuid` | Primary Key, references Supabase Auth `auth.users.id` |
| `employee_id` | `text` | `UNIQUE`, `NOT NULL` (e.g., "EMP001") |
| `name` | `text` | `NOT NULL` |
| `email` | `text` | `UNIQUE`, `NOT NULL` |
| `role` | `user_role` | `NOT NULL`, default `'employee'` |
| `phone` | `text` | Optional contact number |
| `address` | `text` | Optional physical address |
| `profile_picture_url` | `text` | Optional URL to profile avatar |
| `job_title` | `text` | `NOT NULL` (e.g., "Frontend Developer") |
| `salary` | `numeric` | `NOT NULL`, numeric value |
| `created_at` | `timestamp` | Default `NOW()` |

#### 2. `attendance`
| Column Name | Type | Constraints / Description |
| :--- | :--- | :--- |
| `id` | `uuid` | Primary Key, default `gen_random_uuid()` |
| `user_id` | `uuid` | Foreign Key -> `users.id` (`ON DELETE CASCADE`) |
| `date` | `date` | `NOT NULL` (e.g., "2026-08-22") |
| `check_in` | `timestamp` | Nullable timestamp of check-in |
| `check_out` | `timestamp` | Nullable timestamp of check-out |
| `status` | `attendance_status` | `NOT NULL`, default `'absent'` |

#### 3. `leave_requests`
| Column Name | Type | Constraints / Description |
| :--- | :--- | :--- |
| `id` | `uuid` | Primary Key, default `gen_random_uuid()` |
| `user_id` | `uuid` | Foreign Key -> `users.id` (`ON DELETE CASCADE`) |
| `leave_type` | `leave_type` | `NOT NULL` ('paid' \| 'sick' \| 'unpaid') |
| `start_date` | `date` | `NOT NULL` |
| `end_date` | `date` | `NOT NULL` |
| `remarks` | `text` | Reason provided by employee |
| `status` | `leave_status` | `NOT NULL`, default `'pending'` |
| `admin_comment` | `text` | Optional feedback/reason from Admin |
| `created_at` | `timestamp` | Default `NOW()` |

---

## 3. API Conventions

- **Base Endpoint Format**: All backend API routes must be prefixed with `/api/<resource>`.
  - `/api/users` — User profile management, employee directory
  - `/api/attendance` — Clock in, clock out, attendance records
  - `/api/leave` — Leave application submissions, approvals, status updates
- **Authentication Header**: Every protected route must expect a valid Supabase JWT sent via HTTP header:
  ```http
  Authorization: Bearer <token>
  ```
- **Express Auth Middlewares**:
  - `requireAuth`: Verifies the Supabase JWT token from the `Authorization` header and attaches the validated user record (`users` table object) to `req.user`. If token is missing or invalid, returns HTTP `401 Unauthorized`.
  - `requireAdmin`: Executes after `requireAuth`. Checks if `req.user.role === 'admin'`. If false, returns HTTP `403 Forbidden`.

---

## 4. Proposed Monorepo Folder Structure

```text
dayflow/
├── frontend/                   # React (Vite) + Tailwind CSS application
│   ├── public/
│   ├── src/
│   │   ├── components/         # Shared & reusable UI components
│   │   ├── context/            # AuthContext & global states
│   │   ├── hooks/              # Custom hooks (e.g., useAuth)
│   │   ├── pages/              # View components (SignIn, Dashboard, Attendance, Leave, etc.)
│   │   ├── services/           # Axios / Fetch API client configurations
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── package.json
│   ├── vite.config.js
│   └── tailwind.config.js
├── backend/                    # Node.js + Express REST API server
│   ├── config/                 # Supabase client setup & configuration
│   ├── middleware/             # requireAuth.js, requireAdmin.js
│   ├── routes/                 # Resource handlers (one file per resource)
│   │   ├── users.js            # /api/users endpoints
│   │   ├── attendance.js       # /api/attendance endpoints
│   │   └── leave.js            # /api/leave endpoints
│   ├── server.js               # Entry point
│   └── package.json
├── .env.example                # Unified repository environment variable template
├── CONTRACT.md                 # Shared architectural contract document
└── README.md
```

---

## 5. Frontend Conventions

- **Auth Hook**: A custom `useAuth()` hook must be used to access user session and identity across all components.
  - Return signature: `{ user, session, loading, signOut, signIn }`
  - `user` object contains all properties matching the database `users` table schema (`id`, `employee_id`, `name`, `email`, `role`, `phone`, `address`, `profile_picture_url`, `job_title`, `salary`, `created_at`).
- **Route Protection**:
  - Unauthenticated access to protected routes must immediately redirect users to `/signin`.
  - Admin-only routes must verify `user.role === 'admin'` and redirect non-admin employees to their dashboard or access denied page.

---

## 6. Rules for This Repository

1. **Branch Per Feature**: Create a dedicated git branch for each feature or bug fix (e.g., `feature/attendance-clock-in`, `feature/leave-approval`, `fix/login-redirect`).
2. **Never Commit Directly to `main`**: All work must be submitted via Pull Requests (PRs) and reviewed prior to merging into `main`.
3. **Keep Commits Small & Atomic**: Make concise, meaningful commit messages detailing exact additions or fixes.
4. **Pull `main` Regularly**: Always run `git pull origin main` after merging any branch or before starting work on a new feature to minimize merge conflicts.
