import { describe, expect, it } from "vitest";
import type { MarkdownHeading } from "astro";
import {
  buildTocTree,
  hasToc,
  normalizeTocHeadings,
} from "../../src/utils/toc/buildTocTree";

const heading = (
  depth: number,
  slug: string,
  text: string
): MarkdownHeading => ({ depth, slug, text });

describe("buildTocTree", () => {
  it("nests h3 under the closest h2", () => {
    const tree = buildTocTree([
      heading(2, "intro", "Intro"),
      heading(3, "install", "Install"),
      heading(3, "configure", "Configure"),
      heading(2, "usage", "Usage"),
      heading(3, "options", "Options"),
    ]);

    expect(tree).toHaveLength(2);
    expect(tree[0].children.map(item => item.slug)).toEqual([
      "install",
      "configure",
    ]);
    expect(tree[1].children.map(item => item.slug)).toEqual(["options"]);
  });

  it("attaches a skipped level to the closest shallower heading", () => {
    const tree = buildTocTree(
      [
        heading(2, "intro", "Intro"),
        heading(4, "details", "Details"),
        heading(3, "back", "Back"),
      ],
      4
    );

    expect(tree).toHaveLength(1);
    expect(tree[0].children.map(item => item.slug)).toEqual([
      "details",
      "back",
    ]);
  });

  it("keeps a post that starts at h3 at the top level", () => {
    const tree = buildTocTree([
      heading(3, "first", "First"),
      heading(3, "second", "Second"),
    ]);

    expect(tree.map(item => item.slug)).toEqual(["first", "second"]);
  });

  it("filters out footnotes, TOC headings and deeper levels", () => {
    const headings = [
      heading(2, "intro", "Intro"),
      heading(3, "install", "Install"),
      heading(4, "too-deep", "Too deep"),
      heading(2, "footnotes", "Footnotes"),
      heading(2, "fn-1", "A footnote"),
      heading(2, "toc", "Table of contents"),
    ];

    expect(normalizeTocHeadings(headings).map(item => item.slug)).toEqual([
      "intro",
      "install",
    ]);
    expect(buildTocTree(headings)).toHaveLength(1);
  });

  it("respects maxDepth", () => {
    const headings = [
      heading(2, "intro", "Intro"),
      heading(3, "install", "Install"),
      heading(2, "usage", "Usage"),
    ];

    const tree = buildTocTree(headings, 2);
    expect(tree.map(item => item.slug)).toEqual(["intro", "usage"]);
    expect(tree[0].children).toHaveLength(0);
  });
});

describe("hasToc", () => {
  it("requires at least two headings in the configured depth range", () => {
    expect(hasToc([heading(2, "only", "Only")])).toBe(false);
    expect(hasToc([heading(2, "one", "One"), heading(2, "two", "Two")])).toBe(
      true
    );
  });

  it("does not count filtered headings", () => {
    expect(
      hasToc([heading(2, "one", "One"), heading(2, "footnotes", "Footnotes")])
    ).toBe(false);
  });
});
