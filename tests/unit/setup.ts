import fs from "node:fs";
import os from "node:os";
import path from "node:path";

process.env.DEV_DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), "jmt-test-"));
process.env.MIN_FORM_SECONDS = "0";
process.env.UPLOAD_TOKEN_SECRET = "test-secret";
