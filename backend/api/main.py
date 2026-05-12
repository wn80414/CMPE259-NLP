from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.routes import upload, auth, chat, resume, save, export

app = FastAPI(title="AI Resume Reviewer")
print("Allowing CORS for frontend at: " + settings.frontend_host + ":" + str(settings.frontend_port))
# CORS (React frontend support)
app.add_middleware(
    CORSMiddleware,
    
    allow_origins=["http://localhost:5173", "https://cmpe-259-nlp.vercel.app"],

    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routes
app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(upload.router, prefix="/upload", tags=["upload"])
app.include_router(chat.router, prefix="/chat", tags=["chat"])
app.include_router(resume.router, prefix="/resume", tags=["resume"])
app.include_router(save.router, prefix="/save", tags=["save"])
app.include_router(export.router, prefix="/export", tags=["export"])