import { useEffect, useState } from "react";
import api from "@/lib/api";
import { brl, ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { ShoppingBag, DollarSign, TrendingUp, Clock, Loader2 } from "lucide-react";

function Kpi({ icon: Icon, label, value, accent }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 hover:-translate-y-0.5 transition-transform">
      <div className="flex items-center justify-between">
        <span className="grid place-items-center w-10 h-10 rounded-xl" style={{ backgroundColor: `${accent}1a`, color: accent }}>
          <Icon className="w-5 h-5" />
        </span>
      </div>
      <p className="font-display font-extrabold text-2xl mt-3">{value}</p>
      <p className="text-sm text-gray-400">{label}</p>
    </div>
  );
}

export default function Dashboard() {
  const [data, setData] = useState(null);

  const load = () => api.get("/admin/dashboard").then((r) => setData(r.data));
  useEffect(() => { load(); }, []);

  const toggleOpen = async () => {
    await api.post("/admin/restaurant/toggle-open");
    load();
  };

  if (!data) return <div className="grid place-items-center py-20"><Loader2 className="w-6 h-6 animate-spin text-gray-300" /></div>;

  return (
    <div className="space-y-6" data-testid="admin-dashboard">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display font-bold text-2xl">Dashboard</h1>
          <p className="text-sm text-gray-400">Visão geral do seu restaurante hoje</p>
        </div>
        <div className="flex items-center gap-3 bg-white border border-gray-100 rounded-xl px-4 py-2.5">
          <span className={`w-2.5 h-2.5 rounded-full ${data.is_open ? "bg-green-500" : "bg-red-500"}`} />
          <span className="text-sm font-medium">{data.is_open ? "Loja aberta" : "Loja fechada"}</span>
          <Switch checked={data.is_open_manual} onCheckedChange={toggleOpen} data-testid="toggle-open" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Kpi icon={ShoppingBag} label="Pedidos hoje" value={data.orders_today} accent="#3B82F6" />
        <Kpi icon={DollarSign} label="Faturamento hoje" value={brl(data.revenue_today)} accent="#22C55E" />
        <Kpi icon={TrendingUp} label="Ticket médio" value={brl(data.avg_ticket)} accent="#8B5CF6" />
        <Kpi icon={Clock} label="Em andamento" value={data.in_progress} accent="#F59E0B" />
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h2 className="font-display font-semibold mb-4">Produtos mais vendidos</h2>
          {data.top_products.length === 0 ? (
            <p className="text-sm text-gray-400">Nenhuma venda registrada ainda.</p>
          ) : (
            <div className="space-y-3">
              {data.top_products.map((p, i) => (
                <div key={i} className="flex items-center justify-between">
                  <span className="text-sm flex items-center gap-2">
                    <span className="w-6 h-6 grid place-items-center rounded-full bg-gray-100 text-xs font-bold">{i + 1}</span>
                    {p.name}
                  </span>
                  <span className="text-sm font-semibold">{p.qty}x</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h2 className="font-display font-semibold mb-4">Pedidos recentes</h2>
          {data.recent_orders.length === 0 ? (
            <p className="text-sm text-gray-400">Nenhum pedido recebido ainda.</p>
          ) : (
            <div className="space-y-2">
              {data.recent_orders.map((o) => (
                <div key={o.id} className="flex items-center justify-between text-sm border-b border-gray-50 pb-2">
                  <span className="font-medium">#{o.order_number} · {o.customer?.name}</span>
                  <span className="flex items-center gap-2">
                    {brl(o.total)}
                    <span className="text-xs font-semibold px-2 py-0.5 rounded" style={{ backgroundColor: `${ORDER_STATUS_COLORS[o.status]}1a`, color: ORDER_STATUS_COLORS[o.status] }}>
                      {ORDER_STATUS_LABELS[o.status]}
                    </span>
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
