# Patient Management Module - Quick Start Guide

## 🚀 Get Started in 5 Minutes

This guide will help you run the Lithic Patient Management module locally.

---

## Prerequisites

- Node.js 20+ installed
- npm 10+ installed
- Terminal/Command line access

---

## Installation & Setup

### Step 1: Install Backend Dependencies

```bash
cd /home/user/lithic/vanilla/backend
npm install express cors
npm install --save-dev @types/express @types/cors @types/node typescript ts-node-dev
```

### Step 2: Install Frontend Dependencies

```bash
cd /home/user/lithic/vanilla/frontend
npm install
npm install --save-dev webpack webpack-cli webpack-dev-server ts-loader html-webpack-plugin
```

---

## Running the Application

### Terminal 1: Start Backend Server

```bash
cd /home/user/lithic/vanilla/backend

# Development mode (auto-reload)
npx ts-node-dev --respawn --transpile-only src/server.ts

# Or if you have tsx installed
npx tsx watch src/server.ts
```

**Backend will run on:** `http://localhost:3001`

You should see:

```
🏥 Lithic Patient Management API running on port 3001
📋 Health check: http://localhost:3001/health
🔌 API Base: http://localhost:3001/api
```

### Terminal 2: Start Frontend Server

```bash
cd /home/user/lithic/vanilla/frontend

# Development mode
npx webpack serve --mode development

# Or if you have vite configured
npm run dev
```

**Frontend will run on:** `http://localhost:8080`

Browser will automatically open to the patient list page.

---

## Verify Installation

### Test Backend API

```bash
# Health check
curl http://localhost:3001/health

# Get all patients
curl http://localhost:3001/api/patients

# Expected response:
{
  "success": true,
  "data": [...],
  "pagination": {...}
}
```

### Test Frontend

Open your browser to:

- **Patient List:** http://localhost:8080/patients
- **API Docs:** http://localhost:3001/api

You should see:

- Two mock patients (John Doe, Jane Smith)
- Search functionality
- Pagination controls

---

## Quick Feature Tour

### 1. View Patients

- Go to http://localhost:8080/patients
- See list of all patients
- Use search to filter

### 2. Create New Patient

- Click "New Patient" button
- Fill out the form
- Submit to create

### 3. View Patient Details

- Click "View" on any patient
- See patient card with demographics
- View tabs: Demographics, Insurance, Documents, History

### 4. Search for Duplicates

- Create a patient with similar data
- System will detect potential duplicates
- View match scores

### 5. Merge Patients

- Go to patient detail page
- Click "Merge" button
- Select target patient
- Provide merge reason
- Confirm merge

### 6. Add Insurance

- Go to patient detail
- Click "Insurance" tab
- Add primary or secondary insurance
- Verify details

### 7. Upload Documents

- Go to patient detail
- Click "Documents" tab
- Upload consent forms, insurance cards, etc.
- View/download documents

### 8. View History

- Go to patient detail
- Click "History" tab
- See complete audit trail
- Export history

---

## API Endpoints Quick Reference

### Patients

```bash
# List all
GET /api/patients

# Get by ID
GET /api/patients/:id

# Get by MRN
GET /api/patients/mrn/:mrn

# Create
POST /api/patients
Content-Type: application/json
{
  "firstName": "John",
  "lastName": "Doe",
  "dateOfBirth": "1980-01-01",
  "gender": "male",
  "contact": {"phone": "555-1234"},
  "address": {
    "street": "123 Main St",
    "city": "Springfield",
    "state": "IL",
    "zipCode": "62701",
    "country": "USA"
  },
  "insurance": []
}

# Update
PUT /api/patients/:id

# Delete (soft)
DELETE /api/patients/:id
```

### Search

```bash
# Quick search
GET /api/patients/search?query=John

# Advanced search
GET /api/patients/search?firstName=John&lastName=Doe&dateOfBirth=1980-01-01

# Find duplicates
POST /api/patients/search/duplicates
Content-Type: application/json
{
  "firstName": "John",
  "lastName": "Doe",
  "dateOfBirth": "1980-01-01"
}
```

### Merge

```bash
POST /api/patients/merge
Content-Type: application/json
{
  "sourceMrn": "MRN-12345678-9",
  "targetMrn": "MRN-98765432-1",
  "reason": "Duplicate records for same patient"
}
```

---

## Sample Requests

### Create Patient (cURL)

```bash
curl -X POST http://localhost:3001/api/patients \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Alice",
    "lastName": "Smith",
    "dateOfBirth": "1990-05-15",
    "gender": "female",
    "contact": {
      "phone": "555-9876",
      "email": "alice@example.com"
    },
    "address": {
      "street": "456 Oak Ave",
      "city": "Springfield",
      "state": "IL",
      "zipCode": "62702",
      "country": "USA"
    },
    "bloodType": "A+",
    "allergies": ["Penicillin"],
    "insurance": []
  }'
```

### Search Patients (cURL)

```bash
curl "http://localhost:3001/api/patients/search?firstName=Alice&lastName=Smith"
```

### Add Insurance (cURL)

```bash
curl -X POST http://localhost:3001/api/patients/insurance/{PATIENT_ID} \
  -H "Content-Type: application/json" \
  -d '{
    "provider": "Blue Cross Blue Shield",
    "policyNumber": "BCBS123456",
    "subscriberName": "Alice Smith",
    "subscriberId": "AS123456",
    "relationship": "self",
    "effectiveDate": "2024-01-01",
    "isPrimary": true,
    "verified": true
  }'
```

---

## Development Workflow

### Making Changes

#### Backend Changes

1. Edit files in `backend/src/`
2. Server auto-reloads (ts-node-dev)
3. Test API endpoint
4. Check console for errors

#### Frontend Changes

1. Edit files in `frontend/src/`
2. Webpack rebuilds automatically
3. Browser auto-refreshes
4. Check browser console for errors

### Debugging

#### Backend Debugging

```typescript
// Add console logs in server.ts or services
console.log("Patient data:", patient);

// Check request/response
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`, req.body);
  next();
});
```

#### Frontend Debugging

```typescript
// Add console logs in components
console.log("Loading patient:", patientId);

// Use browser DevTools
// Network tab - check API calls
// Console tab - see errors
// Elements tab - inspect DOM
```

---

## Common Issues & Solutions

### Issue: Backend won't start

**Solution:**

```bash
# Check if port 3001 is in use
lsof -i :3001

# Kill process if needed
kill -9 <PID>

# Install missing dependencies
npm install
```

### Issue: Frontend won't build

**Solution:**

```bash
# Clear webpack cache
rm -rf node_modules/.cache

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Try alternative dev server
npx vite
```

### Issue: CORS errors

**Solution:**
Backend already has CORS enabled. Check that:

- Backend is running on port 3001
- Frontend is requesting from http://localhost:3001
- CORS headers are present in response

### Issue: TypeScript errors

**Solution:**

```bash
# Check TypeScript version
npx tsc --version

# Install latest
npm install -D typescript@latest

# Clear and rebuild
rm -rf dist
npm run build
```

---

## Production Build

### Backend Production Build

```bash
cd backend
npm run build
node dist/server.js
```

### Frontend Production Build

```bash
cd frontend
npm run build
# Serve from dist/ folder
npx serve dist
```

---

## Testing

### Manual Testing Checklist

- [ ] Create new patient
- [ ] Search for patient (by name, MRN, phone)
- [ ] View patient details
- [ ] Update patient information
- [ ] Add insurance
- [ ] Upload document
- [ ] View patient history
- [ ] Detect duplicates
- [ ] Merge duplicate records
- [ ] Delete patient
- [ ] Pagination works
- [ ] Form validation works
- [ ] Error messages display

---

## Environment Variables

Create `.env` file in backend:

```env
# Server
PORT=3001
NODE_ENV=development

# Database (when implementing)
DATABASE_URL=postgresql://user:password@localhost:5432/lithic

# Security
JWT_SECRET=your-secret-key-here
SESSION_SECRET=your-session-secret-here

# CORS
CORS_ORIGIN=http://localhost:8080

# File Upload
MAX_FILE_SIZE=10485760  # 10MB
UPLOAD_DIR=/uploads
```

---

## Next Steps

1. ✅ **Get it running** - Follow steps above
2. 📊 **Explore features** - Try all pages and components
3. 🔧 **Customize** - Modify styles, add fields
4. 🗄️ **Add database** - Replace in-memory storage
5. 🔐 **Add auth** - Implement real authentication
6. 🚀 **Deploy** - Deploy to production

---

## Resources

- **Main Documentation:** `PATIENT_MANAGEMENT_MODULE.md`
- **File List:** `FILE_MANIFEST.md`
- **Backend Code:** `/backend/src/`
- **Frontend Code:** `/frontend/src/`

---

## Support

If you encounter issues:

1. Check console logs (backend and frontend)
2. Verify all dependencies are installed
3. Ensure ports 3001 and 8080 are available
4. Review error messages carefully
5. Check API responses in Network tab

---

## Success Indicators

You'll know everything is working when:

- ✅ Backend shows: "Lithic Patient Management API running"
- ✅ Frontend opens in browser automatically
- ✅ You see 2 mock patients in the list
- ✅ Health check returns `{"status":"healthy"}`
- ✅ You can create, view, and search patients
- ✅ No errors in browser console
- ✅ No errors in terminal

---

**🎉 You're all set! Start building amazing healthcare software!**

---

Last Updated: 2026-01-01
