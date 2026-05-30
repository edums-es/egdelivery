import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { UtensilsCrossed, Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { formatApiError } from "@/lib/api";

export default function LoginPage() {
  const { user, login, register } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [rName, setRName] = useState("");
  const [rEmail, setREmail] = useState("");
  const [rPass, setRPass] = useState("");
  const [rStore, setRStore] = useState("");

  useEffect(() => {
    if (user && user.role) {
      navigate(user.role === "super_admin" ? "/super" : "/admin", { replace: true });
    }
  }, [user, navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const u = await login(email, password);
      toast.success("Bem-vindo de volta!");
      navigate(u.role === "super_admin" ? "/super" : "/admin", { replace: true });
    } catch (err) {
      toast.error(formatApiError(err.response?.data?.detail) || "Falha no login");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await register({
        name: rName, email: rEmail, password: rPass, restaurant_name: rStore,
      });
      toast.success("Restaurante criado! Configure seu cardápio.");
      navigate("/admin", { replace: true });
      void data;
    } catch (err) {
      toast.error(formatApiError(err.response?.data?.detail) || "Falha no cadastro");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 font-body">
      <div className="hidden lg:flex flex-col justify-between p-12 brand-bg relative overflow-hidden">
        <Link to="/" className="flex items-center gap-2 font-display font-bold text-xl">
          <UtensilsCrossed className="w-6 h-6" /> MenuFlow
        </Link>
        <div className="relative z-10">
          <h2 className="font-display font-extrabold text-4xl leading-tight tracking-tight">
            Gerencie seu restaurante com facilidade.
          </h2>
          <p className="opacity-80 mt-4 max-w-sm">
            Cardápio digital, pedidos e relatórios em um painel feito para o dia a dia da sua cozinha.
          </p>
        </div>
        <div className="absolute -right-20 -bottom-20 w-80 h-80 rounded-full bg-white/10" />
      </div>

      <div className="flex items-center justify-center p-6 bg-[#FAFAFA]">
        <div className="w-full max-w-sm">
          <Link to="/" className="lg:hidden flex items-center gap-2 font-display font-bold text-xl mb-8 brand-text">
            <UtensilsCrossed className="w-6 h-6" /> MenuFlow
          </Link>
          <Tabs defaultValue="login">
            <TabsList className="grid grid-cols-2 w-full mb-6">
              <TabsTrigger value="login" data-testid="tab-login">Entrar</TabsTrigger>
              <TabsTrigger value="register" data-testid="tab-register">Criar conta</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <h1 className="font-display font-bold text-2xl mb-1">Acesse seu painel</h1>
              <p className="text-sm text-gray-500 mb-6">Entre com seu e-mail e senha.</p>
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <Label htmlFor="email">E-mail</Label>
                  <Input id="email" type="email" required value={email}
                    onChange={(e) => setEmail(e.target.value)} data-testid="login-email"
                    placeholder="voce@restaurante.com" className="mt-1.5" />
                </div>
                <div>
                  <Label htmlFor="password">Senha</Label>
                  <Input id="password" type="password" required value={password}
                    onChange={(e) => setPassword(e.target.value)} data-testid="login-password"
                    placeholder="••••••••" className="mt-1.5" />
                </div>
                <Button type="submit" disabled={loading} data-testid="login-submit"
                  className="w-full brand-bg hover:opacity-90 h-11 rounded-xl">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Entrar"}
                </Button>
              </form>
              <div className="mt-6 text-xs text-gray-400 bg-white border border-gray-100 rounded-xl p-3 space-y-1">
                <p className="font-semibold text-gray-500">Contas de teste:</p>
                <p>Restaurante: dono@burger.com / dono123</p>
                <p>Super admin: super@menudigital.com / super123</p>
              </div>
            </TabsContent>

            <TabsContent value="register">
              <h1 className="font-display font-bold text-2xl mb-1">Crie seu cardápio</h1>
              <p className="text-sm text-gray-500 mb-6">Comece grátis em segundos.</p>
              <form onSubmit={handleRegister} className="space-y-4">
                <div>
                  <Label htmlFor="rstore">Nome do restaurante</Label>
                  <Input id="rstore" required value={rStore} onChange={(e) => setRStore(e.target.value)}
                    data-testid="register-store" placeholder="Ex: Burger do Zé" className="mt-1.5" />
                </div>
                <div>
                  <Label htmlFor="rname">Seu nome</Label>
                  <Input id="rname" required value={rName} onChange={(e) => setRName(e.target.value)}
                    data-testid="register-name" className="mt-1.5" />
                </div>
                <div>
                  <Label htmlFor="remail">E-mail</Label>
                  <Input id="remail" type="email" required value={rEmail} onChange={(e) => setREmail(e.target.value)}
                    data-testid="register-email" className="mt-1.5" />
                </div>
                <div>
                  <Label htmlFor="rpass">Senha</Label>
                  <Input id="rpass" type="password" required minLength={6} value={rPass}
                    onChange={(e) => setRPass(e.target.value)} data-testid="register-password" className="mt-1.5" />
                </div>
                <Button type="submit" disabled={loading} data-testid="register-submit"
                  className="w-full brand-bg hover:opacity-90 h-11 rounded-xl">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Criar restaurante"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
