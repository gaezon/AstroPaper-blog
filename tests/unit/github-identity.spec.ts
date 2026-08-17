import { describe, expect, it } from "vitest";
import { GITHUB_PROFILE_URL, GITHUB_REPOSITORY_URL, SITE } from "@/config";
import { SOCIALS } from "@/constants";

describe("public GitHub identity", () => {
  it("points the site profile and socials at the GitHub account", () => {
    expect(SITE.profile).toBe(GITHUB_PROFILE_URL);
    expect(SOCIALS.some(social => social.href === GITHUB_PROFILE_URL)).toBe(
      true
    );
  });

  it("enables GitHub-backed post edits against the public repository", () => {
    expect(SITE.editPost.enabled).toBe(true);
    expect(SITE.editPost.url).toBe(`${GITHUB_REPOSITORY_URL}/edit/main/`);
  });
});
