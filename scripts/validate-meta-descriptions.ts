#!/usr/bin/env tsx

import fs from "node:fs";
import path from "node:path";
import { isPostFile } from "../src/utils/post-extensions";

const SCRIPT_DIR = import.meta.dirname;

// SEO best practice: Meta description should be 150-160 characters
const MIN_LENGTH = 120;
const MAX_LENGTH = 160;
const OPTIMAL_LENGTH = 155;

// Type definitions
interface ValidationIssue {
  file: string;
  issue: string;
  description?: string;
  length?: number;
  severity: "error" | "warning" | "good";
}

interface Colors {
  red: string;
  green: string;
  yellow: string;
  blue: string;
  reset: string;
  bold: string;
}

// Color output
const colors: Colors = {
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  reset: "\x1b[0m",
  bold: "\x1b[1m",
};

function colorize(text: string, color: keyof Colors): string {
  return `${colors[color]}${text}${colors.reset}`;
}

function checkMarkdownFiles(): boolean {
  const blogDir = path.join(SCRIPT_DIR, "../src/data/blog");
  const staticPages: string[] = [
    path.join(SCRIPT_DIR, "../src/pages/about.md"),
    path.join(SCRIPT_DIR, "../src/pages/contact.md"),
  ];

  const issues: ValidationIssue[] = [];
  const allFiles: string[] = [];

  // Collect all blog posts
  function collectBlogFiles(dir: string): void {
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);

      if (stat.isDirectory()) {
        collectBlogFiles(filePath);
      } else if (isPostFile(file)) {
        allFiles.push(filePath);
      }
    }
  }

  collectBlogFiles(blogDir);
  allFiles.push(...staticPages.filter(file => fs.existsSync(file)));

  console.log(colorize("📝 Meta Description 验证报告", "bold"));
  console.log(colorize("=".repeat(50), "blue"));
  console.log(
    `${colorize("✅ 最佳长度:", "green")} ${MIN_LENGTH}-${MAX_LENGTH} 字符`
  );
  console.log(`${colorize("🎯 推荐长度:", "blue")} ${OPTIMAL_LENGTH} 字符左右`);
  console.log("");

  let totalFiles = 0;
  let passedFiles = 0;

  for (const filePath of allFiles) {
    try {
      const content = fs.readFileSync(filePath, "utf-8");
      const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);

      if (!frontmatterMatch) {
        issues.push({
          file: path.relative(process.cwd(), filePath),
          issue: "No frontmatter found",
          severity: "error",
        });
        continue;
      }

      const frontmatter = frontmatterMatch[1];
      const descriptionMatch = frontmatter.match(
        /description:\s*["']?(.*?)["']?$/m
      );

      totalFiles++;

      if (!descriptionMatch) {
        issues.push({
          file: path.relative(process.cwd(), filePath),
          issue: "No description field",
          severity: "error",
        });
        continue;
      }

      const description = descriptionMatch[1].trim();
      const length = description.length;

      let status = "";
      let severity: ValidationIssue["severity"] = "good";

      if (length < MIN_LENGTH) {
        status = `太短 (${length} 字符)`;
        severity = "warning";
      } else if (length > MAX_LENGTH) {
        status = `太长 (${length} 字符)`;
        severity = "warning";
      } else {
        status = `合适 (${length} 字符)`;
        severity = "good";
        passedFiles++;
      }

      const fileName = path.relative(process.cwd(), filePath);

      if (severity === "good") {
        console.log(`${colorize("✅", "green")} ${fileName}`);
        console.log(`   ${colorize(status, "green")}`);
      } else {
        console.log(`${colorize("⚠️", "yellow")} ${fileName}`);
        console.log(`   ${colorize(status, "yellow")}`);
        console.log(
          `   ${colorize('"' + description.substring(0, 100) + (description.length > 100 ? "..." : "") + '"', "blue")}`
        );

        issues.push({
          file: fileName,
          issue: status,
          description: description,
          length: length,
          severity: "warning",
        });
      }
      console.log("");
    } catch (error) {
      issues.push({
        file: path.relative(process.cwd(), filePath),
        issue: `Error reading file: ${(error as Error).message}`,
        severity: "error",
      });
    }
  }

  // Summary report
  console.log(colorize("📊 汇总报告", "bold"));
  console.log(colorize("=".repeat(50), "blue"));
  console.log(`${colorize("总文件数:", "blue")} ${totalFiles}`);
  console.log(`${colorize("通过检查:", "green")} ${passedFiles}`);
  console.log(
    `${colorize("需要优化:", "yellow")} ${issues.filter(i => i.severity === "warning").length}`
  );
  console.log(
    `${colorize("错误:", "red")} ${issues.filter(i => i.severity === "error").length}`
  );
  console.log(
    `${colorize("通过率:", passedFiles >= totalFiles * 0.8 ? "green" : "yellow")} ${((passedFiles / totalFiles) * 100).toFixed(1)}%`
  );

  if (issues.length > 0) {
    console.log("\n" + colorize("🔍 需要关注的问题:", "bold"));
    console.log(colorize("-".repeat(50), "blue"));

    issues.forEach(issue => {
      const color = issue.severity === "error" ? "red" : "yellow";
      console.log(`${colorize("▶", color)} ${issue.file}`);
      console.log(`  ${colorize(issue.issue, color)}`);
      if (issue.description && issue.length !== undefined) {
        console.log(
          `  建议: ${issue.length < MIN_LENGTH ? "增加更多描述性内容" : "精简描述内容"}`
        );
      }
      console.log("");
    });
  }

  return issues.length === 0;
}

// Check Astro page configuration
function checkAstroPages(): void {
  const configPath = path.join(SCRIPT_DIR, "../src/config.ts");

  if (fs.existsSync(configPath)) {
    const content = fs.readFileSync(configPath, "utf-8");
    const descMatch = content.match(/desc:\s*["'](.*?)["']/);

    if (descMatch) {
      const desc = descMatch[1];
      console.log(colorize("🔧 默认配置检查", "bold"));
      console.log(colorize("=".repeat(50), "blue"));
      console.log(`默认描述长度: ${desc.length} 字符`);

      if (desc.length < MIN_LENGTH) {
        console.log(
          colorize("⚠️  默认描述太短，建议增加到 150-160 字符", "yellow")
        );
      } else if (desc.length > MAX_LENGTH) {
        console.log(
          colorize("⚠️  默认描述太长，建议控制在 150-160 字符", "yellow")
        );
      } else {
        console.log(colorize("✅ 默认描述长度合适", "green"));
      }
      console.log("");
    }
  }
}

// Main function
function main(): void {
  console.log(colorize("🚀 开始验证 Meta Descriptions...", "bold"));
  console.log("");

  checkAstroPages();
  const allPassed = checkMarkdownFiles();

  console.log(colorize("🎉 验证完成！", "bold"));

  if (allPassed) {
    console.log(
      colorize("所有页面的 Meta descriptions 都符合 SEO 最佳实践！", "green")
    );
    process.exit(0);
  } else {
    console.log(colorize("部分页面需要优化，请查看上方详细信息。", "yellow"));
    process.exit(1);
  }
}

main();
