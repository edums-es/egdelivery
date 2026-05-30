import { useEffect, useState } from "react";
import api from "@/lib/api";
import { brl } from "@/lib/format";
import { Store, ShoppingBag, Users, DollarSign, Loader2 } from "lucide-react";

function Kpi({ icon: Icon, label, value }) {
  return (
    <div className="bg-[#11151F] border border-white/5 rounded-2xl p-5">
      <Icon className="w-5 h-5 text-indigo-400" />
      <p className="font-display font-extrabold text-2xl mt-3">{value}</p>
      <p className="text-sm text-gray-500">{label}</p>
    </div>
  );
}

export default function SuperDashboard() {
  const [m, setM] = useState(null);
  useEffect(() => { api.get("/super/metrics").then((r) => setM(r.data)); }, []);
  if (!m) return <div className="grid place-items-center py-20"><Loader2 className="w-6 h-6 animate-spin text-gray-600" /></div>;

  return (
    <div className="space-y-6" data-testid="super-dashboard">
      <h1 className="font-display font-bold text-2xl">Visão geral da plataforma</h1>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Kpi icon={Store} label="Restaurantes" value={m.total_restaurants} />
        <Kpi icon={ShoppingBag} label="Pedidos totais" value={m.total_orders} />
        <Kpi icon={DollarSign} label="GMV" value={brl(m.gmv)} />
        <Kpi icon={Users} label="Usuários" value={m.total_users} />
      </div>
      <div className="grid lg:grid-cols-2 gap-4">
        <div className="bg-[#11151F] border border-white/5 rounded-2xl p-5">
          <h2 className="font-display font-semibold mb-4">Status das lojas</h2>
          <div className="flex justify-between text-sm py-1"><span className="text-gray-400">Ativas</span><span className="text-green-400 font-semibold">{m.active}</span></div>
          <div className="flex justify-between text-sm py-1"><span className="text-gray-400">Suspensas</span><span className="text-red-400 font-semibold">{m.suspended}</span></div>
        </div>
        <div className="bg-[#11151F] border border-white/5 rounded-2xl p-5">
          <h2 className="font-display font-semibold mb-4">Restaurantes por plano</h2>
          {m.plans.map((p) => (
            <div key={p.plan} className="flex justify-between text-sm py-1 capitalize"><span className="text-gray-400">{p.plan}</span><span className="font-semibold">{p.count}</span></div>
          ))}
        </div>
      </div>
    </div>
  );
}
