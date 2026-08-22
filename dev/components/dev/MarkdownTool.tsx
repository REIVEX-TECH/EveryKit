"use client";

import { useMemo, useState } from "react";
import { renderMarkdown } from "@/lib/dev/markdown";
import { CopyButton, TextBox } from "./ui";

const SAMPLE = `# Notes

A short **readme** in _Markdown_, with a [link](https://useeverykit.com) and some \`inline code\`.

- First point
- Second point

> A quiet aside.

\`\`\`
a fenced code block
stays exactly as typed
\`\`\`
`;

/**
 * Live Markdown preview, side by side, with the rendered HTML available to
 * copy. The renderer is a safe subset that escapes everything and emits only a
 * fixed set of tags, so the preview cannot run anything the source smuggled in.
 */
export function MarkdownTool() {
  const [source, setSource] = useState("");
  const html = useMemo(() => renderMarkdown(source), [source]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[14px] text-text-light">
          A subset: headings, bold, italic, code, links, lists, quotes and rules. Enough for a
          readme, not a full engine.
        </p>
        <button
          type="button"
          onClick={() => setSource(SAMPLE)}
          className="inline-flex min-h-[24px] items-center text-[14px] text-text-light hover:text-primary-dark"
        >
          Use a sample
        </button>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div>
          <label htmlFor="md-source" className="block text-[14px] font-semibold">
            Markdown
          </label>
          <TextBox
            id="md-source"
            value={source}
            onChange={(e) => setSource(e.target.value)}
            rows={16}
            placeholder="Type or paste Markdown here."
            className="mt-2 font-mono text-[14px]"
          />
        </div>
        <div>
          <p className="text-[14px] font-semibold">Preview</p>
          <div
            className="ek-prose mt-2 min-h-[220px] rounded-[10px] border border-line bg-bg-soft px-4 py-3"
            // The HTML comes only from renderMarkdown, which escapes all input
            // and emits a fixed set of tags, so there is nothing to inject.
            dangerouslySetInnerHTML={{ __html: html }}
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <CopyButton text={() => html} label="Copy HTML" />
        <CopyButton
          text={() => source}
          label="Copy Markdown"
          className="ek-btn ek-btn-quiet"
        />
      </div>
    </div>
  );
}
