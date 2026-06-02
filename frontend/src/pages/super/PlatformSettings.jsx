/**
 * Configurações Globais da Plataforma — Super Admin
 * Gerencia OneSignal (push), WebSocket stats e futuras integrações.
 * Configurações salvas aqui se aplicam a todos os restaurantes.
 */
import { useEffect, useState, useCallback, useRef } from "react";
import api from "@/lib/api";
import { toast } from "sonner";
import {
  Bell, Wifi, Save, Eye, EyeOff, RefreshCw, Send,
  CheckCircle2, XCircle, Loader2, Info, Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";

// ── Helpers ────────────────────────────────────────────────────────────────
function SectionCard({ icon: Icon, title, subtitle, color = "#6366f1", children }) {
  return (
    <div className="bg-white dark:bg-[#161B22] border border-gray-100 dark:border-gray-800 rounded-2xl overflow-hidden">
      <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100 dark:border-gray-800">
        <span
          className="grid place-items-center w-9 h-9 rounded-xl shrink-0"
          style={{ background: color + "22" }}
        >
          <Icon className="w-4 h-4" style={{ color }} />
        </span>
        <div>
          <p className="font-semibold text-sm dark:text-white">{title}</p>
          {subtitle && <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{subtitle}</p>}
        </div>
      </div>
      <div className="p-6 space-y-5">{children}</div>
    </div>
  );
}

function Field({ label, hint, children }) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>
      {children}
      {hint && <p className="text-xs text-gray-400 dark:text-gray-500">{hint}</p>}
    </div>
  );
}

function SecretInput({ value, onChange, placeholder, disabled }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <Input
        type={show ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className="pr-10 font-mono text-sm dark:bg-[#0D1117] dark:border-gray-700 dark:text-gray-200"
      />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
      >
        {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      </button>
    </div>
  );
}

function StatusDot({ ok, label }) {
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${
      ok
        ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
        : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"
    }`}>
      {ok ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
      {label}
    </span>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────
export default function PlatformSettings() {
  const [settings, setSettings] = useState({});
  const [wsStats, setWsStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testingPush, setTestingPush] = useState(false);
  const wsRefresh = useRef(null);

  // ── Load settings ──
  const loadSettings = useCallback(async () => {
    try {
      const res = await api.get("/super/platform-settings");
      // Campos mascarados (***) viram string vazia no form para não sobrescrever com ***
      const raw = res.data || {};
      const clean = {};
      for (const [k, v] of Object.entries(raw)) {
        clean[k] = v === "***" ? "" : v;
      }
      setSettings(clean);
    } catch {
      toast.error("Erro ao carregar configurações");
    }
  }, []);

  // ── Load WS stats ──
  const loadWsStats = useCallback(async () => {
    try {
      const res = await api.get("/ws/stats");
      setWsStats(res.data);
    } catch {
      setWsStats(null);
    }
  }, []);

  useEffect(() => {
    Promise.all([loadSettings(), loadWsStats()]).finally(() => setLoading(false));
    // Atualiza stats de WS a cada 10s
    wsRefresh.current = setInterval(loadWsStats, 10000);
    return () => clearInterval(wsRefresh.current);
  }, [loadSettings, loadWsStats]);

  // ── Save ──
  const save = async () => {
    setSaving(true);
    try {
      // Filtra campos vazios para não sobrescrever segredos já salvos com vazio
      const payload = {};
      for (const [k, v] of Object.entries(settings)) {
        if (v !== "" && v !== null && v !== undefined) {
          payload[k] = v;
        }
      }
      await api.put("/super/platform-settings", payload);
      toast.success("Configurações salvas com sucesso!");
      // Recarrega para pegar valores mascarados atualizados
      await loadSettings();
    } catch {
      toast.error("Erro ao salvar configurações");
    } finally {
      setSaving(false);
    }
  };

  // ── Test push ──
  const testPush = async () => {
    if (!settings.onesignal_app_id) {
      toast.warning("Configure o OneSignal App ID antes de testar");
      return;
    }
    setTestingPush(true);
    try {
      await api.post("/super/test-push");
      toast.success("Notificação de teste enviada!");
    } catch (e) {
      const msg = e?.response?.data?.detail || "Erro ao enviar notificação de teste";
      toast.error(msg);
    } finally {
      setTestingPush(false);
    }
  };

  const set = (key) => (value) => setSettings((s) => ({ ...s, [key]: value }));

  if (loading) {
    return (
      <div className="grid place-items-center py-24">
        <Loader2 className="w-7 h-7 animate-spin text-indigo-400" />
      </div>
    );
  }

  const pushConfigured = !!(settings.onesignal_app_id);
  const pushEnabled = settings.push_notifications_enabled !== false && settings.push_notifications_enabled !== "false";

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-2xl dark:text-white">Configurações da Plataforma</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Aplicado a todos os restaurantes cadastrados
          </p>
        </div>
        <Button onClick={save} disabled={saving} className="gap-2">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Salvar
        </Button>
      </div>

      {/* Info banner */}
      <div className="flex items-start gap-3 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-xl px-4 py-3">
        <Info className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
        <p className="text-xs text-indigo-700 dark:text-indigo-300">
          As configurações salvas aqui são aplicadas globalmente. O OneSignal App ID é exposto
          para o frontend via <code className="font-mono bg-indigo-100 dark:bg-indigo-800 px-1 rounded">/api/public/platform-config</code>.
          Chaves secretas (API Key) ficam apenas no servidor.
        </p>
      </div>

      {/* ── WebSocket ── */}
      <SectionCard
        icon={Wifi}
        title="WebSocket — Tempo Real"
        subtitle="Canal persistente para atualizações instantâneas de pedidos"
        color="#10b981"
      >
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium dark:text-white">Status do servidor WebSocket</p>
            <p className="text-xs text-gray-400">Conexões ativas por restaurante</p>
          </div>
          <button
            onClick={loadWsStats}
            className="text-gray-400 hover:text-green-500 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {wsStats ? (
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 text-center">
              <p className="font-display font-bold text-2xl text-green-600 dark:text-green-400">
                {wsStats.total_connected}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Clientes conectados</p>
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 text-center">
              <p className="font-display font-bold text-2xl text-green-600 dark:text-green-400">
                {wsStats.active_rooms}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Restaurantes online</p>
            </div>
          </div>
        ) : (
          <div className="text-center py-4">
            <p className="text-sm text-gray-400">Nenhum cliente conectado agora</p>
          </div>
        )}

        {wsStats?.rooms && Object.keys(wsStats.rooms).length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Salas ativas</p>
            <div className="divide-y divide-gray-100 dark:divide-gray-800 rounded-xl border border-gray-100 dark:border-gray-800 overflow-hidden">
              {Object.entries(wsStats.rooms).map(([rid, count]) => (
                <div key={rid} className="flex items-center justify-between px-3 py-2 bg-white dark:bg-[#0D1117]">
                  <span className="font-mono text-xs text-gray-500 dark:text-gray-400 truncate max-w-xs">{rid}</span>
                  <span className="text-xs font-semibold text-green-600 dark:text-green-400">{count} cliente{count !== 1 ? "s" : ""}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-[#0D1117] rounded-xl">
          <Zap className="w-4 h-4 text-green-500 shrink-0" />
          <p className="text-xs text-gray-500 dark:text-gray-400">
            O WebSocket está sempre ativo — reconecta automaticamente com backoff exponencial.
            Não requer configuração adicional.
          </p>
        </div>
      </SectionCard>

      {/* ── OneSignal ── */}
      <SectionCard
        icon={Bell}
        title="Notificações Push — OneSignal"
        subtitle="Push nativo em mobile e desktop para todos os restaurantes"
        color="#f59e0b"
      >
        {/* Toggle geral */}
        <div className="flex items-center justify-between py-1">
          <div>
            <p className="text-sm font-medium dark:text-white">Ativar notificações push</p>
            <p className="text-xs text-gray-400">Desativar silencia push em toda a plataforma</p>
          </div>
          <Switch
            checked={pushEnabled}
            onCheckedChange={(v) => set("push_notifications_enabled")(v)}
          />
        </div>

        <div className="border-t border-gray-100 dark:border-gray-800 pt-5 space-y-4">
          {/* App ID */}
          <Field
            label="OneSignal App ID"
            hint="Visível no frontend — usado para inicializar o SDK nos navegadores dos usuários."
          >
            <Input
              value={settings.onesignal_app_id || ""}
              onChange={(e) => set("onesignal_app_id")(e.target.value)}
              placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
              className="font-mono text-sm dark:bg-[#0D1117] dark:border-gray-700 dark:text-gray-200"
            />
          </Field>

          {/* REST API Key */}
          <Field
            label="OneSignal REST API Key"
            hint="Secreta — usada apenas no servidor para enviar notificações. Nunca exposta ao frontend."
          >
            <SecretInput
              value={settings.onesignal_api_key || ""}
              onChange={set("onesignal_api_key")}
              placeholder="REST API Key (começa com os2_…)"
            />
          </Field>
        </div>

        {/* Status + teste */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-2">
            <StatusDot ok={pushConfigured && pushEnabled} label={
              !pushConfigured ? "Não configurado" :
              !pushEnabled ? "Desativado" : "Ativo"
            } />
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={testPush}
            disabled={testingPush || !pushConfigured}
            className="gap-2 dark:border-gray-700 dark:text-gray-300"
          >
            {testingPush
              ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
              : <Send className="w-3.5 h-3.5" />
            }
            Enviar teste
          </Button>
        </div>

        {/* Instruções */}
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 space-y-2">
          <p className="text-xs font-semibold text-amber-700 dark:text-amber-400">Como configurar o OneSignal</p>
          <ol className="text-xs text-amber-600 dark:text-amber-300 space-y-1 list-decimal list-inside">
            <li>Crie uma conta em <a href="https://onesignal.com" target="_blank" rel="noreferrer" className="underline">onesignal.com</a> e crie um app Web</li>
            <li>Copie o <strong>App ID</strong> (Dashboard → Settings → Keys & IDs)</li>
            <li>Copie a <strong>REST API Key</strong> (mesma tela)</li>
            <li>Cole os valores nos campos acima e salve</li>
            <li>A configuração propaga automaticamente para todos os restaurantes</li>
          </ol>
        </div>
      </SectionCard>

      {/* Botão de salvar inferior */}
      <div className="flex justify-end pb-8">
        <Button onClick={save} disabled={saving} size="lg" className="gap-2 min-w-36">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? "Salvando…" : "Salvar configurações"}
        </Button>
      </div>
    </div>
  );
}
