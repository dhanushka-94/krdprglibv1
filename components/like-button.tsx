"use client";

import { useState, useEffect } from "react";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const STORAGE_KEY = "programme-likes";

function getLikedSlugs(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw) as string[];
    return new Set(Array.isArray(arr) ? arr : []);
  } catch {
    return new Set();
  }
}

function setLikedSlugs(slugs: Set<string>) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...slugs]));
  } catch {
    // ignore
  }
}

interface LikeButtonProps {
  slug: string;
  className?: string;
}

export function LikeButton({ slug, className }: LikeButtonProps) {
  const [liked, setLiked] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const slugs = getLikedSlugs();
    setLiked(slugs.has(slug));
  }, [slug]);

  const handleToggle = () => {
    const slugs = getLikedSlugs();
    if (slugs.has(slug)) {
      slugs.delete(slug);
      setLiked(false);
      toast.success("Removed from favourites");
    } else {
      slugs.add(slug);
      setLiked(true);
      toast.success("Added to favourites");
    }
    setLikedSlugs(slugs);
  };

  if (!mounted) {
    return (
      <Button
        variant="outline"
        size="icon"
        className={`rounded-full opacity-50 ${className ?? "size-10"}`}
        disabled
        aria-label="Like"
      >
        <Heart className="size-4" />
      </Button>
    );
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      className={`rounded-full transition-all hover:scale-105 ${className ?? "size-10"} ${
        liked ? "border-red-300 bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-950/30 dark:border-red-800 dark:text-red-400" : ""
      }`}
      onClick={handleToggle}
      aria-label={liked ? "Remove from favourites" : "Add to favourites"}
    >
      <Heart className={`size-4 ${liked ? "fill-current" : ""}`} />
    </Button>
  );
}
