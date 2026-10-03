/** Private Supabase Storage bucket with signed upload and read URLs. */
import { serverConfig } from "../config";
import type { PhotoStorage } from "../types";
import { supabaseAdmin } from "./supabase-store";

export class SupabasePhotoStorage implements PhotoStorage {
  readonly label = "Supabase Storage (private bucket)";
  private get bucket() {
    return supabaseAdmin().storage.from(serverConfig.supabaseBucket);
  }

  async createUploadUrl(key: string, contentType: string) {
    const { data, error } = await this.bucket.createSignedUploadUrl(key);
    if (error || !data) throw new Error(`Supabase storage: ${error?.message}`);
    return { url: data.signedUrl, headers: { "content-type": contentType, "x-upsert": "false" } };
  }
  async read(key: string) {
    const { data, error } = await this.bucket.download(key);
    if (error || !data) return null;
    return Buffer.from(await data.arrayBuffer());
  }
  async write(key: string, data: Buffer, contentType: string) {
    const { error } = await this.bucket.upload(key, data, { contentType, upsert: true });
    if (error) throw new Error(`Supabase storage: ${error.message}`);
  }
  async remove(keys: string[]) {
    if (!keys.length) return;
    const { error } = await this.bucket.remove(keys);
    if (error) throw new Error(`Supabase storage: ${error.message}`);
  }
  async signedReadUrl(key: string, ttlSeconds: number) {
    const { data, error } = await this.bucket.createSignedUrl(key, ttlSeconds);
    if (error || !data) throw new Error(`Supabase storage: ${error?.message}`);
    return data.signedUrl;
  }
}
