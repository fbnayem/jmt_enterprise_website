/** Transactional email through Resend. */
import { Resend } from "resend";
import { serverConfig } from "./config";
import { PermanentMailError, type Mailer, type OutgoingEmail } from "./types";

// Resend error names that will not succeed on retry.
const PERMANENT = new Set([
  "validation_error",
  "missing_required_field",
  "invalid_from_address",
  "invalid_to_address",
  "invalid_parameter",
  "restricted_api_key",
  "invalid_api_key",
]);

export class ResendMailer implements Mailer {
  readonly label = "Resend";
  private client = new Resend(serverConfig.resendApiKey);

  async send(email: OutgoingEmail) {
    const { data, error } = await this.client.emails.send(
      {
        from: email.from,
        to: email.to,
        replyTo: email.replyTo,
        subject: email.subject,
        html: email.html,
        text: email.text,
      },
      // Resend de-duplicates sends with the same key for 24 hours, so a retry
      // after a timeout cannot deliver the same notification twice.
      { idempotencyKey: email.idempotencyKey },
    );
    if (error) {
      const msg = `${error.name}: ${error.message}`;
      if (PERMANENT.has(error.name)) throw new PermanentMailError(msg);
      throw new Error(msg);
    }
    return { providerMessageId: data!.id };
  }
}
