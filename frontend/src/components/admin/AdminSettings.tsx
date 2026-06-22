"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AdminShell from "./AdminShell";
import { fetchAdminProfile, updateAdminCredentials } from "@/lib/blogApi";
import { isAdminAuthenticated } from "@/lib/adminAuth";
import { ApiError } from "@/lib/api";

export default function AdminSettings() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!isAdminAuthenticated()) {
      router.replace("/admin/login");
      return;
    }

    async function load() {
      try {
        const profile = await fetchAdminProfile();
        setUsername(profile.username);
        setNewUsername(profile.username);
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) {
          router.replace("/admin/login");
          return;
        }
        setError("Failed to load admin profile.");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [router]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    const usernameChanged = newUsername.trim() !== username;
    const passwordChanged = newPassword.length > 0;

    if (!usernameChanged && !passwordChanged) {
      setError("Change your username and/or enter a new password.");
      return;
    }

    if (passwordChanged && newPassword !== confirmPassword) {
      setError("New password and confirmation do not match.");
      return;
    }

    setSaving(true);
    try {
      const result = await updateAdminCredentials({
        current_password: currentPassword,
        ...(usernameChanged ? { new_username: newUsername.trim() } : {}),
        ...(passwordChanged ? { new_password: newPassword } : {}),
      });
      setUsername(result.username);
      setNewUsername(result.username);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setSuccess(result.message);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Update failed.";
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminShell title="Account settings" showCreateButton={false}>
      {loading ? (
        <p className="text-sm text-muted">Loading…</p>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="max-w-xl space-y-5 rounded-xl border border-border bg-surface p-6 shadow-sm"
        >
          <p className="text-sm text-muted">
            Update your admin username or password. You must enter your current password to save
            changes.
          </p>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">
              Current password
            </label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full rounded-lg border border-border px-3 py-2.5 text-sm"
              required
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">Username</label>
            <input
              type="text"
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value)}
              className="w-full rounded-lg border border-border px-3 py-2.5 text-sm"
              minLength={3}
              required
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">
              New password <span className="text-muted">(optional)</span>
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full rounded-lg border border-border px-3 py-2.5 text-sm"
              minLength={6}
              placeholder="Leave blank to keep current password"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">
              Confirm new password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full rounded-lg border border-border px-3 py-2.5 text-sm"
              minLength={6}
            />
          </div>

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-800 dark:bg-red-950/40 dark:text-red-200">
              {error}
            </div>
          )}

          {success && (
            <div className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800 dark:border-green-800 dark:bg-green-950/40 dark:text-green-200">
              {success}
            </div>
          )}

          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save changes"}
          </button>
        </form>
      )}
    </AdminShell>
  );
}
