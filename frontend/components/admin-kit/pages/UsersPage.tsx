'use client';
import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  SortingState,
} from "@tanstack/react-table";
import { Search, ChevronLeft, ChevronRight, MoreVertical, ArrowUp, ArrowDown, ArrowUpDown, Mic, Download } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/admin-kit/_deps/components/ui/dialog";
import { toast } from "sonner";
import { PageHeader } from "../components/PageHeader";
import { KpiTile } from "../components/KpiTile";
import { ChartCard } from "../components/ChartCard";
import { UserDetailDrawer } from "../components/UserDetailDrawer";
import { useAdminMetrics } from "../lib/queries";
import { callEdgeFn } from "../lib/api";
import { formatNumber, formatRelative } from "../lib/formatters";
import { cn } from "@/lib/utils";
import { Input } from "@/components/admin-kit/_deps/components/ui/input";
import { Badge } from "@/components/admin-kit/_deps/components/ui/badge";
import { Button } from "@/components/admin-kit/_deps/components/ui/button";
import { Skeleton } from "@/components/admin-kit/_deps/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/admin-kit/_deps/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/admin-kit/_deps/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/admin-kit/_deps/components/ui/dropdown-menu";

interface User {
  id: string;
  email: string;
  full_name: string | null;
  display_name: string | null;
  created_at: string;
  last_active_at: string | null;
  is_premium: boolean;
  premium_plan: "monthly" | "yearly" | null;
  premium_grant_expires_at?: string | null;
  premium_grant_source?: string | null;
  role?: string | null;
  goal_id?: string | null;
  voice_clone_status?: 'pending' | 'cloning' | 'ready' | 'failed' | null;
  country_code?: string | null;
  language?: string | null;
  utm_source?: string | null;
  utm_medium?: string | null;
  referrer?: string | null;
  signup_platform?: string | null;
  heard_about?: string | null;
  preferred_name?: string | null;
  /** Inverted opt-in: true means this person must NOT receive marketing email. */
  reminder_opt_out?: boolean | null;
}

interface UsersListResponse {
  rows: User[];
  nextCursor: string | null;
  hasMore: boolean;
}

type GrantDuration = '7d' | '30d' | '3m' | '6m' | '1y' | 'lifetime';
const GRANT_OPTIONS: { value: GrantDuration; label: string }[] = [
  { value: '7d', label: '7 days' },
  { value: '30d', label: '30 days' },
  { value: '3m', label: '3 months' },
  { value: '6m', label: '6 months' },
  { value: '1y', label: '1 year' },
  { value: 'lifetime', label: 'Lifetime' },
];

const GOAL_LABEL: Record<string, { label: string; color: string }> = {
  manage_emotions:   { label: 'Emotions',  color: 'border-error-border bg-error-bg text-error-text' },
  connect_to_source: { label: 'Source',    color: 'border-brand/30 bg-brand/10 text-brand' },
  attract_abundance: { label: 'Abundance', color: 'border-warning-border bg-warning-bg text-warning-text' },
  all_of_the_above:  { label: 'All',       color: 'border-success-border bg-success-bg text-success-text' },
};

// Best-effort country code → flag emoji conversion (ISO-2 → regional indicator pair)
function flagEmoji(cc: string | null | undefined): string {
  if (!cc || cc.length !== 2) return '';
  const A = 0x1F1E6;
  const a = 'A'.charCodeAt(0);
  return String.fromCodePoint(A + (cc.toUpperCase().charCodeAt(0) - a)) +
         String.fromCodePoint(A + (cc.toUpperCase().charCodeAt(1) - a));
}

function isUserGrantActive(u: User): boolean {
  if (!u.premium_grant_expires_at) return false;
  return new Date(u.premium_grant_expires_at) > new Date();
}

interface ColumnOpts {
  onView: (u: User) => void;
  onPromote: (u: User) => void;
  onDemote: (u: User) => void;
  onGrant: (u: User, duration: GrantDuration) => void;
  onRevokeGrant: (u: User) => void;
  pendingId: string | null;
}

function buildColumns(opts: ColumnOpts): ColumnDef<User, unknown>[] {
  const { onView, onPromote, onDemote, onGrant, onRevokeGrant, pendingId } = opts;
  return [
    {
      header: "User",
      id: "email",
      enableSorting: true,
      cell: ({ row }) => (
        <div>
          <p className="text-sm text-ink-strong">{row.original.email}</p>
          {(row.original.full_name || row.original.display_name) && (
            <p className="text-xs text-ink-soft">{row.original.display_name || row.original.full_name}</p>
          )}
          {row.original.role === 'admin' && (
            <Badge variant="outline" className="mt-1 text-[10px] border-brand/40 bg-brand/15 text-brand">
              Admin
            </Badge>
          )}
        </div>
      ),
    },
    {
      header: "Plan",
      id: "is_premium",
      enableSorting: true,
      cell: ({ row }) => {
        const grantActive = isUserGrantActive(row.original);
        // Hierarchy: Granted > Premium > Free. Show one badge primarily.
        if (row.original.is_premium) {
          return (
            <Badge variant="outline" className="text-xs border-brand/30 bg-brand/10 text-brand">
              {row.original.premium_plan === 'yearly' ? 'Annual' : 'Monthly'}
            </Badge>
          );
        }
        if (grantActive) {
          return (
            <Badge variant="outline" className="text-xs border-warning-border bg-warning-bg text-warning-text">
              Granted
            </Badge>
          );
        }
        return (
          <Badge variant="outline" className="text-xs border-glass-hairline text-ink-soft">
            Free
          </Badge>
        );
      },
    },
    {
      header: "Goal",
      id: "goal_id",
      enableSorting: true,
      cell: ({ row }) => {
        const meta = row.original.goal_id ? GOAL_LABEL[row.original.goal_id] : null;
        if (!meta) return <span className="text-ink-faint text-xs">—</span>;
        return (
          <Badge variant="outline" className={cn("text-[11px]", meta.color)}>
            {meta.label}
          </Badge>
        );
      },
    },
    {
      header: "Voice",
      id: "voice_clone_status",
      enableSorting: true,
      cell: ({ row }) => {
        const s = row.original.voice_clone_status;
        if (s === 'ready') {
          return (
            <span className="inline-flex items-center gap-1 text-success-text text-xs">
              <Mic size={11} /> Ready
            </span>
          );
        }
        if (s === 'cloning' || s === 'pending') {
          return <span className="inline-flex items-center gap-1 text-warning-text text-xs"><Mic size={11} /> {s}</span>;
        }
        if (s === 'failed') {
          return <span className="inline-flex items-center gap-1 text-error-text text-xs"><Mic size={11} /> Failed</span>;
        }
        return <span className="text-ink-faint text-xs">—</span>;
      },
    },
    {
      header: "Country",
      id: "country_code",
      enableSorting: true,
      cell: ({ row }) => {
        const cc = row.original.country_code;
        if (!cc) return <span className="text-ink-faint text-xs">—</span>;
        return (
          <span className="text-xs text-ink-body tabular-nums">
            <span className="mr-1">{flagEmoji(cc)}</span>{cc.toUpperCase()}
          </span>
        );
      },
    },
    {
      header: "Joined",
      id: "created_at",
      enableSorting: true,
      cell: ({ row }) => (
        <span className="text-xs text-ink-soft">{new Date(row.original.created_at).toLocaleDateString()}</span>
      ),
    },
    {
      header: "Source",
      id: "source",
      enableSorting: false,
      cell: ({ row }) => {
        const u = row.original;
        const channel = u.utm_source || u.referrer || "direct";
        return (
          <div className="flex flex-col gap-0.5">
            <span className="text-xs text-ink-body">{channel}</span>
            {(u.utm_medium || u.signup_platform) && (
              <span className="text-[10px] text-ink-soft">
                {[u.utm_medium, u.signup_platform].filter(Boolean).join(" · ")}
              </span>
            )}
            {u.heard_about && (
              <span className="text-[10px] text-ink-soft">said: {u.heard_about}</span>
            )}
          </div>
        );
      },
    },
    {
      header: "Last Active",
      id: "last_active_at",
      enableSorting: true,
      cell: ({ row }) => (
        <span className="text-xs text-ink-soft">
          {row.original.last_active_at ? formatRelative(row.original.last_active_at) : "—"}
        </span>
      ),
    },
    {
      header: "",
      id: "actions",
      enableSorting: false,
      cell: ({ row }) => {
        const u = row.original;
        const isPending = pendingId === u.id;
        const isAdmin = u.role === 'admin';
        const grantActive = isUserGrantActive(u);
        return (
          <div onClick={(e) => e.stopPropagation()} className="flex justify-end">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  disabled={isPending}
                  className="h-8 w-8 rounded-md flex items-center justify-center text-ink-soft hover:text-ink-strong hover:bg-surface-sunken transition-colors disabled:opacity-40"
                  aria-label="User actions"
                >
                  <MoreVertical size={16} />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-surface border-glass-hairline text-ink-strong">
                <DropdownMenuLabel className="text-ink-soft text-xs">Manage user</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => onView(u)} className="text-ink-strong focus:bg-surface-sunken focus:text-ink-strong">
                  View details
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-surface-sunken" />
                {isAdmin ? (
                  <DropdownMenuItem onClick={() => onDemote(u)} className="text-error-text focus:bg-error-bg focus:text-error-text">
                    Remove admin role
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem onClick={() => onPromote(u)} className="text-brand focus:bg-brand/10 focus:text-brand">
                    Make admin
                  </DropdownMenuItem>
                )}
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger className="text-warning-text focus:bg-warning-bg focus:text-warning-text">
                    Comp paid access
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent className="bg-surface border-glass-hairline">
                    {GRANT_OPTIONS.map((opt) => (
                      <DropdownMenuItem key={opt.value} onClick={() => onGrant(u, opt.value)} className="text-warning-text focus:bg-warning-bg focus:text-warning-text">
                        {opt.label}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
                {grantActive && (
                  <DropdownMenuItem onClick={() => onRevokeGrant(u)} className="text-error-text focus:bg-error-bg focus:text-error-text">
                    Revoke grant
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    },
  ];
}

interface ExportField {
  id: string;
  label: string;
  getter: (u: User) => string;
}

const EXPORT_FIELDS: ExportField[] = [
  { id: 'email', label: 'Email', getter: (u) => u.email },
  { id: 'name', label: 'Name / Display Name', getter: (u) => u.display_name || u.full_name || '' },
  // The greeting field for email campaigns. Kept separate from the column above
  // because full_name is frequently empty or derived from the email local part,
  // which reads as spam when used in a "Hi ___".
  { id: 'first_name', label: 'First Name (for email)', getter: (u) => {
    const n = (u.preferred_name || u.display_name || u.full_name || '').trim().split(/\s+/)[0] || '';
    return n ? n.charAt(0).toUpperCase() + n.slice(1) : '';
  } },
  { id: 'language', label: 'Language', getter: (u) => u.language || 'en' },
  { id: 'mailable', label: 'Mailable (not opted out)', getter: (u) => (u.reminder_opt_out ? 'no' : 'yes') },
  { id: 'plan', label: 'Plan', getter: (u) => u.is_premium ? (u.premium_plan || 'premium') : (isUserGrantActive(u) ? 'granted' : 'free') },
  { id: 'goal', label: 'Goal', getter: (u) => u.goal_id ? (GOAL_LABEL[u.goal_id]?.label || u.goal_id) : '' },
  { id: 'country', label: 'Country', getter: (u) => u.country_code?.toUpperCase() || '' },
  { id: 'voice', label: 'Voice Status', getter: (u) => u.voice_clone_status || '' },
  { id: 'joined', label: 'Joined Date', getter: (u) => u.created_at ? new Date(u.created_at).toISOString().slice(0, 10) : '' },
  { id: 'source', label: 'Source Channel', getter: (u) => u.utm_source || u.referrer || 'direct' },
  { id: 'last_active', label: 'Last Active Date', getter: (u) => u.last_active_at ? new Date(u.last_active_at).toISOString().slice(0, 10) : '' },
];

export default function UsersPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [premiumFilter, setPremiumFilter] = useState<"all" | "premium" | "free">("all");
  const [cursorHistory, setCursorHistory] = useState<string[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [pendingActionId, setPendingActionId] = useState<string | null>(null);
  const [sorting, setSorting] = useState<SortingState>([{ id: 'created_at', desc: true }]);

  // Server caps a non-export page at 100 (admin-users-list), so 100 is the ceiling.
  const [pageSize, setPageSize] = useState(20);

  const [exportOpen, setExportOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [selectedFields, setSelectedFields] = useState<string[]>(EXPORT_FIELDS.map((f) => f.id));
  /** Whether the export honours the on-screen search/plan filters or ignores them. */
  const [exportScope, setExportScope] = useState<'filtered' | 'all'>('all');
  /** Letter narrowing, applied client-side to the fetched set. */
  const [letterMode, setLetterMode] = useState<'any' | 'from' | 'only'>('any');
  const [letter, setLetter] = useState('A');
  const [letterField, setLetterField] = useState<'email' | 'name'>('email');

  const sortBy = sorting[0]?.id ?? 'created_at';
  const sortDir: 'asc' | 'desc' = sorting[0]?.desc === false ? 'asc' : 'desc';

  const { data: metrics, isLoading: metricsLoading } = useAdminMetrics();

  const usersQuery = useQuery({
    queryKey: ["admin", "users", "list", { search, premiumFilter, cursor, sortBy, sortDir, pageSize }],
    queryFn: () =>
      callEdgeFn<UsersListResponse>("admin-users-list", {
        search: search || undefined,
        isPremium: premiumFilter === "all" ? undefined : premiumFilter === "premium",
        cursor: cursor || undefined,
        limit: pageSize,
        sortBy,
        sortDir,
      }),
    staleTime: 30_000,
    placeholderData: (prev) => prev,
  });

  function openDrawer(u: User) {
    setSelectedUserId(u.id);
    setDrawerOpen(true);
  }

  async function promoteUser(u: User) {
    if (!confirm(`Make ${u.email} an admin?`)) return;
    setPendingActionId(u.id);
    try {
      await callEdgeFn("admin-set-role", { targetUserId: u.id, role: "admin" });
      toast.success(`${u.email} is now an admin`);
      await queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
    } catch (err) {
      toast.error(`Promote failed: ${err instanceof Error ? err.message : "Unknown"}`);
    } finally {
      setPendingActionId(null);
    }
  }

  async function demoteUser(u: User) {
    if (!confirm(`Remove admin role from ${u.email}?`)) return;
    setPendingActionId(u.id);
    try {
      await callEdgeFn("admin-set-role", { targetUserId: u.id, role: null });
      toast.success(`Removed admin role from ${u.email}`);
      await queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
    } catch (err) {
      toast.error(`Remove failed: ${err instanceof Error ? err.message : "Unknown"}`);
    } finally {
      setPendingActionId(null);
    }
  }

  async function grantUser(u: User, duration: GrantDuration) {
    setPendingActionId(u.id);
    try {
      await callEdgeFn("admin-grant-premium", { targetUserId: u.id, duration });
      toast.success(`${u.email} granted ${GRANT_OPTIONS.find(o => o.value === duration)?.label ?? duration}`);
      await queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      await queryClient.invalidateQueries({ queryKey: ["admin", "users", u.id] });
      await queryClient.invalidateQueries({ queryKey: ["admin", "metrics"] });
    } catch (err) {
      toast.error(`Grant failed: ${err instanceof Error ? err.message : "Unknown"}`);
    } finally {
      setPendingActionId(null);
    }
  }

  async function revokeGrant(u: User) {
    if (!confirm(`Revoke premium grant for ${u.email}?`)) return;
    setPendingActionId(u.id);
    try {
      await callEdgeFn("admin-grant-premium", { targetUserId: u.id, duration: null });
      toast.success(`Grant revoked for ${u.email}`);
      await queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      await queryClient.invalidateQueries({ queryKey: ["admin", "users", u.id] });
      await queryClient.invalidateQueries({ queryKey: ["admin", "metrics"] });
    } catch (err) {
      toast.error(`Revoke failed: ${err instanceof Error ? err.message : "Unknown"}`);
    } finally {
      setPendingActionId(null);
    }
  }

  const columns = React.useMemo(
    () => buildColumns({
      onView: openDrawer,
      onPromote: promoteUser,
      onDemote: demoteUser,
      onGrant: grantUser,
      onRevokeGrant: revokeGrant,
      pendingId: pendingActionId,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [pendingActionId]
  );

  const table = useReactTable({
    data: usersQuery.data?.rows ?? [],
    columns,
    state: { sorting },
    onSortingChange: (updater) => {
      // Reset cursor when sort changes; server-side sort means the cursor key must match.
      setCursor(null);
      setCursorHistory([]);
      setSorting(typeof updater === 'function' ? updater(sorting) : updater);
    },
    manualSorting: true,
    getCoreRowModel: getCoreRowModel(),
  });

  function goNext() {
    const next = usersQuery.data?.nextCursor;
    if (!next) return;
    setCursorHistory((h) => [...h, cursor ?? ""]);
    setCursor(next);
  }

  function goPrev() {
    const history = [...cursorHistory];
    const prev = history.pop() ?? null;
    setCursorHistory(history);
    setCursor(prev);
  }

  async function handleExportCsv() {
    if (selectedFields.length === 0) {
      toast.error("Please select at least one column to export");
      return;
    }
    setExporting(true);
    try {
      const honourFilters = exportScope === 'filtered';
      const res = await callEdgeFn<UsersListResponse>("admin-users-list", {
        search: honourFilters ? (search || undefined) : undefined,
        isPremium: honourFilters && premiumFilter !== "all" ? premiumFilter === "premium" : undefined,
        exportAll: true,
        sortBy,
        sortDir,
      });

      // Letter narrowing runs here rather than server-side: the export already
      // pulls the whole set in one request, so filtering locally keeps it instant
      // and avoids another edge-function round trip per tweak.
      const selected = (res.rows || []).filter((u) => {
        if (letterMode === 'any') return true;
        const source = letterField === 'email'
          ? (u.email || '')
          : (u.display_name || u.full_name || '');
        const initial = source.trim().charAt(0).toUpperCase();
        if (!initial) return false;                 // no name/email → can't be in a letter range
        return letterMode === 'only' ? initial === letter : initial >= letter;
      });

      if (selected.length === 0) {
        toast.error("No users match that selection — nothing to export");
        return;
      }

      const fieldsToExport = EXPORT_FIELDS.filter((f) => selectedFields.includes(f.id));
      const header = fieldsToExport.map((f) => `"${f.label}"`).join(",");
      const rows = selected.map((u) =>
        fieldsToExport.map((f) => `"${(f.getter(u) || '').replace(/"/g, '""')}"`).join(",")
      );

      // BOM so Excel reads the UTF-8 names correctly instead of mojibake.
      const blob = new Blob(["﻿" + [header, ...rows].join("\r\n")], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const today = new Date().toISOString().slice(0, 10);
      const suffix = letterMode === 'any' ? '' : `-${letterField}-${letterMode}-${letter}`;
      a.download = `users-${today}${suffix}.csv`;
      a.click();
      URL.revokeObjectURL(url);

      toast.success(
        selected.length === res.rows.length
          ? `Exported ${selected.length} users to CSV`
          : `Exported ${selected.length} of ${res.rows.length} users to CSV`
      );
      setExportOpen(false);
    } catch (err) {
      toast.error(`Export failed: ${err instanceof Error ? err.message : 'Unknown'}`);
    } finally {
      setExporting(false);
    }
  }

  function toggleExportField(id: string) {
    setSelectedFields((prev) =>
      prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between gap-4">
        <PageHeader
          title="Users"
          description="DAU/MAU, activation funnel, and user management"
        />
        <Button
          onClick={() => setExportOpen(true)}
          variant="outline"
          size="sm"
          className="border-glass-hairline bg-surface text-ink-body hover:text-ink-strong hover:bg-surface-sunken gap-2"
        >
          <Download size={14} />
          Export CSV
        </Button>
      </div>

      {/* KPI tiles */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiTile
          label="Total Users"
          value={metrics ? formatNumber(metrics.totalUsers) : "—"}
          loading={metricsLoading}
        />
        <KpiTile
          label="Paying firms"
          value={metrics ? formatNumber(metrics.paidCustomers ?? 0) : "—"}
          loading={metricsLoading}
        />
        <KpiTile
          label="Comped firms"
          value={metrics ? formatNumber(metrics.grantedUsers ?? 0) : "—"}
          loading={metricsLoading}
        />
        <KpiTile
          label="Active in Period"
          value={metrics ? formatNumber(metrics.activeUsers) : "—"}
          loading={metricsLoading}
        />
      </div>

      {/* Users table */}
      <ChartCard
        title="All Users"
        description={
          usersQuery.data
            ? `${usersQuery.data.rows.length} shown${usersQuery.data.hasMore ? " · more pages available" : ""}`
            : undefined
        }
      >
        {/* Filter bar */}
        <div className="flex items-center gap-3 mb-4">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-ink-soft" />
            <Input
              placeholder="Search by email or name…"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCursor(null);
                setCursorHistory([]);
              }}
              className="pl-9 bg-surface border-glass-hairline text-ink-strong placeholder:text-ink-faint focus-visible:ring-brand/40"
            />
          </div>
          <Select
            value={premiumFilter}
            onValueChange={(v) => {
              setPremiumFilter(v as typeof premiumFilter);
              setCursor(null);
              setCursorHistory([]);
            }}
          >
            <SelectTrigger className="w-32 bg-surface border-glass-hairline text-ink-body">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-surface border-glass-hairline">
              <SelectItem value="all" className="text-ink-body">All</SelectItem>
              <SelectItem value="premium" className="text-ink-body">Paid</SelectItem>
              <SelectItem value="free" className="text-ink-body">Free</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <div className="rounded-xl border border-glass-hairline overflow-hidden overflow-x-auto">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((hg) => (
                <TableRow key={hg.id} className="border-glass-hairline hover:bg-transparent">
                  {hg.headers.map((header) => {
                    const canSort = header.column.getCanSort();
                    const sorted = header.column.getIsSorted();
                    return (
                      <TableHead
                        key={header.id}
                        onClick={canSort ? header.column.getToggleSortingHandler() : undefined}
                        className={cn(
                          "text-ink-soft text-[11px] uppercase tracking-wider font-medium py-3 select-none",
                          canSort && "cursor-pointer hover:text-ink-body"
                        )}
                      >
                        <span className="inline-flex items-center gap-1.5">
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {canSort && (
                            sorted === 'asc' ? <ArrowUp size={11} className="text-brand" /> :
                            sorted === 'desc' ? <ArrowDown size={11} className="text-brand" /> :
                            <ArrowUpDown size={11} className="text-ink-faint" />
                          )}
                        </span>
                      </TableHead>
                    );
                  })}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {usersQuery.isLoading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <TableRow key={i} className="border-glass-hairline">
                    {columns.map((_, j) => (
                      <TableCell key={j}>
                        <Skeleton className="h-4 w-full bg-surface-sunken" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : table.getRowModel().rows.length === 0 ? (
                <TableRow className="border-0">
                  <TableCell colSpan={columns.length} className="py-12 text-center text-ink-soft text-sm">
                    No users found
                  </TableCell>
                </TableRow>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    onClick={() => {
                      setSelectedUserId(row.original.id);
                      setDrawerOpen(true);
                    }}
                    className="border-glass-hairline cursor-pointer hover:bg-surface-sunken transition-colors"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id} className="text-ink-strong text-sm py-3">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between mt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={goPrev}
            disabled={cursorHistory.length === 0}
            className="border-glass-hairline bg-transparent text-ink-soft hover:text-ink-strong gap-1"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            Prev
          </Button>
          <div className="flex items-center gap-3">
            <span className="text-xs text-ink-soft">
              {usersQuery.data ? `${usersQuery.data.rows.length} users` : ""}
            </span>
            <label className="flex items-center gap-1.5 text-xs text-ink-soft">
              Rows
              <select
                value={pageSize}
                onChange={(e) => {
                  // Page size changes invalidate the cursor chain — a cursor is a
                  // position in the OLD page stride, so reset to the first page.
                  setPageSize(Number(e.target.value));
                  setCursor(null);
                  setCursorHistory([]);
                }}
                className="rounded-lg border border-glass-hairline bg-surface-sunken px-2 py-1 text-xs text-ink-strong"
              >
                {[20, 50, 100].map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </label>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={goNext}
            disabled={!usersQuery.data?.nextCursor}
            className="border-glass-hairline bg-transparent text-ink-soft hover:text-ink-strong gap-1"
          >
            Next
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </ChartCard>

      <UserDetailDrawer
        userId={selectedUserId}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onActionComplete={() => usersQuery.refetch()}
      />

      <Dialog open={exportOpen} onOpenChange={setExportOpen}>
        <DialogContent className="bg-surface border-glass-hairline text-ink-strong max-w-md">
          <DialogHeader>
            <DialogTitle className="text-brand flex items-center gap-2">
              <Download size={18} />
              Export Users to CSV
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Who to export */}
            <div className="space-y-2">
              <p className="text-xs text-ink-soft">Who to export</p>
              <div className="grid grid-cols-2 gap-2">
                {([
                  { id: 'all', label: 'Everyone', hint: 'Ignore on-screen filters' },
                  { id: 'filtered', label: 'Current filters', hint: 'Match search + plan' },
                ] as const).map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setExportScope(opt.id)}
                    className={cn(
                      "rounded-lg border p-2 text-left text-xs transition-colors",
                      exportScope === opt.id
                        ? "border-brand/40 bg-brand-wash text-ink-strong"
                        : "border-glass-hairline bg-surface-sunken text-ink-soft hover:text-ink-strong"
                    )}
                  >
                    <span className="block font-medium">{opt.label}</span>
                    <span className="block text-[10px] text-ink-soft">{opt.hint}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Letter narrowing — "from B onwards" or "B only" */}
            <div className="space-y-2">
              <p className="text-xs text-ink-soft">Narrow by first letter</p>
              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={letterMode}
                  onChange={(e) => setLetterMode(e.target.value as 'any' | 'from' | 'only')}
                  className="rounded-lg border border-glass-hairline bg-surface-sunken px-2 py-1.5 text-xs text-ink-strong"
                >
                  <option value="any">All letters</option>
                  <option value="from">From letter…</option>
                  <option value="only">Only letter…</option>
                </select>

                <select
                  value={letter}
                  onChange={(e) => setLetter(e.target.value)}
                  disabled={letterMode === 'any'}
                  className="rounded-lg border border-glass-hairline bg-surface-sunken px-2 py-1.5 text-xs text-ink-strong disabled:opacity-40"
                >
                  {Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i)).map((l) => (
                    <option key={l} value={l}>{l}</option>
                  ))}
                </select>

                <select
                  value={letterField}
                  onChange={(e) => setLetterField(e.target.value as 'email' | 'name')}
                  disabled={letterMode === 'any'}
                  className="rounded-lg border border-glass-hairline bg-surface-sunken px-2 py-1.5 text-xs text-ink-strong disabled:opacity-40"
                >
                  <option value="email">of email</option>
                  <option value="name">of name</option>
                </select>
              </div>
              {letterMode !== 'any' && (
                <p className="text-[10px] text-ink-soft">
                  {letterMode === 'only'
                    ? `Only users whose ${letterField} starts with "${letter}".`
                    : `Users whose ${letterField} starts with "${letter}" through "Z".`}
                </p>
              )}
            </div>

            <div className="flex items-center justify-between text-xs text-ink-soft pb-1 border-b border-glass-hairline">
              <span>Columns ({selectedFields.length} / {EXPORT_FIELDS.length} selected)</span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedFields(EXPORT_FIELDS.map((f) => f.id))}
                  className="text-brand hover:underline"
                >
                  Select all
                </button>
                <span>·</span>
                <button
                  type="button"
                  onClick={() => setSelectedFields([])}
                  className="text-ink-soft hover:underline"
                >
                  Clear all
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
              {EXPORT_FIELDS.map((f) => {
                const checked = selectedFields.includes(f.id);
                return (
                  <label
                    key={f.id}
                    className={cn(
                      "flex items-center gap-2.5 p-2 rounded-lg border text-xs cursor-pointer transition-colors select-none",
                      checked
                        ? "border-brand/40 bg-brand-wash text-ink-strong"
                        : "border-glass-hairline bg-surface-sunken text-ink-soft hover:text-ink-strong"
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleExportField(f.id)}
                      className="accent-brand rounded"
                    />
                    <span>{f.label}</span>
                  </label>
                );
              })}
            </div>
          </div>

          <DialogFooter className="gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => setExportOpen(false)}
              className="border-glass-hairline bg-transparent text-ink-soft hover:text-ink-strong"
            >
              Cancel
            </Button>
            <Button
              onClick={handleExportCsv}
              disabled={exporting || selectedFields.length === 0}
              className="bg-brand hover:bg-brand-dark text-white gap-2"
            >
              <Download size={14} />
              {exporting ? "Generating CSV…" : "Download CSV"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
