#!/usr/bin/env node

/**
 * 自动发现中英文博客文章配对
 *
 * 这个脚本会扫描 src/data/blog/ 目录下的中英文文章，
 * 基于文件名模式相似度自动识别双语文章配对，
 * 生成动态映射关系供评论系统使用。
 */

import { readFileSync, readdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = join(__dirname, '..');
const BLOG_PATH = join(PROJECT_ROOT, 'src', 'data', 'blog');
const BLOG_EN_PATH = join(BLOG_PATH, 'en');

/**
 * 从 Markdown 文件中提取 frontmatter
 */
function extractFrontmatter(filePath) {
  try {
    const content = readFileSync(filePath, 'utf-8');
    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
    if (!frontmatterMatch) return {};

    const frontmatter = frontmatterMatch[1];
    const result = {};

    // 简单解析 YAML frontmatter
    const lines = frontmatter.split('\n');
    let currentKey = null;
    let inArray = false;

    for (const line of lines) {
      const trimmed = line.trim();

      if (trimmed.startsWith('#') || !trimmed) continue;

      const arrayMatch = trimmed.match(/^(\w+):\s*\[(.*)\]$/);
      if (arrayMatch) {
        result[arrayMatch[1]] = arrayMatch[2].split(',').map(item => item.trim().replace(/['"]/g, ''));
        continue;
      }

      const keyValueMatch = trimmed.match(/^(\w+):\s*(.*)$/);
      if (keyValueMatch) {
        currentKey = keyValueMatch[1];
        const value = keyValueMatch[2].replace(/^["']|["']$/g, '');
        result[currentKey] = value;
        inArray = false;
      } else if (currentKey && trimmed.startsWith('- ')) {
        if (!inArray) {
          result[currentKey] = [];
          inArray = true;
        }
        result[currentKey].push(trimmed.substring(2).replace(/^["']|["']$/g, ''));
      }
    }

    return result;
  } catch (error) {
    console.warn(`Error reading frontmatter from ${filePath}:`, error.message);
    return {};
  }
}

/**
 * 获取文章列表及其元数据
 */
function getArticles() {
  const articles = { zh: [], en: [] };

  // 获取中文文章
  if (existsSync(BLOG_PATH)) {
    const files = readdirSync(BLOG_PATH, { withFileTypes: true })
      .filter(dirent => dirent.isFile() && dirent.name.endsWith('.md'))
      .filter(dirent => dirent.name !== '_TEMPLATE.md')
      .filter(dirent => !dirent.name.startsWith('_'));

    for (const dirent of files) {
      const filePath = join(BLOG_PATH, dirent.name);
      const frontmatter = extractFrontmatter(filePath);
      articles.zh.push({
        file: dirent.name,
        path: filePath,
        slug: frontmatter.slug || dirent.name.replace('.md', ''),
        title: frontmatter.title || '',
        originalTitle: frontmatter.originalTitle,
        locale: frontmatter.locale || 'zh-CN'
      });
    }
  }

  // 获取英文文章
  if (existsSync(BLOG_EN_PATH)) {
    const files = readdirSync(BLOG_EN_PATH, { withFileTypes: true })
      .filter(dirent => dirent.isFile() && dirent.name.endsWith('.md'))
      .filter(dirent => !dirent.name.startsWith('_'));

    for (const dirent of files) {
      const filePath = join(BLOG_EN_PATH, dirent.name);
      const frontmatter = extractFrontmatter(filePath);
      articles.en.push({
        file: dirent.name,
        path: filePath,
        slug: frontmatter.slug || dirent.name.replace('.md', ''),
        title: frontmatter.title || '',
        originalTitle: frontmatter.originalTitle,
        locale: frontmatter.locale || 'en'
      });
    }
  }

  return articles;
}

/**
 * 计算字符串相似度（基于编辑距离）
 */
function similarity(str1, str2) {
  const s1 = str1.toLowerCase().replace(/[^a-z0-9\u4e00-\u9fa5]/g, '');
  const s2 = str2.toLowerCase().replace(/[^a-z0-9\u4e00-\u9fa5]/g, '');

  const longer = s1.length > s2.length ? s1 : s2;
  const shorter = s1.length > s2.length ? s2 : s1;

  if (longer.length === 0) return 1.0;

  const editDistance = levenshteinDistance(longer, shorter);
  return (longer.length - editDistance) / longer.length;
}

/**
 * 计算编辑距离
 */
function levenshteinDistance(str1, str2) {
  const matrix = [];

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
 * 基于 originalTitle 匹配文章
 */
function matchByOriginalTitle(zhArticles, enArticles) {
  const matches = [];
  const matchedEn = new Set();

  for (const zh of zhArticles) {
    if (zh.originalTitle) {
      const matchingEn = enArticles.find(en =>
        en.originalTitle === zh.originalTitle && !matchedEn.has(en.file)
      );

      if (matchingEn) {
        matches.push({
          zh,
          en: matchingEn,
          confidence: 1.0,
          matchType: 'originalTitle'
        });
        matchedEn.add(matchingEn.file);
      }
    }
  }

  return matches;
}

/**
 * 基于文件名相似度匹配文章
 */
function matchBySimilarity(zhArticles, unmatchedEn) {
  const matches = [];
  const matchedEn = new Set();

  for (const zh of zhArticles) {
    let bestMatch = null;
    let bestScore = 0;

    for (const en of unmatchedEn) {
      // 跳过已经匹配的文章
      if (matchedEn.has(en.file)) continue;

      // 计算多种相似度分数
      const slugSimilarity = similarity(zh.slug, en.slug);
      const titleSimilarity = zh.title && en.title ? similarity(zh.title, en.title) : 0;

      // 综合评分，slug 相似度权重更高
      const combinedScore = slugSimilarity * 0.7 + titleSimilarity * 0.3;

      if (combinedScore > bestScore && combinedScore > 0.6) { // 设定阈值
        bestScore = combinedScore;
        bestMatch = en;
      }
    }

    if (bestMatch) {
      matches.push({
        zh,
        en: bestMatch,
        confidence: bestScore,
        matchType: 'similarity'
      });
      matchedEn.add(bestMatch.file);
    }
  }

  return matches;
}

/**
 * 生成动态映射表
 */
function generateDynamicMapping(matches) {
  const mapping = {};
  const unifiedPaths = {};

  for (const match of matches) {
    const { zh, en, confidence, matchType } = match;

    // 使用中文 slug 作为标识符，或者生成统一的标识符
    const unifiedId = zh.originalTitle || zh.slug;
    const unifiedPath = `/comments/${zh.slug}/`;

    // 存储映射关系
    mapping[en.slug] = zh.slug;
    unifiedPaths[unifiedId] = {
      zhPath: `/posts/${zh.slug}/`,
      enPath: `/en/posts/${en.slug}/`,
      unifiedCommentPath: unifiedPath,
      confidence,
      matchType
    };
  }

  return { mapping, unifiedPaths };
}

/**
 * 保存结果到文件
 */
function saveResults(results) {
  const outputPath = join(PROJECT_ROOT, 'src', 'utils', 'generated');

  // 确保目录存在
  import('fs').then(({ mkdirSync }) => {
    try {
      mkdirSync(outputPath, { recursive: true });
    } catch (e) {
      // 目录可能已存在
    }
  });

  // 保存动态映射
  const mappingContent = `/**
 * 自动生成的双语文章映射表
 * 生成时间: ${new Date().toISOString()}
 *
 * 此文件由脚本自动生成，请勿手动编辑！
 * 如需重新生成，请运行: pnpm run generate:bilingual-mapping
 */

export const dynamicSlugMapping = ${JSON.stringify(results.mapping, null, 2)};

export const unifiedCommentPaths = ${JSON.stringify(results.unifiedPaths, null, 2)};

export const mappingMetadata = {
  generatedAt: '${new Date().toISOString()}',
  totalMatches: ${Object.keys(results.unifiedPaths).length},
  matchTypes: ${JSON.stringify(Object.values(results.unifiedPaths).map(p => p.matchType))}
};
`;

  import('fs').then(({ writeFileSync }) => {
    writeFileSync(join(outputPath, 'bilingualMapping.ts'), mappingContent);
  });
}

/**
 * 主函数
 */
function main() {
  console.log('🔍 开始自动发现双语文章配对...');

  const articles = getArticles();
  console.log(`📚 发现 ${articles.zh.length} 篇中文文章，${articles.en.length} 篇英文文章`);

  // 第一步：基于 originalTitle 匹配
  const originalTitleMatches = matchByOriginalTitle(articles.zh, articles.en);
  console.log(`✅ 通过 originalTitle 匹配 ${originalTitleMatches.length} 对文章`);

  // 找出未匹配的英文文章
  const matchedEnFiles = new Set(originalTitleMatches.map(m => m.en.file));
  const unmatchedEn = articles.en.filter(en => !matchedEnFiles.has(en.file));
  console.log(`🔍 剩余 ${unmatchedEn.length} 篇英文文章待匹配`);

  // 第二步：基于相似度匹配
  const similarityMatches = matchBySimilarity(articles.zh, unmatchedEn);
  console.log(`🎯 通过相似度匹配 ${similarityMatches.length} 对文章`);

  const allMatches = [...originalTitleMatches, ...similarityMatches];

  // 生成动态映射
  const results = generateDynamicMapping(allMatches);
  saveResults(results);

  // 输出报告
  console.log('\n📊 匹配报告:');
  console.log(`总共匹配 ${allMatches.length} 对文章`);

  const confidenceDistribution = {};
  for (const match of allMatches) {
    const range = Math.floor(match.confidence * 10) / 10;
    confidenceDistribution[range] = (confidenceDistribution[range] || 0) + 1;
  }

  console.log('置信度分布:');
  Object.entries(confidenceDistribution)
    .sort(([a], [b]) => b - a)
    .forEach(([range, count]) => {
      console.log(`  ${range}: ${count} 对`);
    });

  // 输出低置信度匹配供人工检查
  const lowConfidenceMatches = allMatches.filter(m => m.confidence < 0.8);
  if (lowConfidenceMatches.length > 0) {
    console.log('\n⚠️  低置信度匹配（需要人工检查）:');
    lowConfidenceMatches.forEach(match => {
      console.log(`  ${match.zh.slug} <-> ${match.en.slug} (${match.confidence.toFixed(2)})`);
    });
  }

  console.log('\n✨ 动态映射生成完成！');
  console.log('📁 输出文件: src/utils/generated/bilingualMapping.ts');
}

// 运行主函数
main();