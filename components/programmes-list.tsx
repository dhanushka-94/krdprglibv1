"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import Link from "next/link";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Music, Search, Play, ChevronRight, X } from "lucide-react";
import { formatDateOnlyDisplay } from "@/lib/date-utils";
import { useNowPlaying } from "@/lib/now-playing-context";
import { ShareDownloadButtons } from "@/components/share-download-buttons";
import type { AudioProgramme, Category, Subcategory, RadioChannel } from "@/lib/types";

const DESCRIPTION_LINES = 3;
type SortOption = "newest" | "oldest" | "title";

export function ProgrammesList() {
  const { play: playTrack } = useNowPlaying();
  const [mounted, setMounted] = useState(false);
  const [programmes, setProgrammes] = useState<
    (AudioProgramme & { category?: Category; subcategory?: Subcategory })[]
  >([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [radioChannels, setRadioChannels] = useState<RadioChannel[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [subcategoryFilter, setSubcategoryFilter] = useState<string>("all");
  const [radioChannelFilter, setRadioChannelFilter] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [loading, setLoading] = useState(true);
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  /* Auto search: debounce typing and run server-side search (Supabase) without loading all data */
  useEffect(() => {
    if (!mounted) return;
    const trimmed = searchInput.trim();
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(() => {
      setSearch(trimmed);
      searchDebounceRef.current = null;
    }, 350);
    return () => {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    };
  }, [mounted, searchInput]);

  useEffect(() => {
    if (!mounted) return;
    fetch("/api/categories")
      .then((r) => r.json())
      .then((d) => setCategories(d))
      .catch(() => {});
    fetch("/api/radio-channels")
      .then((r) => r.json())
      .then((d) => setRadioChannels(Array.isArray(d) ? d : []))
      .catch(() => setRadioChannels([]));
  }, [mounted]);

  useEffect(() => {
    if (!mounted) return;
    if (categoryFilter !== "all") {
      fetch(`/api/subcategories?category_id=${categoryFilter}`)
        .then((r) => r.json())
        .then((d) => setSubcategories(d))
        .catch(() => setSubcategories([]));
    } else {
      setSubcategories([]);
      setSubcategoryFilter("all");
    }
  }, [mounted, categoryFilter]);

  useEffect(() => {
    if (!mounted) return;
    setLoading(true);
    const params = new URLSearchParams();
    if (categoryFilter !== "all") params.set("category_id", categoryFilter);
    if (subcategoryFilter !== "all") params.set("subcategory_id", subcategoryFilter);
    if (radioChannelFilter !== "all") params.set("radio_channel_id", radioChannelFilter);
    if (dateFrom) params.set("date_from", dateFrom);
    if (dateTo) params.set("date_to", dateTo);
    if (search) params.set("search", search);

    fetch(`/api/programmes?${params.toString()}`)
      .then((r) => r.json())
      .then((d) => setProgrammes(d))
      .catch(() => setProgrammes([]))
      .finally(() => setLoading(false));
  }, [mounted, categoryFilter, subcategoryFilter, radioChannelFilter, dateFrom, dateTo, search]);

  const sortedProgrammes = useMemo(() => {
    const list = [...programmes];
    if (sortBy === "newest") {
      list.sort((a, b) => (b.broadcasted_date || "").localeCompare(a.broadcasted_date || ""));
    } else if (sortBy === "oldest") {
      list.sort((a, b) => (a.broadcasted_date || "").localeCompare(b.broadcasted_date || ""));
    } else {
      list.sort((a, b) => (a.title || "").localeCompare(b.title || "", undefined, { sensitivity: "base" }));
    }
    return list;
  }, [programmes, sortBy]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput.trim());
  };

  const clearSearch = () => {
    setSearchInput("");
    setSearch("");
  };

  const clearFilters = () => {
    setCategoryFilter("all");
    setSubcategoryFilter("all");
    setRadioChannelFilter("all");
    setDateFrom("");
    setDateTo("");
    setSearch("");
    setSearchInput("");
  };

  const handleQuickPlay = (e: React.MouseEvent, p: AudioProgramme & { category?: Category; subcategory?: Subcategory }) => {
    e.preventDefault();
    e.stopPropagation();
    playTrack({
      url: p.firebase_storage_url,
      title: p.title,
      slug: p.slug,
    });
  };

  if (!mounted) {
    return (
      <div className="space-y-8">
        <div className="h-48 animate-pulse rounded-2xl bg-muted/50" />
      </div>
    );
  }

  const hasActiveFilters =
    categoryFilter !== "all" ||
    subcategoryFilter !== "all" ||
    radioChannelFilter !== "all" ||
    !!dateFrom ||
    !!dateTo ||
    !!searchInput;

  return (
    <div className="space-y-8">
      {/* Hero / intro */}
      <section className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Radio Programmes
        </h1>
        <p className="text-muted-foreground max-w-2xl">
          Browse and listen to all programmes. Use the filters below to find by category, radio channel, or date.
        </p>
      </section>

      {/* Categories – filter pills */}
      <div className="space-y-3">
        <p className="text-sm font-medium text-foreground">Categories</p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setCategoryFilter("all")}
            className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
              categoryFilter === "all"
                ? "bg-primary text-primary-foreground"
                : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            All
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setCategoryFilter(c.id)}
              className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                categoryFilter === c.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>
        {categoryFilter !== "all" && subcategories.length > 0 && (
          <div className="flex flex-wrap gap-2 pl-1">
            <span className="text-xs text-muted-foreground self-center mr-1">Subcategory:</span>
            <button
              type="button"
              onClick={() => setSubcategoryFilter("all")}
              className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                subcategoryFilter === "all"
                  ? "bg-primary/80 text-primary-foreground"
                  : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              All
            </button>
            {subcategories.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setSubcategoryFilter(s.id)}
                className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                  subcategoryFilter === s.id
                    ? "bg-primary/80 text-primary-foreground"
                    : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                {s.name}
              </button>
            ))}
          </div>
        )}
        {radioChannels.length > 0 && (
          <div className="flex flex-wrap gap-2 pl-1">
            <span className="text-xs text-muted-foreground self-center mr-1">Radio channel:</span>
            <button
              type="button"
              onClick={() => setRadioChannelFilter("all")}
              className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                radioChannelFilter === "all"
                  ? "bg-primary/80 text-primary-foreground"
                  : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              All
            </button>
            {radioChannels.map((ch) => (
              <button
                key={ch.id}
                type="button"
                onClick={() => setRadioChannelFilter(ch.id)}
                className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                  radioChannelFilter === ch.id
                    ? "bg-primary/80 text-primary-foreground"
                    : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                {ch.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Search (auto search – queries Supabase as you type), dates, sort */}
      <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end">
        <form onSubmit={handleSearch} className="flex flex-1 min-w-0 gap-2 sm:max-w-sm">
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <Input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search programmes..."
              className="h-9 pl-9 pr-9 rounded-lg bg-muted/50 border-0"
            />
            {searchInput && (
              <button
                type="button"
                onClick={clearSearch}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                aria-label="Clear search"
              >
                <X className="size-4" />
              </button>
            )}
          </div>
          <Button type="submit" size="sm" className="h-9 shrink-0 rounded-lg">
            Search
          </Button>
        </form>
        <Input
          type="date"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          className="h-9 w-full sm:w-[140px] rounded-lg bg-muted/50 border-0"
        />
        <Input
          type="date"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
          className="h-9 w-full sm:w-[140px] rounded-lg bg-muted/50 border-0"
        />
        <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
          <SelectTrigger className="h-9 w-[180px] rounded-lg bg-muted/50 border-0">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest first</SelectItem>
            <SelectItem value="oldest">Oldest first</SelectItem>
            <SelectItem value="title">Title A–Z</SelectItem>
          </SelectContent>
        </Select>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={clearFilters}
          className="h-9 text-muted-foreground hover:text-foreground"
        >
          Clear
        </Button>
      </div>

      {/* Result count */}
      {!loading && (
        <p className="text-sm text-muted-foreground">
          {sortedProgrammes.length === 0
            ? "No programmes match your filters."
            : `${sortedProgrammes.length} programme${sortedProgrammes.length === 1 ? "" : "s"}`}
          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="ml-2 text-primary hover:underline"
            >
              Clear filters
            </button>
          )}
        </p>
      )}

      {loading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="h-40 animate-pulse rounded-xl bg-muted/50"
            />
          ))}
        </div>
      ) : sortedProgrammes.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-muted/30 py-16 text-center">
          <Music className="mx-auto size-10 text-muted-foreground/50" />
          <p className="mt-3 text-sm font-medium text-muted-foreground">
            No programmes found
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Try adjusting filters or search.
          </p>
        </div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sortedProgrammes.map((p) => {
            const cat = p.category as Category | undefined;
            const sub = p.subcategory as Subcategory | undefined;
            const channel = p.radio_channel as RadioChannel | undefined;
            const categoryLabel = [cat?.name, sub?.name].filter(Boolean).join(" · ") || "Programme";
            const dateStr = formatDateOnlyDisplay(p.broadcasted_date) || p.broadcasted_date;
            const repeatDateStr = p.repeat_broadcasted_date
              ? formatDateOnlyDisplay(p.repeat_broadcasted_date) || p.repeat_broadcasted_date
              : null;
            const hasLongDescription = p.description && p.description.trim().length > 0;

            return (
              <li key={p.id}>
                <div className="group flex flex-col rounded-xl border border-border/60 bg-card overflow-hidden transition-colors hover:border-primary/30 hover:bg-muted/20">
                  {/* 1st highlight: Category + Broadcasted Date */}
                  <div className="flex items-center justify-between gap-2 bg-primary/10 px-4 py-2.5 border-b border-border/60">
                    <span className="text-sm font-semibold text-foreground">
                      {categoryLabel}
                      {dateStr ? ` · ${dateStr}` : ""}
                    </span>
                    <Button
                      type="button"
                      size="icon"
                      className="size-9 shrink-0 rounded-full bg-primary text-primary-foreground shadow hover:bg-primary/90"
                      onClick={(e) => handleQuickPlay(e, p)}
                      aria-label={`Play ${p.title}`}
                    >
                      <Play className="ml-0.5 size-4" />
                    </Button>
                  </div>

                  {/* 2nd highlight: Programme Title */}
                  <div className="px-4 pt-3 pb-2">
                    <Link
                      href={`/programmes/${p.slug}`}
                      className="font-semibold text-base text-foreground line-clamp-2 hover:text-primary hover:underline"
                    >
                      {p.title}
                    </Link>
                  </div>

                  {/* 3rd highlight: Description (3 lines, justified) + Read more */}
                  <div className="px-4 pb-3">
                    {hasLongDescription ? (
                      <>
                        <p className="text-sm text-muted-foreground leading-relaxed text-justify line-clamp-3">
                          {p.description!.trim()}
                        </p>
                        <Link
                          href={`/programmes/${p.slug}`}
                          className="mt-1 inline-block text-sm font-medium text-primary hover:underline"
                        >
                          Read more →
                        </Link>
                      </>
                    ) : (
                      <Link
                        href={`/programmes/${p.slug}`}
                        className="inline-block text-sm font-medium text-primary hover:underline"
                      >
                        View programme →
                      </Link>
                    )}
                  </div>

                  {/* 4th highlight: Repeat broadcasted date */}
                  {repeatDateStr && (
                    <div className="px-4 py-2 bg-muted/40 border-t border-border/60">
                      <p className="text-xs font-medium text-foreground">
                        Repeat broadcast: {repeatDateStr}
                      </p>
                    </div>
                  )}

                  {/* 5th highlight: Radio channel */}
                  {channel && (
                    <div className="px-4 py-2.5 flex items-center gap-2 bg-muted/40 border-t border-border/60">
                      {channel.logo_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={channel.logo_url}
                          alt=""
                          className="size-6 rounded-full object-cover shrink-0"
                        />
                      ) : null}
                      <span className="text-xs font-medium text-foreground truncate">
                        {channel.name}
                        {[channel.frequency, channel.frequency_2].filter(Boolean).length > 0
                          ? " · " + [channel.frequency, channel.frequency_2].filter(Boolean).join(" · ")
                          : ""}
                      </span>
                    </div>
                  )}

                  <div className="mt-auto border-t border-border/60 px-4 py-2 flex items-center justify-between gap-2">
                    <Link
                      href={`/programmes/${p.slug}`}
                      className="text-xs font-medium text-primary hover:underline"
                    >
                      Open programme →
                    </Link>
                    <ShareDownloadButtons
                      title={p.title}
                      slug={p.slug}
                      variant="compact"
                    />
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
