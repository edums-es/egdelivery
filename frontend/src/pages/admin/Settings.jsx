import { useEffect, useState } from "react";
import api from "@/lib/api";
import { toast } from "sonner";
import { brl, WEEKDAYS } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select";
import ImageUpload from "@/components/admin/ImageUpload";
import { Loader2, Plus, X, Save } from "lucide-react";

const PAYMENT_OPTIONS = ["Pix", "Dinheiro", "Cartão de crédito", "Cartão de débito", "Vale refeição"];
const uid = () => Math.random().toString(36).slice(2);

export default function Settings() {
  const [r, setR] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => { api.get("/admin/restaurant").then((res) => setR(res.data)); }, []);

  const set = (patch) => setR((p) => ({ ...p, ...patch }));

  const save = async () => {
    setSaving(true);
    try {
      const payload = {
        name: r.name, description: r.description, tagline: r.tagline,
        logo_url: r.logo_url, cover_url: r.cover_url, whatsapp: r.whatsapp,
        phone: r.phone, address: r.address, city: r.city, state: r.state,
        primary_color: r.primary_color, secondary_color: r.secondary_color,
        minimum_order: Number(r.minimum_order) || 0, average_delivery_time: r.average_delivery_time,
        accepts_delivery: r.accepts_delivery, accepts_pickup: r.accepts_pickup,
        delivery_fee_mode: r.delivery_fee_mode, flat_delivery_fee: Number(r.flat_delivery_fee) || 0,
        delivery_zones: r.delivery_zones, payment_methods: r.payment_methods,
        pix_key: r.pix_key, pix_name: r.pix_name, opening_hours: r.opening_hours,
      };
      await api.put("/admin/restaurant", payload);
      toast.success("Configurações salvas");
    } catch { toast.error("Erro ao salvar"); }
    finally { setSaving(false); }
  };

  const togglePayment = (m) => {
    const cur = r.payment_methods || [];
    set({ payment_methods: cur.includes(m) ? cur.filter((x) => x !== m) : [...cur, m] });
  };

  const setHour = (day, patch) => set({ opening_hours: { ...r.opening_hours, [day]: { ...r.opening_hours[day], ...patch } } });

  const addZone = () => set({ delivery_zones: [...(r.delivery_zones || []), { id: uid(), neighborhood: "", fee: 0, active: true }] });
  const updZone = (id, patch) => set({ delivery_zones: r.delivery_zones.map((z) => z.id === id ? { ...z, ...patch } : z) });
  const delZone = (id) => set({ delivery_zones: r.delivery_zones.filter((z) => z.id !== id) });

  if (!r) return <div className="grid place-items-center py-20"><Loader2 className="w-6 h-6 animate-spin text-gray-300" /></div>;

  return (
    <div className="space-y-5" data-testid="admin-settings">
      <div className="flex items-center justify-between sticky top-0 bg-[#F7F8FA] py-1 z-10">
        <h1 className="font-display font-bold text-2xl">Configurações</h1>
        <Button onClick={save} disabled={saving} data-testid="save-settings" className="bg-[#111827] rounded-xl">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4 mr-1" /> Salvar</>}
        </Button>
      </div>

      <Tabs defaultValue="loja">
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="loja" data-testid="tab-loja">Loja</TabsTrigger>
          <TabsTrigger value="aparencia" data-testid="tab-aparencia">Aparência</TabsTrigger>
          <TabsTrigger value="horarios" data-testid="tab-horarios">Horários</TabsTrigger>
          <TabsTrigger value="entrega" data-testid="tab-entrega">Entrega</TabsTrigger>
          <TabsTrigger value="pagamento" data-testid="tab-pagamento">Pagamento</TabsTrigger>
        </TabsList>

        <TabsContent value="loja" className="bg-white rounded-2xl border p-5 space-y-4">
          <div><Label>Nome da loja</Label><Input value={r.name || ""} onChange={(e) => set({ name: e.target.value })} data-testid="settings-name" className="mt-1" /></div>
          <div><Label>Frase curta (tagline)</Label><Input value={r.tagline || ""} onChange={(e) => set({ tagline: e.target.value })} className="mt-1" /></div>
          <div><Label>Descrição</Label><Textarea value={r.description || ""} onChange={(e) => set({ description: e.target.value })} rows={2} className="mt-1 resize-none" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>WhatsApp (com DDI)</Label><Input value={r.whatsapp || ""} onChange={(e) => set({ whatsapp: e.target.value })} placeholder="5511999999999" data-testid="settings-whatsapp" className="mt-1" /></div>
            <div><Label>Telefone</Label><Input value={r.phone || ""} onChange={(e) => set({ phone: e.target.value })} className="mt-1" /></div>
          </div>
          <div><Label>Endereço</Label><Input value={r.address || ""} onChange={(e) => set({ address: e.target.value })} className="mt-1" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Cidade</Label><Input value={r.city || ""} onChange={(e) => set({ city: e.target.value })} className="mt-1" /></div>
            <div><Label>Estado</Label><Input value={r.state || ""} onChange={(e) => set({ state: e.target.value })} className="mt-1" /></div>
          </div>
          <div><Label>Slug público</Label><Input value={r.slug || ""} disabled className="mt-1 bg-gray-50" /><p className="text-xs text-gray-400 mt-1">/loja/{r.slug}</p></div>
        </TabsContent>

        <TabsContent value="aparencia" className="bg-white rounded-2xl border p-5 space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <ImageUpload value={r.logo_url} onChange={(url) => set({ logo_url: url })} label="Logo" aspect="aspect-square" />
            <ImageUpload value={r.cover_url} onChange={(url) => set({ cover_url: url })} label="Imagem de capa" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Cor principal</Label>
              <div className="flex gap-2 mt-1">
                <input type="color" value={r.primary_color || "#EF4444"} onChange={(e) => set({ primary_color: e.target.value })} data-testid="color-primary" className="h-10 w-14 rounded-lg border" />
                <Input value={r.primary_color || ""} onChange={(e) => set({ primary_color: e.target.value })} />
              </div>
            </div>
            <div>
              <Label>Cor secundária</Label>
              <div className="flex gap-2 mt-1">
                <input type="color" value={r.secondary_color || "#FEE2E2"} onChange={(e) => set({ secondary_color: e.target.value })} className="h-10 w-14 rounded-lg border" />
                <Input value={r.secondary_color || ""} onChange={(e) => set({ secondary_color: e.target.value })} />
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="horarios" className="bg-white rounded-2xl border p-5 space-y-3">
          {WEEKDAYS.map((d) => {
            const h = r.opening_hours?.[d.key] || { open: false, start: "18:00", end: "23:00" };
            return (
              <div key={d.key} className="flex items-center gap-3" data-testid={`hours-${d.key}`}>
                <span className="w-24 text-sm font-medium">{d.label}</span>
                <Switch checked={h.open} onCheckedChange={(v) => setHour(d.key, { open: v })} />
                {h.open ? (
                  <div className="flex items-center gap-2">
                    <Input type="time" value={h.start} onChange={(e) => setHour(d.key, { start: e.target.value })} className="w-28 h-9" />
                    <span className="text-gray-400">até</span>
                    <Input type="time" value={h.end} onChange={(e) => setHour(d.key, { end: e.target.value })} className="w-28 h-9" />
                  </div>
                ) : <span className="text-sm text-gray-400">Fechado</span>}
              </div>
            );
          })}
        </TabsContent>

        <TabsContent value="entrega" className="bg-white rounded-2xl border p-5 space-y-4">
          <div className="flex flex-wrap gap-4">
            <label className="flex items-center gap-2 text-sm"><Switch checked={r.accepts_delivery} onCheckedChange={(v) => set({ accepts_delivery: v })} data-testid="toggle-delivery" /> Aceita entrega</label>
            <label className="flex items-center gap-2 text-sm"><Switch checked={r.accepts_pickup} onCheckedChange={(v) => set({ accepts_pickup: v })} /> Aceita retirada</label>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Pedido mínimo</Label><Input type="number" value={r.minimum_order || 0} onChange={(e) => set({ minimum_order: e.target.value })} data-testid="settings-minimum" className="mt-1" /></div>
            <div><Label>Tempo médio</Label><Input value={r.average_delivery_time || ""} onChange={(e) => set({ average_delivery_time: e.target.value })} placeholder="30-45 min" className="mt-1" /></div>
          </div>
          <div>
            <Label>Modelo de taxa de entrega</Label>
            <Select value={r.delivery_fee_mode || "fixed"} onValueChange={(v) => set({ delivery_fee_mode: v })}>
              <SelectTrigger className="mt-1" data-testid="delivery-mode"><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="fixed">Taxa fixa</SelectItem><SelectItem value="neighborhood">Por bairro</SelectItem></SelectContent>
            </Select>
          </div>
          {r.delivery_fee_mode === "fixed" ? (
            <div><Label>Taxa fixa</Label><Input type="number" value={r.flat_delivery_fee || 0} onChange={(e) => set({ flat_delivery_fee: e.target.value })} className="mt-1 w-40" /></div>
          ) : (
            <div>
              <div className="flex items-center justify-between mb-2"><Label>Bairros atendidos</Label><Button size="sm" variant="outline" onClick={addZone} data-testid="add-zone"><Plus className="w-3 h-3 mr-1" /> Bairro</Button></div>
              <div className="space-y-2">
                {(r.delivery_zones || []).map((z) => (
                  <div key={z.id} className="flex gap-2 items-center" data-testid={`zone-${z.id}`}>
                    <Input value={z.neighborhood} onChange={(e) => updZone(z.id, { neighborhood: e.target.value })} placeholder="Bairro" />
                    <Input type="number" value={z.fee} onChange={(e) => updZone(z.id, { fee: Number(e.target.value) })} placeholder="R$" className="w-28" />
                    <Switch checked={z.active} onCheckedChange={(v) => updZone(z.id, { active: v })} />
                    <Button size="icon" variant="ghost" onClick={() => delZone(z.id)} className="text-red-500 shrink-0"><X className="w-4 h-4" /></Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="pagamento" className="bg-white rounded-2xl border p-5 space-y-4">
          <div>
            <Label>Formas de pagamento aceitas</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {PAYMENT_OPTIONS.map((m) => {
                const active = (r.payment_methods || []).includes(m);
                return (
                  <button key={m} onClick={() => togglePayment(m)} data-testid={`payment-${m}`}
                    className={`px-3 py-1.5 rounded-full text-sm border ${active ? "bg-[#111827] text-white border-transparent" : "bg-white border-gray-200 text-gray-500"}`}>
                    {m}
                  </button>
                );
              })}
            </div>
          </div>
          {(r.payment_methods || []).includes("Pix") && (
            <div className="grid grid-cols-2 gap-3 border-t pt-4">
              <div><Label>Chave Pix</Label><Input value={r.pix_key || ""} onChange={(e) => set({ pix_key: e.target.value })} className="mt-1" /></div>
              <div><Label>Nome do recebedor</Label><Input value={r.pix_name || ""} onChange={(e) => set({ pix_name: e.target.value })} className="mt-1" /></div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
