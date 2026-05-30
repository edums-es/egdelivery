import { useEffect, useState } from "react";
import api from "@/lib/api";
import { brl } from "@/lib/format";
import {
  BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid,
} from "recharts";
import { Loader2 } from "lucide-react";

const PERIODS = [["today", "Hoje"], ["7d", "7 dias"], ["30d", "30 dias"]];

export default function Reports() {
  const [period, setPeriod] = useState("7d");
  const [data, setData] = useState(null);

  useEffect(() => {
    setData(null);
    api.get("/admin/reports", { params: { period } }).then((r) => setData(r.data));
  }, [period]);

  return (
    <div className="space-y-5" data-testid="admin-reports">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display font-bold text-2xl">Relatórios</h1>
        <div className="flex gap-2">
          {PERIODS.map(([k, label]) => (
            <button key={k} onClick={() => setPeriod(k)} data-testid={`period-${k}`}
              className={`px-3 py-1.5 rounded-full text-sm font-medium border ${period === k ? "bg-[#111827] text-white border-transparent" : "bg-white border-gray-200 text-gray-500"}`}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {!data ? (
        <div className="grid place-items-center py-20"><Loader2 className="w-6 h-6 animate-spin text-gray-300" /></div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl border p-5"><p className="text-sm text-gray-400">Pedidos</p><p className="font-display font-extrabold text-2xl">{data.total_orders}</p></div>
            <div className="bg-white rounded-2xl border p-5"><p className="text-sm text-gray-400">Faturamento</p><p className="font-display font-extrabold text-2xl">{brl(data.revenue)}</p></div>
            <div className="bg-white rounded-2xl border p-5"><p className="text-sm text-gray-400">Ticket médio</p><p className="font-display font-extrabold text-2xl">{brl(data.avg_ticket)}</p></div>
          </div>

          <div className="bg-white rounded-2xl border p-5">
            <h2 className="font-display font-semibold mb-4">Faturamento por dia</h2>
            {data.by_day.length === 0 ? <p className="text-sm text-gray-400">Sem dados no período.</p> : (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={data.by_day}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis dataKey="date" tickFormatter={(d) => d.slice(5)} fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip formatter={(v) => brl(v)} />
                  <Bar dataKey="total" fill="#EF4444" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="grid lg:grid-cols-2 gap-4">
            <div className="bg-white rounded-2xl border p-5">
              <h2 className="font-display font-semibold mb-4">Mais vendidos</h2>
              {data.top_products.length === 0 ? <p className="text-sm text-gray-400">Sem dados.</p> : data.top_products.map((p, i) => (
                <div key={i} className="flex justify-between text-sm py-1"><span>{p.name}</span><span className="font-semibold">{p.qty}x</span></div>
              ))}
            </div>
            <div className="bg-white rounded-2xl border p-5">
              <h2 className="font-display font-semibold mb-4">Formas de pagamento</h2>
              {data.payment_methods.length === 0 ? <p className="text-sm text-gray-400">Sem dados.</p> : data.payment_methods.map((p, i) => (
                <div key={i} className="flex justify-between text-sm py-1"><span>{p.method}</span><span className="font-semibold">{p.count}</span></div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
