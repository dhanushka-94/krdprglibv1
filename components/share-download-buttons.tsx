"use client";

import { useState } from "react";
import { Share2, Download, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface ShareDownloadButtonsProps {
  title: string;
  slug: string;
  className?: string;
  variant?: "default" | "compact";
}

export function ShareDownloadButtons({
  title,
  slug,
  className,
  variant = "default",
}: ShareDownloadButtonsProps) {
  const [copied, setCopied] = useState(false);
  const base = typeof window !== "undefined" ? window.location.origin : "";
  const sharePath = `/programmes/${encodeURIComponent(slug)}`;
  const url = base ? `${base}${sharePath}` : "";

  const handleShare = async () => {
    const shareUrl = base ? `${base}${sharePath}` : "";
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: title,
          text: `Listen: ${title}`,
          url: shareUrl,
        });
        toast.success("Shared");
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          copyToClipboard(shareUrl);
        }
      }
    } else {
      copyToClipboard(shareUrl);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      toast.success("Link copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const downloadUrl = `/api/programmes/slug/${slug}/download`;

  if (variant === "compact") {
    return (
      <div className={className}>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-8"
            onClick={handleShare}
            aria-label="Share"
          >
            {copied ? (
              <Check className="size-4 text-green-600" />
            ) : (
              <Share2 className="size-4" />
            )}
          </Button>
          <Button variant="ghost" size="icon" className="size-8" asChild>
            <a
              href={downloadUrl}
              download
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Download"
            >
              <Download className="size-4" />
            </a>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={handleShare}
        >
          {copied ? (
            <Check className="size-4 text-green-600" />
          ) : (
            <Share2 className="size-4" />
          )}
          Share
        </Button>
        <Button variant="outline" size="sm" className="gap-2" asChild>
          <a
            href={downloadUrl}
            download
            target="_blank"
            rel="noopener noreferrer"
          >
            <Download className="size-4" />
            Download
          </a>
        </Button>
      </div>
    </div>
  );
}
