'use client';
import React from "react";
import { NavLink } from "@/components/admin-kit/shim/router";
import {
  LayoutDashboard,
  DollarSign,
  Users,
  BarChart2,
  Shield,
  TrendingUp,
  Settings,
  Server,
  FileText,
  Zap,
  ChevronLeft,
  ChevronRight,
  Tag,
  ArrowLeft,
  Activity,
  Receipt,
  Calculator,
  MailCheck,
  FlaskConical,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ADMIN_NAV } from "../lib/nav";

import { Button } from "@/components/admin-kit/_deps/components/ui/button";

const navItems = ADMIN_NAV;

interface SideNavProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function SideNav({ collapsed, onToggle }: SideNavProps) {
  return (
    <aside
      className={cn(
        "fixed top-0 left-0 z-40 flex h-screen flex-col glass-shell border-r text-shell-text",
        collapsed ? "w-16" : "w-60"
      )}
    >
      {/* Logo */}
      <div className="flex h-14 items-center border-b border-glass-hairline-dark px-4">
        {!collapsed && (
          <span className="flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/kyriq-logo-white.svg" alt="Kyriq" height={24} width={58} className="h-6 w-auto" />
            <span className="text-xs font-semibold uppercase tracking-wide text-brand-light">Admin</span>
          </span>
        )}
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "ml-auto h-7 w-7 text-shell-muted hover:text-shell-text hover:bg-shell-text/[0.08]",
            collapsed && "mx-auto"
          )}
          onClick={onToggle}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-0.5 overflow-y-auto px-2 py-4">
        {navItems.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              cn(
                "sidebar-item flex items-center gap-2.5 rounded-input px-2.5 py-[7px] text-[13px] font-medium transition-[color,background-color] duration-tap ease-settle",
                isActive
                  ? "active"
                  : "text-shell-muted hover:bg-shell-text/[0.08] hover:text-shell-text"
              )
            }
          >
            <Icon className="h-4 w-4 flex-shrink-0" />
            {!collapsed && <span>{label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="space-y-2 border-t border-glass-hairline-dark p-3">
        <a
          href="/dashboard"
          className={cn(
            "flex items-center gap-3 rounded-input px-2.5 py-[7px] text-[13px] font-medium text-shell-muted transition-colors hover:bg-shell-text/[0.08] hover:text-shell-text",
            collapsed && "justify-center"
          )}
          title="Back to App"
        >
          <ArrowLeft className="h-4 w-4 flex-shrink-0" />
          {!collapsed && <span>Back to App</span>}
        </a>
        {!collapsed && (
          <div className="px-3 text-[11px] text-shell-muted/70">
            Kyriq super admin
          </div>
        )}
      </div>
    </aside>
  );
}
