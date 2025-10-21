# Healthcare Web App — Frontend Integration Guide (Replit AI Prompt)

This README contains a complete prompt to be used in Replit AI to build the **React frontend integration** for your healthcare project.

---

## 🎯 **Objective**

Integrate the existing backend APIs (Node.js + Express + Firebase) with your React frontend for **patients** and **doctors** dashboards.

Your backend already includes:

- AI-based doctor mapping
- Many-to-many doctor–patient relationship
- Firestore collections: `doctors`, `patients`, `reports`, `sharedReports`, `healthTimeline`

---

## 🧠 **Replit AI Prompt**

```
You are building the React frontend for a healthcare web app that already has:
- A Firebase backend with collections: doctors, patients, reports, sharedReports, and healthTimeline.
- A Node.js + Express backend that exposes APIs for uploading reports, AI-based doctor mapping, and fetching doctor–patient relationships.

Goal:
Integrate the new backend APIs into the existing React dashboard for both patients and doctors.

Functional requirements:

1. **Patient Dashboard Features**
   - After login, display:
     - Patient name and age (from Firebase)
     - List of all uploaded reports
     - Assigned doctors (fetched from `/patient/:patientId/doctors`)
     - Health timeline (from `/patient/:patientId/healthTimeline`)
   - Include an “Upload Report” form:
     - Upload file (PDF/image)
     - Enter symptoms/summary and description
     - On submit → call backend `/uploadReport`
     - Show success message and update the list dynamically

2. **Doctor Dashboard Features**
   - After login, display:
     - Doctor name and specialization
     - List of assigned patients (from `/doctor/:doctorId/patients`)
     - For each patient, show:
       - Name, age
       - Last report summary
       - Link to view full report
   - Add simple navigation between sections (Patients | Reports | Profile)

3. **API Integration**
   - Use Axios for backend calls.
   - Use environment variable `REACT_APP_API_URL` to set the backend URL.
   - Include loading and error handling for all API calls.
   - Use React Router for navigation between dashboard sections.

4. **Folder structure**
   - `components/PatientDashboard.jsx`
   - `components/DoctorDashboard.jsx`
   - `components/UploadReportForm.jsx`
   - `api/api.js` → central Axios instance
   - `pages/Login.jsx`, `pages/Register.jsx`, and `App.jsx` for routing

5. **Behavior**
   - When a patient uploads a new report:
     - Call `/uploadReport`
     - The backend automatically detects the correct doctor specialization
     - UI shows “Report uploaded and assigned to Dr. [Name] (Specialization)”
   - When a doctor logs in:
     - Dashboard updates dynamically with newly assigned patients from sharedReports.

6. **Styling and Navigation**
   - Use React Router v6 for routing.
   - Use Tailwind CSS or SCSS (whichever already exists in the project).
   - Create a responsive navigation bar with links:
     - For Patients: Dashboard | Health Timeline | Reports
     - For Doctors: Patients | Reports | Profile

7. **Optional Enhancement**
   - Add a small toast notification (using react-toastify) when a report is successfully uploaded or a new doctor–patient mapping is created.

Goal:
Build a functional and visually clean React frontend that connects seamlessly to the new backend routes, enabling report uploads, doctor mapping, and dynamic health timeline updates without modifying the Firestore structure.
```

---
