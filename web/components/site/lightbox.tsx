"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ArrowLeft, ArrowRight, X } from "lucide-react";

const EASE = [0.16, 1, 0.3, 1] as const;

export type LightboxPhoto = {
  src: string;
  width: number;
  height: number;
  blurDataURL: string;
  alt: string;
  caption: string;
};

/**
 * Fullscreen image viewer.
 *
 * Built on the native <dialog> element rather than a custom overlay: showModal() gives a real
 * focus trap, Escape-to-close, inert background and top-layer stacking without any of it being
 * reimplemented. Left/right arrows step through the set, and the caption is announced with the
 * image rather than being decoration on top of it.
 */
export function useLightbox(photos: LightboxPhoto[]) {
  const [index, setIndex] = useState<number | null>(null);
  const openAt = useCallback((i: number) => setIndex(i), []);
  const close = useCallback(() => setIndex(null), []);
  const step = useCallback(
    (d: 1 | -1) => setIndex((i) => (i === null ? i : (i + d + photos.length) % photos.length)),
    [photos.length],
  );
  return {
    openAt,
    lightbox: <Lightbox photos={photos} index={index} onClose={close} onStep={step} />,
  };
}

function Lightbox({
  photos,
  index,
  onClose,
  onStep,
}: {
  photos: LightboxPhoto[];
  index: number | null;
  onClose: () => void;
  onStep: (d: 1 | -1) => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const reduce = useReducedMotion();
  const open = index !== null;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") { e.preventDefault(); onStep(1); }
      if (e.key === "ArrowLeft") { e.preventDefault(); onStep(-1); }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onStep]);

  const photo = index === null ? null : photos[index];

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => {
        // backdrop clicks land on the dialog itself, never on its children
        if (e.target === ref.current) onClose();
      }}
      aria-label="Image viewer"
      className="m-0 size-full max-h-none max-w-none bg-deep/95 p-0 backdrop:bg-deep/80"
    >
      {photo ? (
        <div className="relative flex size-full flex-col items-center justify-center p-4 sm:p-8">
          <div className="absolute right-3 top-3 z-10 flex gap-2 sm:right-6 sm:top-6">
            <LbButton onClick={onClose} label="Close the image viewer">
              <X className="size-5" aria-hidden="true" />
            </LbButton>
          </div>

          <AnimatePresence mode="wait">
            <motion.figure
              key={photo.src}
              initial={reduce ? false : { opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={reduce ? undefined : { opacity: 0 }}
              transition={{ duration: 0.28, ease: EASE }}
              className="m-0 flex max-h-full w-full max-w-5xl flex-col items-center gap-4"
            >
              <Image
                src={photo.src}
                alt={photo.alt}
                width={photo.width}
                height={photo.height}
                placeholder="blur"
                blurDataURL={photo.blurDataURL}
                sizes="(max-width: 1024px) 100vw, 1024px"
                className="max-h-[76svh] w-auto object-contain"
              />
              <figcaption className="max-w-[60ch] text-center text-[15px] text-muted-deep">
                {photo.caption}
                <span className="ml-3 text-[13px] text-muted-deep/80">
                  {index! + 1} of {photos.length}
                </span>
              </figcaption>
            </motion.figure>
          </AnimatePresence>

          {photos.length > 1 ? (
            <div className="mt-6 flex gap-3">
              <LbButton onClick={() => onStep(-1)} label="Previous image">
                <ArrowLeft className="size-5" aria-hidden="true" />
              </LbButton>
              <LbButton onClick={() => onStep(1)} label="Next image">
                <ArrowRight className="size-5" aria-hidden="true" />
              </LbButton>
            </div>
          ) : null}
        </div>
      ) : null}
    </dialog>
  );
}

function LbButton({
  onClick,
  label,
  children,
}: {
  onClick: () => void;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex size-11 items-center justify-center text-on-deep shadow-[inset_0_0_0_1px_rgb(250_250_248/0.35)] transition-colors duration-200 hover:bg-on-deep hover:text-deep"
    >
      {children}
      <span className="sr-only">{label}</span>
    </button>
  );
}
