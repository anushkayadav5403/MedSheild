# SENTINEL Health Passport System

A comprehensive digital health passport system that allows users to securely store and share their medical information via QR codes.

## Features

### 🔐 Authentication
- **Phone OTP Authentication** - Secure login with phone number verification
- **Google Sign-In** - Quick authentication with Google account
- **Email/Password** - Traditional email-based authentication

### 📋 9-Chapter Health Interview
1. **Who You Are** - Basic demographic information
2. **Blood Type** - Blood type and Rh factor
3. **Allergies** - Comprehensive allergy tracking
4. **Medical Conditions** - Chronic conditions and medical history
5. **Medications** - Current medications with dosage and frequency
6. **Emergency Contacts** - Multiple emergency contact management
7. **Critical Directives** - Organ donation, DNR, and advance directives
8. **Pandemic Record** - Vaccination history and COVID-19 test results
9. **Final Review** - Complete profile review before submission

### 🔒 Privacy Controls
- **Three Privacy Levels:**
  - **Full** - Complete medical profile
  - **Emergency** - Critical information only (allergies, blood type, DNR, emergency contacts)
  - **Medical** - Medical professional access (conditions, medications, vaccinations)

### 📱 QR Code Generation
- Generate unique QR codes for each privacy level
- Download QR codes as PNG images
- Regenerate QR codes for security
- Hide/show QR code functionality

### 🏥 Healthcare Provider Features
- Instant access to patient information via QR scan
- Prominent display of critical information (allergies, blood type)
- Emergency contact quick access
- Vaccination and test history

## Installation

### Prerequisites
- Node.js 18+ and npm
- Firebase account (for authentication and database)

### Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd <project-directory>
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure Firebase**
   - Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)
   - Enable Authentication methods:
     - Email/Password
     - Google Sign-In
     - Phone Authentication
   - Create a Firestore database
   - Copy your Firebase configuration

4. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and add your Firebase configuration:
   ```env
   VITE_FIREBASE_API_KEY=your_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Access the application**
   - Open your browser to `http://localhost:8080`
   - Navigate to the SENTINEL landing page
   - Create an account and complete the health interview

## Project Structure

```
src/
├── components/
│   └── passport/
│       ├── Chapter1WhoYouAre.tsx
│       ├── Chapter2Blood.tsx
│       ├── Chapter3Allergies.tsx
│       ├── Chapter4Conditions.tsx
│       ├── Chapter5Medications.tsx
│       ├── Chapter6EmergencyContacts.tsx
│       ├── Chapter7CriticalDirectives.tsx
│       ├── Chapter8Pandemic.tsx
│       └── Chapter9Review.tsx
├── lib/
│   ├── firebase.ts              # Firebase configuration
│   └── passportStore.ts         # Zustand state management
├── routes/
│   ├── index.tsx                # Landing page
│   ├── auth/
│   │   ├── login.tsx            # Login page
│   │   └── register.tsx         # Registration page
│   └── passport/
│       ├── interview.tsx        # 9-chapter interview
│       └── view.tsx             # Passport view with QR code
```

## Technologies Used

- **React** - UI framework
- **TypeScript** - Type safety
- **TanStack Router** - Routing
- **Firebase** - Authentication and database
- **Zustand** - State management
- **shadcn/ui** - UI components
- **Tailwind CSS** - Styling
- **qrcode.react** - QR code generation

## Security Features

- Firebase Authentication for secure user management
- Client-side data encryption
- Privacy-level based data sharing
- Unique QR code IDs with regeneration capability
- Secure state persistence with Zustand

## Usage

### For Patients

1. **Create Account**
   - Visit the landing page
   - Click "Get Started" or "Sign In"
   - Choose authentication method (Email, Phone, or Google)

2. **Complete Health Interview**
   - Fill out all 9 chapters
   - Review your information in Chapter 9
   - Submit to generate your health passport

3. **View Your Passport**
   - Access your passport with QR code
   - Choose privacy level (Full, Emergency, or Medical)
   - Download or share QR code with healthcare providers

4. **Update Information**
   - Click "Edit" to return to the interview
   - Update any chapter
   - Changes are saved automatically

### For Healthcare Providers

1. **Scan QR Code**
   - Use any QR code scanner
   - Access patient information based on privacy level
   - View critical information prominently displayed

2. **Emergency Access**
   - Emergency QR codes show:
     - Allergies
     - Blood type
     - DNR status
     - Emergency contacts

## Future Enhancements

- [ ] Pandemic intelligence integration with outbreak alerts
- [ ] Offline PWA support with service workers
- [ ] Multi-language support
- [ ] Healthcare provider portal
- [ ] Access log tracking
- [ ] Biometric authentication
- [ ] Apple Health / Google Fit integration
- [ ] Medication reminders
- [ ] Appointment scheduling

## License

[Your License Here]

## Support

For issues or questions, please contact [your-email@example.com]
