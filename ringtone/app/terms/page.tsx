import type { Metadata } from "next";
import Link from "next/link";
import { absoluteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Terms",
  description:
    "The short version: EveryKit Ringtone cuts the ringtone in your browser and never receives your song, but an iPhone needs a different file format than the MP3 it makes.",
  alternates: { canonical: absoluteUrl("/terms") },
};

export default function TermsPage() {
  return (
    <div className="ek-shell max-w-[680px] py-16">
      <h1 className="text-[32px]">Terms</h1>
      <p className="mt-2 text-[14px] text-text-light">Last updated 19 August 2026</p>

      <div className="mt-10 space-y-8 text-[16px] text-text-light">
        <section>
          <h2 className="text-[19px] text-foreground">What we promise</h2>
          <p className="mt-2">
            The tool does what the page says: the seconds you marked are the seconds you
            get, the fades are half a second each, and the MP3 is written at 128 kbps.
          </p>
          <p className="mt-2">
            Your song is not uploaded. That is not a policy we could quietly change, because
            there is no server here that receives audio.
          </p>
        </section>

        <section>
          <h2 className="text-[19px] text-foreground">What we cannot promise</h2>
          <p className="mt-2">
            We cannot set the ringtone for you. A browser has no way to reach into the sound
            settings of a phone, so the last step is yours: on Android, save the MP3 and
            pick it in your sound settings. An iPhone wants a .m4r file put there through a
            computer, which is a different format from the MP3 this writes.
          </p>
          <p className="mt-2">
            We also cannot promise every file will open. Tracks bought from a store are
            often protected, and a protected track cannot be decoded by a browser. When that
            happens the tool says so instead of producing a silent file.
          </p>
          <p className="mt-2">
            Long songs are limited by your device&apos;s memory rather than a server&apos;s.
            A decoded track takes far more room than the file on disk, so on an older phone
            a very long recording may not finish.
          </p>
        </section>

        <section>
          <h2 className="text-[19px] text-foreground">What it costs</h2>
          <p className="mt-2">
            Nothing. Every kit here is free to use. If that ever changes, this
            page will say so before it does.
          </p>
        </section>

        <section>
          <h2 className="text-[19px] text-foreground">Liability</h2>
          <p className="mt-2">
            This is a small tool offered as is. Keep the original song until you have played
            the ringtone and checked it is what you wanted. We are not responsible for music
            lost by deleting an original before doing so.
          </p>
        </section>

        <section>
          <h2 className="text-[19px] text-foreground">Your music</h2>
          <p className="mt-2">
            It stays yours, and whether you have the right to copy a given track is between
            you and whoever holds it. We never receive your audio, so we claim no rights
            over it. See the{" "}
            <Link className="ek-link" href="/privacy">
              privacy page
            </Link>{" "}
            for how that works.
          </p>
        </section>
      </div>
    </div>
  );
}
