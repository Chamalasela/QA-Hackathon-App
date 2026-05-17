# MediCare Clinic — Setup Guide

## Prerequisites

- **Node.js 18+** — Download from [nodejs.org](https://nodejs.org/)
- **Web browser** (Chrome/Edge recommended)

## Quick Setup

1. Double-click **`setup.bat`**
2. Wait for installation to complete (~1-2 minutes)
3. Two terminal windows will open (keep them open)
4. Open your browser to **http://localhost:3000**

That's it! The app is ready to test.

## Login Credentials

| Role    | Email              | Password |
|---------|--------------------|----------|
| Admin   | admin@test.com     | Test@123 |
| Doctor  | doctor@test.com    | Test@123 |
| Patient | patient@test.com   | Test@123 |

## URLs

| Resource      | URL                              |
|---------------|----------------------------------|
| Application   | http://localhost:3000             |
| API Server    | http://localhost:4000             |
| Swagger (API) | http://localhost:4000/api-docs    |

## Manual Setup (if setup.bat doesn't work)

Open a terminal and run:

```bash
# Backend
cd backend
npm install
node src/seed.js
node src/index.js

# In a new terminal — Frontend
cd frontend
npm install
npx vite --host
```

## Stopping the Application

Close both terminal windows that were opened by setup.bat:
- "MediCare Backend (Port 4000)"
- "MediCare Frontend (Port 3000)"

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "node is not recognized" | Install Node.js and restart your terminal |
| Port 3000/4000 already in use | Close other apps using those ports, or check Task Manager |
| npm install fails | Try running `npm cache clean --force` then re-run setup.bat |
| Database issues | Delete `backend/data/clinic.db` and re-run `node src/seed.js` |
