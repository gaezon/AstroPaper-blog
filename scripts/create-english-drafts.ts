#!/usr/bin/env tsx

import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";

const BLOG_BASE = "src/data/blog";
const EN_BASE = join(BLOG_BASE, "en");

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
    const fm = parts[1];
    const body = parts.slice(2).join("\n---\n");
    return { frontmatter: fm, body };
  }
  return { frontmatter: "", body: content };
}

function buildEnglishDraft(frontmatter: string, body: string) {
  // 朴素替换：标记为英文草稿，保留原始标签以便后续人工修订
  const lines = frontmatter.split(/\r?\n/);
  const kv = new Map<string, string>();
  for (const line of lines) {
    const idx = line.indexOf(":");
    if (idx > -1) {
      const k = line.slice(0, idx).trim();
      const v = line.slice(idx + 1).trim();
      kv.set(k, v);
    }
  }

  const cnTitle = kv.get("title")?.replace(/^"|"$/g, "") ?? "";
  const cnDesc = kv.get("description")?.replace(/^"|"$/g, "") ?? "";

  const out: string[] = [];
  out.push("---");
  out.push(`author: ${kv.get("author") ?? "\"Gaazeon\""}`);
  out.push(`pubDatetime: ${kv.get("pubDatetime") ?? new Date().toISOString()}`);
  if (kv.has("modDatetime")) out.push(`modDatetime: ${kv.get("modDatetime")}`);
  out.push(`title: "TODO: Translate — ${cnTitle}"`);
  out.push(`featured: ${kv.get("featured") ?? "false"}`);
  out.push(`draft: true`);
  if (kv.has("tags")) out.push(`tags: ${kv.get("tags")}`);
  if (kv.has("ogImage")) out.push(`ogImage: ${kv.get("ogImage")}`);
  out.push(`description: "TODO: Translate — ${cnDesc}"`);
  if (kv.has("canonicalURL")) out.push(`canonicalURL: ${kv.get("canonicalURL")}`);
  if (kv.has("hideEditPost")) out.push(`hideEditPost: ${kv.get("hideEditPost")}`);
  if (kv.has("timezone")) out.push(`timezone: ${kv.get("timezone")}`);
  out.push(`locale: "en"`);
  out.push(`originalTitle: "${cnTitle}"`);
  out.push("---\n");
  out.push("<!-- TODO: Translate body content below into English -->\n");
  out.push(body);

  return out.join("\n");
}

function main() {
  ensureDir(EN_BASE);
  const entries = readdirSync(BLOG_BASE, { withFileTypes: true });

  let created = 0;
  for (const ent of entries) {
    if (ent.isDirectory()) {
      if (ent.name === "en" || ent.name.startsWith("_")) continue;
      // 处理子目录（浅层）
      const sub = join(BLOG_BASE, ent.name);
      const files = readdirSync(sub, { withFileTypes: true });
      for (const f of files) {
        if (f.isFile() && isMarkdown(f.name)) {
          const src = join(sub, f.name);
          const dst = join(EN_BASE, f.name);
          if (!existsSync(dst)) {
            const { frontmatter, body } = readFrontmatter(src);
            const out = buildEnglishDraft(frontmatter, body);
            writeFileSync(dst, out, "utf-8");
            created++;
            console.log(`Created EN draft: ${relative(process.cwd(), dst)}`);
          }
        }
      }
      continue;
    }
    if (ent.isFile() && isMarkdown(ent.name)) {
      const src = join(BLOG_BASE, ent.name);
      const dst = join(EN_BASE, ent.name);
      if (!existsSync(dst)) {
        const { frontmatter, body } = readFrontmatter(src);
        const out = buildEnglishDraft(frontmatter, body);
        writeFileSync(dst, out, "utf-8");
        created++;
        console.log(`Created EN draft: ${relative(process.cwd(), dst)}`);
      }
    }
  }

  console.log(created > 0 ? `\n✅ ${created} draft(s) created.` : "No drafts needed.");
}

main();

