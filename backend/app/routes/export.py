from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import StreamingResponse
from jinja2 import Environment, FileSystemLoader
from io import BytesIO
from xhtml2pdf import pisa

from app.routes.upload import get_current_user

router = APIRouter()

# ------------------------------------------------------------
# Template setup
# ------------------------------------------------------------
TEMPLATE_DIR = "app/templates"

env = Environment(
    loader=FileSystemLoader(TEMPLATE_DIR),
    autoescape=True
)

# ------------------------------------------------------------
# Normalize resume safely
# ------------------------------------------------------------
def normalize_resume(resume: dict) -> dict:
    return {
        "name": resume.get("name", ""),
        "email": resume.get("email", ""),
        "phone": resume.get("phone", ""),
        "linkedin": resume.get("linkedin", ""),
        "github": resume.get("github", ""),
        "summary": resume.get("summary", ""),
        "experience": resume.get("experience", []),
        "projects": resume.get("projects", []),
        "education": resume.get("education", []),
        "skills": resume.get("skills", {}),
        "awards": resume.get("awards", []),
    }

# ------------------------------------------------------------
# HTML → PDF (IN MEMORY)
# ------------------------------------------------------------
def html_to_pdf(html: str) -> BytesIO:
    buffer = BytesIO()

    result = pisa.CreatePDF(
        src=html,
        dest=buffer,
    )

    if result.err:
        raise HTTPException(
            status_code=500,
            detail="PDF generation failed (invalid HTML/CSS for xhtml2pdf)"
        )

    buffer.seek(0)
    return buffer

# ------------------------------------------------------------
# PDF endpoint
# ------------------------------------------------------------
@router.post("/")
async def export_resume_pdf(
    request: Request,
    user_id: str = Depends(get_current_user)
):
    resume = await request.json()

    if not isinstance(resume, dict):
        raise HTTPException(status_code=400, detail="Invalid payload")

    safe_resume = normalize_resume(resume)

    template = env.get_template("resume.html")
    html = template.render(resume=safe_resume)

    pdf_buffer = html_to_pdf(html)

    filename = f"{safe_resume.get('name', 'resume')}.pdf".replace(" ", "_")

    return StreamingResponse(
        pdf_buffer,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"'
        }
    )