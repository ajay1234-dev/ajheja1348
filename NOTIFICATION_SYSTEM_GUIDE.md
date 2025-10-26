# Notification System Guide

## Overview

The notification system provides real-time updates for doctor-patient assignments and approvals in the healthcare platform. This guide explains how the system works and how to use it.

## Features Implemented

### 1. **Notification Schema** (`shared/schema.ts`)

- Added `Notification` schema with types:
  - `doctor_assignment` - When AI assigns a doctor to a patient
  - `patient_approval` - When patient approves a suggested doctor
  - `doctor_approval` - When doctor approves a patient
  - `medication` - Medication reminders
  - `appointment` - Appointment reminders
  - `report` - Report processing updates

### 2. **Backend Infrastructure**

#### Storage Layer (`server/storage.ts` & `server/firestore-storage.ts`)

- `getNotification(id)` - Fetch a specific notification
- `getUserNotifications(userId)` - Get all notifications for a user
- `getUnreadNotifications(userId)` - Get unread notifications
- `createNotification(notification)` - Create a new notification
- `markNotificationAsRead(id)` - Mark notification as read
- `markAllNotificationsAsRead(userId)` - Mark all as read
- `deleteNotification(id)` - Delete a notification

#### API Endpoints (`server/routes.ts`)

- `GET /api/notifications` - Fetch all notifications
- `GET /api/notifications/unread` - Fetch unread notifications
- `PUT /api/notifications/:id/read` - Mark notification as read
- `PUT /api/notifications/read-all` - Mark all as read
- `DELETE /api/notifications/:id` - Delete a notification

### 3. **Notification Triggers**

#### When Doctor is Assigned (Upload Report Endpoint)

```javascript
// server/routes.ts - POST /api/uploadReport
await storage.createNotification({
  userId: patientId,
  type: "doctor_assignment",
  title: "Doctor Assigned",
  message: `Dr. ${doctor.firstName} ${doctor.lastName} (${doctor.specialization}) has been suggested for your care. Please approve to proceed.`,
  relatedId: sharedReport.id,
  relatedType: "shared_report",
  actionUrl: `/upload`,
  metadata: { doctorId, doctorName, specialization },
});
```

#### When Patient Approves Doctor (Approve Endpoint)

```javascript
// server/routes.ts - PUT /api/shared-reports/:id/approve
await storage.createNotification({
  userId: doctor.id,
  type: "patient_approval",
  title: "New Patient Approved",
  message: `${patient.firstName} ${patient.lastName} has approved you as their ${specialization}. You can now view their medical records.`,
  relatedId: sharedReport.id,
  relatedType: "shared_report",
  actionUrl: `/doctor-dashboard`,
  metadata: { patientId, patientName, specialization },
});
```

### 4. **Frontend Components**

#### Notification Center (`client/src/components/common/notification-center.tsx`)

- Real-time notification display
- Bell icon with unread count badge
- Click to mark as read
- "Mark all as read" button
- Click notification to navigate to action URL
- Color-coded notification types

#### Patient Dashboard (`client/src/pages/dashboard.tsx`)

- Shows assigned doctors with approval status
- Highlights pending approvals with amber color
- "Action Required" badge when approval needed
- Visual indicators:
  - 🟠 Amber card for pending approvals
  - 🟢 Green badge for approved doctors
  - 🔔 Bell icon for pending actions

#### Doctor Dashboard (`client/src/pages/doctor-dashboard.tsx`)

- **New Tab: "Pending Approvals"**
  - Shows patients awaiting approval
  - Displays detected specialization
  - Shows report summary
  - Visual amber theme for pending status
  - Badge count on tab
- **My Patients Tab**
  - Only shows approved patients
  - Full access to medical records
- **Shared Reports Tab**
  - All shared reports (pending + approved)

## User Workflows

### Patient Workflow

1. Patient uploads medical report
2. AI analyzes and detects needed specialization
3. System assigns appropriate doctor
4. **Patient receives notification**: "Doctor Assigned"
5. Patient sees notification in notification center (bell icon)
6. Patient dashboard shows pending doctor approval (amber card)
7. Patient goes to Upload Report page to approve
8. Patient approves the doctor
9. **Doctor receives notification**: "New Patient Approved"
10. Patient dashboard updates to show approved status (green badge)

### Doctor Workflow

1. AI assigns patient to doctor based on report analysis
2. Doctor logs in and sees:
   - Notification in notification center (bell icon)
   - "Pending Approvals" tab with badge count
3. Doctor clicks "Pending Approvals" tab
4. Doctor sees patient awaiting approval with:
   - Patient name and email
   - Detected specialization
   - Report summary
   - Assignment date
5. When patient approves:
   - Doctor receives notification: "New Patient Approved"
   - Patient moves to "My Patients" tab
   - Doctor can now access full medical records

## Visual Indicators

### Notification Center

- 🔴 Red badge on bell icon: Unread count
- 🔵 Blue: Medication notifications
- 🟡 Amber: Appointment notifications
- 🟢 Green: Report notifications
- 🟣 Purple: Doctor assignment
- 🔵 Blue: Patient approval

### Patient Dashboard - Assigned Doctors

- **Pending Approval**:
  - 🟠 Amber card background
  - 🟠 Amber border (2px)
  - 🟠 Amber badge: "Pending Your Approval"
  - 🔔 Bell icon
  - Text: "Go to Upload Report page to approve"
- **Approved**:
  - ⚪ Gray card background
  - 🟢 Green badge: "Approved - Can view your records"
  - 🩺 Stethoscope icon

### Doctor Dashboard - Pending Approvals Tab

- 🟠 Amber header background
- 🟠 Amber cards for each pending patient
- 🟠 Amber badge: "Awaiting Patient Approval"
- 🩺 Stethoscope icon for specialization
- 📄 File icon for report summary
- ⏰ Clock icon for assignment date
- 📋 Info box with explanation

## Database Schema

### Firestore Collection: `notifications`

```typescript
{
  id: string;
  userId: string;          // User who receives the notification
  type: "doctor_assignment" | "patient_approval" | "doctor_approval" | ...
  title: string;
  message: string;
  relatedId: string;       // ID of related entity (sharedReport, etc.)
  relatedType: "shared_report" | "report" | "medication" | "appointment"
  isRead: boolean;
  actionUrl: string;       // Where to navigate when clicked
  metadata: object;        // Additional context data
  createdAt: Date;
}
```

## API Response Examples

### GET /api/notifications

```json
[
  {
    "id": "notif-123",
    "userId": "patient-456",
    "type": "doctor_assignment",
    "title": "Doctor Assigned",
    "message": "Dr. John Smith (Cardiologist) has been suggested for your care...",
    "relatedId": "share-789",
    "relatedType": "shared_report",
    "isRead": false,
    "actionUrl": "/upload",
    "metadata": {
      "doctorId": "doc-123",
      "doctorName": "Dr. John Smith",
      "specialization": "Cardiologist"
    },
    "createdAt": "2025-10-26T10:30:00Z"
  }
]
```

### GET /api/patient/doctors

```json
[
  {
    "id": "doc-123",
    "firstName": "John",
    "lastName": "Smith",
    "email": "john.smith@hospital.com",
    "specialization": "Cardiologist",
    "profilePictureUrl": "https://...",
    "assignedDate": "2025-10-26T10:00:00Z",
    "detectedSpecialization": "Cardiologist",
    "reportSummary": "AI-detected condition: Cardiologist",
    "approvalStatus": "pending" // or "approved"
  }
]
```

## Testing the System

### Test Scenario 1: Doctor Assignment Notification

1. Login as patient
2. Upload a medical report with symptoms
3. Check notification center (bell icon) - should see "Doctor Assigned"
4. Check dashboard - doctor card should be amber with "Pending Your Approval"
5. Notification should have action URL to upload page

### Test Scenario 2: Patient Approval Notification

1. After uploading report, approve the suggested doctor
2. Login as the assigned doctor
3. Check notification center - should see "New Patient Approved"
4. Check "Pending Approvals" tab - patient should now be in "My Patients"
5. Doctor can now access patient records

### Test Scenario 3: Pending Approvals Tab

1. Login as doctor
2. Have a patient upload report (AI assigns you)
3. Go to doctor dashboard
4. Click "Pending Approvals" tab
5. Should see amber card with patient info
6. Badge count on tab shows number of pending approvals

## Firestore Security Rules

Add to `FIRESTORE_SECURITY_RULES.md`:

```javascript
// Notifications collection
match /notifications/{notificationId} {
  // Users can only read their own notifications
  allow read: if isAuthenticated() && resource.data.userId == request.auth.uid;

  // System can create notifications
  allow create: if isAuthenticated();

  // Users can update (mark as read) their own notifications
  allow update: if isAuthenticated() && resource.data.userId == request.auth.uid;

  // Users can delete their own notifications
  allow delete: if isAuthenticated() && resource.data.userId == request.auth.uid;
}
```

## Future Enhancements

1. **Push Notifications**: Integrate with Firebase Cloud Messaging
2. **Email Notifications**: Send email alerts for important notifications
3. **Notification Preferences**: Let users customize notification types
4. **Sound Alerts**: Play sound when new notification arrives
5. **Notification History**: Archive old notifications
6. **Bulk Actions**: Select multiple notifications to mark as read/delete

## Troubleshooting

### Notifications not appearing

- Check Firestore connection in Firebase console
- Verify notification was created in Firestore `notifications` collection
- Check browser console for errors
- Ensure user is logged in

### Badge count incorrect

- Invalidate React Query cache: `queryClient.invalidateQueries({ queryKey: ["/api/notifications"] })`
- Check `isRead` field in database

### Notification click not navigating

- Verify `actionUrl` is set correctly
- Check browser console for navigation errors
- Ensure routes exist in router configuration

## Summary

The notification system provides a complete workflow for doctor-patient communication:

- ✅ Real-time notifications in UI
- ✅ Backend API for notification management
- ✅ Automatic notification creation on key events
- ✅ Visual indicators for pending actions
- ✅ Separate pending approvals view for doctors
- ✅ Integration with existing approval workflow

All notifications are stored in Firestore and can be queried, marked as read, or deleted by the user.
