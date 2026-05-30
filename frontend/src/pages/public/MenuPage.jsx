import { useEffect, useState, useRef, useMemo } from "react";
import { useParams } from "react-router-dom";
import { toast } from "sonner";
import { CartProvider, useCart } from "@/context/CartContext";
import api, { API } from "@/lib/api";
import { brl } from "@/lib/format";
import ProductDrawer from "@/components/public/ProductDrawer";
import CartSheet from "@/components/public/CartSheet";
import {
  MapPin, Clock, Share2, ShoppingBag, Search, Star, Phone, Plus, Loader2, Store,
} from "lucide-react";
import axios from "axios";

function hexForeground(hex) {
  if (!hex) return "#fff";
  const c = hex.replace("#", "");
  const r = parseInt(c.substr(0, 2), 16), g = parseInt(c.substr(2, 2), 16), b = parseInt(c.substr(4, 2), 16);
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return lum > 0.6 ? "#111827" : "#FFFFFF";
}

function MenuContent({ data, slug }) {
  const { restaurant, categories, products, banners, reviews, reviews_summary } = data;
  const { count, subtotal, addItem } = useCart();
  const [tab, setTab] = useState("cardapio");
  const [search, setSearch] = useState("");
  const [activeCat, setActiveCat] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [cartOpen, setCartOpen] = useState(false);
  const sectionRefs = useRef({});

  const filtered = useMemo(() => {
    if (!search.trim()) return products;
    const q = search.toLowerCase();
    return products.filter((p) => p.name.toLowerCase().includes(q) || (p.description || "").toLowerCase().includes(q));
  }, [search, products]);

  const grouped = useMemo(() => {
    return categories.map((c) => ({
      category: c,
      items: filtered.filter((p) => p.category_id === c.id),
    })).filter((g) => g.items.length > 0);
  }, [categories, filtered]);

  const scrollToCat = (cid) => {
    setActiveCat(cid);
    sectionRefs.current[cid]?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const share = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try { await navigator.share({ title: restaurant.name, url }); } catch { /* cancelled */ }
    } else {
      navigator.clipboard.writeText(url);
      toast.success("Link copiado!");
    }
  };

  return (
    <div className="w-full max-w-md mx-auto bg-[#FAFAFA] min-h-screen relative pb-28 shadow-2xl">
      {/* Header */}
      <div className="relative w-full h-44 rounded-b-3xl overflow-hidden">
        <img src={restaurant.cover_url || "https://images.pexels.com/photos/31124637/pexels-photo-31124637.jpeg"}
          alt="capa" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <button onClick={share} data-testid="share-btn"
          className="absolute top-4 right-4 w-9 h-9 grid place-items-center rounded-full bg-white/90 backdrop-blur no-tap-highlight">
          <Share2 className="w-4 h-4" />
        </button>
      </div>

      <div className="px-4 -mt-10 relative z-10">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-4 flex gap-3">
          <div className="w-16 h-16 rounded-2xl overflow-hidden bg-gray-100 shrink-0 grid place-items-center border">
            {restaurant.logo_url ? (
              <img src={restaurant.logo_url} alt="logo" className="w-full h-full object-cover" />
            ) : (
              <Store className="w-7 h-7 text-gray-300" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="font-display font-bold text-lg leading-tight truncate">{restaurant.name}</h1>
            <p className="text-xs text-gray-500 truncate">{restaurant.tagline || restaurant.description}</p>
            <div className="flex items-center gap-2 mt-1.5">
              <span data-testid="open-status" className={`text-xs font-semibold px-2 py-0.5 rounded-full ${restaurant.is_open ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>
                {restaurant.is_open ? "Aberto" : "Fechado"}
              </span>
              {reviews_summary?.count > 0 && (
                <span className="text-xs text-gray-500 flex items-center gap-0.5">
                  <Star className="w-3 h-3 fill-amber-400 text-amber-400" /> {reviews_summary.average} ({reviews_summary.count})
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 px-4 mt-4 border-b border-gray-100">
        {[["cardapio", "Cardápio"], ["info", "Informações"], ["avaliacoes", "Avaliações"]].map(([k, label]) => (
          <button key={k} onClick={() => setTab(k)} data-testid={`tab-${k}`}
            className={`pb-2 px-1 text-sm font-medium border-b-2 transition-colors ${tab === k ? "brand-text brand-border" : "border-transparent text-gray-400"}`}>
            {label}
          </button>
        ))}
      </div>

      {tab === "cardapio" && (
        <>
          {banners.length > 0 && (
            <div className="px-4 mt-4 flex gap-3 overflow-x-auto scrollbar-hide snap-x">
              {banners.map((b) => (
                <div key={b.id} className="relative min-w-[85%] h-32 rounded-2xl overflow-hidden snap-start" data-testid="banner">
                  {b.image_url && <img src={b.image_url} alt={b.title} className="w-full h-full object-cover" />}
                  <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent p-4 flex flex-col justify-center">
                    <p className="text-white font-display font-bold text-base">{b.title}</p>
                    <p className="text-white/80 text-xs">{b.subtitle}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Search */}
          <div className="px-4 mt-4">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar no cardápio..." data-testid="menu-search"
                className="w-full bg-white border border-gray-200 rounded-full h-11 pl-9 pr-4 text-sm outline-none focus:brand-border" />
            </div>
          </div>

          {/* Category chips */}
          <div className="flex overflow-x-auto gap-2 py-4 px-4 scrollbar-hide snap-x sticky top-0 bg-[#FAFAFA] z-20">
            {grouped.map((g) => (
              <button key={g.category.id} onClick={() => scrollToCat(g.category.id)}
                data-testid={`category-chip-${g.category.id}`}
                className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors snap-start ${
                  activeCat === g.category.id ? "brand-bg" : "bg-white text-gray-600 border border-gray-200"
                }`}>
                {g.category.name}
              </button>
            ))}
          </div>

          {/* Products */}
          <div className="px-4 space-y-6">
            {grouped.length === 0 && (
              <p className="text-center text-gray-400 py-10">Nenhum produto encontrado.</p>
            )}
            {grouped.map((g) => (
              <div key={g.category.id} ref={(el) => (sectionRefs.current[g.category.id] = el)}>
                <h2 className="font-display font-bold text-base mb-3">{g.category.name}</h2>
                <div className="space-y-3">
                  {g.items.map((p) => {
                    const promo = p.promotional_price != null && p.promotional_price > 0;
                    return (
                      <button key={p.id} onClick={() => p.is_available && setSelectedProduct(p)}
                        data-testid={`product-card-${p.id}`}
                        className={`w-full flex gap-3 bg-white rounded-2xl border border-gray-100 p-3 text-left transition-transform active:scale-[0.98] ${!p.is_available ? "opacity-50" : ""}`}>
                        <div className="flex-1 min-w-0">
                          <div className="flex gap-1.5 mb-1">
                            {p.is_best_seller && <span className="text-[10px] font-bold uppercase brand-soft brand-text px-1.5 py-0.5 rounded">Mais vendido</span>}
                            {promo && <span className="text-[10px] font-bold uppercase bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">Promoção</span>}
                          </div>
                          <p className="font-display font-semibold text-sm leading-tight">{p.name}</p>
                          <p className="text-xs text-gray-400 line-clamp-2 mt-0.5">{p.description}</p>
                          <div className="flex items-center gap-2 mt-1.5">
                            <span className="font-display font-bold text-sm brand-text">{brl(promo ? p.promotional_price : p.price)}</span>
                            {promo && <span className="text-xs text-gray-300 line-through">{brl(p.price)}</span>}
                          </div>
                          {!p.is_available && <span className="text-xs text-red-500">Indisponível</span>}
                        </div>
                        {p.image_url && (
                          <div className="relative w-24 h-24 shrink-0">
                            <img src={p.image_url} alt={p.name} className="w-24 h-24 rounded-xl object-cover" />
                            {p.is_available && (
                              <span className="absolute -bottom-1.5 -right-1.5 w-7 h-7 grid place-items-center rounded-full brand-bg shadow">
                                <Plus className="w-4 h-4" />
                              </span>
                            )}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {tab === "info" && (
        <div className="px-4 mt-4 space-y-3 text-sm">
          <InfoRow icon={MapPin} label="Endereço" value={`${restaurant.address || ""}${restaurant.city ? ` · ${restaurant.city}/${restaurant.state}` : ""}`} />
          <InfoRow icon={Clock} label="Tempo de entrega" value={restaurant.average_delivery_time || "—"} />
          <InfoRow icon={ShoppingBag} label="Pedido mínimo" value={brl(restaurant.minimum_order || 0)} />
          {restaurant.phone && <InfoRow icon={Phone} label="Telefone" value={restaurant.phone} />}
          <OpeningHours hours={restaurant.opening_hours} />
        </div>
      )}

      {tab === "avaliacoes" && (
        <ReviewsTab slug={slug} reviews={reviews} summary={reviews_summary} />
      )}

      {/* Cart bottom bar */}
      {count > 0 && (
        <div className="fixed bottom-0 left-0 right-0 w-full max-w-md mx-auto p-4 bg-white border-t border-gray-100 shadow-[0_-8px_30px_rgba(0,0,0,0.08)] z-50 rounded-t-2xl animate-slide-up">
          <button onClick={() => setCartOpen(true)} data-testid="view-cart-btn"
            className="w-full brand-bg rounded-xl h-12 flex items-center justify-between px-4 font-semibold active:scale-[0.98] transition-transform">
            <span className="flex items-center gap-2"><ShoppingBag className="w-5 h-5" /> {count} {count === 1 ? "item" : "itens"}</span>
            <span>Ver pedido · {brl(subtotal)}</span>
          </button>
        </div>
      )}

      <ProductDrawer product={selectedProduct} open={!!selectedProduct}
        onOpenChange={(o) => !o && setSelectedProduct(null)} onAdd={addItem} />
      <CartSheet open={cartOpen} onOpenChange={setCartOpen} restaurant={restaurant} slug={slug} />
    </div>
  );
}

function InfoRow({ icon: Icon, label, value }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-3 flex items-center gap-3">
      <Icon className="w-4 h-4 brand-text" />
      <div><p className="text-xs text-gray-400">{label}</p><p className="font-medium">{value}</p></div>
    </div>
  );
}

const DAY_LABELS = { mon: "Segunda", tue: "Terça", wed: "Quarta", thu: "Quinta", fri: "Sexta", sat: "Sábado", sun: "Domingo" };
function OpeningHours({ hours }) {
  if (!hours) return null;
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-3">
      <p className="text-xs text-gray-400 mb-2 flex items-center gap-2"><Clock className="w-4 h-4 brand-text" /> Horário de funcionamento</p>
      {Object.entries(DAY_LABELS).map(([k, label]) => (
        <div key={k} className="flex justify-between text-sm py-0.5">
          <span className="text-gray-500">{label}</span>
          <span className="font-medium">{hours[k]?.open ? `${hours[k].start} - ${hours[k].end}` : "Fechado"}</span>
        </div>
      ))}
    </div>
  );
}

function ReviewsTab({ slug, reviews, summary }) {
  const [list, setList] = useState(reviews);
  const [name, setName] = useState("");
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [sending, setSending] = useState(false);

  const submit = async () => {
    setSending(true);
    try {
      const { data } = await api.post(`/public/restaurants/${slug}/reviews`, { name, rating, comment });
      setList([data, ...list]);
      setName(""); setComment(""); setRating(5);
      toast.success("Avaliação enviada!");
    } catch {
      toast.error("Erro ao enviar avaliação");
    } finally { setSending(false); }
  };

  return (
    <div className="px-4 mt-4 space-y-4">
      <div className="bg-white rounded-xl border border-gray-100 p-4 text-center">
        <p className="font-display font-extrabold text-3xl">{summary?.average || 0}</p>
        <div className="flex justify-center gap-0.5 my-1">
          {[1, 2, 3, 4, 5].map((s) => (
            <Star key={s} className={`w-4 h-4 ${s <= Math.round(summary?.average || 0) ? "fill-amber-400 text-amber-400" : "text-gray-200"}`} />
          ))}
        </div>
        <p className="text-xs text-gray-400">{summary?.count || 0} avaliações</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 p-4 space-y-2">
        <p className="font-display font-semibold text-sm">Deixe sua avaliação</p>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((s) => (
            <button key={s} onClick={() => setRating(s)} data-testid={`rate-${s}`}>
              <Star className={`w-6 h-6 ${s <= rating ? "fill-amber-400 text-amber-400" : "text-gray-200"}`} />
            </button>
          ))}
        </div>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Seu nome" className="w-full border rounded-lg px-3 py-2 text-sm" data-testid="review-name" />
        <textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Comentário" rows={2} className="w-full border rounded-lg px-3 py-2 text-sm resize-none" data-testid="review-comment" />
        <button onClick={submit} disabled={sending} data-testid="review-submit" className="w-full brand-bg rounded-lg h-10 font-medium text-sm">Enviar avaliação</button>
      </div>

      {list.map((r) => (
        <div key={r.id} className="bg-white rounded-xl border border-gray-100 p-3">
          <div className="flex justify-between items-center">
            <p className="font-medium text-sm">{r.name}</p>
            <div className="flex gap-0.5">{[1,2,3,4,5].map((s) => <Star key={s} className={`w-3 h-3 ${s <= r.rating ? "fill-amber-400 text-amber-400" : "text-gray-200"}`} />)}</div>
          </div>
          {r.comment && <p className="text-sm text-gray-500 mt-1">{r.comment}</p>}
        </div>
      ))}
    </div>
  );
}

export default function MenuPage() {
  const { slug } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    axios.get(`${API}/public/restaurants/${slug}`)
      .then((res) => {
        setData(res.data);
        document.title = `${res.data.restaurant.name} · Cardápio`;
      })
      .catch(() => setError(true));
  }, [slug]);

  if (error) return (
    <div className="min-h-screen grid place-items-center text-center px-6">
      <div><Store className="w-12 h-12 mx-auto text-gray-300 mb-3" /><p className="font-display font-bold text-lg">Restaurante não encontrado</p><p className="text-sm text-gray-400">Verifique o link e tente novamente.</p></div>
    </div>
  );
  if (!data) return <div className="min-h-screen grid place-items-center"><Loader2 className="w-6 h-6 animate-spin text-gray-300" /></div>;

  const primary = data.restaurant.primary_color || "#EF4444";
  const secondary = data.restaurant.secondary_color || "#FEE2E2";
  const style = {
    "--brand-primary": primary,
    "--brand-primary-foreground": hexForeground(primary),
    "--brand-secondary": secondary,
  };

  return (
    <div style={style} className="font-body bg-gray-100 min-h-screen">
      <CartProvider>
        <MenuContent data={data} slug={slug} />
      </CartProvider>
    </div>
  );
}
