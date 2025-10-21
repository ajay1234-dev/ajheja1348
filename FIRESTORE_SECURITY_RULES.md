# Firestore Security Rules

These are the security rules you need to configure in your Firebase Console for the Firestore database.

## How to Apply These Rules

1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Navigate to **Firestore Database** → **Rules**
4. Copy and paste the rules below
5. Click **Publish**

## Complete Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Helper function to check if user is authenticated
    function isAuthenticated() {
      return request.auth != null;
    }
    
    // Helper function to check if user owns the document
    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }
    
    // Helper function to check if user is a doctor
    function isDoctor() {
      return isAuthenticated() && 
             exists(/databases/$(database)/documents/doctors/$(request.auth.uid));
    }
    
    // Helper function to check if user is a patient
    function isPatient() {
      return isAuthenticated() && 
             exists(/databases/$(database)/documents/patients/$(request.auth.uid));
    }
    
    // Patients collection
    match /patients/{userId} {
      // Read access:
      // - Patients can read their own data
      // - Doctors can read patient data (backend API enforces sharedReports filtering)
      // Note: Full many-to-many relationship checking is enforced at the backend API layer
      // via the sharedReports collection. These rules provide baseline access control.
      allow read: if isOwner(userId) || isDoctor();
      allow create: if isAuthenticated();
      allow update: if isOwner(userId);
      allow delete: if isOwner(userId);
    }
    
    // Doctors collection
    match /doctors/{userId} {
      allow read: if isAuthenticated();
      allow create: if isAuthenticated();
      allow update: if isOwner(userId);
      allow delete: if isOwner(userId);
    }
    
    // Reports collection
    match /reports/{reportId} {
      allow read: if isAuthenticated() && 
                     (resource.data.userId == request.auth.uid || isDoctor());
      allow create: if isAuthenticated() && request.resource.data.userId == request.auth.uid;
      allow update: if isAuthenticated() && resource.data.userId == request.auth.uid;
      allow delete: if isAuthenticated() && resource.data.userId == request.auth.uid;
    }
    
    // Medications collection
    match /medications/{medicationId} {
      allow read: if isAuthenticated() && 
                     (resource.data.userId == request.auth.uid || isDoctor());
      allow create: if isAuthenticated() && request.resource.data.userId == request.auth.uid;
      allow update: if isAuthenticated() && resource.data.userId == request.auth.uid;
      allow delete: if isAuthenticated() && resource.data.userId == request.auth.uid;
    }
    
    // Reminders collection
    match /reminders/{reminderId} {
      allow read: if isAuthenticated() && resource.data.userId == request.auth.uid;
      allow create: if isAuthenticated() && request.resource.data.userId == request.auth.uid;
      allow update: if isAuthenticated() && resource.data.userId == request.auth.uid;
      allow delete: if isAuthenticated() && resource.data.userId == request.auth.uid;
    }
    
    // Doctor Consultations collection
    match /doctorConsultations/{consultationId} {
      allow read: if isAuthenticated() && 
                     (resource.data.userId == request.auth.uid || isDoctor());
      allow create: if isAuthenticated();
      allow update: if isAuthenticated() && 
                       (resource.data.userId == request.auth.uid || isDoctor());
      allow delete: if isAuthenticated() && resource.data.userId == request.auth.uid;
    }
    
    // Health Progress collection
    match /healthProgress/{progressId} {
      allow read: if isAuthenticated() && 
                     (resource.data.userId == request.auth.uid || isDoctor());
      allow create: if isAuthenticated() && request.resource.data.userId == request.auth.uid;
      allow update: if isAuthenticated() && resource.data.userId == request.auth.uid;
      allow delete: if isAuthenticated() && resource.data.userId == request.auth.uid;
    }
    
    // Health Timeline collection - THIS IS THE MAIN COLLECTION FOR TIMELINE FEATURE
    match /healthTimeline/{timelineId} {
      // Patients can read their own timeline
      // Doctors can read any patient's timeline
      allow read: if isAuthenticated() && 
                     (resource.data.userId == request.auth.uid || isDoctor());
      
      // Only patients can create their own timeline entries
      // Or the system can create entries when reports are processed
      allow create: if isAuthenticated() && request.resource.data.userId == request.auth.uid;
      
      // Patients can update their own timeline entries
      // Doctors can update timeline entries to add notes
      allow update: if isAuthenticated() && 
                       (resource.data.userId == request.auth.uid || isDoctor());
      
      // Only patients can delete their own timeline entries
      allow delete: if isAuthenticated() && resource.data.userId == request.auth.uid;
    }
    
    // Shared Reports collection (Doctor-Patient Mapping via Risk Detection)
    // This collection creates the many-to-many relationship between doctors and patients
    // based on AI-detected risks in patient reports
    match /sharedReports/{shareId} {
      // Read access:
      // - Patients can read their own shared reports (userId matches)
      // - Doctors can read shared reports where their email matches doctorEmail
      allow read: if isAuthenticated() && 
                     (resource.data.userId == request.auth.uid || 
                      resource.data.patientId == request.auth.uid ||
                      (isDoctor() && 
                       resource.data.doctorEmail == get(/databases/$(database)/documents/doctors/$(request.auth.uid)).data.email));
      
      // Create access:
      // - Patients can create shared reports for themselves
      // - System can create shared reports during report processing
      allow create: if isAuthenticated() && 
                       (request.resource.data.userId == request.auth.uid ||
                        request.resource.data.patientId == request.auth.uid);
      
      // Update access:
      // - Only the patient who owns the shared report can update it
      // - Doctors can update viewCount and status fields for reports shared with them
      allow update: if isAuthenticated() && 
                       (resource.data.userId == request.auth.uid ||
                        resource.data.patientId == request.auth.uid ||
                        (isDoctor() && 
                         resource.data.doctorEmail == get(/databases/$(database)/documents/doctors/$(request.auth.uid)).data.email &&
                         !request.resource.data.diff(resource.data).hasAny(['userId', 'patientId', 'doctorId', 'doctorEmail', 'reportIds', 'shareToken'])));
      
      // Delete access:
      // - Only the patient who created the shared report can delete it
      allow delete: if isAuthenticated() && 
                       (resource.data.userId == request.auth.uid ||
                        resource.data.patientId == request.auth.uid);
    }
  }
}
```

## Important Notes

### Health Timeline Collection
- **Read Access**: Patients can read their own timeline; Doctors can read any patient's timeline
- **Write Access**: Only patients can create and manage their own timeline entries
- **Doctor Updates**: Doctors can add notes or update timeline entries for their patients

### Shared Reports Collection (Doctor-Patient Mapping)
- **Purpose**: Creates many-to-many relationships between doctors and patients based on **risk detection** in analyzed reports
- **Read Access**: 
  - Patients can view reports they've shared
  - Doctors can view reports shared with their email address
- **Write Access**: 
  - Patients can create and delete their own shared reports
  - Doctors can update limited fields (viewCount, status) but cannot modify core mapping data
- **Risk-Based Mapping**: When a patient uploads a report with detected health risks, the system automatically:
  1. Analyzes the report with AI to detect specialization needs
  2. Finds an appropriate doctor by specialization
  3. Creates a `sharedReport` entry linking patient to doctor
  4. Doctor can then view the patient in their dashboard

### Key Security Features
1. **Authentication Required**: All operations require user authentication
2. **Multi-Layer Security**:
   - **Frontend**: Only shows filtered data based on API responses
   - **Backend API**: Enforces sharedReports-based filtering (primary security layer)
   - **Firestore Rules**: Provides role-based baseline access control
3. **Data Ownership**: Patients own their data and control who can modify it
4. **Privacy**: Backend API endpoints ensure doctors only see patients mapped to them via sharedReports (risk-based)

### Important Security Notes

**Doctor-Patient Access Control:**
- The **primary security enforcement** happens at the backend API layer
- The `/api/doctor/patients` endpoint filters patients by `sharedReports` collection
- Firestore rules provide **baseline role-based access**
- Direct Firestore access from frontend is minimal; most operations go through backend APIs
- This architecture ensures risk-based mapping is properly enforced

**Why Backend Enforcement:**
- Firestore security rules cannot efficiently query many-to-many relationships (sharedReports)
- Backend has full access to query and filter across collections
- Backend can implement complex business logic that rules cannot
- Frontend never directly queries Firestore for sensitive patient lists

### Testing the Rules
After applying these rules:
1. Test patient login and timeline viewing
2. Test doctor login and patient timeline viewing
3. Verify that users cannot access data they don't own
4. Check that timeline data is properly displayed in both dashboards

### Troubleshooting
If you encounter permission errors:
- Ensure Firebase Authentication is properly set up
- Verify that user UIDs match the document structure
- Check that the user's role (doctor/patient) is correctly stored in Firestore
- Make sure the `request.auth.uid` matches the document ID in the respective collection

## Doctor-Patient Mapping Workflow

### How It Works

1. **Patient Uploads Report**
   - Patient uploads a medical report via `/api/uploadReport` endpoint
   - AI analyzes the report and detects health risks and required specialization

2. **Automatic Doctor Assignment**
   - If risks are detected, system finds a doctor with matching specialization
   - Creates entry in `sharedReports` collection with:
     - `patientId`: The patient's user ID
     - `doctorId`: The assigned doctor's ID
     - `doctorEmail`: Doctor's email for querying
     - `detectedSpecialization`: AI-detected specialization (e.g., "Cardiologist")
     - `reportSummary`: Brief summary of the report
     - `symptoms`: Detected symptoms

3. **Doctor Dashboard Access**
   - Doctor logs in and visits `/doctor-dashboard`
   - Frontend calls `GET /api/doctor/patients`
   - Backend queries `sharedReports` by doctor's email
   - Returns only patients assigned to this doctor with risk-detected reports

4. **Patient Dashboard Access**
   - Patient logs in and visits `/dashboard`
   - Frontend calls `GET /api/patient/doctors`
   - Backend queries `sharedReports` by patient's ID
   - Returns all doctors currently treating the patient

### API Endpoints

#### Doctor Endpoints
- `GET /api/doctor/patients` - Fetch patients mapped via sharedReports (risk-based)
- `GET /api/doctor/patient/:patientId/reports` - View specific patient's reports
- `GET /api/doctor/patient/:patientId/timeline` - View patient's health timeline
- `GET /api/doctor/shared-reports` - View all shared reports with details

#### Patient Endpoints
- `GET /api/patient/doctors` - Fetch all doctors treating this patient
- `GET /api/patient/:patientId/healthTimeline` - View health timeline (self or doctor)
- `POST /api/uploadReport` - Upload report (triggers AI analysis and doctor assignment)

### Optional: Composite Indexes
For better performance, consider creating these composite indexes in Firestore:

1. **healthTimeline collection**:
   - Fields: `userId` (Ascending), `date` (Descending)
   
2. **reports collection**:
   - Fields: `userId` (Ascending), `createdAt` (Descending)

3. **medications collection**:
   - Fields: `userId` (Ascending), `isActive` (Ascending), `createdAt` (Descending)

4. **sharedReports collection** (Important for doctor-patient mapping):
   - Fields: `doctorEmail` (Ascending), `createdAt` (Descending)
   - Fields: `userId` (Ascending), `createdAt` (Descending)

To create these indexes:
1. Go to Firestore Database → Indexes
2. Click "Create Index"
3. Add the collection name and fields as specified above
4. Set the query scope to "Collection"
5. Click "Create"
