/**
 * Operator tools for stored quote requests. Uses the same adapters as the
 * site: Supabase when SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY are set, else the
 * local development store.
 *
 *   npm run ops -- list [n]                 latest requests
 *   npm run ops -- show <reference>         full request, photos and email status
 *   npm run ops -- photo-links <reference>  fresh 7-day private photo links
 *   npm run ops -- failed                   notifications needing attention
 *   npm run ops -- retry <reference>        re-queue that request's failed emails
 *   npm run ops -- send-due                 run the email worker once
 */
import { getStorage, getStore } from "../src/lib/server/adapters";
import { serverConfig } from "../src/lib/server/config";
import { processOutbox } from "../src/lib/server/outbox";

async function main() {
  const [cmd, arg] = process.argv.slice(2);
  const store = getStore();
  console.error(`(using ${store.label})`);

  switch (cmd) {
    case "list": {
      for (const r of await store.listQuoteRequests(Number(arg ?? 20))) {
        console.log(`${r.createdAt}  ${r.reference}  ${r.request.serviceType}  ${r.request.pickup.city} -> ${r.request.dropoff.city}`);
      }
      break;
    }
    case "show": {
      const r = await store.getQuoteRequest(arg);
      if (!r) throw new Error(`No request ${arg}`);
      console.log(JSON.stringify(r, null, 2));
      break;
    }
    case "photo-links": {
      const r = await store.getQuoteRequest(arg);
      if (!r) throw new Error(`No request ${arg}`);
      const storage = getStorage();
      for (const a of r.attachments.filter((x) => x.storageKey)) {
        console.log(`${a.originalName}: ${await storage.signedReadUrl(a.storageKey!, serverConfig.photoLinkTtlSeconds)}`);
      }
      break;
    }
    case "failed": {
      for (const j of await store.listJobsNeedingAttention()) {
        const r = await store.getQuoteRequest(j.quoteRequestId);
        console.log(`${r?.reference}  ${j.kind}  ${j.status}  attempts=${j.attempts}  ${j.lastError ?? ""}`);
      }
      break;
    }
    case "retry": {
      const r = await store.getQuoteRequest(arg);
      if (!r) throw new Error(`No request ${arg}`);
      for (const j of r.notifications.filter((n) => ["failed", "bounced"].includes(n.status) || n.needsAttention)) {
        await store.updateJob(j.id, { status: "pending", needsAttention: false, nextAttemptAt: new Date().toISOString(), attempts: 0 });
        console.log(`re-queued ${j.kind} to ${j.recipient}`);
      }
      console.log(JSON.stringify(await processOutbox({ requestId: r.id }), null, 2));
      break;
    }
    case "send-due": {
      console.log(JSON.stringify(await processOutbox({ limit: 100 }), null, 2));
      break;
    }
    default:
      console.log("Commands: list [n] | show <ref> | photo-links <ref> | failed | retry <ref> | send-due");
  }
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
