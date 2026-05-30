import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Loader2 } from "lucide-react";

const ROLE_LABELS = { super_admin: "Super Admin", owner: "Dono", manager: "Gerente", attendant: "Atendente", kitchen: "Cozinha" };

export default function Users() {
  const [users, setUsers] = useState(null);
  useEffect(() => { api.get("/super/users").then((r) => setUsers(r.data)); }, []);
  if (!users) return <div className="grid place-items-center py-20"><Loader2 className="w-6 h-6 animate-spin text-gray-600" /></div>;

  return (
    <div className="space-y-5" data-testid="super-users">
      <h1 className="font-display font-bold text-2xl">Usuários</h1>
      <div className="bg-[#11151F] border border-white/5 rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="text-gray-500 text-xs uppercase border-b border-white/5">
            <tr><th className="text-left p-3">Nome</th><th className="text-left p-3">E-mail</th><th className="text-left p-3">Papel</th></tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b border-white/5" data-testid={`user-row-${u.id}`}>
                <td className="p-3 font-medium">{u.name}</td>
                <td className="p-3 text-gray-400">{u.email}</td>
                <td className="p-3"><span className="text-xs bg-white/5 px-2 py-1 rounded">{ROLE_LABELS[u.role] || u.role}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
