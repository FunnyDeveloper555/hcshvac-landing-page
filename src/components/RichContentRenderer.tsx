import { useMemo } from "react";
import GallerySliderEmbed from "./GallerySliderEmbed";

interface RichContentRendererProps {
  html: string;
  className?: string;
}

/**
 * Renders HTML content, replacing gallery placeholder divs
 * (data-gallery-id) with interactive GallerySliderEmbed components.
 */
const RichContentRenderer = ({ html, className }: RichContentRendererProps) => {
  const segments = useMemo(() => {
    if (!html) return [];

    // Split HTML around gallery placeholder divs
    const regex = /<div[^>]*data-gallery-id="([^"]+)"[^>]*>[\s\S]*?<\/div>\s*(?:<\/div>)?/gi;
    const result: Array<{ type: "html"; content: string } | { type: "gallery"; galleryId: string }> = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    // We need a more robust regex that captures the full gallery block
    // The gallery block is: <div data-gallery-id="...">...nested content...</div>
    // We'll use a simple parser approach
    const parser = new DOMParser();
    const doc = parser.parseFromString(`<body>${html}</body>`, "text/html");
    const galleryDivs = doc.querySelectorAll("div[data-gallery-id]");

    if (galleryDivs.length === 0) {
      return [{ type: "html" as const, content: html }];
    }

    // Get the full serialized HTML and find gallery positions
    const bodyHtml = doc.body.innerHTML;
    let remaining = bodyHtml;

    galleryDivs.forEach((div) => {
      const galleryId = div.getAttribute("data-gallery-id") || "";
      const outerHtml = div.outerHTML;
      const idx = remaining.indexOf(outerHtml);

      if (idx > 0) {
        result.push({ type: "html", content: remaining.substring(0, idx) });
      }
      result.push({ type: "gallery", galleryId });
      remaining = remaining.substring(idx + outerHtml.length);
    });

    if (remaining.trim()) {
      result.push({ type: "html", content: remaining });
    }

    return result;
  }, [html]);

  if (segments.length === 0) return null;

  // If no galleries, render plain HTML (most common case)
  if (segments.length === 1 && segments[0].type === "html") {
    return (
      <article
        className={className}
        dangerouslySetInnerHTML={{ __html: segments[0].content }}
      />
    );
  }

  return (
    <article className={className}>
      {segments.map((seg, i) =>
        seg.type === "gallery" ? (
          <GallerySliderEmbed key={`gallery-${seg.galleryId}-${i}`} galleryId={seg.galleryId} />
        ) : (
          <div key={`html-${i}`} dangerouslySetInnerHTML={{ __html: seg.content }} />
        )
      )}
    </article>
  );
};

export default RichContentRenderer;
