"use client";

import { useEffect, useState } from "react";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Pencil, Trash2 } from "lucide-react";
import type { Category, RadioChannel } from "@/lib/types";
import { AdminOnlyGuard } from "@/components/admin-only-guard";

export default function CategoriesPage() {
  return (
    <AdminOnlyGuard>
      <CategoriesContent />
    </AdminOnlyGuard>
  );
}

function CategoriesContent() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [radioChannels, setRadioChannels] = useState<RadioChannel[]>([]);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [radioChannelId, setRadioChannelId] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchCategories = async () => {
    try {
      const res = await fetch("/api/categories");
      const data = await res.json();
      if (res.ok) setCategories(data);
      else toast.error(data.error || "Failed to fetch");
    } catch {
      toast.error("Failed to fetch categories");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetch("/api/radio-channels")
      .then((r) => r.json())
      .then((d) => setRadioChannels(Array.isArray(d) ? d : []))
      .catch(() => {});
  }, []);

  const openCreate = () => {
    setEditingCategory(null);
    setName("");
    setSlug("");
    setRadioChannelId("");
    setDialogOpen(true);
  };

  const openEdit = (c: Category) => {
    setEditingCategory(c);
    setName(c.name);
    setSlug(c.slug);
    setRadioChannelId(c.radio_channel_id ?? "");
    setDialogOpen(true);
  };

  const slugify = (s: string) =>
    s
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_-]+/g, "-")
      .replace(/^-+|-+$/g, "");

  const handleNameChange = (v: string) => {
    setName(v);
    if (!editingCategory) setSlug(slugify(v));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSubmitting(true);
    try {
      const payload = { name: name.trim(), slug: slug.trim() || slugify(name), radio_channel_id: radioChannelId || null };
      const url = editingCategory
        ? `/api/categories/${editingCategory.id}`
        : "/api/categories";
      const method = editingCategory ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(editingCategory ? "Category updated" : "Category created");
        setDialogOpen(false);
        fetchCategories();
      } else toast.error(data.error || "Failed to save");
    } catch {
      toast.error("Failed to save");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this category? Subcategories will also be deleted."))
      return;
    try {
      const res = await fetch(`/api/categories/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (res.ok) {
        toast.success("Category deleted");
        fetchCategories();
      } else toast.error(data.error || "Failed to delete");
    } catch {
      toast.error("Failed to delete");
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-bold">Categories</h1>
        <Button onClick={openCreate}>
          <Plus className="mr-2 size-4" />
          Add Category
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Categories</CardTitle>
          <p className="text-sm text-muted-foreground">
            Manage categories. Subcategories can be added from the subcategories
            section.
          </p>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground">Loading...</p>
          ) : (
            <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Radio Channel</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead className="w-[120px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell>{c.name}</TableCell>
                    <TableCell className="text-muted-foreground">{(c.radio_channel as RadioChannel)?.name ?? "—"}</TableCell>
                    <TableCell className="text-muted-foreground">{c.slug}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEdit(c)}
                        >
                          <Pencil className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(c.id)}
                          className="text-destructive hover:text-destructive"
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

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? "Edit Category" : "Add Category"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="Category name"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="radio_channel">Radio Channel</Label>
                <Select value={radioChannelId || "__none__"} onValueChange={(v) => setRadioChannelId(v === "__none__" ? "" : v)}>
                  <SelectTrigger id="radio_channel">
                    <SelectValue placeholder="Select channel (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">None</SelectItem>
                    {radioChannels.map((ch) => (
                      <SelectItem key={ch.id} value={ch.id}>
                        {ch.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">Programmes in this category will show this channel.</p>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="slug">Slug</Label>
                <Input
                  id="slug"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="category-slug"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Saving..." : editingCategory ? "Update" : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
