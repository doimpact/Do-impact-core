// Sandbox-iframe-safe blob download. Tries File System Access API first
// (works in Lovable preview), then anchor download, then window.open fallback.
export async function saveBlob(blob: Blob, filename: string, mime?: string): Promise<void> {
  const type = mime ?? blob.type ?? "application/octet-stream";
  const w = window as unknown as {
    showSaveFilePicker?: (opts: unknown) => Promise<{
      createWritable: () => Promise<{ write: (d: Blob) => Promise<void>; close: () => Promise<void> }>;
    }>;
  };
  if (typeof w.showSaveFilePicker === "function") {
    try {
      const handle = await w.showSaveFilePicker({
        suggestedName: filename,
        types: [{ description: filename.split(".").pop()?.toUpperCase() ?? "File", accept: { [type]: [`.${filename.split(".").pop()}`] } }],
      });
      const writable = await handle.createWritable();
      await writable.write(blob);
      await writable.close();
      return;
    } catch (e: unknown) {
      if ((e as { name?: string })?.name === "AbortError") return;
      // fall through
    }
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.rel = "noopener";
  a.target = "_blank";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => {
    try { window.open(url, "_blank", "noopener"); } catch { /* ignore */ }
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  }, 100);
}
