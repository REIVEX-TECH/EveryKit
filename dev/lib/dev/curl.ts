/**
 * Parse a curl command and re-express it as fetch, axios and Python requests.
 *
 * Curl has a hundred flags; this covers the ones that shape a request people
 * actually paste: the method, headers, body, basic auth and the URL. Anything it
 * does not model is collected and reported rather than silently dropped, so the
 * output is never quietly wrong about what the request does.
 */

export type ParsedCurl = {
  method: string;
  url: string;
  headers: Array<[string, string]>;
  data: string | null;
  json: boolean;
  auth: { user: string; password: string } | null;
  unsupported: string[];
};

/** Shell-style tokenizer: single and double quotes, backslash escapes, line continuations. */
export function tokenize(input: string): string[] {
  const tokens: string[] = [];
  let token = "";
  let quote: '"' | "'" | null = null;
  let has = false;

  for (let i = 0; i < input.length; i += 1) {
    const c = input[i];
    if (quote === "'") {
      if (c === "'") quote = null;
      else token += c;
      continue;
    }
    if (quote === '"') {
      if (c === '"') quote = null;
      else if (c === "\\" && i + 1 < input.length && '"\\$`'.includes(input[i + 1])) {
        token += input[++i];
      } else token += c;
      continue;
    }
    if (c === "'" || c === '"') {
      quote = c;
      has = true;
    } else if (c === "\\") {
      if (input[i + 1] === "\n") i += 1;
      else if (i + 1 < input.length) {
        token += input[++i];
        has = true;
      }
    } else if (/\s/.test(c)) {
      if (has) {
        tokens.push(token);
        token = "";
        has = false;
      }
    } else {
      token += c;
      has = true;
    }
  }
  if (has) tokens.push(token);
  return tokens;
}

const NO_ARG_IGNORED: Record<string, string> = {
  "--compressed": "--compressed",
  "-L": "-L (follow redirects)",
  "--location": "--location (follow redirects)",
  "-k": "-k (insecure TLS)",
  "--insecure": "--insecure (insecure TLS)",
  "-s": "-s (silent)",
  "--silent": "--silent (silent)",
  "-v": "-v (verbose)",
  "--verbose": "--verbose (verbose)",
  "-i": "-i (include headers in output)",
  "-f": "-f (fail silently)",
  "--fail": "--fail (fail silently)",
};

export function parseCurl(command: string): { parsed: ParsedCurl } | { error: string } {
  const tokens = tokenize(command.trim());
  if (tokens.length === 0) return { error: "" };
  let i = 0;
  if (tokens[0] === "curl") i = 1;

  let method = "";
  let url = "";
  const headers: Array<[string, string]> = [];
  const dataParts: string[] = [];
  let json = false;
  let auth: { user: string; password: string } | null = null;
  let getWithData = false;
  const unsupported: string[] = [];
  const next = () => tokens[++i];

  for (; i < tokens.length; i += 1) {
    const t = tokens[i];
    if (t === "-X" || t === "--request") {
      method = (next() ?? "").toUpperCase();
    } else if (t === "-H" || t === "--header") {
      const raw = next() ?? "";
      const idx = raw.indexOf(":");
      if (idx > 0) headers.push([raw.slice(0, idx).trim(), raw.slice(idx + 1).trim()]);
    } else if (t === "-d" || t === "--data" || t === "--data-raw" || t === "--data-binary" || t === "--data-ascii") {
      dataParts.push(next() ?? "");
    } else if (t === "--data-urlencode") {
      dataParts.push(next() ?? "");
      if (!unsupported.includes("--data-urlencode (encoding not applied)")) unsupported.push("--data-urlencode (encoding not applied)");
    } else if (t === "--json") {
      dataParts.push(next() ?? "");
      json = true;
    } else if (t === "-u" || t === "--user") {
      const raw = next() ?? "";
      const idx = raw.indexOf(":");
      auth = idx >= 0 ? { user: raw.slice(0, idx), password: raw.slice(idx + 1) } : { user: raw, password: "" };
    } else if (t === "-b" || t === "--cookie") {
      headers.push(["Cookie", next() ?? ""]);
    } else if (t === "-A" || t === "--user-agent") {
      headers.push(["User-Agent", next() ?? ""]);
    } else if (t === "-e" || t === "--referer") {
      headers.push(["Referer", next() ?? ""]);
    } else if (t === "-G" || t === "--get") {
      getWithData = true;
    } else if (t === "--url") {
      url = next() ?? "";
    } else if (t === "-F" || t === "--form") {
      next();
      if (!unsupported.includes("-F/--form (multipart form data)")) unsupported.push("-F/--form (multipart form data)");
    } else if (NO_ARG_IGNORED[t]) {
      if (!unsupported.includes(NO_ARG_IGNORED[t])) unsupported.push(NO_ARG_IGNORED[t]);
    } else if (t.startsWith("-") && t !== "-") {
      unsupported.push(t);
    } else if (url === "") {
      url = t;
    }
  }

  if (url === "") return { error: "No URL was found in that command." };

  const data = dataParts.length ? dataParts.join("&") : null;
  if (json && !headers.some(([k]) => k.toLowerCase() === "content-type")) {
    headers.push(["Content-Type", "application/json"]);
  }

  // Method defaulting, the way curl does it: POST when there is a body.
  if (method === "") method = data !== null && !getWithData ? "POST" : "GET";

  // -G moves the data onto the query string.
  if (getWithData && data) {
    url += (url.includes("?") ? "&" : "?") + data;
  }

  return {
    parsed: { method, url, headers, data: getWithData ? null : data, json, auth, unsupported },
  };
}
