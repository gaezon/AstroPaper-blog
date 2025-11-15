import { test, expect, type Page } from '@playwright/test';

type Locale = 'zh' | 'en';

const getPrevLink = (page: Page, locale: Locale = 'zh') => {
  const label = locale === 'en' ? 'Previous Post' : '上一篇';
  return page.getByRole('link', { name: new RegExp(label, 'i') });
};

const getNextLink = (page: Page, locale: Locale = 'zh') => {
  const label = locale === 'en' ? 'Next Post' : '下一篇';
  return page.getByRole('link', { name: new RegExp(label, 'i') });
};

test.describe('Post Navigation', () => {
  test('first post should only have next post link', async ({ page }) => {
    // 获取第一篇文章
    await page.goto('/posts/');
    const firstPostLink = page.locator('main ul li a').first();
    await firstPostLink.click();

    // 验证只有下一篇链接
    const prevLink = getPrevLink(page);
    const nextLink = getNextLink(page);

    await expect(prevLink).not.toBeVisible();
    await expect(nextLink).toBeVisible();
  });

  test('last post should only have previous post link', async ({ page }) => {
    // 导航到最后一篇文章
    await page.goto('/posts/');
    const postLinks = page.locator('main ul li a');
    const lastPostLink = postLinks.last();
    await lastPostLink.click();

    // 验证只有上一篇链接
    const prevLink = getPrevLink(page);
    const nextLink = getNextLink(page);

    await expect(prevLink).toBeVisible();
    await expect(nextLink).not.toBeVisible();
  });

  test('middle post should have both navigation links', async ({ page }) => {
    // 导航到中间文章
    await page.goto('/posts/');
    const postLinks = page.locator('main ul li a');
    const middlePostLink = postLinks.nth(1); // 第二篇文章
    await middlePostLink.click();

    // 验证两个链接都存在
    const prevLink = getPrevLink(page);
    const nextLink = getNextLink(page);

    await expect(prevLink).toBeVisible();
    await expect(nextLink).toBeVisible();
  });

  test('English posts navigation should work correctly', async ({ page }) => {
    await page.goto('/en/posts/');
    const firstPostLink = page.locator('main ul li a').first();
    await firstPostLink.click();

    const prevLink = getPrevLink(page, 'en');
    const nextLink = getNextLink(page, 'en');

    await expect(prevLink).not.toBeVisible();
    await expect(nextLink).toBeVisible();
  });
});
