/**
 * Runs the real Supabase migration against an in-memory Postgres (PGlite) to
 * prove the transactional submit function, idempotency, attachment ownership
 * and job claiming behave as the app expects.
 */
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { beforeAll, describe, expect, it } from "vitest";

let db: PGlite;

beforeAll(async () => {
  db = new PGlite();
  await db.exec(`create role anon; create role authenticated; create role service_role;`);
  const sql = fs.readFileSync(path.join(__dirname, "../../supabase/migrations/20261003000100_quote_requests.sql"), "utf8");
  await db.exec(sql);
});

const request = () => ({
  serviceType: "furniture-appliance",
  customerType: "business",
  companyName: "Acme",
  pickup: { street: "1 A St", unit: "", city: "Denver", state: "CO", zip: "80202" },
  dropoff: { street: "2 B St", unit: "Unit 4", city: "Aurora", state: "CO", zip: "80010" },
  extraStops: [{ kind: "dropoff", address: { street: "3 C St", unit: "", city: "Golden", state: "CO", zip: "80401" }, notes: "Back gate" }],
  dateMode: "date",
  requestedDate: "2030-01-15",
  timeWindow: "morning",
  items: [
    { description: "Fridge", quantity: "1", sizeKnown: "yes", length: "30", width: "30", height: "70", dimensionUnit: "in", weight: "", weightUnit: "lb", fragile: false, oversized: true },
    { description: "Chairs", quantity: "4", sizeKnown: "not-sure", length: "", width: "", height: "", dimensionUnit: "in", weight: "", weightUnit: "lb", fragile: false, oversized: false },
  ],
  vehicle: "box-truck",
  loadingHelp: "yes",
  pickupAccess: { stairs: "none", floor: "", elevator: "na", parkingNotes: "" },
  dropoffAccess: { stairs: "some", floor: "2", elevator: "no", parkingNotes: "Street parking" },
  specialInstructions: "",
  attachmentIds: [],
  photoNotes: "",
  name: "Pat",
  phone: "720-555-0100",
  email: "pat@example.com",
  preferredContact: "email",
});

const input = (over: Record<string, unknown> = {}) => ({
  id: crypto.randomUUID(),
  reference: `JMT-261003-${crypto.randomBytes(3).toString("hex").slice(0, 5).toUpperCase()}`,
  idempotencyKey: crypto.randomUUID(),
  draftId: crypto.randomUUID(),
  createdAt: new Date().toISOString(),
  timezone: "America/Denver",
  acknowledgementVersion: "v1",
  request: request(),
  source: { landingPath: "/request-a-quote" },
  jobs: [
    { id: crypto.randomUUID(), kind: "internal", recipient: "support@jmtenterprise.net" },
    { id: crypto.randomUUID(), kind: "customer_receipt", recipient: "pat@example.com" },
  ],
  ...over,
});

const submit = async (p: object, ids: string[] = []) =>
  (await db.query<{ r: { id: string; reference: string; duplicate: boolean } }>(`select submit_quote_request($1::jsonb, $2::uuid[]) as r`, [JSON.stringify(p), ids])).rows[0].r;

describe("Supabase migration", () => {
  it("saves request, stops in route order, items and jobs in one call", async () => {
    const p = input();
    const r = await submit(p);
    expect(r).toEqual({ id: p.id, reference: p.reference, duplicate: false });
    const stops = (await db.query<{ kind: string; city: string; stairs: string | null }>(`select kind, city, stairs from route_stops where quote_request_id = $1 order by position`, [p.id])).rows;
    expect(stops.map((s) => `${s.kind}:${s.city}`)).toEqual(["pickup:Denver", "dropoff:Golden", "dropoff:Aurora"]);
    expect(stops[2].stairs).toBe("some");
    expect((await db.query(`select * from items where quote_request_id = $1`, [p.id])).rows).toHaveLength(2);
    expect((await db.query(`select * from notification_jobs where quote_request_id = $1 and status = 'pending'`, [p.id])).rows).toHaveLength(2);
    const row = (await db.query<{ requested_date: Date; status: string }>(`select requested_date, status from quote_requests where id = $1`, [p.id])).rows[0];
    expect(row.status).toBe("awaiting_review");
  });

  it("is idempotent on the idempotency key", async () => {
    const p = input();
    await submit(p);
    const again = await submit({ ...p, id: crypto.randomUUID(), reference: "JMT-261003-ZZZZZ", jobs: [{ id: crypto.randomUUID(), kind: "internal", recipient: "x@y.z" }] });
    expect(again).toEqual({ id: p.id, reference: p.reference, duplicate: true });
    expect((await db.query(`select * from notification_jobs where quote_request_id = $1`, [p.id])).rows).toHaveLength(2);
  });

  it("rolls everything back when an attachment does not belong to the draft", async () => {
    const attId = crypto.randomUUID();
    await db.query(
      `insert into attachments (id, draft_id, status, original_name, declared_type, declared_size, upload_key, storage_key) values ($1, $2, 'ready', 'a.jpg', 'image/jpeg', 10, 'k', 'k2')`,
      [attId, crypto.randomUUID()],
    );
    const p = input();
    await expect(submit(p, [attId])).rejects.toThrow(/ATTACHMENT_OWNERSHIP/);
    expect((await db.query(`select * from quote_requests where id = $1`, [p.id])).rows).toHaveLength(0);
    expect((await db.query(`select * from route_stops where quote_request_id = $1`, [p.id])).rows).toHaveLength(0);
  });

  it("links ready attachments from the same draft", async () => {
    const p = input();
    const attId = crypto.randomUUID();
    await db.query(
      `insert into attachments (id, draft_id, status, original_name, declared_type, declared_size, upload_key, storage_key) values ($1, $2, 'ready', 'a.jpg', 'image/jpeg', 10, 'k', 'k2')`,
      [attId, p.draftId],
    );
    await submit(p, [attId]);
    expect((await db.query<{ quote_request_id: string }>(`select quote_request_id from attachments where id = $1`, [attId])).rows[0].quote_request_id).toBe(p.id);
  });

  it("claims each due job once", async () => {
    const first = (await db.query<{ id: string }>(`select id from claim_notification_jobs(100, 60)`)).rows;
    expect(first.length).toBeGreaterThan(0);
    const second = (await db.query(`select id from claim_notification_jobs(100, 60)`)).rows;
    expect(second).toHaveLength(0);
  });

  it("enables row level security on every table and grants the browser roles nothing", async () => {
    const rls = (await db.query<{ relname: string; relrowsecurity: boolean }>(
      `select relname, relrowsecurity from pg_class where relnamespace = 'public'::regnamespace and relkind = 'r'`,
    )).rows;
    expect(rls.length).toBe(6);
    expect(rls.every((r) => r.relrowsecurity)).toBe(true);
    const grants = (await db.query(`select * from information_schema.role_table_grants where grantee in ('anon','authenticated') and table_schema = 'public'`)).rows;
    expect(grants).toHaveLength(0);
  });
});
