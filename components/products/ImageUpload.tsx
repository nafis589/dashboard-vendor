'use client';

import { useCallback, useState } from 'react';
import { ImageIcon, Star, Upload, X } from 'lucide-react';
import { toast } from 'sonner';

import { filesToDataUrls } from '@/lib/images';
import { cn } from '@/lib/utils';

interface ImageUploadProps {
  value: string[];
  onChange: (images: string[]) => void;
  maxFiles?: number;
  disabled?: boolean;
}

export default function ImageUpload({
  value,
  onChange,
  maxFiles = 8,
  disabled = false,
}: ImageUploadProps) {
  const [dragOver, setDragOver] = useState(false);

  const addFiles = useCallback(
    async (files: File[]) => {
      const imageFiles = files.filter((f) => f.type.startsWith('image/'));
      if (imageFiles.length === 0) return;

      const remaining = maxFiles - value.length;
      if (remaining <= 0) {
        toast.error(`Maximum ${maxFiles} photos`);
        return;
      }

      const toAdd = imageFiles.slice(0, remaining);
      if (imageFiles.length > remaining) {
        toast.error(`Seulement ${remaining} photo(s) supplémentaire(s) autorisée(s)`);
      }

      try {
        const dataUrls = await filesToDataUrls(toAdd);
        onChange([...value, ...dataUrls]);
      } catch {
        toast.error('Erreur lors du chargement des images');
      }
    },
    [maxFiles, onChange, value],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setDragOver(false);
      if (disabled) return;
      void addFiles(Array.from(e.dataTransfer.files));
    },
    [addFiles, disabled],
  );

  const removeAt = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  const setPrimary = (index: number) => {
    if (index === 0) return;
    const next = [...value];
    const [img] = next.splice(index, 1);
    next.unshift(img);
    onChange(next);
  };

  return (
    <div className="space-y-4">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={cn(
          'relative flex min-h-[140px] flex-col items-center justify-center rounded-xl border-2 border-dashed px-4 py-8 text-center transition-colors',
          dragOver ? 'border-foreground bg-muted/40' : 'border-border bg-muted/20 hover:border-foreground/50',
          disabled && 'pointer-events-none opacity-50',
        )}
      >
        <input
          type="file"
          accept="image/*"
          multiple
          disabled={disabled || value.length >= maxFiles}
          className="absolute inset-0 cursor-pointer opacity-0"
          onChange={(e) => {
            void addFiles(Array.from(e.target.files ?? []));
            e.target.value = '';
          }}
        />
        <Upload className="mb-2 size-8 text-muted-foreground" />
        <p className="text-sm font-medium">Glissez vos photos ici ou cliquez pour parcourir</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Jusqu&apos;à {maxFiles} images · la première est la photo principale
        </p>
      </div>

      {value.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {value.map((src, index) => (
            <div
              key={`${src.slice(0, 32)}-${index}`}
              className="group relative aspect-square overflow-hidden rounded-lg border bg-muted"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="" className="h-full w-full object-cover" />
              {index === 0 && (
                <span className="absolute left-1.5 top-1.5 inline-flex items-center gap-0.5 rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-medium text-white">
                  <Star className="size-2.5 fill-current" />
                  Principale
                </span>
              )}
              {!disabled && (
                <div className="absolute inset-0 flex items-center justify-center gap-1 bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                  {index !== 0 && (
                    <button
                      type="button"
                      className="rounded-full bg-white/90 p-1.5 text-foreground hover:bg-white"
                      title="Définir comme principale"
                      onClick={() => setPrimary(index)}
                    >
                      <Star className="size-4" />
                    </button>
                  )}
                  <button
                    type="button"
                    className="rounded-full bg-white/90 p-1.5 text-destructive hover:bg-white"
                    title="Supprimer"
                    onClick={() => removeAt(index)}
                  >
                    <X className="size-4" />
                  </button>
                </div>
              )}
            </div>
          ))}
          {value.length < maxFiles && !disabled && (
            <label className="flex aspect-square cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted/20 text-muted-foreground hover:border-foreground/40">
              <ImageIcon className="mb-1 size-6" />
              <span className="text-xs">Ajouter</span>
              <input
                type="file"
                accept="image/*"
                multiple
                className="sr-only"
                onChange={(e) => {
                  void addFiles(Array.from(e.target.files ?? []));
                  e.target.value = '';
                }}
              />
            </label>
          )}
        </div>
      )}
    </div>
  );
}
