import { test, expect } from "@playwright/test";
import { findFirstJsonLdNodeByType, getJsonLdNodes } from "./helpers/json-ld";

const GITHUB_PROFILE_URL = "https://github.com/gaezon";
const GITHUB_REPOSITORY_URL = "https://github.com/gaezon/AstroPaper-blog";

const expectSameAsIncludesGitHub = (sameAs: unknown) => {
  expect(Array.isArray(sameAs)).toBe(true);
  expect(sameAs).toEqual(
    expect.arrayContaining([GITHUB_PROFILE_URL, GITHUB_REPOSITORY_URL])
  );
};

test.describe("public GitHub identity", () => {
  test("homepage socials link to the GitHub profile", async ({ page }) => {
    await page.goto("/");

    const githubLink = page.getByRole("link", { name: "GitHub" }).first();
    await expect(githubLink).toHaveAttribute("href", GITHUB_PROFILE_URL);
    await expect(githubLink).toHaveAttribute("target", "_blank");
    await expect(githubLink).toHaveAttribute("rel", /(?:^|\s)me(?:\s|$)/);
  });

  test("english homepage and footer keep the same GitHub destinations", async ({
    page,
  }) => {
    await page.goto("/en/");

    await expect(
      page.getByRole("link", { name: "GitHub" }).first()
    ).toHaveAttribute("href", GITHUB_PROFILE_URL);
    await expect(page.getByRole("link", { name: "Source" })).toHaveAttribute(
      "href",
      GITHUB_REPOSITORY_URL
    );
  });

  test("footer, about, and contact expose the public repository", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(page.getByRole("link", { name: "源码" })).toHaveAttribute(
      "href",
      GITHUB_REPOSITORY_URL
    );

    await page.goto("/about/");
    await expect(
      page.getByRole("link", { name: "gaezon/AstroPaper-blog" })
    ).toHaveAttribute("href", GITHUB_REPOSITORY_URL);
    await expect(
      page.getByRole("link", { name: "gaezon" }).first()
    ).toHaveAttribute("href", GITHUB_PROFILE_URL);

    await page.goto("/contact/");
    await expect(
      page.getByRole("link", { name: "github.com/gaezon" })
    ).toHaveAttribute("href", GITHUB_PROFILE_URL);
    await expect(
      page.getByRole("link", { name: "gaezon/AstroPaper-blog" })
    ).toHaveAttribute("href", GITHUB_REPOSITORY_URL);
  });

  test("post pages offer a GitHub edit link", async ({ page }) => {
    await page.goto("/posts/Why-did-I-start-blogging/");

    const editLink = page.getByRole("link", { name: "建议修改" }).first();
    await expect(editLink).toBeVisible();
    await expect(editLink).toHaveAttribute(
      "href",
      `${GITHUB_REPOSITORY_URL}/edit/main/src/data/blog/Why%20did%20I%20start%20blogging.md`
    );

    await page.goto("/en/posts/why-i-started-blogging/");
    const englishEditLink = page
      .getByRole("link", { name: "Suggest Changes" })
      .first();
    await expect(englishEditLink).toBeVisible();
    await expect(englishEditLink).toHaveAttribute(
      "href",
      `${GITHUB_REPOSITORY_URL}/edit/main/src/data/blog/en/Why%20did%20I%20start%20blogging.md`
    );
  });

  test("structured data sameAs includes GitHub profile and repository", async ({
    page,
  }) => {
    await page.goto("/");

    const nodes = await getJsonLdNodes(page);
    const person = findFirstJsonLdNodeByType(nodes, "Person");
    const website = findFirstJsonLdNodeByType(nodes, "WebSite");
    const organization = findFirstJsonLdNodeByType(nodes, "Organization");

    expectSameAsIncludesGitHub(person?.sameAs);
    expectSameAsIncludesGitHub(website?.sameAs);
    expectSameAsIncludesGitHub(organization?.sameAs);
  });
});
