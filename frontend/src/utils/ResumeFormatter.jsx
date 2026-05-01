import { ResumeSchema } from "../schema/ResumeSchema";

export const parseResumeSafe = (llmOutput) => {
  try {
    const parsed =
      typeof llmOutput === "string"
        ? JSON.parse(llmOutput)
        : llmOutput;

    return ResumeSchema.parse(parsed);
  } catch (err) {
    console.error("Zod validation failed:", err);

    // fallback so UI never breaks
    return ResumeSchema.parse({});
  }
};

export const resumeToHTML = (resume = {}) => {
  if (!resume) return "";

  return `
    <h2>${resume.name || ""}</h2>

    <p><b>Email:</b> ${resume.email || ""}</p>
    <p><b>Phone:</b> ${resume.phone || ""}</p>
    <p><b>GitHub:</b> ${resume.github || ""}</p>
    <p><b>LinkedIn:</b> ${resume.linkedin || ""}</p>

    <hr/>

    <h3>Experience</h3>
    ${(resume.experience || [])
      .map(
        (exp) => `
          <p><b>${exp.company || ""} — ${exp.role || ""}</b></p>
          ${(exp.bullets || [])
            .map((b) => `<p>• ${b}</p>`)
            .join("")}
        `
      )
      .join("")}

    <h3>Projects</h3>
    ${(resume.projects || [])
      .map(
        (p) => `
          <p><b>${p.name || ""}</b></p>
          ${(p.bullets || [])
            .map((b) => `<p>• ${b}</p>`)
            .join("")}
        `
      )
      .join("")}

    <h3>Skills</h3>
    ${(resume.skills?.languages || [])
      .map((s) => `<p>${s}</p>`)
      .join("")}
  `;
};