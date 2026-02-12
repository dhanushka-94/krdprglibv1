"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Music, Search, Play, X, Youtube, Facebook, Radio, Newspaper, FolderTree, ChevronLeft, ChevronRight, CalendarClock } from "lucide-react";
import { formatDateOnlyDisplay } from "@/lib/date-utils";
import { useNowPlaying } from "@/lib/now-playing-context";
import { ShareDownloadButtons } from "@/components/share-download-buttons";
import type { AudioProgramme, Category, Subcategory, RadioChannel } from "@/lib/types";

const DESCRIPTION_LINES = 3;
const PAGE_SIZE = 12;
type SortOption = "newest" | "oldest" | "title";

export function ProgrammesList() {
  const { play: playTrack } = useNowPlaying();
  const searchParams = useSearchParams();
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
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const catId = searchParams.get("category_id");
    if (catId) setCategoryFilter(catId);
  }, [mounted, searchParams]);

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
    params.set("limit", String(PAGE_SIZE));
    params.set("offset", String((page - 1) * PAGE_SIZE));
    params.set("order", sortBy);

    fetch(`/api/programmes?${params.toString()}`)
      .then((r) => r.json())
      .then((d) => {
        if (d && typeof d === "object" && "programmes" in d) {
          setProgrammes(d.programmes ?? []);
          setTotalCount(d.total ?? 0);
        } else {
          setProgrammes(Array.isArray(d) ? d : []);
          setTotalCount(Array.isArray(d) ? d.length : 0);
        }
      })
      .catch(() => {
        setProgrammes([]);
        setTotalCount(0);
      })
      .finally(() => setLoading(false));
  }, [mounted, categoryFilter, subcategoryFilter, radioChannelFilter, dateFrom, dateTo, search, sortBy, page]);

  useEffect(() => {
    if (!mounted) return;
    setPage(1);
  }, [mounted, categoryFilter, subcategoryFilter, radioChannelFilter, dateFrom, dateTo, search, sortBy]);

  const sortedProgrammes = programmes;

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
    setPage(1);
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
      {/* Hero – Krushi Radio branding (compact) */}
      <section className="rounded-xl border border-border/60 bg-gradient-to-b from-primary/5 to-transparent px-4 py-3 sm:px-5 sm:py-4">
        <div className="flex flex-col gap-1 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-4">
          <div>
            <h1 className="text-base font-bold tracking-tight text-foreground sm:text-lg">
              Official Agricultural Media Network in Sri Lanka
            </h1>
            <p className="text-sm text-muted-foreground font-medium" dir="ltr" lang="si">
              ගහකොල අතරේ හුස්ම හොයනා රෙඩියෝ යාත්‍රිකයා
            </p>
          </div>
          <div className="flex flex-wrap gap-3 sm:gap-4">
            <Link
              href="/schedule"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-foreground hover:text-primary hover:underline"
            >
              <CalendarClock className="size-4 shrink-0" />
              Schedule
            </Link>
            <a
              href="https://player.krushiradio.lk/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-red-600 hover:text-red-700 hover:underline"
            >
              <Radio className="size-4 shrink-0" />
              Listen live
            </a>
            <a
              href="https://www.youtube.com/@KrushiRadio"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-red-600 hover:text-red-700 hover:underline"
            >
              <Youtube className="size-4 shrink-0" />
              YouTube
            </a>
            <a
              href="https://www.facebook.com/krushiradio/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline"
            >
              <Facebook className="size-4 shrink-0" />
              Facebook
            </a>
            <a
              href="https://www.krushiradionews.lk/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-amber-700 hover:text-amber-800 hover:underline"
            >
              <Newspaper className="size-4 shrink-0" />
              News Magazine
            </a>
          </div>
        </div>
      </section>

      {/* Filters – Programme Types & Broadcast Channels */}
      <div className="rounded-xl border border-border/60 bg-card/50 p-4 sm:p-5 space-y-4">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <FolderTree className="size-4 text-primary shrink-0" />
            <p className="text-sm font-semibold text-foreground">Browse by Programme Name</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setCategoryFilter("all")}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-all shadow-sm ${
                categoryFilter === "all"
                  ? "bg-primary text-primary-foreground ring-2 ring-primary/30"
                  : "bg-muted/70 text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              All
            </button>
            {categories.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setCategoryFilter(c.id)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition-all shadow-sm ${
                  categoryFilter === c.id
                    ? "bg-primary text-primary-foreground ring-2 ring-primary/30"
                    : "bg-muted/70 text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>
          {categoryFilter !== "all" && subcategories.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 pl-6 border-l-2 border-primary/20">
              <span className="text-xs font-medium text-muted-foreground">Refine:</span>
              <button
                type="button"
                onClick={() => setSubcategoryFilter("all")}
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
                  subcategoryFilter === "all"
                    ? "bg-primary/90 text-primary-foreground"
                    : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                All
              </button>
              {subcategories.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setSubcategoryFilter(s.id)}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
                    subcategoryFilter === s.id
                      ? "bg-primary/90 text-primary-foreground"
                      : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  {s.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {radioChannels.length > 0 && (
          <div className="space-y-3 pt-3 border-t border-border/60">
            <div className="flex items-center gap-2">
              <Radio className="size-4 text-primary shrink-0" />
              <p className="text-sm font-semibold text-foreground">Where We Broadcast</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setRadioChannelFilter("all")}
                className={`rounded-full px-4 py-2 text-sm font-medium transition-all shadow-sm ${
                  radioChannelFilter === "all"
                    ? "bg-primary text-primary-foreground ring-2 ring-primary/30"
                    : "bg-muted/70 text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                All channels
              </button>
              {radioChannels.map((ch) => (
                <button
                  key={ch.id}
                  type="button"
                  onClick={() => setRadioChannelFilter(ch.id)}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition-all shadow-sm ${
                    radioChannelFilter === ch.id
                      ? "bg-primary text-primary-foreground ring-2 ring-primary/30"
                      : "bg-muted/70 text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  {ch.name}
                </button>
              ))}
            </div>
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

      {/* Result count & pagination info */}
      {!loading && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            {totalCount === 0
              ? "No programmes match your filters."
              : `${totalCount} programme${totalCount === 1 ? "" : "s"}`}
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
        </div>
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

      {/* Pagination */}
      {!loading && totalCount > 0 && totalCount > PAGE_SIZE && (
        <nav
          className="flex items-center justify-center gap-2 pt-4"
          aria-label="Programmes pagination"
        >
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="inline-flex items-center gap-1 rounded-full px-4 py-2 text-sm font-medium transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed bg-muted/70 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <ChevronLeft className="size-4" />
            Previous
          </button>
          <div className="flex items-center gap-1">
            {(() => {
              const totalPages = Math.ceil(totalCount / PAGE_SIZE);
              const maxVisible = 5;
              let start = Math.max(1, page - Math.floor(maxVisible / 2));
              let end = Math.min(totalPages, start + maxVisible - 1);
              if (end - start + 1 < maxVisible) start = Math.max(1, end - maxVisible + 1);
              const pages: (number | "ellipsis")[] = [];
              if (start > 1) {
                pages.push(1);
                if (start > 2) pages.push("ellipsis");
              }
              for (let i = start; i <= end; i++) pages.push(i);
              if (end < totalPages) {
                if (end < totalPages - 1) pages.push("ellipsis");
                pages.push(totalPages);
              }
              return pages.map((p, i) =>
                p === "ellipsis" ? (
                  <span key={`e-${i}`} className="px-2 text-muted-foreground">
                    …
                  </span>
                ) : (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPage(p)}
                    className={`min-w-[2.25rem] rounded-full px-3 py-2 text-sm font-medium transition-all shadow-sm ${
                      page === p
                        ? "bg-primary text-primary-foreground ring-2 ring-primary/30"
                        : "bg-muted/70 text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                  >
                    {p}
                  </button>
                )
              );
            })()}
          </div>
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(Math.ceil(totalCount / PAGE_SIZE), p + 1))}
            disabled={page >= Math.ceil(totalCount / PAGE_SIZE)}
            className="inline-flex items-center gap-1 rounded-full px-4 py-2 text-sm font-medium transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed bg-muted/70 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            Next
            <ChevronRight className="size-4" />
          </button>
        </nav>
      )}
    </div>
  );
}
