#!/usr/bin/env tsx

import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";
import YAML from "yaml";

const BLOG_BASE = "src/data/blog";
const EN_BASE = join(BLOG_BASE, "en");
const FORCE = process.argv.includes("--force");

function isMarkdown(file: string) {
  return file.toLowerCase().endsWith(".md");
}

function ensureDir(dir: string) {
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
}

function readFrontmatter(filePath: string) {
  const content = readFileSync(filePath, "utf-8");
  const parts = content.split(/^---\s*$/m);
  if (parts.length >= 3) {
    const frontmatter = parts[1];
    const body = parts.slice(2).join("\n---\n");
    return { frontmatter, body };
  }
  return { frontmatter: "", body: content };
}

function normalizeDate(value: unknown): string | undefined {
  if (!value) return undefined;
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "string" && value.trim().length > 0) return value;
  return undefined;
}

function toArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map(item => String(item));
  }
  return [];
}

function buildEnglishDraft(frontmatter: string, body: string) {
  const data = frontmatter ? YAML.parse(frontmatter) ?? {} : {};

  const cnTitle = data.title ? String(data.title) : "";
  const cnDesc = data.description ? String(data.description) : "";

  const english: Record<string, unknown> = {};
  english.author = data.author ?? "Gaazeon";
  english.pubDatetime = normalizeDate(data.pubDatetime) ?? new Date().toISOString();
  const mod = normalizeDate(data.modDatetime);
  if (mod) english.modDatetime = mod;
  english.title = `TODO: Translate — ${cnTitle}`;
  english.featured = Boolean(data.featured);
  english.draft = true;
  english.tags = toArray(data.tags);
  if (data.ogImage) english.ogImage = data.ogImage;
  english.description = `TODO: Translate — ${cnDesc}`;
  if (data.canonicalURL) english.canonicalURL = data.canonicalURL;
  if (typeof data.hideEditPost !== "undefined") english.hideEditPost = data.hideEditPost;
  if (data.timezone) english.timezone = data.timezone;
  english.locale = "en";
  english.originalTitle = cnTitle;

  const yaml = YAML.stringify(english, { indent: 2 }).trimEnd();
  const bodyContent = body.startsWith("\n") ? body : `\n${body}`;

  return `---\n${yaml}\n---\n\n<!-- TODO: Translate body content below into English -->${bodyContent}`;
}

function main() {
  ensureDir(EN_BASE);
  const entries = readdirSync(BLOG_BASE, { withFileTypes: true });

  let created = 0;
  for (const ent of entries) {
    if (ent.isDirectory()) {
      if (ent.name === "en" || ent.name.startsWith("_")) continue;
      const sub = join(BLOG_BASE, ent.name);
      const files = readdirSync(sub, { withFileTypes: true });
      for (const f of files) {
        if (f.isFile() && isMarkdown(f.name)) {
          const src = join(sub, f.name);
          const dst = join(EN_BASE, f.name);
          if (existsSync(dst) && !FORCE) continue;
          const { frontmatter, body } = readFrontmatter(src);
          const out = buildEnglishDraft(frontmatter, body);
          writeFileSync(dst, out, "utf-8");
          created++;
          console.log(`Created EN draft: ${relative(process.cwd(), dst)}`);
        }
      }
      continue;
    }
    if (ent.isFile() && isMarkdown(ent.name)) {
      const src = join(BLOG_BASE, ent.name);
      const dst = join(EN_BASE, ent.name);
      if (existsSync(dst) && !FORCE) continue;
      const { frontmatter, body } = readFrontmatter(src);
      const out = buildEnglishDraft(frontmatter, body);
      writeFileSync(dst, out, "utf-8");
      created++;
      console.log(`Created EN draft: ${relative(process.cwd(), dst)}`);
    }
  }

  console.log(created > 0 ? `\n✅ ${created} draft(s) created.` : "No drafts needed.");
}

main();
