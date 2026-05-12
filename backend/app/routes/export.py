from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import StreamingResponse
from io import BytesIO
import re

from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer,
    ListFlowable, ListItem, Table, TableStyle
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors

from app.routes.upload import get_current_user

router = APIRouter()

# ------------------------------------------------------------
# CLEAN TEXT (fixes □ squares, emojis, broken unicode)
# ------------------------------------------------------------
def clean_text(text):
    if not text:
        return ""

    text = str(text)

    # normalize dashes / quotes
    text = (
        text.replace("–", "-")
            .replace("—", "-")
            .replace("’", "'")
            .replace("“", '"')
            .replace("”", '"')
    )

    # remove non-printable / emoji / broken glyphs
    text = re.sub(r"[^\x00-\x7F\u00A0-\uFFFF]+", "", text)

    return text.strip()


def clean_list(lst):
    if not isinstance(lst, list):
        return []
    return [clean_text(x) for x in lst if x]


# ------------------------------------------------------------
# NORMALIZE RESUME
# ------------------------------------------------------------
def normalize_resume(resume: dict) -> dict:
    return {
        "name": clean_text(resume.get("name", "")) or "Unnamed",
        "email": clean_text(resume.get("email", "")),
        "phone": clean_text(resume.get("phone", "")),
        "linkedin": clean_text(resume.get("linkedin", "")),
        "github": clean_text(resume.get("github", "")),
        "summary": clean_text(resume.get("summary", "")),
        "experience": resume.get("experience", []),
        "projects": resume.get("projects", []),
        "education": resume.get("education", []),
        "skills": resume.get("skills", {}),
    }


# ------------------------------------------------------------
# BUILD PDF (JAKES STYLE)
# compact, tight spacing, right-aligned dates
# ------------------------------------------------------------
def build_pdf(resume: dict) -> BytesIO:
    buffer = BytesIO()

    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=40,
        leftMargin=40,
        topMargin=36,
        bottomMargin=36,
    )

    styles = getSampleStyleSheet()

    # ---------------- Title (compact)
    title = ParagraphStyle(
        "Title",
        parent=styles["Heading1"],
        fontSize=18,
        spaceAfter=2,
        leading=20,
    )

    # ---------------- Section headers (tight like Jake template)
    section = ParagraphStyle(
        "Section",
        parent=styles["Heading2"],
        fontSize=11,
        spaceBefore=6,
        spaceAfter=2,
        textColor=colors.black,
    )

    # ---------------- Body
    normal = ParagraphStyle(
        "Normal",
        parent=styles["Normal"],
        fontSize=9.5,
        leading=12,
        spaceAfter=2,
    )

    story = []

    # =========================================================
    # HEADER (center-like compact block)
    # =========================================================
    story.append(Paragraph(resume["name"], title))

    contact = " | ".join(filter(None, [
        resume.get("email"),
        resume.get("phone"),
        resume.get("linkedin"),
        resume.get("github")
    ]))

    story.append(Paragraph(clean_text(contact), normal))
    story.append(Spacer(1, 8))

    # =========================================================
    # SUMMARY
    # =========================================================
    if resume["summary"]:
        story.append(Paragraph("SUMMARY", section))
        story.append(Paragraph(clean_text(resume["summary"]), normal))
    # =========================================================
    # EXPERIENCE (compact, right-aligned dates)
    # =========================================================
    if resume["experience"]:
        story.append(Paragraph("EXPERIENCE", section))

        for exp in resume["experience"]:
            role = clean_text(exp.get("role"))
            company = clean_text(exp.get("company"))
            start = clean_text(exp.get("start_date"))
            end = clean_text(exp.get("end_date"))

            # ----------------------------------------------------
            # LINE 1: ROLE - COMPANY (like project title)
            # ----------------------------------------------------
            story.append(
                Paragraph(
                    f"<b>{role}</b> - {company}",
                    normal
                )
            )

            # ----------------------------------------------------
            # LINE 2: DATES (INDENTED RIGHT STYLE)
            # ----------------------------------------------------
            story.append(
                Paragraph(
                    f"<font size=9>{start} - {end}</font>",
                    ParagraphStyle(
                        "date",
                        parent=normal,
                        alignment=2,  # RIGHT
                        textColor=colors.grey,
                        fontSize=9,
                        spaceAfter=2,
                    )
                )
            )

            # ----------------------------------------------------
            # BULLETS (SAME AS PROJECTS)
            # ----------------------------------------------------
            bullets = clean_list(exp.get("bullets", []))

            if bullets:
                story.append(ListFlowable(
                    [ListItem(Paragraph(b, normal)) for b in bullets],
                    bulletType="bullet",
                    leftIndent=14,
                ))

            story.append(Spacer(1, 6))

    # =========================================================
    # PROJECTS (compact)
    # =========================================================
    if resume["projects"]:
        story.append(Paragraph("PROJECTS", section))

        for proj in resume["projects"]:
            story.append(Paragraph(f"<b>{clean_text(proj.get('name'))}</b>", normal))

            bullets = clean_list(proj.get("bullets", []))
            if bullets:
                story.append(ListFlowable(
                    [ListItem(Paragraph(b, normal)) for b in bullets],
                    bulletType="bullet",
                    leftIndent=14,
                ))

    # =========================================================
    # EDUCATION (tight)
    # =========================================================
    if resume["education"]:
        story.append(Paragraph("EDUCATION", section))

        for edu in resume["education"]:
            line = f"{clean_text(edu.get('degree'))} - {clean_text(edu.get('school'))}"
            story.append(Paragraph(line, normal))

    # =========================================================
    # SKILLS (inline, compact)
    # =========================================================
    if resume["skills"]:
        story.append(Paragraph("SKILLS", section))

        skill_text = ", ".join(
            f"{clean_text(k)}: {', '.join(clean_list(v))}"
            for k, v in resume["skills"].items()
        )

        story.append(Paragraph(skill_text, normal))

    doc.build(story)
    buffer.seek(0)
    return buffer


# ------------------------------------------------------------
# ENDPOINT
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
    pdf_buffer = build_pdf(safe_resume)

    filename = f"{safe_resume.get('name', 'resume')}.pdf".replace(" ", "_")

    return StreamingResponse(
        pdf_buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'}
    )