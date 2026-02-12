"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import Link from "next/link";
import { getAdminPath } from "@/lib/config";
import { formatDateOnlyDisplay, formatDurationSeconds } from "@/lib/date-utils";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Pencil, Trash2, ExternalLink, Search, Music, X } from "lucide-react";
import type { AudioProgramme, Category, Subcategory, RadioChannel } from "@/lib/types";

type SortOption = "newest" | "oldest" | "title";

export default function ProgrammesAdminPage() {
  const [programmes, setProgrammes] = useState<
    (AudioProgramme & { category?: Category; subcategory?: Subcategory; radio_channel?: RadioChannel })[]
  >([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [radioChannels, setRadioChannels] = useState<RadioChannel[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [subcategoryFilter, setSubcategoryFilter] = useState<string>("all");
  const [radioChannelFilter, setRadioChannelFilter] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounce search
  useEffect(() => {
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(() => {
      setSearch(searchInput.trim());
      searchDebounceRef.current = null;
    }, 300);
    return () => {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    };
  }, [searchInput]);

  // Load subcategories when category changes
  useEffect(() => {
    if (categoryFilter === "all") {
      setSubcategories([]);
      setSubcategoryFilter("all");
      return;
    }
    fetch(`/api/subcategories?category_id=${categoryFilter}`)
      .then((r) => r.json())
      .then((d) => setSubcategories(Array.isArray(d) ? d : []))
      .catch(() => setSubcategories([]));
    setSubcategoryFilter("all");
  }, [categoryFilter]);

  // Fetch programmes when filters change
  useEffect(() => {
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
      .then((d) => setProgrammes(Array.isArray(d) ? d : []))
      .catch(() => {
        setProgrammes([]);
        toast.error("Failed to fetch programmes");
      })
      .finally(() => setLoading(false));
  }, [categoryFilter, subcategoryFilter, radioChannelFilter, dateFrom, dateTo, search]);

  // Load categories and radio channels once
  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then((d) => setCategories(Array.isArray(d) ? d : []))
      .catch(() => {});
    fetch("/api/radio-channels")
      .then((r) => r.json())
      .then((d) => setRadioChannels(Array.isArray(d) ? d : []))
      .catch(() => {});
  }, []);

  const sorted = useMemo(() => {
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

  const hasActiveFilters =
    categoryFilter !== "all" ||
    subcategoryFilter !== "all" ||
    radioChannelFilter !== "all" ||
    !!dateFrom ||
    !!dateTo ||
    !!searchInput;

  const clearFilters = () => {
    setCategoryFilter("all");
    setSubcategoryFilter("all");
    setRadioChannelFilter("all");
    setDateFrom("");
    setDateTo("");
    setSearchInput("");
    setSearch("");
  };

  const handleDelete = async (id: string, path: string) => {
    if (!confirm("Delete this programme? The audio file will remain in storage."))
      return;
    try {
      const [delRes] = await Promise.all([
        fetch(`/api/programmes/${id}`, { method: "DELETE" }),
        path
          ? fetch(`/api/upload?path=${encodeURIComponent(path)}`, {
              method: "DELETE",
            })
          : Promise.resolve({ ok: true }),
      ]);
      const data = await delRes.json();
      if (delRes.ok) {
        toast.success("Programme deleted");
        setProgrammes((prev) => prev.filter((p) => p.id !== id));
      } else toast.error(data.error || "Failed to delete");
    } catch {
      toast.error("Failed to delete");
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold sm:text-3xl">Programmes</h1>
        <Button asChild>
          <Link href={getAdminPath("programmes/upload")}>Upload Programme</Link>
        </Button>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <p className="text-sm text-muted-foreground">
            Filter and search programmes. Results update as you change filters.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end">
            <div className="relative flex-1 min-w-0 sm:max-w-[240px]">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search anything..."
                className="pl-9 pr-9"
              />
              {searchInput && (
                <button
                  type="button"
                  onClick={() => setSearchInput("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:bg-muted"
                  aria-label="Clear search"
                >
                  <X className="size-4" />
                </button>
              )}
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium">Category</label>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium">Subcategory</label>
              <Select
                value={subcategoryFilter}
                onValueChange={setSubcategoryFilter}
                disabled={categoryFilter === "all"}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  {subcategories.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium">Radio channel</label>
              <Select value={radioChannelFilter} onValueChange={setRadioChannelFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  {radioChannels.map((ch) => (
                    <SelectItem key={ch.id} value={ch.id}>
                      {ch.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium">Date from</label>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-[160px]"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium">Date to</label>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-[160px]"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium">Sort</label>
              <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest first</SelectItem>
                  <SelectItem value="oldest">Oldest first</SelectItem>
                  <SelectItem value="title">Title A–Z</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {hasActiveFilters && (
              <Button variant="outline" onClick={clearFilters}>
                Clear filters
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>All Programmes</CardTitle>
          <p className="text-sm text-muted-foreground">
            {loading ? "Loading…" : `${sorted.length} programme(s)`}
          </p>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Broadcasted</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Subcategory</TableHead>
                    <TableHead>Radio channel</TableHead>
                    <TableHead className="w-[120px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[1, 2, 3, 4, 5].map((i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={6} className="h-12 animate-pulse bg-muted/50" />
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : sorted.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-muted/20 py-16 text-center">
              <Music className="size-12 text-muted-foreground/50" />
              <p className="mt-4 font-medium text-muted-foreground">No programmes found</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {hasActiveFilters
                  ? "Try changing or clearing filters."
                  : "Upload a programme to get started."}
              </p>
              {hasActiveFilters && (
                <Button variant="outline" className="mt-4" onClick={clearFilters}>
                  Clear filters
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Broadcasted</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Subcategory</TableHead>
                    <TableHead>Radio channel</TableHead>
                    <TableHead className="w-[140px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sorted.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">
                        <span className="line-clamp-2">{p.title}</span>
                        {p.duration_seconds != null && (
                          <span className="mt-1 block text-xs text-muted-foreground">
                            {formatDurationSeconds(p.duration_seconds)}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {(formatDateOnlyDisplay(p.broadcasted_date) || p.broadcasted_date) ?? "—"}
                      </TableCell>
                      <TableCell>{(p.category as Category)?.name ?? "—"}</TableCell>
                      <TableCell>{(p.subcategory as Subcategory)?.name ?? "—"}</TableCell>
                      <TableCell>{(p.radio_channel as RadioChannel)?.name ?? "—"}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" asChild title="View on site">
                            <a
                              href={`/programmes/${encodeURIComponent(p.slug)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <ExternalLink className="size-4" />
                            </a>
                          </Button>
                          <Button variant="ghost" size="icon" asChild title="Edit">
                            <Link href={getAdminPath(`programmes/${p.id}/edit`)}>
                              <Pencil className="size-4" />
                            </Link>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() =>
                              handleDelete(p.id, p.firebase_storage_path ?? "")
                            }
                            className="text-destructive hover:text-destructive"
                            title="Delete"
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
