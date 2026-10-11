'use client';
import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "../components/PageHeader";
import { ChartCard } from "../components/ChartCard";
import { EmptyState } from "../components/EmptyState";
import { callEdgeFn } from "../lib/api";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Trash2, UserPlus, Shield, Server } from "lucide-react";
import { Badge } from "@/components/admin-kit/_deps/components/ui/badge";

// DepthMe's feature-flag, funnel, voice-script, toast, font and intro-screen
// controls all read a feature_flags table Kyriq does not have; they were removed.

interface AdminUser {
  id: string;
  email: string;
  created_at: string;
}

const SUPABASE_HOST = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").replace(/^https?:\/\//, "");
const PROJECT_REF = SUPABASE_HOST.split(".")[0] || "—";

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const [promoteEmail, setPromoteEmail] = useState("");
  const [promoting, setPromoting] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const { data: admins, isLoading: adminsLoading } = useQuery({
    queryKey: ["admin", "settings", "admins"],
    queryFn: () => callEdgeFn<{ admins: AdminUser[] }>("admin-list-admins", {}),
    staleTime: 60_000,
  });

  async function promoteByEmail(e: React.FormEvent) {
    e.preventDefault();
    const email = promoteEmail.trim();
    if (!email) return;
    setPromoting(true);
    try {
      // 1. Look up user_id by email
      const lookup = await callEdgeFn<{ user: { id: string; email: string } }>(
        "admin-find-user-by-email",
        { email }
      );
      // 2. Promote to admin
      await callEdgeFn("admin-set-role", {
        targetUserId: lookup.user.id,
        role: "admin",
      });
      toast.success(`${lookup.user.email} is now an admin`);
      setPromoteEmail("");
      await queryClient.invalidateQueries({ queryKey: ["admin", "settings", "admins"] });
    } catch (err) {
      toast.error(`Promote failed: ${err instanceof Error ? err.message : "Unknown"}`);
    } finally {
      setPromoting(false);
    }
  }

  async function removeAdmin(adminId: string, adminEmail: string) {
    if (!confirm(`Remove admin role from ${adminEmail}?`)) return;
    setRemovingId(adminId);
    try {
      await callEdgeFn("admin-set-role", { targetUserId: adminId, role: null });
      toast.success(`Removed admin role from ${adminEmail}`);
      await queryClient.invalidateQueries({ queryKey: ["admin", "settings", "admins"] });
    } catch (err) {
      toast.error(`Remove failed: ${err instanceof Error ? err.message : "Unknown"}`);
    } finally {
      setRemovingId(null);
    }
  }

  return (
    <div className="space-y-8">
      <PageHeader title="Settings" description="Admin users and project details" />

      {/* Admin users */}
      <ChartCard
        title="Admin Users"
        description={admins?.admins?.length
          ? `${admins.admins.length} ${admins.admins.length === 1 ? 'admin' : 'admins'} with full dashboard access`
          : "Accounts with app_metadata.role = admin"}
        loading={adminsLoading}
      >
        {/* Promote form — pretty styled card */}
        <div className="rounded-xl border border-brand/20 bg-gradient-to-br from-brand/[0.06] to-transparent p-4 mb-5">
          <div className="flex items-center gap-2 mb-2.5">
            <Shield size={13} className="text-brand" />
            <p className="text-xs font-medium text-brand">Promote a user</p>
          </div>
          <form onSubmit={promoteByEmail} className="flex gap-2">
            <input
              type="email"
              placeholder="email@example.com"
              value={promoteEmail}
              onChange={(e) => setPromoteEmail(e.target.value)}
              disabled={promoting}
              className="flex-1 h-9 px-3 rounded-md bg-surface border border-glass-hairline text-sm text-ink-strong placeholder:text-ink-faint focus:border-brand/50 focus:outline-none disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={promoting || !promoteEmail.trim()}
              className="h-9 px-4 rounded-md bg-brand-dark hover:bg-brand disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium flex items-center gap-1.5 transition-colors shadow-lg shadow-brand/20"
            >
              <UserPlus size={14} />
              {promoting ? "Promoting…" : "Promote"}
            </button>
          </form>
        </div>

        {!admins?.admins?.length ? (
          <EmptyState title="No admin users found" description="Promote a user with the form above." />
        ) : (
          <div className="space-y-1.5">
            {admins.admins.map((admin) => (
              <div key={admin.id} className="flex items-center gap-3 py-2.5 px-3 rounded-lg hover:bg-surface-sunken transition-colors group">
                <div className="h-9 w-9 rounded-full bg-gradient-to-br from-brand/30 to-brand/10 ring-1 ring-brand/30 flex items-center justify-center text-xs text-brand font-semibold shrink-0">
                  {(admin.email?.[0] || "?").toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm text-ink-strong truncate">{admin.email}</p>
                    <Badge variant="outline" className="text-[9px] h-4 px-1.5 border-brand/30 bg-brand/10 text-brand">
                      ADMIN
                    </Badge>
                  </div>
                  <p className="text-[11px] text-ink-faint font-mono">{admin.id.slice(0, 12)}…</p>
                </div>
                <button
                  onClick={() => removeAdmin(admin.id, admin.email)}
                  disabled={removingId === admin.id}
                  className="h-8 px-2.5 rounded-md text-error-text hover:bg-error-bg hover:text-error-text disabled:opacity-40 transition-[color,background-color,border-color,box-shadow,opacity,transform] opacity-60 group-hover:opacity-100 flex items-center gap-1.5 text-xs"
                  aria-label={`Remove admin ${admin.email}`}
                >
                  <Trash2 size={13} />
                  {removingId === admin.id ? "Removing…" : "Remove"}
                </button>
              </div>
            ))}
          </div>
        )}
      </ChartCard>

      {/* Project info */}
      <ChartCard title="Project" description="Supabase project details">
        <div className="space-y-2 text-sm">
          {[
            { icon: <Server size={12} className="text-ink-soft" />, label: "Project ref", value: PROJECT_REF, mono: true },
            { icon: null, label: "URL", value: SUPABASE_HOST || "—", mono: true, accent: true },
          ].map((row) => (
            <div key={row.label} className="flex items-center justify-between py-1.5">
              <span className="text-ink-soft inline-flex items-center gap-1.5">{row.icon}{row.label}</span>
              <span className={cn(
                row.mono ? "font-mono text-xs" : "",
                row.accent ? "text-brand" : "text-ink-body",
              )}>
                {row.value}
              </span>
            </div>
          ))}
        </div>
      </ChartCard>
    </div>
  );
}
