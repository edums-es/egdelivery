import { useState } from "react";
import { Outlet, NavLink, useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard, ClipboardList, UtensilsCrossed, FolderTree, Ticket,
  Image, BarChart3, Settings, LogOut, Menu, X, ExternalLink,
} from "lucide-react";

const NAV = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/admin/pedidos", label: "Pedidos", icon: ClipboardList },
  { to: "/admin/produtos", label: "Produtos", icon: UtensilsCrossed },
  { to: "/admin/categorias", label: "Categorias", icon: FolderTree },
  { to: "/admin/cupons", label: "Cupons", icon: Ticket },
  { to: "/admin/banners", label: "Banners", icon: Image },
  { to: "/admin/relatorios", label: "Relatórios", icon: BarChart3 },
  { to: "/admin/configuracoes", label: "Configurações", icon: Settings },
];

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const handleLogout = () => { logout(); navigate("/login"); };

  return (
    <div className="min-h-screen bg-[#F7F8FA] font-admin text-[#111827] flex">
      {/* Sidebar */}
      <aside className={`fixed lg:static z-50 inset-y-0 left-0 w-64 bg-white border-r border-gray-100 flex flex-col transition-transform ${open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}>
        <div className="h-16 flex items-center gap-2 px-5 border-b border-gray-100 font-display font-bold text-lg">
          <span className="grid place-items-center w-8 h-8 rounded-lg bg-[#111827] text-white"><UtensilsCrossed className="w-4 h-4" /></span>
          MenuFlow
        </div>
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {NAV.map((n) => (
            <NavLink key={n.to} to={n.to} end={n.end} onClick={() => setOpen(false)}
              data-testid={`nav-${n.label.toLowerCase()}`}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${isActive ? "bg-[#111827] text-white" : "text-gray-500 hover:bg-gray-50"}`
              }>
              <n.icon className="w-4 h-4" /> {n.label}
            </NavLink>
          ))}
        </nav>
        <div className="p-3 border-t border-gray-100">
          <Button variant="ghost" onClick={handleLogout} data-testid="logout-btn"
            className="w-full justify-start text-gray-500 hover:text-red-500">
            <LogOut className="w-4 h-4 mr-2" /> Sair
          </Button>
        </div>
      </aside>

      {open && <div className="fixed inset-0 bg-black/30 z-40 lg:hidden" onClick={() => setOpen(false)} />}

      {/* Main */}
      <div className="flex-1 min-w-0 flex flex-col">
        <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-4 lg:px-6 sticky top-0 z-30">
          <button className="lg:hidden" onClick={() => setOpen(!open)} data-testid="sidebar-toggle">
            {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <div className="flex-1" />
          <div className="flex items-center gap-3">
            <Link to="/loja/burger-lanches" target="_blank" className="text-sm text-gray-500 hover:text-[#111827] flex items-center gap-1">
              Ver cardápio <ExternalLink className="w-3.5 h-3.5" />
            </Link>
            <div className="w-9 h-9 rounded-full bg-[#111827] text-white grid place-items-center text-sm font-semibold">
              {(user?.name || "U")[0].toUpperCase()}
            </div>
          </div>
        </header>
        <main className="flex-1 p-4 lg:p-6 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
