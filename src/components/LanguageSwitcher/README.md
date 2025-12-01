# Language Switcher Component

This directory contains the Language Switcher component and its sub-components.

## data-astro-reload Usage

The `data-astro-reload` attribute is intentionally used on language switcher links to force a full page reload when switching languages. This is necessary to:

1.  **Ensure Proper Event Binding**: Due to known limitations in Astro's View Transitions, a full page reload ensures that all JavaScript event handlers and scripts are correctly re-initialized when switching languages.
2.  **Fix View Transitions Issues**: Astro's View Transitions may not fully re-initialize certain scripts or styles when switching locales. Using `data-astro-reload` guarantees a clean state by forcing a full reload.
