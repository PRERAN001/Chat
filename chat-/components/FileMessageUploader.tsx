"use client";

import { useRef, useState } from "react";

type UploadedFileResult = {
  fileUrl: string;
  fileName: string;
  mimeType?: string;
  bytes?: number;
};

type FileMessageUploaderProps = {
  onUploaded: (file: UploadedFileResult) => Promise<void> | void;
  disabled?: boolean;
  className?: string;
};

export default function FileMessageUploader({
  onUploaded,
  disabled = false,
  className = "",
}: FileMessageUploaderProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const openPicker = () => {
    if (disabled || isUploading) return;
    inputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);

      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload_file", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || "Failed to upload file");
      }

      await onUploaded({
        fileUrl: data.fileUrl,
        fileName: data.fileName || file.name,
        mimeType: data.mimeType || file.type,
        bytes: data.bytes || file.size,
      });
    } catch (error) {
      alert(error instanceof Error ? error.message : "File upload failed");
    } finally {
      setIsUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        onChange={handleFileChange}
      />
      <button
        type="button"
        onClick={openPicker}
        disabled={disabled || isUploading}
        className={`text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 rounded-full p-2.5 transition-colors disabled:opacity-50 ${className}`}
        title={isUploading ? "Uploading file..." : "Attach file"}
      >
        {isUploading ? (
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" className="animate-spin" stroke="currentColor" strokeWidth="2">
            <path d="M12 2a10 10 0 1 0 10 10" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path>
          </svg>
        )}
      </button>
    </>
  );
}
