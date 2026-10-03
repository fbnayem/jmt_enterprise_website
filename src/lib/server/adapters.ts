import { assertDevAdaptersAllowed, usingResend, usingSupabase } from "./config";
import { DevMailer } from "./dev/dev-mailer";
import { DevPhotoStorage } from "./dev/dev-storage";
import { DevLeadStore } from "./dev/dev-store";
import { ResendMailer } from "./resend-mailer";
import { SupabasePhotoStorage } from "./supabase/supabase-storage";
import { SupabaseLeadStore } from "./supabase/supabase-store";
import type { LeadStore, Mailer, PhotoStorage } from "./types";

let store: LeadStore | undefined;
let storage: PhotoStorage | undefined;
let mailer: Mailer | undefined;

export function getStore(): LeadStore {
  if (!store) {
    if (usingSupabase()) store = new SupabaseLeadStore();
    else {
      assertDevAdaptersAllowed("Lead database (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY)");
      store = new DevLeadStore();
    }
  }
  return store;
}

export function getStorage(): PhotoStorage {
  if (!storage) {
    if (usingSupabase()) storage = new SupabasePhotoStorage();
    else {
      assertDevAdaptersAllowed("Photo storage (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY)");
      storage = new DevPhotoStorage();
    }
  }
  return storage;
}

export function getMailer(): Mailer {
  if (!mailer) {
    if (usingResend()) mailer = new ResendMailer();
    else {
      assertDevAdaptersAllowed("Email (RESEND_API_KEY)");
      mailer = new DevMailer();
    }
  }
  return mailer;
}

/** Test hook: replace adapters with fakes. */
export function setAdapters(a: { store?: LeadStore; storage?: PhotoStorage; mailer?: Mailer }) {
  if (a.store) store = a.store;
  if (a.storage) storage = a.storage;
  if (a.mailer) mailer = a.mailer;
}
