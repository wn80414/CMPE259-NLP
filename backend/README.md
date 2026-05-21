# Resume Tailoring Backend API

Backend service for the AI-powered resume tailoring application built with FastAPI. The backend handles authentication, resume parsing, AI-generated resume tailoring, file uploads, exporting resumes, and chat-based AI interactions.

---

# Tech Stack

* FastAPI
* Python
* REST API Architecture
* Llama AI Models
* PDF Parsing
* HTML Templates
* MongoDB / Supabase (if applicable)

---

# Installation

Install dependencies:

```bash id="t8b6ys"
pip install -r requirements.txt
```

Run the development server:

```bash id="k0p9sa"
uvicorn main:app --reload
```

Default backend server:

```plaintext id="w8m3yo"
http://localhost:8000
```

---
# Update .env.example to .env to run application

# Backend Architecture

The backend follows a modular FastAPI architecture consisting of:

* API Routes
* AI Services
* Service Routers
* Template Rendering
* Resume Processing Pipeline

The application separates API endpoints from business logic to improve maintainability and scalability.

---

# API Routes

## auth

Handles user authentication and account-related operations.

### Responsibilities

* User login
* User signup
* Session/token management
* Authentication validation

---

## chat

Handles AI chat interactions between the frontend and backend AI services.

### Responsibilities

* Receive user prompts
* Process AI requests
* Return AI-generated responses
* Resume tailoring conversations

### Key Features

* Integrates with Llama-based generation services
* Supports contextual resume assistance

---

## export

Exports resume data into downloadable formats.

### Responsibilities

* Generate formatted resumes
* Export resumes as PDF or HTML
* Render export templates

### Key Features

* Uses HTML templates for resume formatting
* Supports printable resume generation

---

## resume

Core route for resume management and processing.

### Responsibilities

* Retrieve resume data
* Update resume information
* Manage structured resume JSON

### Key Features

* Central route for frontend resume interactions
* Supports dynamic resume editing

---

## save

Handles persistent storage of user resume data.

### Responsibilities

* Save resume state
* Update existing resume records
* Auto-save support

### Key Features

* Enables persistent resume editing workflow
* Designed for real-time frontend synchronization

---

## upload

Handles file uploads and resume ingestion.

### Responsibilities

* Upload PDF resumes
* Validate uploaded files
* Trigger parsing pipeline and chunking

### Key Features

* Integrates with PDF parsing services
* Converts resumes into structured JSON data

---

# Services

## jsearch_jobs

Handles external job search integration and job data retrieval.

### Responsibilities

* Retrieve job postings from Google Jobs
* Process job descriptions
* Support resume tailoring against job requirements

### Key Features

* Provides job-specific context for AI tailoring

---

## llama_generator

AI text generation service using Llama models.

### Responsibilities

* Generate tailored resume content
* Produce AI chat responses
* Rewrite resume bullet points

### Key Features

* Core AI generation engine
* Supports contextual prompt engineering

---

## llama_parser

Processes and structures AI-generated content.

### Responsibilities

* Extract structured information
* Normalize generated resume content

### Key Features

* Converts generated text into structured formats

---

## pdf_parser

Extracts text and data from uploaded PDF resumes.

### Responsibilities

* Parse uploaded PDFs
* Extract resume content
* Clean raw text

### Key Features

* Entry point for resume ingestion pipeline
* Supports automated resume parsing

---

## resume_engine

Core business logic for resume tailoring and processing.

### Responsibilities

* Optimize resume content
* Coordinate AI workflows

### Key Features

* Central orchestration service
* Combines parsing, AI generation, and formatting

---

## text_processing

Utility service for text normalization and preprocessing.

### Responsibilities

* Clean extracted text
* Normalize formatting
* Prepare prompts for AI models

### Key Features

* Improves AI response quality
* Standardizes resume content structure

---

# Service Routers

## chat_router

Dedicated router for AI chat-related service endpoints.

### Responsibilities

* Organize chat API logic
* Separate AI communication flow
* Route prompt requests

---

## intent_router

Handles intent classification and routing logic.

### Responsibilities

* Detect user intent
* Route requests to correct AI workflows
* Support intelligent backend processing

### Key Features

* Improves AI response accuracy
* Enables dynamic workflow selection

---
# Vector Services

## vector_service

Handles vector embedding generation and semantic similarity search for Retrieval-Augmented Generation (RAG) workflows.

### Responsibilities

* Generate embeddings for resume and job description text
* Store and retrieve vectorized document chunks
* Perform semantic similarity searches
* Support contextual AI prompting workflows

### Key Features

* Enables Retrieval-Augmented Generation (RAG)
* Improves AI-generated resume tailoring accuracy
* Supports semantic search instead of keyword matching
* Provides context-aware retrieval for AI responses

### Vector Search Workflow

1. Resume is uploaded and parsed
2. Resume text is chunked into smaller sections
3. Chunks are converted into vector embeddings
4. Embeddings are stored in a vector index/database
5. Relevant chunks are retrieved using semantic similarity
6. Retrieved context is passed into AI prompts for better responses

---
# Templates

## HTML Templates

HTML templates are used for rendering exported resume documents.

### Responsibilities

* Resume formatting
* Export layout generation
* Printable document structure

### Key Features

* Supports PDF export workflows

---

# Backend Structure

```plaintext id="jjlwmn"
backend/
├── routes/
│   ├── auth.py
│   ├── chat.py
│   ├── export.py
│   ├── resume.py
│   ├── save.py
│   └── upload.py
│
├── services/
|   ├── service_routers/
│      ├── chat_router.py
│      └── intent_router.py
|   ├── vector/
│      ├── vector_service.py
│      ├── vector_search.py
│   ├── jsearch_jobs.py
│   ├── llama_generator.py
│   ├── llama_parser.py
│   ├── pdf_parser.py
│   ├── resume_engine.py
│   └── text_processing.py
│
│
├── templates/
│
├── main.py
└── requirements.txt
```

---

# Key System Features

* AI-powered resume tailoring
* PDF resume parsing
* Structured JSON resume processing
* REST API architecture
* Resume export generation
* Context-aware AI chat
* Modular FastAPI backend design

---

# Future Improvements

* RAG pipeline improvements
* Resume scoring system
* Streaming AI responses
* Docker deployment support
* Cloud deployment scalability
