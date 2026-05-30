import { useEffect, useState } from "react";
import api from "@/lib/api";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, FolderTree } from "lucide-react";

const EMPTY = { name: "", icon: "", sort_order: 0, is_active: true };

export default function Categories() {
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [editId, setEditId] = useState(null);

  const load = () => api.get("/admin/categories").then((r) => setItems(r.data));
  useEffect(() => { load(); }, []);

  const openNew = () => { setForm(EMPTY); setEditId(null); setOpen(true); };
  const openEdit = (c) => { setForm(c); setEditId(c.id); setOpen(true); };

  const save = async () => {
    if (!form.name.trim()) return toast.error("Informe o nome");
    const payload = { name: form.name, icon: form.icon, sort_order: Number(form.sort_order) || 0, is_active: form.is_active };
    if (editId) await api.put(`/admin/categories/${editId}`, payload);
    else await api.post("/admin/categories", payload);
    toast.success("Categoria salva");
    setOpen(false); load();
  };

  const remove = async (id) => {
    if (!window.confirm("Excluir categoria e seus produtos?")) return;
    await api.delete(`/admin/categories/${id}`);
    toast.success("Categoria excluída"); load();
  };

  return (
    <div className="space-y-5" data-testid="admin-categories">
      <div className="flex items-center justify-between">
        <h1 className="font-display font-bold text-2xl">Categorias</h1>
        <Button onClick={openNew} data-testid="new-category-btn" className="bg-[#111827] rounded-xl"><Plus className="w-4 h-4 mr-1" /> Nova</Button>
      </div>

      {items.length === 0 ? (
        <div className="bg-white rounded-2xl border p-12 text-center text-gray-400">
          <FolderTree className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p>Nenhuma categoria cadastrada. Crie a primeira para organizar seu cardápio.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 divide-y">
          {items.map((c) => (
            <div key={c.id} className="flex items-center justify-between p-4" data-testid={`category-row-${c.id}`}>
              <div>
                <p className="font-medium">{c.name}</p>
                <p className="text-xs text-gray-400">Ordem {c.sort_order} · {c.is_active ? "Ativa" : "Inativa"}</p>
              </div>
              <div className="flex gap-1">
                <Button size="icon" variant="ghost" onClick={() => openEdit(c)} data-testid={`edit-category-${c.id}`}><Pencil className="w-4 h-4" /></Button>
                <Button size="icon" variant="ghost" onClick={() => remove(c.id)} data-testid={`delete-category-${c.id}`} className="text-red-500"><Trash2 className="w-4 h-4" /></Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle className="font-display">{editId ? "Editar" : "Nova"} categoria</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Nome</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} data-testid="category-name" className="mt-1" /></div>
            <div><Label>Ordem de exibição</Label><Input type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: e.target.value })} className="mt-1" /></div>
            <div className="flex items-center justify-between"><Label>Ativa</Label><Switch checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} /></div>
          </div>
          <DialogFooter><Button onClick={save} data-testid="save-category" className="bg-[#111827] rounded-xl">Salvar</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
