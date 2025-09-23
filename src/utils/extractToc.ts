export interface TocItem {
  id: string;
  title: string;
  level: number;
  children?: TocItem[];
}

/**
 * 从文章内容中提取目录结构
 * 该函数在客户端运行，从DOM中提取标题元素
 */
export function extractTocFromDOM(): TocItem[] {
  const article = document.getElementById('article');
  if (!article) return [];

  const headings = article.querySelectorAll('h2, h3, h4, h5, h6');
  const tocItems: TocItem[] = [];
  
  headings.forEach((heading) => {
    const id = heading.id;
    // 清理标题文本：去除末尾由自动锚点产生的「#」，并规范空白
    const rawTitle = heading.textContent || '';
    const title = rawTitle
      .replace(/\s*#\s*$/, '') // 删除结尾的 #
      .replace(/\s+/g, ' ')     // 规范空白
      .trim();
    const level = parseInt(heading.tagName.substring(1));
    
    // 排除 Footnotes 和其他特殊标题
    if (id && title && 
        !title.toLowerCase().includes('footnote') && 
        !id.toLowerCase().includes('footnote') &&
        !id.startsWith('fnref-') &&
        !id.startsWith('fn-') &&
        // 排除自动生成目录的标题（remark-toc）
        title.toLowerCase() !== 'table of contents') {
      tocItems.push({
        id,
        title,
        level
      });
    }
  });

  return buildTocHierarchy(tocItems);
}

/**
 * 将扁平的标题列表构建成层级结构
 */
function buildTocHierarchy(items: TocItem[]): TocItem[] {
  const result: TocItem[] = [];
  const stack: TocItem[] = [];

  for (const item of items) {
    // 移除比当前级别深的项目
    while (stack.length > 0 && stack[stack.length - 1].level >= item.level) {
      stack.pop();
    }

    if (stack.length === 0) {
      // 顶级项目
      result.push(item);
    } else {
      // 子级项目
      const parent = stack[stack.length - 1];
      if (!parent.children) {
        parent.children = [];
      }
      parent.children.push(item);
    }

    stack.push(item);
  }

  return result;
}

/**
 * 从Astro渲染的内容中提取目录（服务端使用）
 * 由于remark-toc已经处理了标题，我们主要依赖客户端提取
 */
export function extractTocFromContent(content: string): TocItem[] {
  // 这里可以使用正则表达式或HTML解析器来提取标题
  // 但为了简化，我们主要依赖客户端实现
  const headingRegex = /<h([2-6])[^>]*id="([^"]*)"[^>]*>(.*?)<\/h[2-6]>/gi;
  const tocItems: TocItem[] = [];
  let match;

  while ((match = headingRegex.exec(content)) !== null) {
    const level = parseInt(match[1]);
    const id = match[2];
    const title = match[3].replace(/<[^>]*>/g, '').trim(); // 移除HTML标签

    if (id && title) {
      tocItems.push({
        id,
        title,
        level
      });
    }
  }

  return buildTocHierarchy(tocItems);
}
