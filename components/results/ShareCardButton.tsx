'use client';

import * as Dialog from '@radix-ui/react-dialog';
import { Check, Download, ImageIcon, Link2, Loader2, Share2, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { CARD_SIZE, cardHeadline, cardImagePath, sharePagePath, type ShareCard } from '@/lib/share';

type Copied = 'link' | 'image' | null;

const actionClass =
  'inline-flex h-9 items-center justify-center gap-2 rounded-md border border-line-strong px-3 text-xs font-semibold text-ink transition-ui hover:bg-raised disabled:opacity-60';

export default function ShareCardButton({ card }: { card: ShareCard }) {
  const [open, setOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [copied, setCopied] = useState<Copied>(null);
  const [error, setError] = useState<string | null>(null);
  const blobRef = useRef<Promise<Blob> | null>(null);

  const imagePath = cardImagePath(card);
  const headline = cardHeadline(card);
  const fileName = `devtype-${card.wpm}wpm.png`;

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(null), 2000);
    return () => clearTimeout(timer);
  }, [copied]);

  // One fetch of the PNG serves download, copy and native share
  const getBlob = () => {
    blobRef.current ??= fetch(imagePath).then((res) => {
      if (!res.ok) throw new Error('Could not create the card');
      return res.blob();
    });
    blobRef.current.catch(() => (blobRef.current = null));
    return blobRef.current;
  };

  // Dialog content only mounts after a click, so reading browser APIs here cannot mismatch SSR
  const canCopyImage = open && typeof ClipboardItem !== 'undefined' && !!navigator.clipboard?.write;
  const canNativeShare = open && typeof navigator.share === 'function';

  const shareUrl = () => new URL(sharePagePath(card), window.location.origin).toString();

  const run = async (action: () => Promise<void>) => {
    setError(null);
    try {
      await action();
    } catch (err) {
      // Closing the native share sheet is not an error
      if (err instanceof DOMException && err.name === 'AbortError') return;
      setError(err instanceof Error ? err.message : 'Something went wrong');
    }
  };

  const download = () =>
    run(async () => {
      const url = URL.createObjectURL(await getBlob());
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      link.click();
      URL.revokeObjectURL(url);
    });

  const copyImage = () =>
    run(async () => {
      // Pass the promise straight in so Safari keeps the user gesture
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': getBlob() })]);
      setCopied('image');
    });

  const copyLink = () =>
    run(async () => {
      await navigator.clipboard.writeText(shareUrl());
      setCopied('link');
    });

  const nativeShare = () =>
    run(async () => {
      const file = new File([await getBlob()], fileName, { type: 'image/png' });
      const data: ShareData = { title: 'DEV_TYPE personal best', text: headline, url: shareUrl() };
      await navigator.share(
        navigator.canShare?.({ ...data, files: [file] }) ? { ...data, files: [file] } : data
      );
    });

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button type="button" className={actionClass}>
          <Share2 size={14} aria-hidden />
          Share card
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="data-[state=open]:animate-fade fixed inset-0 z-50 bg-backdrop/60 backdrop-blur-xs" />
        <Dialog.Content className="rounded-2xl fixed top-1/2 left-1/2 z-50 flex max-h-[calc(100dvh-2rem)] w-[min(40rem,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 flex-col gap-4 overflow-y-auto border border-line bg-surface p-5 shadow-modal focus:outline-none data-[state=open]:animate-pop">
          <div className="flex items-start justify-between gap-4">
            <div>
              <Dialog.Title className="text-base font-bold text-ink">Share your personal best</Dialog.Title>
              <Dialog.Description className="text-2xs text-muted">
                Save the card or send a link that shows it as a preview.
              </Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <button
                type="button"
                aria-label="Close"
                className="flex size-7 shrink-0 items-center justify-center rounded-md text-muted transition-ui hover:bg-raised hover:text-ink"
              >
                <X size={16} aria-hidden />
              </button>
            </Dialog.Close>
          </div>

          <div className="relative aspect-[1200/630] w-full overflow-hidden rounded-lg border border-line bg-canvas">
            {!loaded && (
              <div className="absolute inset-0 flex items-center justify-center text-muted">
                <Loader2 size={20} className="animate-spin" aria-label="Loading card" />
              </div>
            )}
            {/* eslint-disable-next-line @next/next/no-img-element -- generated PNG */}
            <img
              src={imagePath}
              alt={headline}
              width={CARD_SIZE.width}
              height={CARD_SIZE.height}
              onLoad={() => setLoaded(true)}
              className="h-full w-full"
            />
          </div>

          <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
            {canNativeShare && (
              <button
                type="button"
                onClick={nativeShare}
                className="col-span-2 inline-flex h-9 items-center justify-center gap-2 rounded-md bg-accent-fill px-3 text-xs font-bold text-accent-ink transition-ui hover:bg-accent-fill-hover"
              >
                <Share2 size={14} aria-hidden />
                Share…
              </button>
            )}
            <button type="button" onClick={download} className={actionClass}>
              <Download size={14} aria-hidden />
              Download PNG
            </button>
            {canCopyImage && (
              <button type="button" onClick={copyImage} className={actionClass}>
                {copied === 'image' ? <Check size={14} aria-hidden /> : <ImageIcon size={14} aria-hidden />}
                {copied === 'image' ? 'Image copied' : 'Copy image'}
              </button>
            )}
            <button type="button" onClick={copyLink} className={actionClass}>
              {copied === 'link' ? <Check size={14} aria-hidden /> : <Link2 size={14} aria-hidden />}
              {copied === 'link' ? 'Link copied' : 'Copy link'}
            </button>
          </div>

          <p role="status" className="sr-only">
            {copied === 'link' ? 'Link copied' : copied === 'image' ? 'Image copied' : ''}
          </p>
          {error && (
            <p role="alert" className="text-xs text-danger">
              {error}
            </p>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
