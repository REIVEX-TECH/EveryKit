/**
 * LetterDoc to DOCX, in the browser.
 *
 * Same structure as the PDF so the two open looking like the same letter: A4,
 * 25mm margins, sender block right-aligned, a gap for a signature. Built with
 * the `docx` package, which produces a real Office Open XML package rather than
 * an HTML file with a .doc extension — the difference matters the moment
 * someone opens it in Google Docs.
 */

import type { LetterDoc } from "@/lib/letter/types";

/** DOCX measures in twentieths of a point. 25mm is 1417. */
const MARGIN_TWIPS = 1417;
const BODY_SIZE_HALF_POINTS = 22; // 11pt
const PARAGRAPH_GAP_TWIPS = 180;
const BLOCK_GAP_TWIPS = 320;

export async function renderDocx(doc: LetterDoc): Promise<Blob> {
  const { Document, Packer, Paragraph, TextRun, AlignmentType, convertMillimetersToTwip } =
    await import("docx");

  const line = (
    text: string,
    options: { bold?: boolean; right?: boolean; after?: number } = {},
  ) =>
    new Paragraph({
      alignment: options.right ? AlignmentType.RIGHT : AlignmentType.LEFT,
      spacing: { after: options.after ?? 0, line: 300 },
      children: [
        new TextRun({
          text,
          bold: options.bold ?? false,
          size: BODY_SIZE_HALF_POINTS,
          font: "Helvetica",
        }),
      ],
    });

  const children: InstanceType<typeof Paragraph>[] = [];

  doc.sender.forEach((text, index) =>
    children.push(
      line(text, {
        right: true,
        after: index === doc.sender.length - 1 ? BLOCK_GAP_TWIPS : 0,
      }),
    ),
  );

  doc.recipient.forEach((text, index) =>
    children.push(
      line(text, { after: index === doc.recipient.length - 1 ? BLOCK_GAP_TWIPS : 0 }),
    ),
  );

  if (doc.date) children.push(line(doc.date, { after: BLOCK_GAP_TWIPS }));
  if (doc.subject) children.push(line(doc.subject, { bold: true, after: BLOCK_GAP_TWIPS }));

  children.push(line(`${doc.salutation},`, { after: PARAGRAPH_GAP_TWIPS }));

  for (const para of doc.body) {
    children.push(line(para, { after: PARAGRAPH_GAP_TWIPS }));
  }

  children.push(line(`${doc.valediction},`, { after: BLOCK_GAP_TWIPS }));
  // An empty line where a signature goes, so the printed letter has room.
  children.push(line("", { after: BLOCK_GAP_TWIPS }));
  doc.signOff.forEach((text) => children.push(line(text)));

  if (doc.enclosures && doc.enclosures.length > 0) {
    children.push(line("Enclosed:", { bold: true, after: 0 }));
    doc.enclosures.forEach((item) => children.push(line(`- ${item}`)));
  }

  const document = new Document({
    sections: [
      {
        properties: {
          page: {
            size: {
              width: convertMillimetersToTwip(210),
              height: convertMillimetersToTwip(297),
            },
            margin: {
              top: MARGIN_TWIPS,
              right: MARGIN_TWIPS,
              bottom: MARGIN_TWIPS,
              left: MARGIN_TWIPS,
            },
          },
        },
        children,
      },
    ],
  });

  const blob = await Packer.toBlob(document);
  return blob;
}
