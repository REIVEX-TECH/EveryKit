"use client";

import { useMemo, useState } from "react";
import { ShieldAlert } from "lucide-react";
import { REGISTERED_CLAIMS, claimDate, decodeJwt, expiryState } from "@/lib/dev/jwt";
import { relative, toLocalString, localZoneName } from "@/lib/dev/timestamp";
import { CodeBlock, CopyButton, Note, TextBox } from "./ui";

/**
 * A JWT taken apart, with the disclaimer given as much room as the output.
 *
 * The banner is not decoration and is not dismissible. Every decoder on the
 * internet looks like a validator, people paste production tokens into them,
 * and the two facts that matter, that nothing is verified and nothing is sent,
 * belong above the result rather than in a footnote under it.
 */
export function JwtTool() {
  const [token, setToken] = useState("");
  const result = useMemo(() => decodeJwt(token), [token]);
  const zone = useMemo(() => localZoneName(), []);

  const expiry = result.ok ? expiryState(result.token.payload) : null;
  const issued = result.ok ? claimDate(result.token.payload, "iat") : null;

  return (
    <div className="flex flex-col gap-5">
      <div className="ek-card flex items-start gap-3 bg-bg-soft p-4">
        <ShieldAlert aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-warn" />
        <div className="text-[14px]">
          <p className="font-semibold">The signature is not checked.</p>
          <p className="mt-1 text-text-light">
            This splits the token on its dots and decodes the first two parts. It does not verify
            anything, because verifying needs the signing key and no page should ask you for that.
            A token that decodes cleanly here is well formed, which is not the same as valid.
          </p>
          <p className="mt-1 text-text-light">
            The token is read in this page and is not sent anywhere. You can check that in your
            browser&apos;s network tab: pasting one produces no request at all.
          </p>
        </div>
      </div>

      <div>
        <label htmlFor="jwt-in" className="block text-[14px] font-semibold">
          Token
        </label>
        <TextBox
          id="jwt-in"
          value={token}
          onChange={(event) => setToken(event.target.value)}
          placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.signature"
          className="mt-2 min-h-[120px]"
        />
      </div>

      {token.trim() !== "" && !result.ok ? <Note tone="bad">{result.message}</Note> : null}

      {result.ok ? (
        <>
          {expiry && expiry.state !== "none" ? (
            <div className="ek-card p-3">
              <p className="text-[14px]">
                {expiry.state === "expired"
                  ? "Expired "
                  : expiry.state === "not-yet"
                    ? "Not valid until "
                    : "Expires "}
                <strong className="font-semibold">{relative(expiry.at)}</strong>, at{" "}
                {toLocalString(expiry.at)} in {zone}.
              </p>
              {issued ? (
                <p className="mt-1 text-[13px] text-text-light">
                  Issued {relative(issued)}, at {toLocalString(issued)}.
                </p>
              ) : null}
            </div>
          ) : null}

          <div className="grid gap-5 lg:grid-cols-2">
            <section>
              <div className="flex items-baseline justify-between gap-3">
                <h2 className="text-[15px]">Header</h2>
                <CopyButton
                  text={result.token.headerText}
                  className="ek-btn ek-btn-quiet px-3 py-1.5 text-[13px]"
                />
              </div>
              <CodeBlock className="mt-2">{result.token.headerText}</CodeBlock>
            </section>

            <section>
              <div className="flex items-baseline justify-between gap-3">
                <h2 className="text-[15px]">Payload</h2>
                <CopyButton
                  text={result.token.payloadText}
                  className="ek-btn ek-btn-accent px-3 py-1.5 text-[13px]"
                />
              </div>
              <CodeBlock className="mt-2">{result.token.payloadText}</CodeBlock>
            </section>
          </div>

          <section>
            <h2 className="text-[15px]">Claims</h2>
            <dl className="ek-card mt-2 divide-y divide-line">
              {Object.entries(result.token.payload).map(([name, value]) => (
                <div key={name} className="flex flex-wrap gap-x-3 gap-y-1 px-3 py-2">
                  <dt className="w-32 shrink-0 font-mono text-[13px] font-semibold">{name}</dt>
                  <dd className="min-w-0 flex-1 break-words text-[13px] text-text-light">
                    {typeof value === "object" ? JSON.stringify(value) : String(value)}
                    {REGISTERED_CLAIMS[name] ? (
                      <span className="ml-2 text-text-light">({REGISTERED_CLAIMS[name]})</span>
                    ) : null}
                    {["exp", "iat", "nbf"].includes(name) && claimDate(result.token.payload, name) ? (
                      <span className="ml-2">
                        {toLocalString(claimDate(result.token.payload, name) as Date)}
                      </span>
                    ) : null}
                  </dd>
                </div>
              ))}
            </dl>
          </section>

          <section>
            <h2 className="text-[15px]">Signature</h2>
            <p className="mt-1 text-[13px] text-text-light">
              Shown as the opaque string it is. Checking it would need the key.
            </p>
            <CodeBlock className="mt-2">{result.token.signature}</CodeBlock>
          </section>
        </>
      ) : null}
    </div>
  );
}
