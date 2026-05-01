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
    return ResumeSchema.parse({});
  }
};

const listToHTML = (arr = [], emptyMsg = "") => {
  if (!arr || arr.length === 0) {
    return emptyMsg ? `<p style="opacity:0.5">${emptyMsg}</p>` : "";
  }
  return arr.map((item) => `<p>• ${item}</p>`).join("");
};

const keyValue = (label, value) => {
  if (!value) return "";
  return `<p><b>${label}:</b> ${value}</p>`;
};

export const resumeToHTML = (resume = {}) => {
  if (!resume || typeof resume !== "object") return "";

  return `
    <h2>${resume.name || "Unnamed Resume"}</h2>

    ${keyValue("Email", resume.email)}
    ${keyValue("Phone", resume.phone)}
    ${keyValue("GitHub", resume.github)}
    ${keyValue("LinkedIn", resume.linkedin)}

    <hr/>

    <h3>Experience</h3>
    ${(resume.experience || [])
      .map((exp) => `
        <p><b>${exp.company || ""} — ${exp.role || ""}</b></p>
        ${listToHTML(exp.bullets)}
      `)
      .join("") || `<p style="opacity:0.5">No experience provided</p>`}

    <h3>Projects</h3>
    ${(resume.projects || [])
      .map((p) => `
        <p><b>${p.name || ""}</b></p>
        ${listToHTML(p.bullets)}
      `)
      .join("") || `<p style="opacity:0.5">No projects provided</p>`}

    <hr/>

    <h3>Skills</h3>
    ${Object.entries(resume.skills || {})
      .map(([key, arr]) => `
        <p><b>${key.toUpperCase()}</b></p>
        ${listToHTML(arr, "Missing " + key + " skills")}
      `)
      .join("")}

    <h3>Awards</h3>
    ${listToHTML(
      resume.awards,
      "No awards listed — add achievements or honors"
    )}
  `;
};