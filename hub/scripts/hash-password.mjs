/**
 * Print a bcrypt hash of a password, to paste into .env.production.
 *
 *   npm run hash-password -- "the password you chose"
 *
 * The plaintext is read from the argument, hashed, and dropped. It is not
 * written to a file, not echoed back, and not logged anywhere. What is printed
 * is the hash, which is the only half the server ever needs.
 *
 * One caveat worth knowing rather than hiding: an argument passed on a command
 * line lands in that shell's history and is visible to `ps` while the command
 * runs. Run it once, on your own machine, then clear the line from history if
 * that matters to you. Reading from a prompt instead would avoid it, and would
 * also make this impossible to run over a pipe.
 */

import { hash } from "bcryptjs";

/** Twelve rounds: slow enough to matter offline, quick enough to log in. */
const ROUNDS = 12;

const password = process.argv[2];

if (!password) {
  console.error('Usage: npm run hash-password -- "your password"');
  process.exit(1);
}

if (password.length < 12) {
  console.error(
    `That password is ${password.length} characters. This is the only door to the ` +
      "dashboard and there is no lockout worth the name behind it, so use at least 12.",
  );
  process.exit(1);
}

const digest = await hash(password, ROUNDS);

console.log();
console.log("Paste this line into /root/codes/EveryKit/.env.production,");
console.log("exactly as printed. The dollar signs are part of the hash, and the");
console.log("reader in ecosystem.config.js does not expand them.");
console.log();
console.log(`ADMIN_PASSWORD_HASH=${digest}`);
console.log();
