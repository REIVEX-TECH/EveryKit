/**
 * LetterDoc to plain text — what the Copy button puts on the clipboard, and
 * what the tests read to check a template never leaves an artefact behind.
 *
 * Layout follows the block convention: sender top right, recipient left, date,
 * subject, then the letter. Plain text cannot right-align, so the sender block
 * sits at the top left here; the PDF and DOCX place it properly.
 */

import type { LetterDoc } from "@/lib/letter/types";

export function renderText(doc: LetterDoc): string {
  const blocks: string[] = [];

  if (doc.sender.length > 0) blocks.push(doc.sender.join("\n"));
  if (doc.recipient.length > 0) blocks.push(doc.recipient.join("\n"));
  if (doc.date) blocks.push(doc.date);
  if (doc.subject) blocks.push(doc.subject);

  blocks.push(`${doc.salutation},`);
  blocks.push(doc.body.join("\n\n"));
  blocks.push(`${doc.valediction},`);
  blocks.push(doc.signOff.join("\n"));

  if (doc.enclosures && doc.enclosures.length > 0) {
    blocks.push(
      doc.enclosures.length === 1
        ? `Enclosed: ${doc.enclosures[0]}`
        : `Enclosed:\n${doc.enclosures.map((item) => `- ${item}`).join("\n")}`,
    );
  }

  return blocks.join("\n\n").replace(/\n{3,}/g, "\n\n").trim() + "\n";
}
