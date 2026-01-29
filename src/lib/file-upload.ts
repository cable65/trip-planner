import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { randomUUID } from "crypto";

const UPLOAD_DIR = join(process.cwd(), "public/uploads/vendor");

export async function saveUploadedFile(file: File, type: "logo" | "banner" | "document" | "media"): Promise<string | null> {
  if (!file || file.size === 0) return null;

  // Validation
  const validTypes = [
    "image/jpeg", "image/png", "image/webp", 
    "application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "application/vnd.ms-excel", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "video/mp4", "video/webm", "video/quicktime"
  ];
  if (!validTypes.includes(file.type)) {
    throw new Error(`Invalid file type: ${file.type}`);
  }

  const maxSize = type === "logo" ? 2 * 1024 * 1024 : 
                  type === "banner" ? 5 * 1024 * 1024 : 
                  type === "media" ? 50 * 1024 * 1024 : // 50MB for media
                  20 * 1024 * 1024;
  if (file.size > maxSize) {
    throw new Error(`File too large. Max size for ${type} is ${maxSize / 1024 / 1024}MB`);
  }

  // Ensure dir exists
  await mkdir(UPLOAD_DIR, { recursive: true });

  const buffer = Buffer.from(await file.arrayBuffer());
  const ext = file.name.split(".").pop() || "bin";
  const filename = `${type}-${randomUUID()}.${ext}`;
  const filepath = join(UPLOAD_DIR, filename);

  await writeFile(filepath, buffer);

  return `/uploads/vendor/${filename}`;
}
