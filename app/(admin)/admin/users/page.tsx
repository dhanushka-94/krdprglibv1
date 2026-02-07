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
import { Textarea } from "@/components/ui/textarea";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { getAdminPath } from "@/lib/config";
import { AdminOnlyGuard } from "@/components/admin-only-guard";

interface Role {
  id: string;
  name: string;
  description?: string;
}

interface User {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
  company?: string | null;
  unit?: string | null;
  avatar_url: string | null;
  bio: string | null;
  role_id: string;
  is_active: boolean;
  created_at: string;
  role?: { id: string; name: string };
  category_ids?: string[];
  subcategory_ids?: string[];
}

interface Category {
  id: string;
  name: string;
}

interface Subcategory {
  id: string;
  name: string;
  category_id: string;
}

export default function UsersPage() {
  return (
    <AdminOnlyGuard>
      <UsersContent />
    </AdminOnlyGuard>
  );
}

function UsersContent() {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [company, setCompany] = useState("");
  const [unit, setUnit] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [bio, setBio] = useState("");
  const [roleId, setRoleId] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [categoryIds, setCategoryIds] = useState<string[]>([]);
  const [subcategoryIds, setSubcategoryIds] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    try {
      const [usersRes, rolesRes, catRes, subRes] = await Promise.all([
        fetch("/api/users"),
        fetch("/api/roles"),
        fetch("/api/categories"),
        fetch("/api/subcategories"),
      ]);
      const usersData = await usersRes.json();
      const rolesData = await rolesRes.json();
      const catData = await catRes.json();
      const subData = await subRes.json();
      if (usersRes.ok) setUsers(usersData);
      if (rolesRes.ok) setRoles(rolesData);
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

  useEffect(() => {
    fetch("/api/auth/me", { credentials: "include" })
      .then((r) => r.json())
      .then((data) => setIsAdmin(data.user?.role === "Admin"))
      .catch(() => setIsAdmin(false));
  }, []);

  const openCreate = () => {
    setEditingUser(null);
    setEmail("");
    setPassword("");
    setName("");
    setPhone("");
    setCompany("");
    setUnit("");
    setAvatarUrl("");
    setBio("");
    setRoleId(roles[0]?.id ?? "");
    setIsActive(true);
    setCategoryIds([]);
    setSubcategoryIds([]);
    setDialogOpen(true);
  };

  const openEdit = async (u: User) => {
    const res = await fetch(`/api/users/${u.id}`);
    const full = await res.json();
    if (!res.ok) {
      toast.error("Failed to load user");
      return;
    }
    setEditingUser(full);
    setEmail(full.email);
    setPassword("");
    setName(full.name ?? "");
    setPhone(full.phone ?? "");
    setCompany(full.company ?? "");
    setUnit(full.unit ?? "");
    setAvatarUrl(full.avatar_url ?? "");
    setBio(full.bio ?? "");
    setRoleId(full.role_id);
    setIsActive(full.is_active);
    setCategoryIds(full.category_ids ?? []);
    setSubcategoryIds(full.subcategory_ids ?? []);
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error("Email is required");
      return;
    }
    if (!editingUser && !password.trim()) {
      toast.error("Password is required for new users");
      return;
    }
    if (!roleId) {
      toast.error("Role is required");
      return;
    }
    setSubmitting(true);
    try {
      const payload: Record<string, unknown> = {
        email: email.trim(),
        name: name.trim() || null,
        phone: phone.trim() || null,
        company: company.trim() || null,
        unit: unit.trim() || null,
        avatar_url: avatarUrl.trim() || null,
        bio: bio.trim() || null,
        role_id: roleId,
        category_ids: categoryIds,
        subcategory_ids: subcategoryIds,
      };
      if (isAdmin) payload.is_active = isActive;
      if (password.trim()) payload.password = password;

      const url = editingUser ? `/api/users/${editingUser.id}` : "/api/users";
      const method = editingUser ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(editingUser ? "User updated" : "User created");
        setDialogOpen(false);
        fetchData();
      } else {
        toast.error(data.error || "Failed to save");
      }
    } catch {
      toast.error("Failed to save");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this user?")) return;
    try {
      const res = await fetch(`/api/users/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (res.ok) {
        toast.success("User deleted");
        fetchData();
      } else {
        toast.error(data.error || "Failed to delete");
      }
    } catch {
      toast.error("Failed to delete");
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-bold">Users</h1>
        <Button onClick={openCreate}>
          <Plus className="mr-2 size-4" />
          Add User
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Users</CardTitle>
          <p className="text-sm text-muted-foreground">
            Manage system users and their roles.
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
                  <TableHead>Email</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[120px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell>{u.email}</TableCell>
                    <TableCell>{u.name || "-"}</TableCell>
                    <TableCell>{u.company || "-"}</TableCell>
                    <TableCell>{u.unit || "-"}</TableCell>
                    <TableCell>{(Array.isArray(u.role) ? u.role[0]?.name : (u.role as { name?: string })?.name) ?? "-"}</TableCell>
                    <TableCell>
                      <span
                        className={
                          u.is_active
                            ? "text-green-600"
                            : "text-muted-foreground"
                        }
                      >
                        {u.is_active ? "Active" : "Inactive"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEdit(u)}
                        >
                          <Pencil className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(u.id)}
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
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingUser ? "Edit User" : "Add User"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="user@example.com"
                  disabled={!!editingUser}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password">
                  Password {editingUser ? "(leave blank to keep)" : "*"}
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Full name"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Phone number"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="company">Company</Label>
                <Input
                  id="company"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="Company name"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="unit">Unit</Label>
                <Input
                  id="unit"
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  placeholder="Unit"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="avatar">Avatar URL</Label>
                <Input
                  id="avatar"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  placeholder="https://..."
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Brief bio"
                  rows={3}
                />
              </div>
              <div className="grid gap-2">
                <Label>Role *</Label>
                <Select value={roleId} onValueChange={setRoleId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((r) => (
                      <SelectItem key={r.id} value={r.id}>
                        {r.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {editingUser && isAdmin && (
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="rounded"
                  />
                  <Label htmlFor="isActive">Active (Admin only)</Label>
                </div>
              )}
              <div className="border-t pt-4">
                <h4 className="mb-2 font-medium">Category / Subcategory Assignments</h4>
                <p className="mb-3 text-sm text-muted-foreground">
                  Programme Managers can only upload to assigned categories or subcategories.
                </p>
                <div className="space-y-3">
                  <div>
                    <Label className="text-xs">Categories</Label>
                    <div className="mt-1 max-h-32 overflow-y-auto rounded border p-2">
                      {categories.map((c) => (
                        <label key={c.id} className="flex items-center gap-2 py-1">
                          <input
                            type="checkbox"
                            checked={categoryIds.includes(c.id)}
                            onChange={(e) =>
                              setCategoryIds((prev) =>
                                e.target.checked ? [...prev, c.id] : prev.filter((id) => id !== c.id)
                              )
                            }
                          />
                          <span className="text-sm">{c.name}</span>
                        </label>
                      ))}
                      {categories.length === 0 && (
                        <p className="text-sm text-muted-foreground">No categories</p>
                      )}
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs">Subcategories</Label>
                    <div className="mt-1 max-h-32 overflow-y-auto rounded border p-2">
                      {subcategories.map((s) => (
                        <label key={s.id} className="flex items-center gap-2 py-1">
                          <input
                            type="checkbox"
                            checked={subcategoryIds.includes(s.id)}
                            onChange={(e) =>
                              setSubcategoryIds((prev) =>
                                e.target.checked ? [...prev, s.id] : prev.filter((id) => id !== s.id)
                              )
                            }
                          />
                          <span className="text-sm">{s.name}</span>
                        </label>
                      ))}
                      {subcategories.length === 0 && (
                        <p className="text-sm text-muted-foreground">No subcategories</p>
                      )}
                    </div>
                  </div>
                </div>
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
                {submitting ? "Saving..." : editingUser ? "Update" : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
