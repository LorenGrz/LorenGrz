// Regenerates the "projects" block of README.md from the portfolio's resume.json,
// so the profile README always shows the same projects, in the same order, as the CV.
// Usage: node scripts/sync-projects.mjs   (Node 20+, no dependencies)
import { readFile, writeFile } from "node:fs/promises";

const RESUME_URL = "https://lorengrz.github.io/resume.json";
const README = new URL("../README.md", import.meta.url);
const START = "<!-- PROJECTS:START -->";
const END = "<!-- PROJECTS:END -->";

const landingUrl = (name) => `https://lorengrz.github.io/landing-${name.toLowerCase()}/`;

async function exists(url) {
  try {
    const res = await fetch(url, { method: "HEAD" });
    return res.ok;
  } catch {
    return false;
  }
}

async function renderProject(project) {
  const links = [`[código](${project.url})`];
  if (await exists(landingUrl(project.name))) links.unshift(`[landing ↗](${landingUrl(project.name)})`);

  // Same naming rule as the portfolio: always "Node.js/NestJS", never "NestJS" alone.
  const tags = project.keywords.map((k) => `\`${k === "NestJS" ? "Node.js/NestJS" : k}\``).join(" ");
  const highlights = project.highlights.slice(0, 2).map((h) => `- ${h}`).join("\n");

  return [`### ${project.name}`, "", `${project.description}`, "", highlights, "", tags, "", links.join(" · ")].join("\n");
}

const res = await fetch(RESUME_URL);
if (!res.ok) throw new Error(`No se pudo leer ${RESUME_URL}: ${res.status}`);
const resume = await res.json();

const blocks = await Promise.all(resume.projects.map(renderProject));
const generated = `${START}\n<!-- Generado desde ${RESUME_URL} por scripts/sync-projects.mjs. No editar a mano. -->\n\n${blocks.join("\n\n")}\n\n${END}`;

const readme = await readFile(README, "utf8");
const pattern = new RegExp(`${START}[\\s\\S]*?${END}`);
if (!pattern.test(readme)) throw new Error("README.md no tiene los marcadores PROJECTS:START/END");

const next = readme.replace(pattern, generated);
if (next === readme) {
  console.log("README.md ya está sincronizado.");
} else {
  await writeFile(README, next);
  console.log(`README.md actualizado con ${resume.projects.length} proyectos.`);
}
