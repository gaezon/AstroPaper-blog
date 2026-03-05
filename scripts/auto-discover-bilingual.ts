#!/usr/bin/env node

/**
 * Auto-discover bilingual (zh/en) blog post pairs
 *
 * This script scans posts under src/data/blog/ and src/data/blog/en,
 * auto-identifies bilingual pairs based on filename/pattern similarity,
 * and generates dynamic mappings for the comment system.
 */

import {
  readFileSync,
  readdirSync,
  existsSync,
  mkdirSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";

// Type definitions
interface ArticleFrontmatter {
  author?: string;
  pubDatetime: Date;
  modDatetime?: Date | null;
  title: string;
  featured?: boolean;
  draft?: boolean;
  tags: string[];
  description?: string;
  canonicalURL?: string;
  hideEditPost?: boolean;
  timezone?: string;
  locale?: string;
  originalTitle?: string;
  slug?: string;
}

interface Article {
  file: string;
  path: string;
  slug: string;
  title: string;
  originalTitle?: string;
  locale: string;
}

interface ArticleMatch {
  zh: Article;
  en: Article;
  confidence: number;
  matchType: "originalTitle" | "similarity";
}

interface DynamicMappingResult {
  mapping: Record<string, string>;
  unifiedPaths: Record<string, UnifiedPathInfo>;
}

interface UnifiedPathInfo {
  zhPath: string;
  enPath: string;
  unifiedCommentPath: string;
  confidence: number;
  matchType: string;
}

interface MappingMetadata {
  generatedAt: string;
  totalMatches: number;
  matchTypes: string[];
}

// Detect CI environment or non-interactive context
const isCI = process.env.CI || process.env.NODE_ENV === "production";

const log = (message: string): void => {
  if (!isCI && typeof process !== "undefined" && process.stdout) {
    console.log(message);
  }
};

const PROJECT_ROOT = join(import.meta.dirname, "..");
const BLOG_PATH = join(PROJECT_ROOT, "src", "data", "blog");
const BLOG_EN_PATH = join(BLOG_PATH, "en");

/**
 * Extract frontmatter from a Markdown file
 */
function extractFrontmatter(filePath: string): Partial<ArticleFrontmatter> {
  try {
    const content = readFileSync(filePath, "utf-8");
    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
    if (!frontmatterMatch) return {};

    const frontmatter = frontmatterMatch[1];
    const result: Record<string, string | string[] | undefined> = {};

    // Simple YAML frontmatter parsing
    const lines = frontmatter.split("\n");
    let currentKey: string | null = null;
    let inArray = false;

    for (const line of lines) {
      const trimmed = line.trim();

      if (trimmed.startsWith("#") || !trimmed) continue;

      const arrayMatch = trimmed.match(/^(\w+):\s*\[(.*)\]$/);
      if (arrayMatch) {
        result[arrayMatch[1]] = arrayMatch[2]
          .split(",")
          .map(item => item.trim().replace(/['"]/g, ""));
        continue;
      }

      const keyValueMatch = trimmed.match(/^(\w+):\s*(.*)$/);
      if (keyValueMatch) {
        currentKey = keyValueMatch[1];
        const value = keyValueMatch[2].replace(/^["']|["']$/g, "");
        result[currentKey] = value;
        inArray = false;
      } else if (currentKey && trimmed.startsWith("- ")) {
        if (!inArray) {
          result[currentKey] = [];
          inArray = true;
        }
        const currentArray = result[currentKey] as string[];
        currentArray.push(trimmed.substring(2).replace(/^["']|["']$/g, ""));
      }
    }

    return result as Partial<ArticleFrontmatter>;
  } catch {
    // Silent error handling for CI environments
    return {};
  }
}

/**
 * Get articles and their metadata
 */
function getArticles(): { zh: Article[]; en: Article[] } {
  const articles: { zh: Article[]; en: Article[] } = { zh: [], en: [] };

  // Get Chinese posts
  if (existsSync(BLOG_PATH)) {
    const files = readdirSync(BLOG_PATH, { withFileTypes: true })
      .filter(dirent => dirent.isFile() && dirent.name.endsWith(".md"))
      .filter(dirent => dirent.name !== "_TEMPLATE.md")
      .filter(dirent => !dirent.name.startsWith("_"));

    for (const dirent of files) {
      const filePath = join(BLOG_PATH, dirent.name);
      const frontmatter = extractFrontmatter(filePath);
      articles.zh.push({
        file: dirent.name,
        path: filePath,
        slug: frontmatter.slug || dirent.name.replace(".md", ""),
        title: frontmatter.title || "",
        originalTitle: frontmatter.originalTitle,
        locale: frontmatter.locale || "zh-CN",
      });
    }
  }

  // Get English posts
  if (existsSync(BLOG_EN_PATH)) {
    const files = readdirSync(BLOG_EN_PATH, { withFileTypes: true })
      .filter(dirent => dirent.isFile() && dirent.name.endsWith(".md"))
      .filter(dirent => !dirent.name.startsWith("_"));

    for (const dirent of files) {
      const filePath = join(BLOG_EN_PATH, dirent.name);
      const frontmatter = extractFrontmatter(filePath);
      articles.en.push({
        file: dirent.name,
        path: filePath,
        slug: frontmatter.slug || dirent.name.replace(".md", ""),
        title: frontmatter.title || "",
        originalTitle: frontmatter.originalTitle,
        locale: frontmatter.locale || "en",
      });
    }
  }

  return articles;
}

/**
 * Compute string similarity (based on edit distance)
 */
function similarity(str1: string, str2: string): number {
  const s1 = str1.toLowerCase().replace(/[^a-z0-9\u4e00-\u9fa5]/g, "");
  const s2 = str2.toLowerCase().replace(/[^a-z0-9\u4e00-\u9fa5]/g, "");

  const longer = s1.length > s2.length ? s1 : s2;
  const shorter = s1.length > s2.length ? s2 : s1;

  if (longer.length === 0) return 1.0;

  const editDistance = levenshteinDistance(longer, shorter);
  return (longer.length - editDistance) / longer.length;
}

/**
 * Compute Levenshtein edit distance
 */
function levenshteinDistance(str1: string, str2: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[str2.length][str1.length];
}

/**
 * Match posts by originalTitle
 */
function matchByOriginalTitle(
  zhArticles: Article[],
  enArticles: Article[]
): ArticleMatch[] {
  const matches: ArticleMatch[] = [];
  const matchedEnFiles = new Set<string>();

  for (const zh of zhArticles) {
    if (zh.originalTitle) {
      const matchingEn = enArticles.find(
        en =>
          en.originalTitle === zh.originalTitle && !matchedEnFiles.has(en.file)
      );

      if (matchingEn) {
        matches.push({
          zh,
          en: matchingEn,
          confidence: 1.0,
          matchType: "originalTitle",
        });
        matchedEnFiles.add(matchingEn.file);
      }
    }
  }

  return matches;
}

/**
 * 基于文件名相似度匹配文章
 */
function matchBySimilarity(
  zhArticles: Article[],
  unmatchedEn: Article[]
): ArticleMatch[] {
  const matches: ArticleMatch[] = [];
  const matchedEnFiles = new Set<string>();

  for (const zh of zhArticles) {
    let bestMatch: Article | null = null;
    let bestScore = 0;

    for (const en of unmatchedEn) {
      // Skip already matched posts
      if (matchedEnFiles.has(en.file)) continue;

      // Compute multiple similarity scores
      const slugSimilarity = similarity(zh.slug, en.slug);
      const titleSimilarity =
        zh.title && en.title ? similarity(zh.title, en.title) : 0;

      // Composite score: slug similarity has higher weight
      const combinedScore = slugSimilarity * 0.7 + titleSimilarity * 0.3;

      if (combinedScore > bestScore && combinedScore > 0.6) {
        // Apply threshold
        bestScore = combinedScore;
        bestMatch = en;
      }
    }

    if (bestMatch) {
      matches.push({
        zh,
        en: bestMatch,
        confidence: bestScore,
        matchType: "similarity",
      });
      matchedEnFiles.add(bestMatch.file);
    }
  }

  return matches;
}

/**
 * Generate the dynamic mapping table
 */
function generateDynamicMapping(matches: ArticleMatch[]): DynamicMappingResult {
  const mapping: Record<string, string> = {};
  const unifiedPaths: Record<string, UnifiedPathInfo> = {};

  for (const match of matches) {
    const { zh, en, confidence, matchType } = match;

    // Use the Chinese slug as identifier, or generate a unified identifier
    const unifiedId = zh.originalTitle || zh.slug;
    const unifiedPath = `/comments/${zh.slug}/`;

    // Store mapping relations
    mapping[en.slug] = zh.slug;
    unifiedPaths[unifiedId] = {
      zhPath: `/posts/${zh.slug}/`,
      enPath: `/en/posts/${en.slug}/`,
      unifiedCommentPath: unifiedPath,
      confidence,
      matchType,
    };
  }

  return { mapping, unifiedPaths };
}

/**
 * Save results to file
 */
/**
 * Save results to file
 */
async function saveResults(results: DynamicMappingResult): Promise<void> {
  const outputPath = join(PROJECT_ROOT, "src", "utils", "generated");
  const outputFile = join(outputPath, "bilingualMapping.ts");

  // Ensure output directory exists
  try {
    mkdirSync(outputPath, { recursive: true });
  } catch {
    // Directory may already exist
  }

  // Check if file exists and content matches
  if (existsSync(outputFile)) {
    try {
      // Use dynamic import to load the existing module
      // We need a file URL or relative path for import
      const modulePath = outputFile;
      const currentModule = await import(modulePath);

      const currentMapping = currentModule.dynamicSlugMapping;
      const currentUnifiedPaths = currentModule.unifiedCommentPaths;

      // Compare objects
      if (
        JSON.stringify(currentMapping) === JSON.stringify(results.mapping) &&
        JSON.stringify(currentUnifiedPaths) ===
          JSON.stringify(results.unifiedPaths)
      ) {
        log("✨ 映射关系未发生变化，跳过文件写入 (保持原有时间戳)");
        return;
      }
    } catch (e) {
      log("⚠️ 读取现有文件失败，将重新生成: " + e);
    }
  }

  // Save dynamic mapping
  const metadata: MappingMetadata = {
    generatedAt: new Date().toISOString(),
    totalMatches: Object.keys(results.unifiedPaths).length,
    matchTypes: Object.values(results.unifiedPaths).map(p => p.matchType),
  };

  const mappingContent = `/**
 * 自动生成的双语文章映射表
 * 生成时间: ${metadata.generatedAt}
 *
 * 此文件由脚本自动生成，请勿手动编辑！
 * 如需重新生成，请运行: pnpm run generate:bilingual-mapping
 */

export const dynamicSlugMapping: Record<string, string> = ${JSON.stringify(results.mapping, null, 2)};

export const unifiedCommentPaths: Record<string, {
  zhPath: string;
  enPath: string;
  unifiedCommentPath: string;
  confidence: number;
  matchType: string;
}> = ${JSON.stringify(results.unifiedPaths, null, 2)};

export const mappingMetadata = ${JSON.stringify(metadata, null, 2)};
`;

  writeFileSync(outputFile, mappingContent);
  log("📁 已更新文件: src/utils/generated/bilingualMapping.ts");
}

/**
 * Main function
 */
async function main(): Promise<void> {
  log("🔍 开始自动发现双语文章配对...");

  const articles = getArticles();
  log(
    `📚 发现 ${articles.zh.length} 篇中文文章，${articles.en.length} 篇英文文章`
  );

  // Step 1: match by originalTitle
  const originalTitleMatches = matchByOriginalTitle(articles.zh, articles.en);
  log(`✅ 通过 originalTitle 匹配 ${originalTitleMatches.length} 对文章`);

  // Find unmatched English posts
  const matchedEnFiles = new Set(originalTitleMatches.map(m => m.en.file));
  const unmatchedEn = articles.en.filter(en => !matchedEnFiles.has(en.file));
  log(`🔍 剩余 ${unmatchedEn.length} 篇英文文章待匹配`);

  // Step 2: match by similarity
  const similarityMatches = matchBySimilarity(articles.zh, unmatchedEn);
  log(`🎯 通过相似度匹配 ${similarityMatches.length} 对文章`);

  const allMatches = [...originalTitleMatches, ...similarityMatches];

  // Generate dynamic mapping
  const results = generateDynamicMapping(allMatches);
  await saveResults(results);

  // Output report
  log("\n📊 匹配报告:");
  log(`总共匹配 ${allMatches.length} 对文章`);

  const confidenceDistribution: Record<number, number> = {};
  for (const match of allMatches) {
    const range = Math.floor(match.confidence * 10) / 10;
    confidenceDistribution[range] = (confidenceDistribution[range] || 0) + 1;
  }

  log("置信度分布:");
  Object.entries(confidenceDistribution)
    .sort(([a], [b]) => Number(b) - Number(a))
    .forEach(([range, count]) => {
      log(`  ${range}: ${count} 对`);
    });

  // Output low-confidence matches for manual review
  const lowConfidenceMatches = allMatches.filter(m => m.confidence < 0.8);
  if (lowConfidenceMatches.length > 0) {
    log("\n⚠️  低置信度匹配（需要人工检查）:");
    lowConfidenceMatches.forEach(match => {
      log(
        `  ${match.zh.slug} <-> ${match.en.slug} (${match.confidence.toFixed(2)})`
      );
    });
  }

  log("\n✨ 动态映射生成完成！");
  log("📁 输出文件: src/utils/generated/bilingualMapping.ts");
}

// Run main
main();
