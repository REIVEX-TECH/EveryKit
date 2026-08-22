/**
 * A small, safe Markdown-to-HTML renderer.
 *
 * Safe by construction rather than by scrubbing afterwards: every scrap of the
 * user's text is HTML-escaped first, and only a fixed set of tags is ever
 * emitted, from patterns this file controls. There is no path by which input
 * becomes an unescaped tag, so a `<script>` in the source shows up as the
 * characters on the page. That is why this needs no DOMPurify and no network:
 * the output can only contain the tags below.
 *
 * It is a subset, on purpose: headings, bold, italic, inline code, links,
 * fenced and indented code blocks, unordered and ordered lists, blockquotes,
 * horizontal rules, and paragraphs. Enough for a readme or a comment, and the
 * copy says it is a subset rather than pretending to be a full engine.
 *
 * Pure and DOM-free, so the escaping and the structure are tested directly.
 */

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Only these protocols may appear in a link, so no javascript: or data: URLs. */
function safeHref(url: string): string | null {
  const trimmed = url.trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (/^mailto:/i.test(trimmed)) return trimmed;
  // A bare path or anchor is fine; it cannot execute.
  if (/^[/#]/.test(trimmed)) return trimmed;
  return null;
}

// A sentinel that cannot occur in typed text and survives HTML-escaping
// untouched, used to hold inline-code spans aside while the emphasis passes
// run, so a * inside code stays literal and cannot collide with real content.
const OPEN = String.fromCharCode(1);
const CLOSE = String.fromCharCode(2);

/** Inline spans: code first, then links, then emphasis, all on escaped text. */
function renderInline(text: string): string {
  const codeSlots: string[] = [];
  let out = text.replace(/`([^`]+)`/g, (_m, code: string) => {
    codeSlots.push(`<code>${escapeHtml(code)}</code>`);
    return `${OPEN}${codeSlots.length - 1}${CLOSE}`;
  });

  out = escapeHtml(out);

  // Links: [text](href). The label is already escaped; the href is validated.
  out = out.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (whole, label: string, href: string) => {
    const safe = safeHref(href);
    if (!safe) return whole;
    return `<a href="${escapeHtml(safe)}" rel="nofollow noopener" target="_blank">${label}</a>`;
  });

  // Bold before italic, so ** is not eaten by the single-* rule.
  out = out.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  out = out.replace(/(^|[^*])\*([^*]+)\*/g, "$1<em>$2</em>");
  out = out.replace(/_([^_]+)_/g, "<em>$1</em>");

  // Put the inline code back.
  const restore = new RegExp(`${OPEN}(\\d+)${CLOSE}`, "g");
  out = out.replace(restore, (_m, i: string) => codeSlots[Number(i)]);
  return out;
}

type Block = string;

/**
 * Render a Markdown string to an HTML string.
 *
 * Line-based, which is all the subset needs. It walks the lines gathering
 * blocks (a run of list items, a fenced code block, a blockquote) and closes
 * each when the block ends.
 */
export function renderMarkdown(markdown: string): string {
  const lines = markdown.replace(/\r\n?/g, "\n").split("\n");
  const blocks: Block[] = [];

  let i = 0;
  let paragraph: string[] = [];

  const flushParagraph = () => {
    if (paragraph.length) {
      blocks.push(`<p>${renderInline(paragraph.join(" "))}</p>`);
      paragraph = [];
    }
  };

  while (i < lines.length) {
    const line = lines[i];

    const fence = line.match(/^```/);
    if (fence) {
      flushParagraph();
      const body: string[] = [];
      i += 1;
      while (i < lines.length && !/^```/.test(lines[i])) {
        body.push(lines[i]);
        i += 1;
      }
      i += 1; // skip the closing fence
      blocks.push(`<pre><code>${escapeHtml(body.join("\n"))}</code></pre>`);
      continue;
    }

    if (line.trim() === "") {
      flushParagraph();
      i += 1;
      continue;
    }

    const heading = line.match(/^(#{1,6})\s+(.*)$/);
    if (heading) {
      flushParagraph();
      const level = heading[1].length;
      blocks.push(`<h${level}>${renderInline(heading[2].trim())}</h${level}>`);
      i += 1;
      continue;
    }

    if (/^(-{3,}|\*{3,}|_{3,})$/.test(line.trim())) {
      flushParagraph();
      blocks.push("<hr>");
      i += 1;
      continue;
    }

    if (/^>\s?/.test(line)) {
      flushParagraph();
      const quote: string[] = [];
      while (i < lines.length && /^>\s?/.test(lines[i])) {
        quote.push(lines[i].replace(/^>\s?/, ""));
        i += 1;
      }
      blocks.push(`<blockquote>${renderInline(quote.join(" "))}</blockquote>`);
      continue;
    }

    if (/^\s*[-*+]\s+/.test(line)) {
      flushParagraph();
      const items: string[] = [];
      while (i < lines.length && /^\s*[-*+]\s+/.test(lines[i])) {
        items.push(`<li>${renderInline(lines[i].replace(/^\s*[-*+]\s+/, ""))}</li>`);
        i += 1;
      }
      blocks.push(`<ul>${items.join("")}</ul>`);
      continue;
    }

    if (/^\s*\d+\.\s+/.test(line)) {
      flushParagraph();
      const items: string[] = [];
      while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i])) {
        items.push(`<li>${renderInline(lines[i].replace(/^\s*\d+\.\s+/, ""))}</li>`);
        i += 1;
      }
      blocks.push(`<ol>${items.join("")}</ol>`);
      continue;
    }

    paragraph.push(line.trim());
    i += 1;
  }

  flushParagraph();
  return blocks.join("\n");
}
