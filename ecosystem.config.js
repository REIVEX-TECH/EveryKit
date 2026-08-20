/**
 * PM2 process definitions for the four EveryKit apps on the VPS.
 *
 * Each app is a normal `next start` behind nginx, on its own localhost port.
 * Nothing here listens on a public interface — nginx is the only thing bound
 * to 80 and 443, and it terminates TLS.
 *
 * Secrets are NOT in this file, because it is committed. Real values live in
 * /root/codes/EveryKit/.env.production, which is git-ignored; see
 * .env.production.example for the shape. That file is read below and merged
 * into each app's environment.
 */

const fs = require("fs");
const path = require("path");

const ROOT = __dirname;
const ENV_FILE = path.join(ROOT, ".env.production");

/**
 * A small KEY=VALUE reader, rather than pulling in dotenv.
 *
 * PM2 has no built-in env-file support, and adding a dependency to the process
 * manager's own config is a poor trade for thirty lines. Handles comments,
 * blank lines, `export` prefixes and quoted values; deliberately does not do
 * variable interpolation, because a password containing `$` should stay
 * literal.
 */
function readEnvFile(file) {
  if (!fs.existsSync(file)) {
    console.warn(
      `[ecosystem] ${file} not found. Apps will start without DATABASE_URL, ` +
        `so /api/subscribe will answer 500 and the kits will fail open.`,
    );
    return {};
  }

  const out = {};
  for (const raw of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const line = raw.trim();
    if (line === "" || line.startsWith("#")) continue;
    const match = /^(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/.exec(line);
    if (!match) continue;
    let value = match[2].trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    out[match[1]] = value;
  }
  return out;
}

const secrets = readEnvFile(ENV_FILE);

/** Values that are the same everywhere and are not secret. */
const shared = {
  NODE_ENV: "production",
  NEXT_PUBLIC_HUB_URL: "https://useeverykit.com",
  NEXT_PUBLIC_PAYMENTS_ENABLED: "false",
};

function app(name, folder, port, env) {
  return {
    name,
    cwd: path.join(ROOT, folder),
    // Next's binary directly, rather than `npm run start`. The package.json
    // start scripts carry their own -p for local convenience, and letters'
    // hardcodes 3100 — going through npm would produce `next start -p 3100 -p
    // 3002` and leave which port wins to chance. This has one source of truth.
    script: "node_modules/next/dist/bin/next",
    args: `start -p ${port}`,
    // One process each. These are stateless request handlers, but the box is
    // small and four Next servers already have their own memory footprint;
    // cluster mode can come later if traffic asks for it.
    instances: 1,
    exec_mode: "fork",
    autorestart: true,
    max_restarts: 10,
    // A Next server that is still crash-looping after this much memory is
    // wrong, not busy.
    max_memory_restart: "512M",
    env: { ...shared, PORT: String(port), ...env },
  };
}

module.exports = {
  apps: [
    app("everykit-hub", "hub", 3010, {
      NEXT_PUBLIC_SITE_URL: "https://useeverykit.com",
      // Only the hub talks to Postgres. The kits post to its endpoint and
      // never hold credentials.
      DATABASE_URL: secrets.DATABASE_URL || "",
      // The dashboard. Only the hub has these, and no kit ever sees them.
      ADMIN_EMAIL: secrets.ADMIN_EMAIL || "",
      ADMIN_PASSWORD_HASH: secrets.ADMIN_PASSWORD_HASH || "",
      SESSION_SECRET: secrets.SESSION_SECRET || "",
    }),
    app("everykit-photos", "photos", 3011, {
      NEXT_PUBLIC_SITE_URL: "https://photos.useeverykit.com",
    }),
    app("everykit-letters", "letters", 3012, {
      NEXT_PUBLIC_SITE_URL: "https://letters.useeverykit.com",
      NEXT_PUBLIC_AI_POLISH_ENABLED: "false",
    }),
    app("everykit-pdf", "pdf", 3013, {
      NEXT_PUBLIC_SITE_URL: "https://pdf.useeverykit.com",
    }),
    app("everykit-qr", "qr", 3014, {
      NEXT_PUBLIC_SITE_URL: "https://qr.useeverykit.com",
    }),
    app("everykit-images", "images", 3015, {
      NEXT_PUBLIC_SITE_URL: "https://images.useeverykit.com",
    }),
    app("everykit-background", "background", 3018, {
      NEXT_PUBLIC_SITE_URL: "https://background.useeverykit.com",
    }),
    app("everykit-text", "text", 3020, {
      NEXT_PUBLIC_SITE_URL: "https://text.useeverykit.com",
    }),
    app("everykit-sign", "sign", 3016, {
      NEXT_PUBLIC_SITE_URL: "https://sign.useeverykit.com",
    }),
    app("everykit-invoice", "invoice", 3017, {
      NEXT_PUBLIC_SITE_URL: "https://invoice.useeverykit.com",
    }),
    app("everykit-ringtone", "ringtone", 3019, {
      NEXT_PUBLIC_SITE_URL: "https://ringtone.useeverykit.com",
    }),
    app("everykit-dev", "dev", 3021, {
      NEXT_PUBLIC_SITE_URL: "https://dev.useeverykit.com",
    }),
    app("everykit-study", "study", 3022, {
      NEXT_PUBLIC_SITE_URL: "https://study.useeverykit.com",
    }),
    app("everykit-calc", "calc", 3023, {
      NEXT_PUBLIC_SITE_URL: "https://calc.useeverykit.com",
    }),
  ],
};
