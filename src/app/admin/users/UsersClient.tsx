"use client";

import { useState } from "react";
import { useAdmin } from "@/lib/admin-context";
import AdminShell from "@/components/admin/AdminShell";
import type { UserPublic, UserRole } from "@/lib/users";

export default function UsersClient({ users: initialUsers }: { users: UserPublic[] }) {
  const { dict } = useAdmin();
  const [users, setUsers] = useState<UserPublic[]>(initialUsers);
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState<UserPublic | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(
    null,
  );

  const [formEmail, setFormEmail] = useState("");
  const [formPassword, setFormPassword] = useState("");
  const [formRole, setFormRole] = useState<UserRole>("product_editor");

  const resolveRoles = () => {
    const d = dict.usersPage;
    return [
      { value: "admin" as UserRole, label: d.roles.admin, desc: d.roleDescriptions.admin },
      { value: "manager" as UserRole, label: d.roles.manager, desc: d.roleDescriptions.manager },
      {
        value: "product_editor" as UserRole,
        label: d.roles.product_editor,
        desc: d.roleDescriptions.product_editor,
      },
    ];
  };

  const roles = resolveRoles();

  const clearForm = () => {
    setFormEmail("");
    setFormPassword("");
    setFormRole("product_editor");
    setEditingUser(null);
    setShowForm(false);
    setMessage(null);
  };

  const showMessage = (text: string, type: "success" | "error") => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 4000);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: formEmail, password: formPassword, role: formRole }),
      });
      if (res.ok) {
        const newUser = (await res.json()) as UserPublic;
        setUsers((prev) => [newUser, ...prev]);
        showMessage(dict.usersPage.messages.created, "success");
        clearForm();
      } else {
        const err = (await res.json()) as { error?: string };
        showMessage(err.error || dict.usersPage.messages.error, "error");
      }
    } catch {
      showMessage(dict.usersPage.messages.error, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setLoading(true);
    try {
      const body: Record<string, unknown> = { id: editingUser.id };
      if (formEmail !== editingUser.email) body.email = formEmail;
      if (formPassword) body.password = formPassword;
      if (formRole !== editingUser.role) body.role = formRole;

      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });
      if (res.ok) {
        const updated = (await res.json()) as UserPublic;
        setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
        showMessage(dict.usersPage.messages.updated, "success");
        clearForm();
      } else {
        const err = (await res.json()) as { error?: string };
        showMessage(err.error || dict.usersPage.messages.error, "error");
      }
    } catch {
      showMessage(dict.usersPage.messages.error, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/users?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (res.ok) {
        setUsers((prev) => prev.filter((u) => u.id !== id));
        showMessage(dict.usersPage.messages.deleted, "success");
      } else {
        const err = (await res.json()) as { error?: string };
        showMessage(err.error || dict.usersPage.messages.error, "error");
      }
    } catch {
      showMessage(dict.usersPage.messages.error, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (user: UserPublic) => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ id: user.id, isActive: !user.is_active }),
      });
      if (res.ok) {
        const updated = (await res.json()) as UserPublic;
        setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    clearForm();
    setShowForm(true);
  };

  const openEdit = (user: UserPublic) => {
    setFormEmail(user.email);
    setFormPassword("");
    setFormRole(user.role);
    setEditingUser(user);
    setShowForm(true);
    setMessage(null);
  };

  const getRoleBadge = (role: UserRole) => {
    const colors: Record<UserRole, string> = {
      admin: "bg-gold/15 text-gold border-gold/30",
      manager: "bg-indigo-500/15 text-indigo-400 border-indigo-500/30",
      product_editor: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    };
    const roleData = roles.find((r) => r.value === role);
    return (
      <span
        className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${colors[role]}`}
      >
        {roleData?.label ?? role}
      </span>
    );
  };

  return (
    <AdminShell title={dict.usersPage.title}>
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-muted/60">
              {dict.usersPage.heading}
            </p>
            <p className="mt-1 text-xs text-muted/50">{dict.usersPage.intro}</p>
          </div>
          <button
            onClick={openCreate}
            className="inline-flex items-center gap-2 rounded-lg bg-gold px-4 py-2 text-xs font-semibold text-black transition-all duration-150 hover:bg-gold/90"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            {dict.usersPage.create}
          </button>
        </div>

        {message && (
          <div
            className={`mb-4 rounded-lg border px-4 py-3 text-xs ${
              message.type === "success"
                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                : "border-red-500/30 bg-red-500/10 text-red-400"
            }`}
          >
            {message.text}
          </div>
        )}

        {showForm && (
          <div className="mb-6 rounded-2xl border border-white/8 bg-surface p-6">
            <p className="mb-4 text-xs font-semibold text-muted/80">
              {editingUser ? dict.usersPage.form.edit : dict.usersPage.create}
            </p>
            <form
              onSubmit={editingUser ? handleEdit : handleCreate}
              className="flex flex-col gap-4 sm:flex-row sm:items-end"
            >
              <div className="flex-1">
                <label className="mb-1 block text-[10px] uppercase tracking-widest text-muted/60">
                  {dict.usersPage.form.email}
                </label>
                <input
                  type="email"
                  required
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-surface-strong px-3 py-2 text-sm text-foreground placeholder:text-muted/40 focus:border-gold/40 focus:outline-none"
                  placeholder="user@example.com"
                />
              </div>
              <div className="flex-1">
                <label className="mb-1 block text-[10px] uppercase tracking-widest text-muted/60">
                  {dict.usersPage.form.password}
                </label>
                <input
                  type="text"
                  required={!editingUser}
                  value={formPassword}
                  onChange={(e) => setFormPassword(e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-surface-strong px-3 py-2 text-sm text-foreground placeholder:text-muted/40 focus:border-gold/40 focus:outline-none"
                  placeholder={editingUser ? "Leave empty to keep" : "Password"}
                />
              </div>
              <div className="w-48">
                <label className="mb-1 block text-[10px] uppercase tracking-widest text-muted/60">
                  {dict.usersPage.form.role}
                </label>
                <select
                  value={formRole}
                  onChange={(e) => setFormRole(e.target.value as UserRole)}
                  className="w-full rounded-lg border border-white/10 bg-surface-strong px-3 py-2 text-sm text-foreground focus:border-gold/40 focus:outline-none"
                >
                  {roles.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="rounded-lg bg-gold px-4 py-2 text-xs font-semibold text-black transition-all duration-150 hover:bg-gold/90 disabled:opacity-50"
                >
                  {loading
                    ? editingUser
                      ? dict.usersPage.form.editing
                      : dict.usersPage.form.saving
                    : editingUser
                      ? dict.usersPage.form.edit
                      : dict.usersPage.form.save}
                </button>
                <button
                  type="button"
                  onClick={clearForm}
                  className="rounded-lg border border-white/10 px-4 py-2 text-xs text-muted/60 transition-all duration-150 hover:border-white/20 hover:text-muted"
                >
                  Cancel
                </button>
              </div>
            </form>
            {formRole && (
              <p className="mt-3 text-[10px] text-muted/50">
                {roles.find((r) => r.value === formRole)?.desc}
              </p>
            )}
          </div>
        )}

        <div className="overflow-hidden rounded-2xl border border-white/8">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-white/5 bg-surface/40">
                <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-widest text-muted/50">
                  {dict.usersPage.table.email}
                </th>
                <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-widest text-muted/50">
                  {dict.usersPage.table.role}
                </th>
                <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-widest text-muted/50">
                  {dict.usersPage.table.status}
                </th>
                <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-widest text-muted/50">
                  {dict.usersPage.table.created}
                </th>
                <th className="px-4 py-3 text-right text-[10px] font-semibold uppercase tracking-widest text-muted/50">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-muted/50">
                    {dict.usersPage.empty}
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr
                    key={user.id}
                    className="transition-colors duration-150 hover:bg-white/3"
                  >
                    <td className="px-4 py-3 font-medium text-foreground">
                      <span className="truncate">{user.email}</span>
                    </td>
                    <td className="px-4 py-3">{getRoleBadge(user.role)}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleToggleActive(user)}
                        disabled={loading}
                        className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider transition-all duration-150 ${
                          user.is_active
                            ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
                            : "border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20"
                        }`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            user.is_active ? "bg-emerald-400" : "bg-red-400"
                          }`}
                        />
                        {user.is_active
                          ? dict.usersPage.status.active
                          : dict.usersPage.status.inactive}
                      </button>
                    </td>
                    <td className="px-4 py-3 font-mono text-[10px] tabular-nums text-muted/50">
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEdit(user)}
                          className="rounded-md px-2.5 py-1.5 text-[10px] text-muted/50 transition-all duration-150 hover:bg-white/8 hover:text-gold"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(user.id)}
                          disabled={loading}
                          className="rounded-md px-2.5 py-1.5 text-[10px] text-muted/50 transition-all duration-150 hover:bg-red-500/10 hover:text-red-400 disabled:opacity-50"
                        >
                          {dict.usersPage.form.delete}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AdminShell>
  );
}
