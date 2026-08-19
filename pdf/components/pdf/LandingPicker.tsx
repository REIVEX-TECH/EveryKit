"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Dropzone } from "@/components/pdf/Dropzone";
import { tools, type Tool } from "@/data/tools";
import { formatBytes, stashFiles, type PickedFile } from "@/lib/pdf/files";

const ACCEPT = "application/pdf,image/jpeg,image/png,image/webp";

/**
 * The hero, which is the tool rather than a picture of one.
 *
 * A file can be dropped here before deciding what to do with it, because that
 * is the order people actually think in — they have a PDF in hand and a
 * problem, not a chosen verb. Once the file is in, only the tools that can
 * take it are offered, and the file travels to that tool in memory rather than
 * being picked a second time.
 */
export function LandingPicker() {
  const router = useRouter();
  const [files, setFiles] = useState<PickedFile[]>([]);

  const isPdf = files.length > 0 && files.every((file) => file.type === "application/pdf");
  const applicable = files.length === 0 ? tools : tools.filter((tool) => suits(tool, files, isPdf));

  function go(tool: Tool) {
    stashFiles(files);
    router.push(`/${tool.slug}`);
  }

  if (files.length === 0) {
    return (
      <Dropzone
        accept={ACCEPT}
        multiple
        onFiles={setFiles}
        label="Choose a file or drop it here"
        hint="PDFs, or JPG and PNG images. Nothing is uploaded."
      />
    );
  }

  return (
    <div>
      <div className="ek-card p-4">
        <p className="text-[14px] font-semibold">
          {files.length === 1
            ? files[0].name
            : `${files.length} files, ${formatBytes(files.reduce((sum, f) => sum + f.size, 0))}`}
        </p>
        <p className="mt-1 text-[13px] text-text-light">What do you want to do with it?</p>

        <ul className="mt-3 flex flex-col gap-2">
          {applicable.map((tool) => (
            <li key={tool.slug}>
              <button
                type="button"
                onClick={() => go(tool)}
                className="flex w-full flex-col rounded-[12px] border border-line px-3 py-2 text-left transition-colors hover:border-accent hover:bg-accent/5"
              >
                <span className="text-[15px] font-semibold">{tool.title}</span>
                <span className="text-[13px] text-text-light">{tool.blurb}</span>
              </button>
            </li>
          ))}
        </ul>

        <button
          type="button"
          onClick={() => setFiles([])}
          className="ek-btn ek-btn-quiet mt-3"
        >
          Choose something else
        </button>
      </div>

      {applicable.length < tools.length ? (
        <p className="mt-3 text-[13px] text-text-light">
          The other tools need a different kind of file.{" "}
          <Link href="#tools" className="ek-link">
            See everything this kit does
          </Link>
          .
        </p>
      ) : null}
    </div>
  );
}

/** Whether a tool can take what was just dropped. */
function suits(tool: Tool, files: PickedFile[], isPdf: boolean): boolean {
  if (tool.slug === "images-to-pdf") return !isPdf;
  if (!isPdf) return false;
  // The single-file tools cannot do anything sensible with a stack of them.
  if (!tool.multiple && files.length > 1) return false;
  return true;
}
