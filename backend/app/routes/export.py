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

    title = ParagraphStyle(
        "Title",
        parent=styles["Heading1"],
        fontSize=18,
        spaceAfter=2,
        leading=20,
    )

    section = ParagraphStyle(
        "Section",
        parent=styles["Heading2"],
        fontSize=11,
        spaceBefore=6,
        spaceAfter=2,
        textColor=colors.black,
    )

    normal = ParagraphStyle(
        "Normal",
        parent=styles["Normal"],
        fontSize=9.5,
        leading=12,
        spaceAfter=2,
    )

    right = ParagraphStyle(
        "Right",
        parent=normal,
        fontSize=9,
        textColor=colors.black,           # was grey – now black
        alignment=2,
        spaceAfter=2,
    )

    sub = ParagraphStyle(
        "Sub",
        parent=normal,
        fontSize=9,
        textColor=colors.black,           # was grey – now black
        spaceAfter=2,
    )

    story = []

    # HEADER
    story.append(Paragraph(resume.get("name", ""), title))
    contact = " | ".join(filter(None, [
        resume.get("email"),
        resume.get("phone"),
        resume.get("linkedin"),
        resume.get("github")
    ]))
    story.append(Paragraph(clean_text(contact), normal))
    story.append(Spacer(1, 8))

    # SUMMARY
    if resume.get("summary"):
        story.append(Paragraph("SUMMARY", section))
        story.append(Paragraph(clean_text(resume["summary"]), normal))

    # EXPERIENCE
    if resume.get("experience"):
        story.append(Paragraph("EXPERIENCE", section))
        for exp in resume["experience"]:
            company = clean_text(exp.get("company", ""))
            role = clean_text(exp.get("role", ""))
            start = clean_text(exp.get("start_date", ""))
            end = clean_text(exp.get("end_date", ""))
            loc = clean_text(exp.get("location", ""))

            story.append(Paragraph(f"<b>{company}</b> — {role}", normal))

            # Location and dates on same line (right-aligned)
            date_str = f"{start} – {end}" if start or end else ""
            parts = [loc, date_str]
            line = ", ".join(filter(None, parts))
            if line:
                story.append(Paragraph(line, right))

            bullets = clean_list(exp.get("bullets", []))
            if bullets:
                story.append(ListFlowable(
                    [ListItem(Paragraph(b, normal)) for b in bullets],
                    bulletType="bullet",
                    leftIndent=14,
                ))
            story.append(Spacer(1, 6))

    # PROJECTS (inline tech stack)
    if resume.get("projects"):
        story.append(Paragraph("PROJECTS", section))
        for proj in resume["projects"]:
            name = clean_text(proj.get("name", ""))
            tech_stack = clean_list(proj.get("tech_stack", []))
            display_name = name
            if tech_stack:
                display_name += f" ({', '.join(tech_stack)})"
            story.append(Paragraph(f"<b>{display_name}</b>", normal))

            bullets = clean_list(proj.get("bullets", []))
            if bullets:
                story.append(ListFlowable(
                    [ListItem(Paragraph(b, normal)) for b in bullets],
                    bulletType="bullet",
                    leftIndent=14,
                ))
            story.append(Spacer(1, 6))

    # EDUCATION
    if resume.get("education"):
        story.append(Paragraph("EDUCATION", section))
        for edu in resume["education"]:
            school = clean_text(edu.get("school", ""))
            degree = clean_text(edu.get("degree", ""))
            loc = clean_text(edu.get("location", ""))
            grad = clean_text(edu.get("graduation_date", ""))
            gpa = clean_text(edu.get("gpa", ""))
            coursework = clean_list(edu.get("coursework", []))

            story.append(Paragraph(f"<b>{school}</b> — {degree}", normal))

            line_parts = []
            if loc:
                line_parts.append(loc)
            if grad:
                line_parts.append(grad)
            if gpa:
                line_parts.append(f"GPA: {gpa}")
            if line_parts:
                story.append(Paragraph(", ".join(line_parts), sub))

            if coursework:
                story.append(
                    Paragraph(f"<b>Coursework:</b> {', '.join(coursework)}", sub)
                )
            story.append(Spacer(1, 6))

    # SKILLS (custom labels, no gray)
    if resume.get("skills"):
        story.append(Paragraph("SKILLS", section))
        label_map = {
            "languages": "Languages",
            "cloud": "Cloud",
            "ml_ai": "ML/AI",
            "tools": "Technologies",
        }
        skill_lines = []
        for key in ["languages", "cloud", "ml_ai", "tools"]:
            items = resume["skills"].get(key, [])
            if items:
                label = label_map.get(key, key.capitalize())
                skill_lines.append(
                    f"<b>{label}:</b> {', '.join(clean_list(items))}"
                )
        if skill_lines:
            story.append(Paragraph("<br/>".join(skill_lines), normal))

    # AWARDS
    if resume.get("awards"):
        story.append(Paragraph("AWARDS", section))
        awards = clean_list(resume.get("awards", []))
        if awards:
            story.append(ListFlowable(
                [ListItem(Paragraph(a, normal)) for a in awards],
                bulletType="bullet",
                leftIndent=14,
            ))

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