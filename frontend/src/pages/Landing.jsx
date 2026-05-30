import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  UtensilsCrossed, Smartphone, MessageCircle, BarChart3, Palette,
  Ticket, ArrowRight, Check, Store,
} from "lucide-react";

const features = [
  { icon: Smartphone, title: "Cardápio mobile-first", desc: "Experiência de app premium que seus clientes amam usar." },
  { icon: MessageCircle, title: "Pedido pelo WhatsApp", desc: "Mensagem formatada automática, direto no seu WhatsApp." },
  { icon: BarChart3, title: "Painel de gestão", desc: "Pedidos em tempo real, produtos, relatórios e métricas." },
  { icon: Palette, title: "Marca personalizada", desc: "Suas cores, logo e capa. Cardápio com a sua identidade." },
  { icon: Ticket, title: "Cupons e promoções", desc: "Crie descontos e banners para vender mais." },
  { icon: Store, title: "Multi-loja (SaaS)", desc: "Cada restaurante isolado e seguro, pronto para escalar." },
];

const plans = [
  { name: "Básico", price: "R$ 0", tag: "Comece grátis", items: ["Cardápio digital", "Pedido via WhatsApp", "Produtos ilimitados", "Categorias ilimitadas"] },
  { name: "Profissional", price: "R$ 79", highlight: true, tag: "Mais popular", items: ["Tudo do Básico", "Painel de pedidos", "Cupons e banners", "Relatórios", "Personalização avançada"] },
  { name: "Premium", price: "R$ 149", tag: "Para escalar", items: ["Tudo do Profissional", "Domínio personalizado", "Integrações", "Suporte prioritário"] },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-[#FAFAFA] text-[#111827] font-body">
      {/* Nav */}
      <header className="sticky top-0 z-40 bg-[#FAFAFA]/80 backdrop-blur-lg border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 font-display font-bold text-xl tracking-tight">
            <span className="grid place-items-center w-9 h-9 rounded-xl brand-bg">
              <UtensilsCrossed className="w-5 h-5" />
            </span>
            MenuFlow
          </div>
          <div className="flex items-center gap-3">
            <Link to="/loja/burger-lanches" data-testid="nav-demo-link">
              <Button variant="ghost" className="hidden sm:inline-flex">Ver demo</Button>
            </Link>
            <Link to="/login" data-testid="nav-login-link">
              <Button className="brand-bg hover:opacity-90 rounded-full px-5">Entrar</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-5 pt-16 pb-12 grid lg:grid-cols-2 gap-12 items-center">
        <div className="animate-slide-up">
          <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider brand-soft brand-text px-3 py-1.5 rounded-full">
            Cardápio digital & delivery
          </span>
          <h1 className="font-display font-extrabold tracking-tight text-4xl sm:text-5xl lg:text-6xl mt-5 leading-[1.05]">
            Seu cardápio digital,<br />
            <span className="brand-text">pronto para vender.</span>
          </h1>
          <p className="text-base sm:text-lg text-gray-500 mt-5 max-w-md">
            Monte um cardápio lindo, receba pedidos pelo WhatsApp ou no painel e gerencie tudo em um só lugar. Simples para o cliente, prático para você.
          </p>
          <div className="flex flex-wrap gap-3 mt-8">
            <Link to="/login" data-testid="hero-cta-start">
              <Button className="brand-bg hover:opacity-90 rounded-full h-12 px-7 text-base">
                Criar meu cardápio <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
            <Link to="/loja/burger-lanches" data-testid="hero-cta-demo">
              <Button variant="outline" className="rounded-full h-12 px-7 text-base border-gray-300">
                Ver cardápio demo
              </Button>
            </Link>
          </div>
        </div>
        <div className="relative animate-fade-in">
          <div className="absolute -inset-6 brand-soft rounded-[2.5rem] -z-10 rotate-3" />
          <img
            src="https://images.pexels.com/photos/1639557/pexels-photo-1639557.jpeg"
            alt="Cardápio"
            className="rounded-[2rem] shadow-2xl w-full h-[420px] object-cover"
          />
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-5 py-16">
        <h2 className="font-display font-bold text-2xl sm:text-3xl tracking-tight text-center">
          Tudo que seu restaurante precisa
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 mt-10">
          {features.map((f) => (
            <div key={f.title} className="bg-white rounded-2xl border border-gray-100 p-6 hover:-translate-y-1 transition-transform">
              <span className="grid place-items-center w-11 h-11 rounded-xl brand-soft brand-text mb-4">
                <f.icon className="w-5 h-5" />
              </span>
              <h3 className="font-display font-semibold text-lg">{f.title}</h3>
              <p className="text-sm text-gray-500 mt-1.5">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Plans */}
      <section className="max-w-6xl mx-auto px-5 py-16">
        <h2 className="font-display font-bold text-2xl sm:text-3xl tracking-tight text-center">Planos para todo tamanho</h2>
        <div className="grid md:grid-cols-3 gap-5 mt-10">
          {plans.map((p) => (
            <div
              key={p.name}
              className={`rounded-2xl p-7 border ${p.highlight ? "brand-bg border-transparent shadow-xl scale-[1.02]" : "bg-white border-gray-100"}`}
            >
              <p className={`text-xs font-semibold uppercase tracking-wider ${p.highlight ? "opacity-80" : "text-gray-400"}`}>{p.tag}</p>
              <h3 className={`font-display font-bold text-xl mt-2 ${p.highlight ? "" : ""}`}>{p.name}</h3>
              <p className="font-display font-extrabold text-3xl mt-3">{p.price}<span className="text-sm font-medium opacity-70">/mês</span></p>
              <ul className="mt-5 space-y-2.5">
                {p.items.map((it) => (
                  <li key={it} className="flex items-center gap-2 text-sm">
                    <Check className={`w-4 h-4 ${p.highlight ? "" : "brand-text"}`} /> {it}
                  </li>
                ))}
              </ul>
              <Link to="/login">
                <Button className={`w-full mt-6 rounded-full ${p.highlight ? "bg-white text-[#111827] hover:bg-white/90" : "brand-bg hover:opacity-90"}`}>
                  Começar
                </Button>
              </Link>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-gray-100 mt-8">
        <div className="max-w-6xl mx-auto px-5 py-8 text-sm text-gray-400 flex flex-col sm:flex-row justify-between gap-3">
          <span>© {new Date().getFullYear()} MenuFlow — Cardápio digital & delivery</span>
          <Link to="/login" className="brand-text font-medium">Acessar painel</Link>
        </div>
      </footer>
    </div>
  );
}
