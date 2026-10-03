/**
 * DEVELOPMENT ADAPTER — SIMULATED EMAIL. Nothing is sent.
 * Each message is written to .data/outbox as .html and .json so it can be
 * inspected. DEV_MAIL_FAILURE=transient|permanent simulates provider errors.
 */
import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { serverConfig } from "../config";
import { PermanentMailError, type Mailer, type OutgoingEmail } from "../types";

export class DevMailer implements Mailer {
  readonly label = "SIMULATED email (written to .data/outbox, not sent)";
  private sent = new Map<string, string>();

  async send(email: OutgoingEmail) {
    if (serverConfig.devMailFailure === "permanent") throw new PermanentMailError("Simulated permanent failure");
    if (serverConfig.devMailFailure === "transient") throw new Error("Simulated transient failure");

    const existing = this.sent.get(email.idempotencyKey);
    if (existing) return { providerMessageId: existing };

    const id = `dev_${crypto.randomUUID()}`;
    const dir = path.join(serverConfig.devDataDir, "outbox");
    await fs.mkdir(dir, { recursive: true });
    const base = path.join(dir, `${new Date().toISOString().replace(/[:.]/g, "-")}_${id}`);
    await fs.writeFile(`${base}.html`, email.html);
    await fs.writeFile(`${base}.json`, JSON.stringify({ ...email, html: undefined, providerMessageId: id }, null, 2));
    this.sent.set(email.idempotencyKey, id);
    return { providerMessageId: id };
  }
}
