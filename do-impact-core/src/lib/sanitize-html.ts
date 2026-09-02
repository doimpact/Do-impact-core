import DOMPurify from "dompurify";

const ALLOWED_TAGS = [
  "p", "br", "b", "strong", "i", "em", "u", "s", "code", "pre",
  "blockquote", "ul", "ol", "li", "h1", "h2", "h3", "h4", "a", "span",
];

/** Sanitize stored rich-text HTML before rendering it. */
export function sanitizeRichText(html: string): string {
  if (!html) return "";
  if (typeof window === "undefined") {
    // No DOM during SSR — strip all markup rather than emit raw HTML.
    return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  }
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS,
    ALLOWED_ATTR: ["href", "target", "rel", "class"],
    ALLOWED_URI_REGEXP: /^(?:https?:|mailto:|tel:|#|\/)/i,
    FORBID_TAGS: ["script", "style", "iframe", "object", "embed", "form"],
    FORBID_ATTR: ["style", "srcset"],
  });
}
