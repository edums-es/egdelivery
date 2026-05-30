import { useEffect, useState, useCallback } from "react";
import api from "@/lib/api";
import { brl, ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from "@/lib/format";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { MessageCircle, Printer, Loader2, ClipboardList } from "lucide-react";

const FILTERS = [
  ["", "Todos"], ["pending", "Novos"], ["preparing", "Em preparo"],
  ["out_for_delivery", "Em entrega"], ["completed", "Finalizados"],
];
const NEXT_STATUSES = ["pending", "accepted", "preparing", "ready", "out_for_delivery", "completed", "cancelled"];

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    api.get("/admin/orders", { params: filter ? { status: filter } : {} })
      .then((r) => setOrders(r.data))
      .finally(() => setLoading(false));
  }, [filter]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    const t = setInterval(load, 15000);
    return () => clearInterval(t);
  }, [load]);

  const updateStatus = async (id, status) => {
    await api.put(`/admin/orders/${id}/status`, { status });
    load();
    if (selected?.id === id) setSelected({ ...selected, status });
  };

  const printOrder = (o) => {
    const w = window.open("", "_blank");
    const itemsHtml = o.items.map((it) =>
      `<div>${it.quantity}x ${it.product_name} - ${brl(it.total_price)}</div>` +
      it.options.map((op) => `<div style="padding-left:12px;font-size:11px">+ ${op.name}</div>`).join("")
    ).join("");
    w.document.write(`<pre style="font-family:monospace;font-size:13px">
PEDIDO #${o.order_number}
${new Date(o.created_at).toLocaleString("pt-BR")}
--------------------------------
Cliente: ${o.customer?.name}
Tel: ${o.customer?.phone}
Tipo: ${o.type === "delivery" ? "Entrega" : "Retirada"}
${o.address ? `End: ${o.address.street}, ${o.address.number} - ${o.address.neighborhood}` : ""}
--------------------------------
${itemsHtml.replace(/<[^>]+>/g, (m) => m.includes("padding") ? "  " : "\n")}
--------------------------------
Subtotal: ${brl(o.subtotal)}
Entrega: ${brl(o.delivery_fee)}
Desconto: ${brl(o.discount)}
TOTAL: ${brl(o.total)}
Pagamento: ${o.payment_method}
${o.customer_notes ? `Obs: ${o.customer_notes}` : ""}
</pre>`);
    w.print();
  };

  return (
    <div className="space-y-5" data-testid="admin-orders">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display font-bold text-2xl">Pedidos</h1>
        <div className="flex gap-2 overflow-x-auto scrollbar-hide">
          {FILTERS.map(([k, label]) => (
            <button key={k} onClick={() => setFilter(k)} data-testid={`order-filter-${k || "all"}`}
              className={`shrink-0 px-3 py-1.5 rounded-full text-sm font-medium border ${filter === k ? "bg-[#111827] text-white border-transparent" : "bg-white border-gray-200 text-gray-500"}`}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="grid place-items-center py-20"><Loader2 className="w-6 h-6 animate-spin text-gray-300" /></div>
      ) : orders.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center text-gray-400">
          <ClipboardList className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p>Nenhum pedido recebido ainda.</p>
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {orders.map((o) => (
            <div key={o.id} className="bg-white rounded-2xl border border-gray-100 p-4" data-testid={`order-card-${o.order_number}`}>
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-display font-bold">#{o.order_number}</p>
                  <p className="text-xs text-gray-400">{new Date(o.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</p>
                </div>
                <span className="text-xs font-semibold px-2 py-1 rounded uppercase tracking-wide" style={{ backgroundColor: `${ORDER_STATUS_COLORS[o.status]}1a`, color: ORDER_STATUS_COLORS[o.status] }}>
                  {ORDER_STATUS_LABELS[o.status]}
                </span>
              </div>
              <p className="text-sm font-medium mt-2">{o.customer?.name}</p>
              <p className="text-xs text-gray-400">{o.type === "delivery" ? "Entrega" : "Retirada"} · {o.items.length} itens · {brl(o.total)}</p>
              <div className="flex gap-2 mt-3">
                <Button size="sm" variant="outline" className="flex-1" onClick={() => setSelected(o)} data-testid={`order-view-${o.order_number}`}>Detalhes</Button>
                <Select value={o.status} onValueChange={(v) => updateStatus(o.id, v)}>
                  <SelectTrigger className="flex-1 h-9" data-testid={`order-status-${o.order_number}`}><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {NEXT_STATUSES.map((s) => <SelectItem key={s} value={s}>{ORDER_STATUS_LABELS[s]}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-md">
          {selected && (
            <>
              <DialogHeader><DialogTitle className="font-display">Pedido #{selected.order_number}</DialogTitle></DialogHeader>
              <div className="space-y-3 text-sm max-h-[60vh] overflow-y-auto">
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="font-medium">{selected.customer?.name}</p>
                  <p className="text-gray-500">{selected.customer?.phone}</p>
                  <p className="text-gray-500">{selected.type === "delivery" ? "Entrega" : "Retirada"}</p>
                  {selected.address && <p className="text-gray-500">{selected.address.street}, {selected.address.number} - {selected.address.neighborhood} {selected.address.complement}</p>}
                </div>
                <div className="space-y-2">
                  {selected.items.map((it, idx) => (
                    <div key={idx} className="border-b border-gray-50 pb-2">
                      <div className="flex justify-between font-medium"><span>{it.quantity}x {it.product_name}</span><span>{brl(it.total_price)}</span></div>
                      {it.options.map((op, i) => <p key={i} className="text-xs text-gray-400 pl-3">+ {op.name}</p>)}
                      {it.notes && <p className="text-xs text-gray-400 italic pl-3">Obs: {it.notes}</p>}
                    </div>
                  ))}
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-gray-500"><span>Subtotal</span><span>{brl(selected.subtotal)}</span></div>
                  <div className="flex justify-between text-gray-500"><span>Entrega</span><span>{brl(selected.delivery_fee)}</span></div>
                  {selected.discount > 0 && <div className="flex justify-between text-green-600"><span>Desconto</span><span>-{brl(selected.discount)}</span></div>}
                  <div className="flex justify-between font-bold text-base"><span>Total</span><span>{brl(selected.total)}</span></div>
                  <p className="text-gray-500 pt-1">Pagamento: {selected.payment_method} {selected.change_for ? `(troco p/ ${brl(selected.change_for)})` : ""}</p>
                  {selected.customer_notes && <p className="text-gray-500">Obs: {selected.customer_notes}</p>}
                </div>
                <div className="flex gap-2 pt-2">
                  {selected.customer?.phone && (
                    <a href={`https://wa.me/55${selected.customer.phone.replace(/\D/g, "")}`} target="_blank" rel="noreferrer" className="flex-1">
                      <Button variant="outline" className="w-full"><MessageCircle className="w-4 h-4 mr-1" /> WhatsApp</Button>
                    </a>
                  )}
                  <Button variant="outline" className="flex-1" onClick={() => printOrder(selected)} data-testid="print-order"><Printer className="w-4 h-4 mr-1" /> Imprimir</Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
