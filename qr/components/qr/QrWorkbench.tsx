"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Download } from "lucide-react";
import { EmailGate } from "@/components/site/EmailGate";
import { MoreFromEveryKit } from "@/components/site/MoreFromEveryKit";
import { hasGivenEmail } from "@/lib/emailCapture";
import { revealResult } from "@/lib/revealResult";
import {
  buildEmail,
  buildEvent,
  buildSms,
  buildText,
  buildUrl,
  buildVCard,
  buildWhatsApp,
  buildWifi,
  type QrKind,
  type Result,
  type WifiSecurity,
} from "@/lib/qr/payloads";
import {
  DEFAULT_COLOURS,
  QUIET_ZONE,
  logoPlacement,
  scaleFor,
  toMatrix,
  toRgba,
  toSvg,
  toSvgWithLogo,
  type Colours,
  type ErrorCorrection,
} from "@/lib/qr/render";
import { judgeContrast } from "@/lib/qr/contrast";

const LEVELS: Array<{ value: ErrorCorrection; label: string; detail: string }> = [
  { value: "M", label: "Normal", detail: "The usual choice" },
  { value: "Q", label: "Sturdy", detail: "Survives a scuff" },
  { value: "H", label: "Toughest", detail: "Densest code" },
];

const PNG_SIZE = 1024;

type Fields = {
  url: string;
  text: string;
  ssid: string;
  wifiPassword: string;
  security: WifiSecurity;
  hidden: boolean;
  firstName: string;
  lastName: string;
  organisation: string;
  jobTitle: string;
  phone: string;
  email: string;
  contactUrl: string;
  waPhone: string;
  waMessage: string;
  emailTo: string;
  emailSubject: string;
  emailBody: string;
  smsPhone: string;
  smsMessage: string;
  eventTitle: string;
  eventLocation: string;
  eventDescription: string;
  eventStartDate: string;
  eventStartTime: string;
  eventEndDate: string;
  eventEndTime: string;
};

const EMPTY: Fields = {
  url: "",
  text: "",
  ssid: "",
  wifiPassword: "",
  security: "WPA",
  hidden: false,
  firstName: "",
  lastName: "",
  organisation: "",
  jobTitle: "",
  phone: "",
  email: "",
  contactUrl: "",
  waPhone: "",
  waMessage: "",
  emailTo: "",
  emailSubject: "",
  emailBody: "",
  smsPhone: "",
  smsMessage: "",
  eventTitle: "",
  eventLocation: "",
  eventDescription: "",
  eventStartDate: "",
  eventStartTime: "",
  eventEndDate: "",
  eventEndTime: "",
};

function payloadFor(kind: QrKind, f: Fields): Result<string> {
  switch (kind) {
    case "url":
      return buildUrl(f.url);
    case "text":
      return buildText(f.text);
    case "wifi":
      return buildWifi({
        ssid: f.ssid,
        password: f.wifiPassword,
        security: f.security,
        hidden: f.hidden,
      });
    case "vcard":
      return buildVCard({
        firstName: f.firstName,
        lastName: f.lastName,
        organisation: f.organisation,
        title: f.jobTitle,
        phone: f.phone,
        email: f.email,
        url: f.contactUrl,
      });
    case "whatsapp":
      return buildWhatsApp({ phone: f.waPhone, message: f.waMessage });
    case "email":
      return buildEmail({ to: f.emailTo, subject: f.emailSubject, body: f.emailBody });
    case "sms":
      return buildSms({ phone: f.smsPhone, message: f.smsMessage });
    case "event":
      return buildEvent({
        title: f.eventTitle,
        location: f.eventLocation,
        description: f.eventDescription,
        startDate: f.eventStartDate,
        startTime: f.eventStartTime,
        endDate: f.eventEndDate,
        endTime: f.eventEndTime,
      });
  }
}

/** True once the user has typed enough that an error is worth showing. */
function hasInput(kind: QrKind, f: Fields): boolean {
  switch (kind) {
    case "url":
      return f.url.trim() !== "";
    case "text":
      return f.text.trim() !== "";
    case "wifi":
      return f.ssid.trim() !== "";
    case "vcard":
      return f.firstName.trim() !== "" || f.lastName.trim() !== "";
    case "whatsapp":
      return f.waPhone.trim() !== "";
    case "email":
      return f.emailTo.trim() !== "";
    case "sms":
      return f.smsPhone.trim() !== "";
    case "event":
      return f.eventTitle.trim() !== "";
  }
}

export function QrWorkbench({ kind }: { kind: QrKind }) {
  const [fields, setFields] = useState<Fields>(EMPTY);
  const [level, setLevel] = useState<ErrorCorrection>("M");
  const [colours, setColours] = useState<Colours>(DEFAULT_COLOURS);
  const [logo, setLogo] = useState<string | null>(null);
  const [gateFor, setGateFor] = useState<(() => void) | null>(null);
  const resultRef = useRef<HTMLDivElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  // A logo covers the centre, so the code is built at the toughest level
  // whenever one is present; H can lose the covered modules and still decode.
  const effectiveLevel: ErrorCorrection = logo ? "H" : level;
  const contrast = judgeContrast(colours.dark, colours.light);

  const set = <K extends keyof Fields>(key: K, value: Fields[K]) =>
    setFields((current) => ({ ...current, [key]: value }));

  const built = payloadFor(kind, fields);
  const typing = hasInput(kind, fields);

  // Pulled out of the memo's dependency list as a plain string: the payload is
  // what the code is made of, so keying on it means a keystroke that does not
  // change the payload does not redraw the code.
  const payload = built.ok ? built.value : null;

  const code = useMemo(() => {
    if (payload === null) return null;
    const matrix = toMatrix(payload, effectiveLevel);
    const svg = logo
      ? toSvgWithLogo(matrix, logo, colours)
      : toSvg(matrix, colours);
    return { matrix, svg, payload };
  }, [payload, effectiveLevel, colours, logo]);

  const hadCode = useRef(false);
  useEffect(() => {
    // Reveal once, when a code first appears — not on every keystroke after.
    if (code && !hadCode.current && resultRef.current) {
      hadCode.current = true;
      revealResult(resultRef.current);
    }
    if (!code) hadCode.current = false;
  }, [code]);

  function take(save: () => void) {
    if (hasGivenEmail()) {
      save();
      return;
    }
    setGateFor(() => save);
  }

  function saveSvg() {
    if (!code) return;
    download(new Blob([code.svg], { type: "image/svg+xml" }), `${fileStem(kind)}.svg`);
  }

  function savePng() {
    if (!code) return;
    const scale = scaleFor(code.matrix, PNG_SIZE);
    const { data, width, height } = toRgba(code.matrix, scale, colours);
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) return;
    context.putImageData(new ImageData(data, width, height), 0, 0);

    const finish = () => {
      canvas.toBlob((blob) => {
        if (blob) download(blob, `${fileStem(kind)}.png`);
      }, "image/png");
    };

    if (!logo) {
      finish();
      return;
    }

    // The logo is drawn on a white rounded pad over the centre, matching the
    // SVG, so the downloaded PNG looks like the preview rather than a bare code.
    const box = logoPlacement(code.matrix, 0.2);
    const image = new Image();
    image.onload = () => {
      const outer = (box.size + box.pad * 2) * scale;
      const cx = (width - outer) / 2;
      const radius = Math.max(1, Math.round(outer * 0.14));
      context.fillStyle = colours.light;
      roundRect(context, cx, cx, outer, outer, radius);
      context.fill();
      const inner = box.size * scale;
      const ix = (width - inner) / 2;
      context.drawImage(image, ix, ix, inner, inner);
      finish();
    };
    // If the logo somehow fails to load, save the code without it rather than
    // nothing at all.
    image.onerror = finish;
    image.src = logo;
  }

  const pngPixels = code ? scaleFor(code.matrix, PNG_SIZE) * (code.matrix.size + QUIET_ZONE * 2) : 0;

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,320px)] lg:items-start">
      <div className="flex flex-col gap-4">
        <Fieldsets kind={kind} fields={fields} set={set} />

        <fieldset>
          <legend className="text-[14px] font-semibold">How much damage it survives</legend>
          <div className="mt-2 grid gap-2 sm:grid-cols-3">
            {LEVELS.map((option) => (
              <label
                key={option.value}
                className={[
                  "flex cursor-pointer flex-col rounded-[12px] border px-3 py-2 transition-colors",
                  (logo ? "H" : level) === option.value
                    ? "border-primary bg-primary/5"
                    : "border-line hover:border-line-strong",
                  logo ? "opacity-60" : "",
                ].join(" ")}
              >
                <span className="flex items-center gap-2 text-[14px] font-semibold">
                  <input
                    type="radio"
                    name="level"
                    checked={(logo ? "H" : level) === option.value}
                    disabled={Boolean(logo)}
                    onChange={() => setLevel(option.value)}
                    className="h-4 w-4 accent-[var(--color-primary)]"
                  />
                  {option.label}
                </span>
                <span className="mt-0.5 pl-6 text-[12px] text-text-light">{option.detail}</span>
              </label>
            ))}
          </div>
          {logo ? (
            <p className="mt-2 text-[13px] text-text-light">
              Set to the toughest level automatically, because the logo covers the middle of the
              code.
            </p>
          ) : null}
        </fieldset>

        <Appearance
          colours={colours}
          setColours={setColours}
          contrast={contrast}
          logo={logo}
          setLogo={setLogo}
          logoInputRef={logoInputRef}
        />

        {!built.ok && typing ? (
          <p role="alert" className="text-[14px] text-warn">
            {built.error}
          </p>
        ) : null}
      </div>

      {/*
        The code goes first on a narrow screen. It updates as you type, so
        putting it after the form means that on a phone it appears roughly
        1,300px below the field being typed into and is never seen. It cannot
        be scrolled to either: the reveal helper deliberately refuses to move
        the page while a text field is being edited, which is the right rule
        and the reason the order has to solve this instead.
      */}
      <div ref={resultRef} className="order-first lg:order-none lg:sticky lg:top-6">
        <div className="ek-card p-4">
          {code ? (
            <>
              <div
                className="mx-auto w-full max-w-[260px]"
                // The SVG is generated here from the matrix, not from anything
                // the user can inject markup through.
                dangerouslySetInnerHTML={{ __html: code.svg }}
              />

              <p className="mt-3 break-all text-[12px] text-text-light">
                {kind === "wifi" || kind === "vcard"
                  ? `${describeKind(kind)}, ${code.matrix.size} x ${code.matrix.size} modules`
                  : code.payload}
              </p>

              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => take(savePng)}
                  className="ek-btn ek-btn-accent flex-1"
                >
                  <Download aria-hidden="true" className="h-4 w-4" />
                  PNG
                </button>
                <button
                  type="button"
                  onClick={() => take(saveSvg)}
                  className="ek-btn ek-btn-quiet flex-1"
                >
                  <Download aria-hidden="true" className="h-4 w-4" />
                  SVG
                </button>
              </div>

              <p className="mt-2 text-[12px] text-text-light">
                PNG is {pngPixels} x {pngPixels} px. SVG stays sharp at any size, so it is the
                one to send to a printer.
              </p>

              {gateFor ? (
                <EmailGate
                  actionLabel="Save the code"
                  onDone={() => {
                    gateFor();
                    setGateFor(null);
                  }}
                  // Dismissed: the code is not saved. A cancel, not a skip.
                  onCancel={() => setGateFor(null)}
                />
              ) : null}

              <MoreFromEveryKit />
            </>
          ) : (
            /* Short while empty so it does not push the form off a phone
               screen; the square only applies once there is a code to hold. */
            <div className="flex items-center justify-center rounded-[12px] bg-bg-soft py-6 lg:aspect-square lg:py-0">
              <p className="max-w-[24ch] text-center text-[14px] text-text-light">
                Your code appears here as you type.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function describeKind(kind: QrKind): string {
  return kind === "wifi" ? "Wi-Fi network details" : "Contact card";
}

function fileStem(kind: QrKind): string {
  return `qr-${kind}`;
}

function download(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

// ---------------------------------------------------------------------------
// The form, which is the only part that differs between kinds
// ---------------------------------------------------------------------------

type SetField = <K extends keyof Fields>(key: K, value: Fields[K]) => void;

function Fieldsets({
  kind,
  fields,
  set,
}: {
  kind: QrKind;
  fields: Fields;
  set: SetField;
}) {
  if (kind === "url") {
    return (
      <Field
        id="url"
        label="Web address"
        hint="The https:// is added if you leave it off."
        value={fields.url}
        onChange={(v) => set("url", v)}
        placeholder="example.com"
        type="url"
        autoFocus
      />
    );
  }

  if (kind === "text") {
    return (
      <Field
        id="text"
        label="Text"
        hint="Shown as words when scanned, rather than opening anything."
        value={fields.text}
        onChange={(v) => set("text", v)}
        placeholder="Anything you like"
        multiline
        autoFocus
      />
    );
  }

  if (kind === "wifi") {
    return (
      <>
        <Field
          id="ssid"
          label="Network name"
          hint="Exactly as it appears in the list of networks, including capitals."
          value={fields.ssid}
          onChange={(v) => set("ssid", v)}
          placeholder="My Home Wi-Fi"
          autoFocus
        />
        <div>
          <label htmlFor="security" className="block text-[14px] font-semibold">
            Security
          </label>
          <select
            id="security"
            value={fields.security}
            onChange={(event) => set("security", event.target.value as WifiSecurity)}
            className="mt-2 w-full rounded-[10px] border border-line bg-background px-3 py-2 text-[15px] outline-none focus:border-primary"
          >
            <option value="WPA">WPA / WPA2 / WPA3</option>
            <option value="WEP">WEP (very old equipment)</option>
            <option value="nopass">Open, no password</option>
          </select>
        </div>
        {fields.security !== "nopass" ? (
          <Field
            id="wifi-password"
            label="Password"
            hint="Punctuation is fine. Semicolons and colons are escaped correctly."
            value={fields.wifiPassword}
            onChange={(v) => set("wifiPassword", v)}
            placeholder=""
          />
        ) : null}
        <label className="flex items-center gap-2 text-[14px]">
          <input
            type="checkbox"
            checked={fields.hidden}
            onChange={(event) => set("hidden", event.target.checked)}
            className="h-4 w-4 accent-[var(--color-primary)]"
          />
          This network does not appear in the list of nearby networks
        </label>
      </>
    );
  }

  if (kind === "vcard") {
    return (
      <>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            id="first"
            label="First name"
            value={fields.firstName}
            onChange={(v) => set("firstName", v)}
            placeholder="Ada"
            autoFocus
          />
          <Field
            id="last"
            label="Last name"
            value={fields.lastName}
            onChange={(v) => set("lastName", v)}
            placeholder="Lovelace"
          />
        </div>
        <p className="text-[13px] text-text-light">
          Everything below is optional. Anything left blank is left out of the card, and each
          field you add makes the code a little denser.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            id="phone"
            label="Phone"
            value={fields.phone}
            onChange={(v) => set("phone", v)}
            placeholder="+44 20 7946 0000"
            type="tel"
          />
          <Field
            id="email"
            label="Email"
            value={fields.email}
            onChange={(v) => set("email", v)}
            placeholder="ada@example.com"
            type="email"
          />
          <Field
            id="org"
            label="Company"
            value={fields.organisation}
            onChange={(v) => set("organisation", v)}
            placeholder=""
          />
          <Field
            id="jobtitle"
            label="Job title"
            value={fields.jobTitle}
            onChange={(v) => set("jobTitle", v)}
            placeholder=""
          />
        </div>
        <Field
          id="contact-url"
          label="Website"
          value={fields.contactUrl}
          onChange={(v) => set("contactUrl", v)}
          placeholder="example.com"
          type="url"
        />
      </>
    );
  }

  if (kind === "email") {
    return (
      <>
        <Field
          id="email-to"
          label="Send to"
          hint="The address the message will open to."
          value={fields.emailTo}
          onChange={(v) => set("emailTo", v)}
          placeholder="you@example.com"
          type="email"
          autoFocus
        />
        <Field
          id="email-subject"
          label="Subject"
          hint="Optional. Punctuation is safe."
          value={fields.emailSubject}
          onChange={(v) => set("emailSubject", v)}
          placeholder="Enquiry from your poster"
        />
        <Field
          id="email-body"
          label="Message"
          hint="Optional. Appears in the new email, ready to edit and send."
          value={fields.emailBody}
          onChange={(v) => set("emailBody", v)}
          placeholder="Hello,"
          multiline
        />
      </>
    );
  }

  if (kind === "sms") {
    return (
      <>
        <Field
          id="sms-phone"
          label="Phone number"
          hint="However your readers would dial it. Use the full international number for another country."
          value={fields.smsPhone}
          onChange={(v) => set("smsPhone", v)}
          placeholder="+44 7700 900000"
          type="tel"
          autoFocus
        />
        <Field
          id="sms-message"
          label="Message to start with"
          hint="Optional. Appears in the text, ready to send."
          value={fields.smsMessage}
          onChange={(v) => set("smsMessage", v)}
          placeholder="JOIN"
          multiline
        />
      </>
    );
  }

  if (kind === "event") {
    return (
      <>
        <Field
          id="event-title"
          label="Event name"
          value={fields.eventTitle}
          onChange={(v) => set("eventTitle", v)}
          placeholder="Summer barbecue"
          autoFocus
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="event-start-date" className="block text-[14px] font-semibold">
              Start date
            </label>
            <input
              id="event-start-date"
              type="date"
              value={fields.eventStartDate}
              onChange={(event) => set("eventStartDate", event.target.value)}
              className="mt-2 w-full rounded-[10px] border border-line bg-background px-3 py-2 text-[15px] outline-none focus:border-primary"
            />
          </div>
          <div>
            <label htmlFor="event-start-time" className="block text-[14px] font-semibold">
              Start time
            </label>
            <input
              id="event-start-time"
              type="time"
              value={fields.eventStartTime}
              onChange={(event) => set("eventStartTime", event.target.value)}
              className="mt-2 w-full rounded-[10px] border border-line bg-background px-3 py-2 text-[15px] outline-none focus:border-primary"
            />
          </div>
        </div>
        <p className="text-[13px] text-text-light">
          Leave the time blank for an all-day event. The end below is optional; without it the
          event lasts the block you started.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="event-end-date" className="block text-[14px] font-semibold">
              End date
            </label>
            <input
              id="event-end-date"
              type="date"
              value={fields.eventEndDate}
              onChange={(event) => set("eventEndDate", event.target.value)}
              className="mt-2 w-full rounded-[10px] border border-line bg-background px-3 py-2 text-[15px] outline-none focus:border-primary"
            />
          </div>
          <div>
            <label htmlFor="event-end-time" className="block text-[14px] font-semibold">
              End time
            </label>
            <input
              id="event-end-time"
              type="time"
              value={fields.eventEndTime}
              onChange={(event) => set("eventEndTime", event.target.value)}
              className="mt-2 w-full rounded-[10px] border border-line bg-background px-3 py-2 text-[15px] outline-none focus:border-primary"
            />
          </div>
        </div>
        <Field
          id="event-location"
          label="Place"
          hint="Optional."
          value={fields.eventLocation}
          onChange={(v) => set("eventLocation", v)}
          placeholder="The Bell, Main Street"
        />
        <Field
          id="event-description"
          label="Note"
          hint="Optional. Keep it short so the code stays quick to scan."
          value={fields.eventDescription}
          onChange={(v) => set("eventDescription", v)}
          placeholder="Bring a friend"
          multiline
        />
      </>
    );
  }

  return (
    <>
      <Field
        id="wa-phone"
        label="Phone number"
        hint="Country code first, no leading zero. Spaces, brackets and + are fine."
        value={fields.waPhone}
        onChange={(v) => set("waPhone", v)}
        placeholder="+44 20 7946 0000"
        type="tel"
        autoFocus
      />
      <Field
        id="wa-message"
        label="Message to start with"
        hint="Optional. Appears in the box, ready to send."
        value={fields.waMessage}
        onChange={(v) => set("waMessage", v)}
        placeholder="Hello, I saw your poster"
        multiline
      />
    </>
  );
}

function Appearance({
  colours,
  setColours,
  contrast,
  logo,
  setLogo,
  logoInputRef,
}: {
  colours: Colours;
  setColours: (c: Colours) => void;
  contrast: ReturnType<typeof judgeContrast>;
  logo: string | null;
  setLogo: (v: string | null) => void;
  logoInputRef: React.RefObject<HTMLInputElement | null>;
}) {
  function pickLogo(file: File | undefined) {
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => setLogo(typeof reader.result === "string" ? reader.result : null);
    reader.readAsDataURL(file);
  }

  return (
    <fieldset>
      <legend className="text-[14px] font-semibold">Colour and logo</legend>

      <div className="mt-2 flex flex-wrap gap-4">
        <label className="flex items-center gap-2 text-[14px]">
          <input
            type="color"
            aria-label="Code colour"
            value={colours.dark}
            onChange={(event) => setColours({ ...colours, dark: event.target.value })}
            className="h-8 w-10 cursor-pointer rounded border border-line bg-background"
          />
          Code colour
        </label>
        <label className="flex items-center gap-2 text-[14px]">
          <input
            type="color"
            aria-label="Background colour"
            value={colours.light}
            onChange={(event) => setColours({ ...colours, light: event.target.value })}
            className="h-8 w-10 cursor-pointer rounded border border-line bg-background"
          />
          Background
        </label>
        {colours.dark !== DEFAULT_COLOURS.dark || colours.light !== DEFAULT_COLOURS.light ? (
          <button
            type="button"
            onClick={() => setColours(DEFAULT_COLOURS)}
            className="text-[13px] text-text-light hover:text-primary-dark"
          >
            Reset to black on white
          </button>
        ) : null}
      </div>

      {contrast.level !== "ok" ? (
        <p
          role="alert"
          className={[
            "mt-2 text-[13px]",
            contrast.level === "bad" ? "text-warn" : "text-text-light",
          ].join(" ")}
        >
          {contrast.message}
        </p>
      ) : null}

      <div className="mt-4">
        {logo ? (
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={logo} alt="The logo to place in the centre" className="h-10 w-10 rounded object-contain" />
            <button
              type="button"
              onClick={() => setLogo(null)}
              className="text-[13px] text-text-light hover:text-primary-dark"
            >
              Remove logo
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => logoInputRef.current?.click()}
            className="ek-btn ek-btn-quiet"
          >
            Add a centre logo
          </button>
        )}
        <input
          ref={logoInputRef}
          type="file"
          accept="image/*"
          aria-label="Choose a logo image"
          className="sr-only"
          onChange={(event) => {
            pickLogo(event.target.files?.[0]);
            event.target.value = "";
          }}
        />
        <p className="mt-1 text-[13px] text-text-light">
          Optional. A small logo sits in the middle, and the code switches to its toughest level so
          it still scans. Keep the logo simple, and test the finished code before you print it.
        </p>
      </div>
    </fieldset>
  );
}

/** A rounded rectangle path, since not every canvas has roundRect built in. */
function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + width, y, x + width, y + height, r);
  ctx.arcTo(x + width, y + height, x, y + height, r);
  ctx.arcTo(x, y + height, x, y, r);
  ctx.arcTo(x, y, x + width, y, r);
  ctx.closePath();
}

function Field({
  id,
  label,
  hint,
  value,
  onChange,
  placeholder,
  type = "text",
  multiline,
  autoFocus,
}: {
  id: string;
  label: string;
  hint?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  type?: string;
  multiline?: boolean;
  autoFocus?: boolean;
}) {
  const className =
    "mt-2 w-full rounded-[10px] border border-line bg-background px-3 py-2 text-[15px] outline-none placeholder:text-text-light focus:border-primary";

  return (
    <div>
      <label htmlFor={id} className="block text-[14px] font-semibold">
        {label}
      </label>
      {multiline ? (
        <textarea
          id={id}
          rows={3}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className={className}
          autoFocus={autoFocus}
        />
      ) : (
        <input
          id={id}
          type={type}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className={className}
          autoFocus={autoFocus}
        />
      )}
      {hint ? <p className="mt-1 text-[13px] text-text-light">{hint}</p> : null}
    </div>
  );
}
