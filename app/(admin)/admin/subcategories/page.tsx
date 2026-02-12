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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Pencil, Trash2 } from "lucide-react";
import type { Category, Subcategory } from "@/lib/types";
import { AdminOnlyGuard } from "@/components/admin-only-guard";

export default function SubcategoriesPage() {
  return (
    <AdminOnlyGuard>
      <SubcategoriesContent />
    </AdminOnlyGuard>
  );
}

function SubcategoriesContent() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<(Subcategory & { category?: Category })[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<(Subcategory & { category?: Category }) | null>(null);
  const [categoryId, setCategoryId] = useState("");
  const [name, setName] = useState("");
  const [nameSi, setNameSi] = useState("");
  const [nameTa, setNameTa] = useState("");
  const [slug, setSlug] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const slugify = (s: string) =>
    s
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_-]+/g, "-")
      .replace(/^-+|-+$/g, "");

  const fetchData = async () => {
    try {
      const [catRes, subRes] = await Promise.all([
        fetch("/api/categories"),
        fetch("/api/subcategories"),
      ]);
      const catData = await catRes.json();
      const subData = await subRes.json();
      if (catRes.ok) setCategories(catData);
      if (subRes.ok) setSubcategories(subData);
    } catch {
      toast.error("Failed to fetch");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openCreate = () => {
    setEditing(null);
    setCategoryId(categories[0]?.id ?? "");
    setName("");
    setNameSi("");
    setNameTa("");
    setSlug("");
    setDialogOpen(true);
  };

  const openEdit = (s: Subcategory & { category?: Category }) => {
    setEditing(s);
    setCategoryId(s.category_id);
    setName(s.name);
    setNameSi(s.name_si ?? "");
    setNameTa(s.name_ta ?? "");
    setSlug(s.slug);
    setDialogOpen(true);
  };

  const handleNameChange = (v: string) => {
    setName(v);
    if (!editing) setSlug(slugify(v));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !categoryId) return;
    setSubmitting(true);
    try {
      const payload = {
        category_id: categoryId,
        name: name.trim(),
        name_si: nameSi.trim(),
        name_ta: nameTa.trim(),
        slug: slug.trim() || slugify(name),
      };
      const url = editing
        ? `/api/subcategories/${editing.id}`
        : "/api/subcategories";
      const method = editing ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(editing ? "Subcategory updated" : "Subcategory created");
        setDialogOpen(false);
        fetchData();
      } else toast.error(data.error || "Failed to save");
    } catch {
      toast.error("Failed to save");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this subcategory?")) return;
    try {
      const res = await fetch(`/api/subcategories/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (res.ok) {
        toast.success("Subcategory deleted");
        fetchData();
      } else toast.error(data.error || "Failed to delete");
    } catch {
      toast.error("Failed to delete");
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-bold">Subcategories</h1>
        <Button onClick={openCreate} disabled={categories.length === 0}>
          <Plus className="mr-2 size-4" />
          Add Subcategory
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Subcategories</CardTitle>
          <p className="text-sm text-muted-foreground">
            Subcategories belong to a parent category.
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
                  <TableHead>Name (EN)</TableHead>
                  <TableHead>Name (SI)</TableHead>
                  <TableHead>Name (TA)</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead className="w-[120px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {subcategories.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell>{s.name}</TableCell>
                    <TableCell className="text-muted-foreground">{s.name_si || "—"}</TableCell>
                    <TableCell className="text-muted-foreground">{s.name_ta || "—"}</TableCell>
                    <TableCell>{(s.category as Category)?.name ?? "-"}</TableCell>
                    <TableCell className="text-muted-foreground">{s.slug}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(s)}>
                          <Pencil className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(s.id)}
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
              {editing ? "Edit Subcategory" : "Add Subcategory"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Category</Label>
                <Select
                  value={categoryId}
                  onValueChange={setCategoryId}
                  disabled={!!editing}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="name">Name (English)</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="Subcategory name"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="sub_name_si">Name (සිංහල)</Label>
                <Input
                  id="sub_name_si"
                  value={nameSi}
                  onChange={(e) => setNameSi(e.target.value)}
                  placeholder="උප කාණ්ඩයේ නම"
                  dir="ltr"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="sub_name_ta">Name (தமிழ்)</Label>
                <Input
                  id="sub_name_ta"
                  value={nameTa}
                  onChange={(e) => setNameTa(e.target.value)}
                  placeholder="துணை வகை பெயர்"
                  dir="ltr"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="slug">Slug</Label>
                <Input
                  id="slug"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="subcategory-slug"
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
                {submitting ? "Saving..." : editing ? "Update" : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
