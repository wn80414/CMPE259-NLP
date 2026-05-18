# CMPE259-NLP: SWE Resume Reviewer Application

An AI-powered web application designed to analyze, critique, and optimize Software Engineering resumes. Leveraging **Llama 3-8b** for rapid initial analysis and **Llama 3-70b** for deep, comprehensive feedback, this tool helps candidates align their resumes with industry standards and specific job descriptions.

---

###  Tech Stack

| Component | Technology | Description |
| :--- | :--- | :--- |
| **Backend** | **FastAPI** | Modern, fast (high-performance) web framework for building APIs with Python. |
| **Frontend** | **React** | Component-based UI library for a dynamic, seamless user experience. |
| **AI Models** | **Llama 3-8b & 70b** | State-of-the-art Large Language Models used for intent parsing and deep resume evaluation. |

---

##  Getting Started

### Prerequisites
* Python 3.11
* Node.js (v18+ recommended)
* npm or yarn

---

### 🔧 Backend Setup (FastAPI)

1. **Navigate to the backend directory:**
   ```bash
   cd backend
   

2. **Create and activate a virtual environment:**
   ```bash
   # MacOS/Linux
   python3 -m venv venv
   source venv/bin/activate

   # Windows
   python -m venv venv
   venv\Scripts\activate
   


3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   


4. **Run the development server:**
   ```bash
   uvicorn main:app --reload
   

   >  **Note:** The backend will typically run on `http://127.0.0.1:8000`. You can view the interactive API documentation at `http://127.0.0.1:8000/docs`.

---

###  Frontend Setup (React)

1. **Navigate to the frontend directory:**
   ```bash
   cd frontend
   


2. **Install the node modules:**
   ```bash
   npm install
   


3. **Start the local development server:**
   ```bash
   npm start

   >  **Note:** The frontend will typically launch on `http://localhost:3000`.
