"use client";

import * as React from "react";
import { ImagePlus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { ACCEPTED_IMAGE_TYPES, MAX_UPLOAD_BYTES } from "@/lib/form-schema";
import { toast } from "sonner";

interface ImageDropzoneProps {
  label: string;
  value: File | null;
  onChange: (file: File | null) => void;
  hint?: string;
  className?: string;
  /** compact：正方形缩略图 + 悬浮删除，用于素材横排 */
  compact?: boolean;
}

export function ImageDropzone({
  label,
  value,
  onChange,
  hint,
  className,
  compact = false,
}: ImageDropzoneProps) {
  const [preview, setPreview] = React.useState<string | null>(null);
  const [dragging, setDragging] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (!value) {
      setPreview(null);
      return;
    }
    const url = URL.createObjectURL(value);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [value]);

  function validateAndSet(file: File | undefined) {
    if (!file) return;
    if (file.type && !ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      toast.error("格式不支持，请使用 PNG / JPG / WebP。");
      return;
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      toast.error("图片过大，请压缩后重新上传（单张上限 10MB）。");
      return;
    }
    onChange(file);
  }

  const fileInput = (
    <input
      ref={inputRef}
      type="file"
      accept={ACCEPTED_IMAGE_TYPES.join(",")}
      className="hidden"
      onChange={(e) => validateAndSet(e.target.files?.[0])}
    />
  );

  const dropHandlers = {
    onClick: () => inputRef.current?.click(),
    onKeyDown: (e: React.KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
    },
    onDragOver: (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(true);
    },
    onDragLeave: () => setDragging(false),
    onDrop: (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      validateAndSet(e.dataTransfer.files?.[0]);
    },
  };

  function clear(e: React.MouseEvent) {
    e.stopPropagation();
    onChange(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  // 紧凑模式：正方形缩略图 + 悬浮删除按钮，用于素材横排
  if (compact) {
    return (
      <div className={cn("space-y-1", className)}>
        <div
          role="button"
          tabIndex={0}
          {...dropHandlers}
          className={cn(
            "group relative flex aspect-square w-full cursor-pointer items-center justify-center overflow-hidden rounded-lg border border-dashed bg-muted/40 transition-colors",
            dragging ? "border-primary bg-primary/5" : "hover:border-primary/60"
          )}
        >
          {preview ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={preview} alt={label} className="h-full w-full object-contain checkerboard" />
              <button
                type="button"
                onClick={clear}
                aria-label={`移除${label}`}
                className="absolute right-1 top-1 hidden rounded-md bg-black/55 p-1 text-white group-hover:block hover:bg-destructive"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </>
          ) : (
            <div className="flex flex-col items-center gap-1 text-muted-foreground">
              <ImagePlus className="h-5 w-5" />
              <span className="text-[11px]">上传</span>
            </div>
          )}
        </div>
        <p className="text-center text-xs font-medium">{label}</p>
        {fileInput}
      </div>
    );
  }

  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">{label}</span>
        {value && (
          <button
            type="button"
            onClick={clear}
            className="text-xs text-muted-foreground hover:text-destructive inline-flex items-center gap-0.5"
          >
            <X className="h-3 w-3" /> 移除
          </button>
        )}
      </div>

      <div
        role="button"
        tabIndex={0}
        {...dropHandlers}
        className={cn(
          "relative flex aspect-[4/3] w-full cursor-pointer items-center justify-center overflow-hidden rounded-lg border border-dashed bg-muted/40 transition-colors",
          dragging ? "border-primary bg-primary/5" : "hover:border-primary/60"
        )}
      >
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt={label} className="h-full w-full object-contain checkerboard" />
        ) : (
          <div className="flex flex-col items-center gap-1 text-muted-foreground">
            <ImagePlus className="h-6 w-6" />
            <span className="text-xs">点击或拖拽上传</span>
          </div>
        )}
      </div>

      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      {fileInput}
    </div>
  );
}
