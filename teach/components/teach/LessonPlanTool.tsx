"use client";

import { useMemo, useState } from "react";
import { Plus, X } from "lucide-react";
import { saveBlob, pdfBlob } from "@/lib/teach/download";
import { Field, Input, Note, TextBox, useTake } from "./ui";

type Activity = { text: string; minutes: string };

function lines(text: string): string[] {
  return text.split(/\r?\n/).map((l) => l.trim()).filter((l) => l !== "");
}

export function LessonPlanTool() {
  const [subject, setSubject] = useState("");
  const [grade, setGrade] = useState("");
  const [date, setDate] = useState("");
  const [objectives, setObjectives] = useState("");
  const [materials, setMaterials] = useState("");
  const [warmUp, setWarmUp] = useState("");
  const [activities, setActivities] = useState<Activity[]>([{ text: "", minutes: "" }]);
  const [assessment, setAssessment] = useState("");
  const [homework, setHomework] = useState("");
  const { take, gate } = useTake("Download");

  const setActivity = (i: number, patch: Partial<Activity>) =>
    setActivities(activities.map((a, j) => (j === i ? { ...a, ...patch } : a)));
  const addActivity = () => setActivities([...activities, { text: "", minutes: "" }]);
  const removeActivity = (i: number) =>
    setActivities(activities.length === 1 ? activities : activities.filter((_, j) => j !== i));

  const totalMinutes = useMemo(
    () => activities.reduce((sum, a) => sum + (Number(a.minutes) || 0), 0),
    [activities],
  );

  const objectiveList = lines(objectives);
  const materialList = lines(materials);
  const activityList = activities.filter((a) => a.text.trim() !== "");
  const heading = [subject.trim(), grade.trim()].filter(Boolean).join(", ") || "Lesson plan";

  async function exportPdf() {
    const { PDFDocument, StandardFonts, rgb } = await import("pdf-lib");
    const pdf = await PDFDocument.create();
    const font = await pdf.embedFont(StandardFonts.Helvetica);
    const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
    const ink = rgb(0.09, 0.09, 0.09);
    const grey = rgb(0.4, 0.4, 0.4);
    const safe = (s: string) => s.replace(/[^\x20-\x7E\xA0-\xFF]/g, "?");
    const [pw, ph] = [595, 842];
    const margin = 50;
    const width = pw - 2 * margin;

    let page = pdf.addPage([pw, ph]);
    let y = ph - margin;
    const need = (space: number) => {
      if (y - space < margin) {
        page = pdf.addPage([pw, ph]);
        y = ph - margin;
      }
    };
    const wrap = (text: string, size: number, f: typeof font): string[] => {
      const words = safe(text).split(/\s+/).filter(Boolean);
      const out: string[] = [];
      let line = "";
      for (const w of words) {
        const test = line ? `${line} ${w}` : w;
        if (f.widthOfTextAtSize(test, size) > width && line) {
          out.push(line);
          line = w;
        } else line = test;
      }
      if (line) out.push(line);
      return out.length ? out : [""];
    };
    const para = (text: string, size: number, f: typeof font, gap: number, color = ink, indent = 0) => {
      for (const line of wrap(text, size, f)) {
        need(gap);
        page.drawText(line, { x: margin + indent, y, size, font: f, color });
        y -= gap;
      }
    };
    const section = (title: string) => {
      need(26);
      y -= 6;
      page.drawText(safe(title), { x: margin, y, size: 12, font: bold, color: ink });
      y -= 16;
    };

    para(heading, 20, bold, 26);
    if (date.trim()) para(date.trim(), 11, font, 16, grey);
    if (totalMinutes > 0) para(`Total activity time: ${totalMinutes} minutes`, 11, font, 16, grey);
    y -= 6;

    if (objectiveList.length) {
      section("Objectives");
      for (const o of objectiveList) para(`•  ${o}`, 11, font, 15);
    }
    if (materialList.length) {
      section("Materials");
      for (const m of materialList) para(`•  ${m}`, 11, font, 15);
    }
    if (warmUp.trim()) {
      section("Warm-up");
      para(warmUp.trim(), 11, font, 15);
    }
    if (activityList.length) {
      section("Activities");
      activityList.forEach((a, i) => {
        const mins = Number(a.minutes) || 0;
        const label = `${i + 1}. ${a.text.trim()}${mins ? `  (${mins} min)` : ""}`;
        para(label, 11, font, 15);
      });
    }
    if (assessment.trim()) {
      section("Assessment");
      para(assessment.trim(), 11, font, 15);
    }
    if (homework.trim()) {
      section("Homework");
      para(homework.trim(), 11, font, 15);
    }

    saveBlob(pdfBlob(await pdf.save()), "lesson-plan.pdf");
  }

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <div className="flex flex-col gap-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Subject" htmlFor="subject">
            <Input id="subject" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="e.g. Biology" />
          </Field>
          <Field label="Class or grade" htmlFor="grade">
            <Input id="grade" value={grade} onChange={(e) => setGrade(e.target.value)} placeholder="e.g. Year 9" />
          </Field>
        </div>
        <Field label="Date" htmlFor="date" note="Optional.">
          <Input id="date" value={date} onChange={(e) => setDate(e.target.value)} placeholder="e.g. 27 August 2026" />
        </Field>
        <Field label="Objectives" htmlFor="objectives" note="One a line.">
          <TextBox id="objectives" value={objectives} onChange={(e) => setObjectives(e.target.value)} className="min-h-[80px]" placeholder={"Explain photosynthesis\nLabel a leaf cross-section"} />
        </Field>
        <Field label="Materials" htmlFor="materials" note="One a line.">
          <TextBox id="materials" value={materials} onChange={(e) => setMaterials(e.target.value)} className="min-h-[70px]" placeholder={"Worksheet\nMicroscopes"} />
        </Field>
        <Field label="Warm-up" htmlFor="warmup">
          <TextBox id="warmup" value={warmUp} onChange={(e) => setWarmUp(e.target.value)} className="min-h-[60px]" placeholder="A question on the board as students arrive." />
        </Field>

        <div>
          <span className="block text-[14px] font-semibold">Activities</span>
          <div className="mt-2 flex flex-col gap-2">
            {activities.map((a, i) => (
              <div key={i} className="flex items-start gap-2">
                <TextBox
                  aria-label={`Activity ${i + 1}`}
                  value={a.text}
                  onChange={(e) => setActivity(i, { text: e.target.value })}
                  className="min-h-[44px] flex-1"
                  placeholder="What happens"
                />
                <Input
                  aria-label={`Activity ${i + 1} minutes`}
                  type="number"
                  min={0}
                  value={a.minutes}
                  onChange={(e) => setActivity(i, { minutes: e.target.value })}
                  className="w-20"
                  placeholder="min"
                />
                <button type="button" onClick={() => removeActivity(i)} aria-label={`Remove activity ${i + 1}`} className="ek-btn ek-btn-quiet mt-1 h-9 w-9 shrink-0 justify-center p-0">
                  <X aria-hidden="true" className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
          <button type="button" onClick={addActivity} className="ek-btn ek-btn-quiet mt-2">
            <Plus aria-hidden="true" className="h-4 w-4" />
            Add activity
          </button>
        </div>

        <Field label="Assessment" htmlFor="assessment">
          <TextBox id="assessment" value={assessment} onChange={(e) => setAssessment(e.target.value)} className="min-h-[60px]" placeholder="How you will check they understood." />
        </Field>
        <Field label="Homework" htmlFor="homework">
          <TextBox id="homework" value={homework} onChange={(e) => setHomework(e.target.value)} className="min-h-[50px]" placeholder="What they do before next time." />
        </Field>

        <div>
          <button type="button" onClick={() => take(() => void exportPdf())} className="ek-btn ek-btn-accent">
            Download PDF
          </button>
          {gate}
        </div>
      </div>

      <div className="lg:sticky lg:top-6 lg:self-start">
        <div className="ek-card bg-bg-soft p-5">
          <h2 className="text-[20px] font-semibold">{heading}</h2>
          {date.trim() ? <p className="mt-0.5 text-[13px] text-text-light">{date.trim()}</p> : null}
          {totalMinutes > 0 ? <p className="text-[13px] text-text-light">Total activity time: {totalMinutes} minutes</p> : null}

          <PreviewList title="Objectives" items={objectiveList} />
          <PreviewList title="Materials" items={materialList} />
          <PreviewText title="Warm-up" text={warmUp} />
          {activityList.length ? (
            <div className="mt-4">
              <h3 className="text-[13px] font-semibold uppercase tracking-wide text-text-light">Activities</h3>
              <ol className="mt-1.5 flex flex-col gap-1 text-[14px]">
                {activityList.map((a, i) => (
                  <li key={i} className="flex justify-between gap-3">
                    <span>{i + 1}. {a.text.trim()}</span>
                    {Number(a.minutes) ? <span className="shrink-0 text-text-light">{Number(a.minutes)} min</span> : null}
                  </li>
                ))}
              </ol>
            </div>
          ) : null}
          <PreviewText title="Assessment" text={assessment} />
          <PreviewText title="Homework" text={homework} />

          {objectiveList.length + materialList.length + activityList.length === 0 && !warmUp.trim() && !assessment.trim() && !homework.trim() ? (
            <Note tone="quiet">Fill in the form and the plan appears here.</Note>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function PreviewList({ title, items }: { title: string; items: string[] }) {
  if (items.length === 0) return null;
  return (
    <div className="mt-4">
      <h3 className="text-[13px] font-semibold uppercase tracking-wide text-text-light">{title}</h3>
      <ul className="mt-1.5 list-disc pl-5 text-[14px]">
        {items.map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

function PreviewText({ title, text }: { title: string; text: string }) {
  if (text.trim() === "") return null;
  return (
    <div className="mt-4">
      <h3 className="text-[13px] font-semibold uppercase tracking-wide text-text-light">{title}</h3>
      <p className="mt-1.5 whitespace-pre-wrap text-[14px]">{text.trim()}</p>
    </div>
  );
}
