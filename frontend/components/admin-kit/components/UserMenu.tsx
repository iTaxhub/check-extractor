'use client';
import React from "react";
import { LogOut, User, ArrowLeft } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/admin-kit/_deps/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/admin-kit/_deps/components/ui/avatar";
import { useAuth } from "@/components/admin-kit/shim/auth";

export function UserMenu() {
  const { user, signOut } = useAuth();

  const initials = user?.email?.slice(0, 2).toUpperCase() ?? "AD";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-2 rounded-lg p-1 hover:bg-surface-sunken transition-colors">
          <Avatar className="h-7 w-7">
            <AvatarFallback className="bg-brand/20 text-brand text-xs">
              {initials}
            </AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48 bg-surface border-glass-hairline">
        <div className="px-2 py-1.5">
          <p className="text-xs text-ink-soft truncate">{user?.email}</p>
        </div>
        <DropdownMenuSeparator className="bg-glass-hairline" />
        <DropdownMenuItem
          onClick={() => { window.location.href = '/'; }}
          className="text-ink-body focus:text-ink-strong focus:bg-surface-sunken cursor-pointer"
        >
          <ArrowLeft className="mr-2 h-3.5 w-3.5" />
          Back to App
        </DropdownMenuItem>
        <DropdownMenuSeparator className="bg-glass-hairline" />
        <DropdownMenuItem className="text-ink-soft focus:text-ink-soft focus:bg-surface-sunken cursor-default" disabled>
          <User className="mr-2 h-3.5 w-3.5" />
          Profile
        </DropdownMenuItem>
        <DropdownMenuSeparator className="bg-glass-hairline" />
        <DropdownMenuItem
          onClick={signOut}
          className="text-error-text focus:text-error-text focus:bg-error-bg cursor-pointer"
        >
          <LogOut className="mr-2 h-3.5 w-3.5" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
