from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routes import upload, auth

app = FastAPI(title="AI Resume Reviewer")

# CORS (React frontend support)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routes
app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(upload.router, prefix="/upload", tags=["upload"])
