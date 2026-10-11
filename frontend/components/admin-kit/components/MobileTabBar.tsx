'use client';
import React, { useState } from "react";
import { NavLink, useNavigate } from "@/components/admin-kit/shim/router";
import {
  Zap, DollarSign, Users, Bell, MoreHorizontal,
  BarChart2, Shield, TrendingUp, LayoutDashboard, Server, FileText, Tag, Settings, ArrowLeft, X, Activity, Calculator, MailCheck, FlaskConical,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ADMIN_NAV } from "../lib/nav";


const primaryTabs = ADMIN_NAV.filter((n) => n.primary);
const morePages = ADMIN_NAV.filter((n) => !n.primary);

export function MobileTabBar() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <>
      {/* Main tab bar */}
      {/* min-h, not h. With the safe-area inset finally applying (see .pb-safe
          in globals.css), a fixed 64px would have the padding eat the row
          instead of extending it, leaving the labels squeezed against the
          icons on exactly the notched devices the inset exists for. The bar
          now grows by the inset and keeps a full 64px of tappable row. */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 flex min-h-16 border-t border-glass-hairline bg-surface pb-safe">
        {primaryTabs.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              cn(
                "flex flex-1 flex-col items-center justify-center gap-1 text-[10px] transition-colors",
                isActive ? "text-brand" : "text-ink-soft"
              )
            }
          >
            <Icon className="h-5 w-5" />
            {label}
          </NavLink>
        ))}
        {/* More button */}
        <button
          onClick={() => setOpen(true)}
          className="flex flex-1 flex-col items-center justify-center gap-1 text-[10px] text-ink-soft transition-colors"
        >
          <MoreHorizontal className="h-5 w-5" />
          More
        </button>
      </nav>

      {/* "More" bottom sheet */}
      {open && (
        <div className="fixed inset-0 z-[60] flex flex-col justify-end">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)} />
          {/* Sheet */}
          <div className="relative bg-surface border-t border-glass-hairline rounded-t-2xl pb-safe">
            <div className="flex items-center justify-between px-5 py-4 border-b border-glass-hairline">
              <span className="text-sm font-medium text-ink-strong">All Pages</span>
              <button onClick={() => setOpen(false)} className="text-ink-soft hover:text-ink-strong">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="grid grid-cols-3 gap-2 p-4">
              {morePages.map(({ to, label, icon: Icon }) => (
                <button
                  key={to}
                  onClick={() => { navigate(to); setOpen(false); }}
                  className="flex flex-col items-center gap-2 rounded-xl bg-surface-sunken border border-glass-hairline p-4 text-ink-soft hover:bg-surface-sunken hover:text-ink-strong transition-colors"
                >
                  <Icon className="h-5 w-5" />
                  <span className="text-[11px] leading-tight text-center">{label}</span>
                </button>
              ))}
            </div>
            {/* Back to App */}
            <div className="px-4 pb-4">
              <a
                href="/"
                className="flex items-center justify-center gap-2 w-full rounded-card border border-glass-hairline bg-surface-sunken py-3 text-sm text-ink-soft hover:text-ink-strong hover:bg-surface-sunken transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to App
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
