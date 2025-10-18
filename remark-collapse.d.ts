declare module 'remark-collapse' {
  export interface RemarkCollapseOptions {
    /**
     * Test string or RegExp to match headings that should be collapsible
     * @default "Table of contents"
     */
    test?: string | RegExp;

    /**
     * Summary text for the collapsible section
     * @default "Toggle"
     */
    summary?: string | ((heading: string) => string);

    /**
     * Whether the collapsible section should be open by default
     * @default true
     */
    open?: boolean;

    /**
     * CSS class to add to the collapsible container
     * @default "remark-collapse"
     */
    class?: string;

    /**
     * Additional HTML attributes to add to the details element
     */
    attributes?: Record<string, string>;
  }

  export default function remarkCollapse(options?: RemarkCollapseOptions): void;
}
