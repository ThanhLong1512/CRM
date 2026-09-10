import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import crypto from "crypto";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
]);

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!ALLOWED_MIME_TYPES.has(file.type.toLowerCase())) {
      return NextResponse.json(
        { error: "Chỉ hỗ trợ file ảnh (JPG, PNG, WEBP, GIF)" },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "Kích thước ảnh tối đa là 10MB" },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Xác định phần mở rộng
    let ext = path.extname(file.name).toLowerCase();
    if (!ext || ext === ".") {
      if (file.type === "image/png") ext = ".png";
      else if (file.type === "image/webp") ext = ".webp";
      else if (file.type === "image/gif") ext = ".gif";
      else ext = ".jpg";
    }

    const uniqueId = crypto.randomBytes(8).toString("hex");
    const safeFileName = `chat_${Date.now()}_${uniqueId}${ext}`;

    const uploadDir = path.join(process.cwd(), "public", "uploads", "chat");
    await mkdir(uploadDir, { recursive: true });

    const filePath = path.join(uploadDir, safeFileName);
    await writeFile(filePath, buffer);

    const fileUrl = `/uploads/chat/${safeFileName}`;

    return NextResponse.json({ url: fileUrl }, { status: 201 });
  } catch (error) {
    console.error("[Chat Upload Error]:", error);
    return NextResponse.json(
      { error: "Lỗi trong quá trình tải ảnh lên" },
      { status: 500 }
    );
  }
}
