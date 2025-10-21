# Medical Report Interpretation Platform

## Overview
This platform transforms complex medical documents (PDFs, images) into patient-friendly explanations using AI-powered analysis. It provides plain language summaries, medication management, and health tracking, aiming to empower patients, simplify medical understanding, and promote proactive health management. The vision is to be a comprehensive digital health companion that reduces the need for repeated doctor visits.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### UI/UX Decisions
- **Design System**: Consistent, accessible design via shadcn/ui based on Radix UI primitives.
- **Data Visualization**: Health trend visualization using Recharts.
- **Form Management**: Robust form handling with React Hook Form and Zod validation.
- **Accessibility**: Web Speech API for text-to-speech functionality.

### Technical Implementations
- **Frontend**: React with TypeScript (Vite), Tailwind CSS, Wouter for routing, TanStack Query for state management.
- **Backend**: Node.js with Express, Drizzle ORM for PostgreSQL, Multer for file uploads.
- **OCR**: Tesseract.js for optical character recognition from uploaded documents.
- **AI Integration**: Google Gemini 2.5 models for medical report analysis, plain language generation, and intelligent risk-based doctor matching. This includes structured extraction, abnormality detection, and specialization identification.
- **Authentication**: Email/password (bcrypt), Firebase/Google authentication with server-side JWT verification, role-based access control ('patient', 'doctor').
- **Security**: Multi-layer security model with backend API as the primary enforcement, type validation and size limits on uploads, Drizzle ORM for SQL injection prevention, and Firebase security rules.
- **Multilingual Support**: Translation services for medical explanations.

### Feature Specifications
- **User Management**: Profiles for Patients and Doctors, secure authentication, account deletion with comprehensive data cleanup.
- **Report Management**: Uploads of PDFs, JPGs, PNGs; AI analysis of reports to generate summaries and detect health risks.
- **Medication Management**: Prescription tracking (dosage, frequency, active status).
- **Reminders**: Medication and appointment scheduling.
- **Health Timeline**: Historical health data tracking for trend analysis.
- **Doctor-Patient Mapping**: AI-driven assignment of patients to specialist doctors based on detected health risks, creating `sharedReports` entries for controlled access. Doctors can only view patients assigned via AI.
- **Profile Management**: Editable user profiles with role-specific fields (e.g., specialization for doctors, age/gender for patients).

### System Design Choices
- **Database**: PostgreSQL (via Neon serverless) as the primary relational database, supplemented by Firebase Firestore for certain collections.
- **ORM**: Drizzle ORM.
- **Production Readiness**: Configured for production deployment with environment-based settings and prepared for Supabase integration.

## External Dependencies

### Core Infrastructure
- **Database**: PostgreSQL (via Neon serverless), Firebase Firestore.
- **ORM**: Drizzle ORM, drizzle-kit.
- **Authentication**: bcrypt, express-session, Firebase Authentication.

### AI & Processing
- **AI Models**: Google Gemini API (Gemini 2.5 models).
- **OCR**: Tesseract.js.
- **PDF Processing**: pdf-parse.

### Frontend Libraries
- **UI Components**: Radix UI primitives, shadcn/ui.
- **Data Fetching**: TanStack React Query.
- **Charting**: Recharts.
- **Form Handling**: React Hook Form, Zod.
- **Styling**: Tailwind CSS, class-variance-authority.