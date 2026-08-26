/**
 * Turn a parsed curl request into fetch, axios and Python requests code.
 *
 * The strings are quoted with JSON.stringify, which produces a valid double
 * quoted literal for both JavaScript and Python in the ordinary cases, so a URL
 * or a header with a space or a quote survives. Exotic bytes are the edge this
 * does not chase, and the tool says which flags it did not model.
 */

import type { ParsedCurl } from "./curl";

const q = (s: string) => JSON.stringify(s);

function headersObject(parsed: ParsedCurl): Array<[string, string]> {
  const headers = [...parsed.headers];
  if (parsed.auth) {
    // btoa is fine here: basic auth is base64 of user:password.
    const token = typeof btoa === "function"
      ? btoa(`${parsed.auth.user}:${parsed.auth.password}`)
      : Buffer.from(`${parsed.auth.user}:${parsed.auth.password}`).toString("base64");
    headers.push(["Authorization", `Basic ${token}`]);
  }
  return headers;
}

export function toFetch(parsed: ParsedCurl): string {
  const headers = headersObject(parsed);
  const opts: string[] = [`  method: ${q(parsed.method)},`];
  if (headers.length) {
    const lines = headers.map(([k, v]) => `    ${q(k)}: ${q(v)},`).join("\n");
    opts.push(`  headers: {\n${lines}\n  },`);
  }
  if (parsed.data !== null) opts.push(`  body: ${q(parsed.data)},`);
  return `fetch(${q(parsed.url)}, {\n${opts.join("\n")}\n})\n  .then((res) => res.json())\n  .then(console.log);`;
}

export function toAxios(parsed: ParsedCurl): string {
  const headers = parsed.headers;
  const lines: string[] = [`  method: ${q(parsed.method.toLowerCase())},`, `  url: ${q(parsed.url)},`];
  if (headers.length) {
    const h = headers.map(([k, v]) => `    ${q(k)}: ${q(v)},`).join("\n");
    lines.push(`  headers: {\n${h}\n  },`);
  }
  if (parsed.data !== null) lines.push(`  data: ${q(parsed.data)},`);
  if (parsed.auth) lines.push(`  auth: { username: ${q(parsed.auth.user)}, password: ${q(parsed.auth.password)} },`);
  return `axios({\n${lines.join("\n")}\n});`;
}

export function toPython(parsed: ParsedCurl): string {
  const fn = parsed.method.toLowerCase();
  const known = ["get", "post", "put", "patch", "delete", "head", "options"];
  const args: string[] = [`    ${q(parsed.url)},`];
  if (parsed.headers.length) {
    const h = parsed.headers.map(([k, v]) => `        ${q(k)}: ${q(v)},`).join("\n");
    args.push(`    headers={\n${h}\n    },`);
  }
  if (parsed.data !== null) args.push(`    data=${q(parsed.data)},`);
  if (parsed.auth) args.push(`    auth=(${q(parsed.auth.user)}, ${q(parsed.auth.password)}),`);
  const call = known.includes(fn)
    ? `requests.${fn}(\n${args.join("\n")}\n)`
    : `requests.request(\n    ${q(parsed.method)},\n${args.join("\n")}\n)`;
  return `import requests\n\nresponse = ${call}\nprint(response.json())`;
}
