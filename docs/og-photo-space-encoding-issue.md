# Issue: English OG Photo Spaces Render as Square Brackets

## Summary

When generating OG preview images for English blog posts, any spaces in the title are being rendered as square-bracket glyphs. This regression affects newly generated OG assets and is visible in social sharing previews (see attached screenshot in the linked chat context).

## Impact

- OG image readability is significantly reduced for English posts.
- Social media previews display incorrect characters, which may harm click-through rates and brand perception.

## Steps to Reproduce

1. Run the OG image generation workflow for an English blog post (for example, invoke the existing OG automation script or generate an OG asset during publishing).
2. Inspect the resulting OG image.
3. Observe that every space in the title has been replaced by a square bracket glyph.

## Expected Result

Spaces in the OG image text should render as normal whitespace.

## Actual Result

Spaces are substituted with square-bracket glyphs (see screenshot reference in the chat attachment).

## Hypothesis / Notes

- Possibly related to a font fallback or character escaping issue in the OG generation pipeline (likely `scripts/og-preview.ts`).
- Might stem from recent changes in the English localization path or font configuration.

## Suggested Next Steps

- Reproduce locally to confirm.
- Inspect the OG generation script for text sanitization or font rendering changes.
- Verify that the font file used for English OG images includes standard whitespace glyphs and that no replacement mapping is applied.
- Add regression tests (visual snapshot or string check) once fixed.

## Additional Context

- Environment: macOS (per current workspace setup), Node.js project using AstroPaper tooling.
- Reference Screenshot: Provided in task attachment (shows OG preview with square brackets instead of spaces).
