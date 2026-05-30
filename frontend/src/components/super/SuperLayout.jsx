import { useState } from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, Store, Users, LogOut, ShieldCheck } from "lucide-react";

const NAV = [
  { to: "/super", label: "Visão geral", icon: LayoutDashboard, end: true },
  { to: "/super/restaurantes", label: "Restaurantes", icon: Store },
  { to: "/super/usuarios", label: "Usuários", icon: Users },
];

export default function SuperLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#0B0F1A] font-admin text-gray-100 flex">
      <aside className="w-60 bg-[#11151F] border-r border-white/5 flex flex-col fixed lg:static inset-y-0">
        <div className="h-16 flex items-center gap-2 px-5 border-b border-white/5 font-display font-bold text-lg">
          <span className="grid place-items-center w-8 h-8 rounded-lg bg-indigo-500"><ShieldCheck className="w-4 h-4" /></span>
          Plataforma
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {NAV.map((n) => (
            <NavLink key={n.to} to={n.to} end={n.end} data-testid={`super-nav-${n.label.toLowerCase().replace(/\s/g, "-")}`}
              className={({ isActive }) => `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${isActive ? "bg-indigo-500 text-white" : "text-gray-400 hover:bg-white/5"}`}>
              <n.icon className="w-4 h-4" /> {n.label}
            </NavLink>
          ))}
        </nav>
        <div className="p-3 border-t border-white/5">
          <p className="text-xs text-gray-500 px-3 mb-2">{user?.email}</p>
          <Button variant="ghost" onClick={() => { logout(); navigate("/login"); }} data-testid="super-logout"
            className="w-full justify-start text-gray-400 hover:text-red-400 hover:bg-white/5">
            <LogOut className="w-4 h-4 mr-2" /> Sair
          </Button>
        </div>
      </aside>
      <main className="flex-1 ml-60 lg:ml-0 p-6 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
