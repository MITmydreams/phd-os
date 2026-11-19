/** Keep files small enough to persist with the JSON cloud snapshot. */
export const MAX_DOCUMENT_BYTES = 3 * 1024 * 1024;

export type AttachedFile = {
  url: string;
  fileName: string;
  mimeType: string;
};

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function readFileAsAttachment(file: File): Promise<AttachedFile> {
  return new Promise((resolve, reject) => {
    if (file.size > MAX_DOCUMENT_BYTES) {
      reject(
        new Error(
          `“${file.name}” is ${formatFileSize(file.size)}. Max is ${formatFileSize(MAX_DOCUMENT_BYTES)} so it can sync across devices.`,
        ),
      );
      return;
    }
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read that file."));
    reader.onload = () => {
      const url = typeof reader.result === "string" ? reader.result : "";
      if (!url) {
        reject(new Error("Could not read that file."));
        return;
      }
      resolve({
        url,
        fileName: file.name,
        mimeType: file.type || "application/octet-stream",
      });
    };
    reader.readAsDataURL(file);
  });
}

export function isPreviewable(mimeType?: string, fileName?: string): "pdf" | "image" | "text" | null {
  const mime = (mimeType ?? "").toLowerCase();
  const name = (fileName ?? "").toLowerCase();
  if (mime === "application/pdf" || name.endsWith(".pdf")) return "pdf";
  if (mime.startsWith("image/") || /\.(png|jpe?g|gif|webp|svg)$/.test(name)) return "image";
  if (mime.startsWith("text/") || /\.(txt|md|csv)$/.test(name)) return "text";
  return null;
}

export function openAttachment(url: string, fileName?: string) {
  const a = document.createElement("a");
  a.href = url;
  a.target = "_blank";
  a.rel = "noopener noreferrer";
  if (fileName) a.download = fileName;
  a.click();
}
