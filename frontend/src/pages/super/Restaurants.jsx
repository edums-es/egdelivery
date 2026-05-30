import { useEffect, useState } from "react";
import api, { formatApiError } from "@/lib/api";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Plus, ExternalLink, Loader2 } from "lucide-react";

const EMPTY = { restaurant_name: "", owner_name: "", owner_email: "", owner_password: "", plan: "basic" };

export default function Restaurants() {
  const [items, setItems] = useState(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);

  const load = () => api.get("/super/restaurants").then((r) => setItems(r.data));
  useEffect(() => { load(); }, []);

  const create = async () => {
    try {
      await api.post("/super/restaurants", form);
      toast.success("Restaurante criado"); setOpen(false); setForm(EMPTY); load();
    } catch (err) { toast.error(formatApiError(err.response?.data?.detail)); }
  };

  const updateField = async (id, patch) => {
    await api.put(`/super/restaurants/${id}`, patch);
    load();
  };

  if (!items) return <div className="grid place-items-center py-20"><Loader2 className="w-6 h-6 animate-spin text-gray-600" /></div>;

  return (
    <div className="space-y-5" data-testid="super-restaurants">
      <div className="flex items-center justify-between">
        <h1 className="font-display font-bold text-2xl">Restaurantes</h1>
        <Button onClick={() => setOpen(true)} data-testid="new-restaurant-btn" className="bg-indigo-500 hover:bg-indigo-600 rounded-xl"><Plus className="w-4 h-4 mr-1" /> Novo</Button>
      </div>

      <div className="bg-[#11151F] border border-white/5 rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="text-gray-500 text-xs uppercase border-b border-white/5">
            <tr><th className="text-left p-3">Restaurante</th><th className="text-left p-3">Plano</th><th className="text-left p-3">Pedidos</th><th className="text-left p-3">Status</th><th className="p-3"></th></tr>
          </thead>
          <tbody>
            {items.map((r) => (
              <tr key={r.id} className="border-b border-white/5" data-testid={`restaurant-row-${r.id}`}>
                <td className="p-3"><p className="font-medium">{r.name}</p><p className="text-xs text-gray-500">/loja/{r.slug}</p></td>
                <td className="p-3">
                  <Select value={r.plan || "basic"} onValueChange={(v) => updateField(r.id, { plan: v })}>
                    <SelectTrigger className="h-8 w-36 bg-transparent border-white/10 capitalize"><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="basic">Básico</SelectItem><SelectItem value="professional">Profissional</SelectItem><SelectItem value="premium">Premium</SelectItem></SelectContent>
                  </Select>
                </td>
                <td className="p-3">{r.order_count}</td>
                <td className="p-3">
                  <button onClick={() => updateField(r.id, { status: r.status === "active" ? "suspended" : "active" })}
                    data-testid={`toggle-status-${r.id}`}
                    className={`text-xs font-semibold px-2 py-1 rounded ${r.status === "active" ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"}`}>
                    {r.status === "active" ? "Ativa" : "Suspensa"}
                  </button>
                </td>
                <td className="p-3 text-right">
                  <a href={`/loja/${r.slug}`} target="_blank" rel="noreferrer" className="text-indigo-400 inline-flex items-center gap-1 text-xs"><ExternalLink className="w-3.5 h-3.5" /> Ver</a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-[#11151F] border-white/10 text-gray-100">
          <DialogHeader><DialogTitle className="font-display">Novo restaurante</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Nome do restaurante</Label><Input value={form.restaurant_name} onChange={(e) => setForm({ ...form, restaurant_name: e.target.value })} data-testid="r-name" className="mt-1 bg-transparent border-white/10" /></div>
            <div><Label>Nome do dono</Label><Input value={form.owner_name} onChange={(e) => setForm({ ...form, owner_name: e.target.value })} className="mt-1 bg-transparent border-white/10" /></div>
            <div><Label>E-mail do dono</Label><Input type="email" value={form.owner_email} onChange={(e) => setForm({ ...form, owner_email: e.target.value })} data-testid="r-email" className="mt-1 bg-transparent border-white/10" /></div>
            <div><Label>Senha</Label><Input value={form.owner_password} onChange={(e) => setForm({ ...form, owner_password: e.target.value })} className="mt-1 bg-transparent border-white/10" /></div>
            <div>
              <Label>Plano</Label>
              <Select value={form.plan} onValueChange={(v) => setForm({ ...form, plan: v })}>
                <SelectTrigger className="mt-1 bg-transparent border-white/10"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="basic">Básico</SelectItem><SelectItem value="professional">Profissional</SelectItem><SelectItem value="premium">Premium</SelectItem></SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter><Button onClick={create} data-testid="save-restaurant" className="bg-indigo-500 hover:bg-indigo-600 rounded-xl">Criar</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
