"# ajheja1348" # 🏥 MediMindAI - Healthcare Platform

AI-powered healthcare platform for medical report analysis, medication management, and patient-doctor collaboration.

## 🚀 Quick Start

### Prerequisites

- Node.js 20+
- Firebase account (for Firestore & Authentication)
- AWS S3 account (for profile pictures)
- Google Gemini API key (for AI features)

### Installation

```bash
# Install dependencies
npm install

# Set up environment variables (copy and configure)
cp .env.example .env

# Start development server
npm run dev
```

### Environment Variables

Create a `.env` file with:

```env
# Google Gemini AI
GEMINI_API_KEY=your_gemini_api_key

# Firebase Configuration
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_APP_ID=your_app_id
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_SERVICE_ACCOUNT_PATH=./firebase-service-account.json

# AWS S3 Configuration
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_S3_BUCKET_NAME=your_bucket_name
AWS_REGION=us-east-1

# Session Secret
SESSION_SECRET=your_random_secret_key

# Server
PORT=5000
NODE_ENV=development
```

## 📚 Features

### For Patients

- 📄 Upload & analyze medical reports (PDF/Image)
- 💊 Medication management & reminders
- 📊 Health timeline tracking
- 🤖 AI-powered report interpretation
- 👨‍⚕️ Share reports with doctors
- 🔔 Medication reminders

### For Doctors

- 👥 Patient management dashboard
- 📋 Access shared medical reports
- 💬 Consultation tracking
- 📈 Patient health monitoring

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS, Radix UI
- **Backend**: Node.js, Express
- **Database**: Firestore (Firebase)
- **Storage**: AWS S3 (profile pictures)
- **AI**: Google Gemini (report analysis)
- **OCR**: Tesseract.js
- **Authentication**: Firebase Auth

## 📂 Project Structure

```
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/         # Page components
│   │   ├── hooks/         # Custom React hooks
│   │   └── lib/           # Utilities
├── server/                 # Express backend
│   ├── routes.ts          # API routes
│   ├── services/          # Business logic
│   └── s3-storage.ts      # AWS S3 integration
├── shared/                 # Shared types & schemas
└── fixtures/              # Sample data
```

## 🔧 Available Scripts

```bash
# Development
npm run dev          # Start dev server with hot reload

# Production
npm run build        # Build for production
npm start            # Run production server

# Type Checking
npm run check        # Run TypeScript type checking
```

## 📖 Documentation

- **AWS S3 Setup**: See `AWS_S3_SETUP_GUIDE.md`
- **Quick AWS Setup**: See `QUICK_AWS_SETUP.md`
- **Firestore Setup**: See `FIRESTORE_SECURITY_RULES.md`
- **DNS Fix**: See `FIRESTORE_DNS_FIX.md`
- **Doctor-Patient Mapping**: See `DOCTOR_PATIENT_MAPPING_GUIDE.md`

## 🔐 Security Notes

- Profile pictures are stored in AWS S3 with public read access
- All other data is stored securely in Firestore
- Firebase Authentication for user management
- Session-based authentication with secure cookies

## 🤝 Contributing

This is a private healthcare application. For questions or issues, contact the development team.

## 📄 License

MIT License

---

**Built with ❤️ for better healthcare**
