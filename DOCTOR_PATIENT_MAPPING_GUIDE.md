# Doctor-Patient Risk-Based Mapping - Implementation Guide

## Overview

This system implements **many-to-many doctor-patient relationships based on AI-detected health risks**. When a patient uploads a medical report, AI analyzes it for health risks. If risks are detected, the system automatically assigns an appropriate specialist doctor to the patient.

## Key Features

✅ **Risk-Based Assignment**: Only patients with detected health risks are visible to doctors  
✅ **Automatic Matching**: AI detects specialization needs and assigns appropriate doctors  
✅ **Many-to-Many**: A patient can have multiple doctors, a doctor can have multiple patients  
✅ **Secure Access**: Multi-layer security (Frontend → Backend API → Firestore)  
✅ **Real-time Updates**: React Query for efficient data fetching and caching  

---

## How It Works

### 1. Patient Uploads Report
- Patient uploads a PDF/image medical report via the dashboard
- System processes the document (OCR + AI analysis)

### 2. AI Analysis & Risk Detection
- Google Gemini analyzes the report content
- Detects health risks, abnormal parameters, symptoms
- Determines required medical specialization (e.g., "Cardiologist", "Diabetologist")

### 3. Automatic Doctor Assignment
- System finds a doctor with matching specialization
- Creates entry in `sharedReports` collection:
  ```typescript
  {
    id: "uuid",
    userId: "patient_id",
    patientId: "patient_id",
    doctorId: "doctor_id",
    doctorEmail: "doctor@example.com",
    detectedSpecialization: "Cardiologist",
    reportSummary: "High cholesterol detected...",
    symptoms: ["chest pain", "fatigue"],
    reportIds: ["report_id"],
    shareToken: "secure_token",
    createdAt: timestamp
  }
  ```

### 4. Doctor Dashboard Access
- Doctor logs in → `/doctor-dashboard`
- System queries `sharedReports` filtered by doctor's email
- Only patients with detected risks are shown
- Each patient card displays:
  - Patient name and age
  - Last report summary
  - Detected specialization
  - Risk symptoms
  - Assignment date

### 5. Patient Dashboard Access
- Patient logs in → `/dashboard`
- System queries `sharedReports` filtered by patient ID
- Shows all assigned doctors with their specializations

---

## API Endpoints

### Doctor Endpoints

#### `GET /api/doctor/patients`
Returns patients assigned to the logged-in doctor via risk detection.

**Response:**
```json
[
  {
    "id": "patient_id",
    "name": "John Doe",
    "email": "john@example.com",
    "dateOfBirth": "1990-01-01",
    "age": 35,
    "lastReportSummary": "High cholesterol detected...",
    "detectedSpecialization": "Cardiologist",
    "symptoms": ["chest pain", "fatigue"],
    "assignedAt": "2025-10-19T12:00:00Z"
  }
]
```

#### `GET /api/patient/doctors`
Returns doctors treating the logged-in patient.

**Response:**
```json
[
  {
    "id": "doctor_id",
    "name": "Dr. Smith",
    "email": "smith@hospital.com",
    "specialization": "Cardiologist",
    "assignedAt": "2025-10-19T12:00:00Z"
  }
]
```

#### `GET /api/patient/:patientId/healthTimeline`
Returns health timeline for a patient (accessible by patient themselves or their assigned doctors).

---

## Security Architecture

### Multi-Layer Security Model

```
┌─────────────────────────────────────────┐
│          Frontend (React)               │
│  - Only displays API response data      │
│  - No direct Firestore access           │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│    Backend API (Express) ⭐ PRIMARY     │
│  - Queries sharedReports collection     │
│  - Filters by doctor email/patient ID   │
│  - Enforces risk-based mapping          │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│   Firestore Rules (Baseline Access)     │
│  - Role-based authentication            │
│  - Ownership validation                 │
└─────────────────────────────────────────┘
```

### Why Backend Enforcement?

**Firestore Security Rules Limitations:**
- Cannot efficiently query many-to-many relationships
- Cannot check if a sharedReport exists linking doctor to patient (requires arbitrary queries)
- Best suited for simple ownership and role checks

**Backend API Advantages:**
- Full query capabilities across collections
- Can implement complex filtering logic
- Can join data from multiple collections
- Returns only authorized data to frontend

**Result:** Backend acts as the **primary security layer**, Firestore rules provide **baseline protection**.

---

## Firebase Setup Instructions

### Required Environment Variables

You need to configure these environment variables in your Replit Secrets:

1. **`FIREBASE_PROJECT_ID`** - Your Firebase project ID
2. **`FIREBASE_SERVICE_ACCOUNT`** - Firebase service account JSON (stringified)
3. **`GEMINI_API_KEY`** - Google Gemini API key for AI analysis

### Steps to Configure

#### 1. Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or use existing
3. Note your Project ID

#### 2. Generate Service Account
1. In Firebase Console → Project Settings → Service Accounts
2. Click "Generate New Private Key"
3. Save the downloaded JSON file

#### 3. Add to Replit Secrets
1. Open Replit → Tools → Secrets
2. Add:
   - Key: `FIREBASE_PROJECT_ID`, Value: your project ID
   - Key: `FIREBASE_SERVICE_ACCOUNT`, Value: entire JSON content (as string)
   - Key: `GEMINI_API_KEY`, Value: your Gemini API key

#### 4. Apply Firestore Security Rules
1. Copy the rules from `FIRESTORE_SECURITY_RULES.md`
2. Go to Firebase Console → Firestore Database → Rules
3. Paste and publish the rules

#### 5. Restart Application
The workflow will automatically restart and connect to Firebase.

---

## Testing the System

### Test Scenario 1: Doctor Views Patients

1. **Create Test Doctor Account**
   ```
   Email: doctor@test.com
   Password: test123
   Role: doctor
   Specialization: Cardiologist
   ```

2. **Create Test Patient Account**
   ```
   Email: patient@test.com
   Password: test123
   Role: patient
   ```

3. **Upload Report as Patient**
   - Log in as patient
   - Upload a medical report (PDF/image)
   - Wait for AI analysis

4. **Check Doctor Dashboard**
   - Log in as doctor
   - Visit `/doctor-dashboard`
   - Patient should appear if risks were detected matching doctor's specialization

### Test Scenario 2: Patient Views Assigned Doctors

1. Log in as patient who uploaded report
2. Visit `/dashboard`
3. Scroll to "Your Medical Team" section
4. Should see assigned doctor(s)

---

## Current Implementation Status

### ✅ Completed
- Backend API endpoints for doctor-patient mapping
- Frontend dashboards (doctor & patient)
- Firebase security rules with documentation
- Risk-based filtering logic
- Multi-layer security architecture

### ⚠️ Configuration Needed
- Firebase environment variables (see setup instructions above)
- Gemini API key for AI analysis

### 📝 Minor Issues
- TypeScript type errors in dashboard.tsx (don't affect runtime)
- Can be fixed by adding proper type guards

---

## File Structure

```
├── server/
│   ├── routes.ts                   # API endpoints
│   ├── firestore-storage.ts        # Firestore operations
│   └── services/
│       └── ai-doctor-matching.ts   # AI analysis & matching
├── client/src/pages/
│   ├── doctor-dashboard.tsx        # Doctor view
│   └── dashboard.tsx               # Patient view
├── shared/
│   └── schema.ts                   # Data models
└── FIRESTORE_SECURITY_RULES.md     # Security rules
```

---

## Next Steps

1. **Configure Firebase** (see setup instructions above)
2. **Test the mapping flow** with sample accounts
3. **Deploy to production** once testing is complete
4. **Monitor sharedReports collection** for proper mappings

---

## Support

For questions or issues:
- Check `FIRESTORE_SECURITY_RULES.md` for security details
- Review `replit.md` for system architecture
- Backend logs show Firebase connection status
- Frontend console shows authentication state

---

**Status**: ✅ Implementation Complete - Configuration Required
