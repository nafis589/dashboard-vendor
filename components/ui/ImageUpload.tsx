'use client';

interface ImageUploadProps {
  onFilesSelected?: (files: File[]) => void;
  maxFiles?: number;
}

/** Upload drag-and-drop — branché sur Cloudinary en P7-4 */
export default function ImageUpload({ onFilesSelected, maxFiles = 8 }: ImageUploadProps) {
  return (
    <label className="flex min-h-[140px] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-[#D5D5D5] bg-[#FAFAFA] px-4 py-8 text-center transition-colors hover:border-[#1A1A1A]">
      <input
        type="file"
        accept="image/*"
        multiple
        className="sr-only"
        onChange={(e) => {
          const files = Array.from(e.target.files ?? []).slice(0, maxFiles);
          onFilesSelected?.(files);
        }}
      />
      <p className="text-sm font-medium text-[#1A1A1A]">Glissez vos photos ici</p>
      <p className="mt-1 text-xs text-[#999]">Jusqu&apos;à {maxFiles} images (P7-4)</p>
    </label>
  );
}
