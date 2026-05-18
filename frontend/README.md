# Resume Tailoring Frontend

Frontend application for an AI-powered resume tailoring system built with React and Vite. This application allows users to upload resumes, edit structured resume data, preview resume content, and interact with an AI assistant for resume optimization and job-specific tailoring.

---

# Tech Stack

* React
* Vite
* Material UI (MUI)
* Axios
* React Router

---

# Environment Variables

Create a `.env` file in the root frontend directory:

```env
VITE_APP_URL=http://localhost:8000
```

This variable specifies the backend API URL used by the frontend application.

---

# Installation

Install dependencies:

```bash
npm install
```

Run the development server:

```bash
npm run dev
```

Build for production:

```bash
npm run build
```

Preview production build:

```bash
npm run preview
```

---

# Application Pages

## Login Page

Allows users to authenticate and access their saved resume data and AI features.

## Signup Page

Allows new users to create an account for accessing the application.

## Resume Page

Main dashboard page where users can:

* Upload resumes
* Edit structured resume JSON data
* Preview formatted resume content
* Use AI chat for resume tailoring suggestions
* Save and manage resume information

---

# Components

## PageNavBar

Navigation bar component used throughout the application for routing and page navigation.

### Responsibilities

* Navigation between pages
* User interface layout
* Application header controls

---

## JsonPreview

Displays resume data in a readable formatted structure.

### Responsibilities

* Render structured resume information
* Display updated resume content in real time
* Provide visual feedback for edited data

---

## JsonEditor

Interactive editor for modifying structured JSON resume data.

### Responsibilities

* Edit resume fields dynamically
* Update resume data state
* Handle structured resume modifications

---

## AI Chat

Chat interface connected to the backend AI service.

### Responsibilities

* Send prompts to AI backend
* Display AI-generated resume suggestions
* Assist with job-specific resume tailoring
* Provide resume improvement recommendations

---

# Project Structure

```plaintext
src/
├── components/
│   ├── PageNavBar
│   ├── JsonPreview
│   ├── JsonEditor
│   └── AIChat
│
├── pages/
│   ├── Login
│   ├── Signup
│   └── ResumePage
│
├── services/
├── hooks/
├── App.jsx
└── main.jsx
```

---

# Features

* Resume upload support
* Structured JSON resume editing
* Real-time resume preview
* AI-powered resume tailoring
* Backend API integration
* Responsive React UI

---

# Backend Integration

The frontend communicates with a FastAPI backend through REST API endpoints for:

* Resume parsing
* AI prompt processing
* Resume tailoring
* Data storage and retrieval

---

# Future Improvements

* Auto-save functionality
* Improved AI personalization
* Resume scoring system
* Mobile responsiveness enhancements
