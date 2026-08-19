"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Download } from "lucide-react";
import { EmailGate } from "@/components/site/EmailGate";
import { MoreFromEveryKit } from "@/components/site/MoreFromEveryKit";
import { hasGivenEmail } from "@/lib/emailCapture";
import { revealResult } from "@/lib/revealResult";
import {
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
  QUIET_ZONE,
  scaleFor,
  toMatrix,
  toRgba,
  toSvg,
  type ErrorCorrection,
} from "@/lib/qr/render";

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
  }
}

export function QrWorkbench({ kind }: { kind: QrKind }) {
  const [fields, setFields] = useState<Fields>(EMPTY);
  const [level, setLevel] = useState<ErrorCorrection>("M");
  const [gateFor, setGateFor] = useState<(() => void) | null>(null);
  const resultRef = useRef<HTMLDivElement>(null);

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
    const matrix = toMatrix(payload, level);
    return { matrix, svg: toSvg(matrix), payload };
  }, [payload, level]);

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
    const { data, width, height } = toRgba(code.matrix, scale);
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) return;
    context.putImageData(new ImageData(data, width, height), 0, 0);
    canvas.toBlob((blob) => {
      if (blob) download(blob, `${fileStem(kind)}.png`);
    }, "image/png");
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
                  level === option.value
                    ? "border-primary bg-primary/5"
                    : "border-line hover:border-line-strong",
                ].join(" ")}
              >
                <span className="flex items-center gap-2 text-[14px] font-semibold">
                  <input
                    type="radio"
                    name="level"
                    checked={level === option.value}
                    onChange={() => setLevel(option.value)}
                    className="h-4 w-4 accent-[var(--color-primary)]"
                  />
                  {option.label}
                </span>
                <span className="mt-0.5 pl-6 text-[12px] text-text-light">{option.detail}</span>
              </label>
            ))}
          </div>
        </fieldset>

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
                  ? `${describeKind(kind)} — ${code.matrix.size} x ${code.matrix.size} modules`
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
                  onCancel={() => {
                    gateFor();
                    setGateFor(null);
                  }}
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
