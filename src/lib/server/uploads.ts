import crypto from "node:crypto";
import { PHOTO_LIMITS } from "@/lib/quote/options";
import { getStorage, getStore } from "./adapters";
import { verifyDraftToken } from "./draft-token";
import { ImageRejectedError, processImage } from "./images";

type Fail = { ok: false; status: number; error: string };

export async function signUpload(body: { draftToken?: string; name?: string; type?: string; size?: number }) {
  const draft = body.draftToken ? verifyDraftToken(body.draftToken) : null;
  if (!draft) return { ok: false, status: 400, error: "Your form session expired. Please refresh the page." } satisfies Fail;

  const type = String(body.type ?? "");
  const size = Number(body.size);
  if (!(PHOTO_LIMITS.acceptedTypes as readonly string[]).includes(type)) {
    return { ok: false, status: 415, error: "Only JPEG, PNG and WebP photos are accepted. iPhone HEIC photos can be shared as JPEG." } satisfies Fail;
  }
  if (!Number.isFinite(size) || size <= 0 || size > PHOTO_LIMITS.maxBytesEach) {
    return { ok: false, status: 413, error: "Each photo must be 10 MB or smaller." } satisfies Fail;
  }

  const store = getStore();
  const existing = (await store.listDraftAttachments(draft.draftId)).filter((a) => a.status !== "rejected");
  if (existing.length >= PHOTO_LIMITS.maxFiles) {
    return { ok: false, status: 409, error: `You can add up to ${PHOTO_LIMITS.maxFiles} photos.` } satisfies Fail;
  }
  const total = existing.reduce((n, a) => n + (a.finalSize ?? a.declaredSize), 0);
  if (total + size > PHOTO_LIMITS.maxBytesTotal) {
    return { ok: false, status: 413, error: "Photos can total up to 50 MB." } satisfies Fail;
  }

  const id = crypto.randomUUID();
  const uploadKey = `incoming/${draft.draftId}/${id}`;
  await store.createAttachment({
    id,
    draftId: draft.draftId,
    quoteRequestId: null,
    status: "pending",
    originalName: String(body.name ?? "photo").replace(/[^\w .()-]/g, "_").slice(0, 120),
    declaredType: type,
    declaredSize: size,
    uploadKey,
    storageKey: null,
    finalSize: null,
    width: null,
    height: null,
    createdAt: new Date().toISOString(),
  });
  const upload = await getStorage().createUploadUrl(uploadKey, type);
  return { ok: true as const, attachmentId: id, uploadUrl: upload.url, headers: upload.headers };
}

/** Validates the uploaded bytes, re-encodes them and marks the attachment ready. */
export async function completeUpload(body: { draftToken?: string; attachmentId?: string }) {
  const draft = body.draftToken ? verifyDraftToken(body.draftToken) : null;
  if (!draft) return { ok: false, status: 400, error: "Your form session expired. Please refresh the page." } satisfies Fail;
  const store = getStore();
  const storage = getStorage();
  const att = body.attachmentId ? await store.getAttachment(body.attachmentId) : null;
  if (!att || att.draftId !== draft.draftId || att.quoteRequestId) {
    return { ok: false, status: 404, error: "Upload not found. Please try again." } satisfies Fail;
  }
  if (att.status === "ready") return { ok: true as const, attachmentId: att.id };

  const raw = await storage.read(att.uploadKey);
  if (!raw) return { ok: false, status: 409, error: "The upload did not finish. Please retry." } satisfies Fail;

  try {
    const img = await processImage(raw);
    const storageKey = `photos/${draft.draftId}/${att.id}.jpg`;
    await storage.write(storageKey, img.data, "image/jpeg");
    await store.updateAttachment(att.id, {
      status: "ready",
      storageKey,
      finalSize: img.data.length,
      width: img.width,
      height: img.height,
    });
    await storage.remove([att.uploadKey]);
    return { ok: true as const, attachmentId: att.id };
  } catch (e) {
    await storage.remove([att.uploadKey]);
    await store.updateAttachment(att.id, { status: "rejected" });
    if (e instanceof ImageRejectedError) return { ok: false, status: 422, error: e.message } satisfies Fail;
    throw e;
  }
}

export async function removeUpload(body: { draftToken?: string; attachmentId?: string }) {
  const draft = body.draftToken ? verifyDraftToken(body.draftToken) : null;
  if (!draft) return { ok: false, status: 400, error: "Your form session expired." } satisfies Fail;
  const store = getStore();
  const att = body.attachmentId ? await store.getAttachment(body.attachmentId) : null;
  if (!att || att.draftId !== draft.draftId || att.quoteRequestId) return { ok: true as const };
  await getStorage().remove([att.uploadKey, ...(att.storageKey ? [att.storageKey] : [])]);
  await store.deleteAttachment(att.id);
  return { ok: true as const };
}
