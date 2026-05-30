"""Restaurant admin endpoints — tenant-scoped, auth required."""
from datetime import datetime, timezone, timedelta

from fastapi import APIRouter, Depends, HTTPException

from db import db
from auth import require_restaurant
from models import (
    CategoryIn, ProductIn, CouponIn, BannerIn, RestaurantSettings, StatusUpdate,
    ORDER_STATUSES, clean, new_id, now_iso, is_restaurant_open,
)

router = APIRouter(prefix="/api/admin", tags=["admin"])


def rid(user):
    return user["restaurant_id"]


# ---------- restaurant config ----------
@router.get("/restaurant")
async def get_restaurant(user=Depends(require_restaurant)):
    r = await db.restaurants.find_one({"id": rid(user)}, {"_id": 0})
    if not r:
        raise HTTPException(status_code=404, detail="Restaurante não encontrado")
    r["is_open"] = is_restaurant_open(r)
    return r


@router.put("/restaurant")
async def update_restaurant(settings: RestaurantSettings, user=Depends(require_restaurant)):
    updates = {k: v for k, v in settings.model_dump().items() if v is not None}
    updates["updated_at"] = now_iso()
    await db.restaurants.update_one({"id": rid(user)}, {"$set": updates})
    r = await db.restaurants.find_one({"id": rid(user)}, {"_id": 0})
    r["is_open"] = is_restaurant_open(r)
    return r


@router.post("/restaurant/toggle-open")
async def toggle_open(user=Depends(require_restaurant)):
    r = await db.restaurants.find_one({"id": rid(user)})
    new_val = not bool(r.get("is_open_manual", True))
    await db.restaurants.update_one({"id": rid(user)}, {"$set": {"is_open_manual": new_val}})
    return {"is_open_manual": new_val}


# ---------- categories ----------
@router.get("/categories")
async def list_categories(user=Depends(require_restaurant)):
    return await db.categories.find({"restaurant_id": rid(user)}, {"_id": 0}).sort("sort_order", 1).to_list(500)


@router.post("/categories")
async def create_category(data: CategoryIn, user=Depends(require_restaurant)):
    doc = data.model_dump()
    doc.update({"id": new_id(), "restaurant_id": rid(user), "created_at": now_iso()})
    await db.categories.insert_one(doc)
    return clean(doc)


@router.put("/categories/{cid}")
async def update_category(cid: str, data: CategoryIn, user=Depends(require_restaurant)):
    res = await db.categories.update_one(
        {"id": cid, "restaurant_id": rid(user)}, {"$set": data.model_dump()})
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Categoria não encontrada")
    return await db.categories.find_one({"id": cid}, {"_id": 0})


@router.delete("/categories/{cid}")
async def delete_category(cid: str, user=Depends(require_restaurant)):
    await db.categories.delete_one({"id": cid, "restaurant_id": rid(user)})
    await db.products.delete_many({"category_id": cid, "restaurant_id": rid(user)})
    return {"ok": True}


# ---------- products ----------
@router.get("/products")
async def list_products(user=Depends(require_restaurant)):
    return await db.products.find({"restaurant_id": rid(user)}, {"_id": 0}).sort("sort_order", 1).to_list(1000)


@router.post("/products")
async def create_product(data: ProductIn, user=Depends(require_restaurant)):
    doc = data.model_dump()
    doc.update({"id": new_id(), "restaurant_id": rid(user), "created_at": now_iso()})
    await db.products.insert_one(doc)
    return clean(doc)


@router.put("/products/{pid}")
async def update_product(pid: str, data: ProductIn, user=Depends(require_restaurant)):
    res = await db.products.update_one(
        {"id": pid, "restaurant_id": rid(user)}, {"$set": data.model_dump()})
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Produto não encontrado")
    return await db.products.find_one({"id": pid}, {"_id": 0})


@router.delete("/products/{pid}")
async def delete_product(pid: str, user=Depends(require_restaurant)):
    await db.products.delete_one({"id": pid, "restaurant_id": rid(user)})
    return {"ok": True}


# ---------- orders ----------
@router.get("/orders")
async def list_orders(status: str = None, user=Depends(require_restaurant)):
    q = {"restaurant_id": rid(user)}
    if status:
        q["status"] = status
    return await db.orders.find(q, {"_id": 0}).sort("created_at", -1).to_list(500)


@router.get("/orders/{oid}")
async def get_order(oid: str, user=Depends(require_restaurant)):
    o = await db.orders.find_one({"id": oid, "restaurant_id": rid(user)}, {"_id": 0})
    if not o:
        raise HTTPException(status_code=404, detail="Pedido não encontrado")
    return o


@router.put("/orders/{oid}/status")
async def update_order_status(oid: str, data: StatusUpdate, user=Depends(require_restaurant)):
    if data.status not in ORDER_STATUSES:
        raise HTTPException(status_code=400, detail="Status inválido")
    res = await db.orders.update_one(
        {"id": oid, "restaurant_id": rid(user)},
        {"$set": {"status": data.status, "updated_at": now_iso()}})
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Pedido não encontrado")
    return await db.orders.find_one({"id": oid}, {"_id": 0})


# ---------- coupons ----------
@router.get("/coupons")
async def list_coupons(user=Depends(require_restaurant)):
    return await db.coupons.find({"restaurant_id": rid(user)}, {"_id": 0}).to_list(200)


@router.post("/coupons")
async def create_coupon(data: CouponIn, user=Depends(require_restaurant)):
    doc = data.model_dump()
    doc["code"] = doc["code"].upper()
    doc.update({"id": new_id(), "restaurant_id": rid(user), "used_count": 0, "created_at": now_iso()})
    await db.coupons.insert_one(doc)
    return clean(doc)


@router.put("/coupons/{cid}")
async def update_coupon(cid: str, data: CouponIn, user=Depends(require_restaurant)):
    payload = data.model_dump()
    payload["code"] = payload["code"].upper()
    res = await db.coupons.update_one({"id": cid, "restaurant_id": rid(user)}, {"$set": payload})
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Cupom não encontrado")
    return await db.coupons.find_one({"id": cid}, {"_id": 0})


@router.delete("/coupons/{cid}")
async def delete_coupon(cid: str, user=Depends(require_restaurant)):
    await db.coupons.delete_one({"id": cid, "restaurant_id": rid(user)})
    return {"ok": True}


# ---------- banners ----------
@router.get("/banners")
async def list_banners(user=Depends(require_restaurant)):
    return await db.banners.find({"restaurant_id": rid(user)}, {"_id": 0}).sort("sort_order", 1).to_list(100)


@router.post("/banners")
async def create_banner(data: BannerIn, user=Depends(require_restaurant)):
    doc = data.model_dump()
    doc.update({"id": new_id(), "restaurant_id": rid(user), "created_at": now_iso()})
    await db.banners.insert_one(doc)
    return clean(doc)


@router.put("/banners/{bid}")
async def update_banner(bid: str, data: BannerIn, user=Depends(require_restaurant)):
    res = await db.banners.update_one({"id": bid, "restaurant_id": rid(user)}, {"$set": data.model_dump()})
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Banner não encontrado")
    return await db.banners.find_one({"id": bid}, {"_id": 0})


@router.delete("/banners/{bid}")
async def delete_banner(bid: str, user=Depends(require_restaurant)):
    await db.banners.delete_one({"id": bid, "restaurant_id": rid(user)})
    return {"ok": True}


# ---------- dashboard & reports ----------
def _today_start_iso():
    try:
        from zoneinfo import ZoneInfo
        now = datetime.now(ZoneInfo("America/Sao_Paulo"))
    except Exception:
        now = datetime.now()
    return now.replace(hour=0, minute=0, second=0, microsecond=0).isoformat()


@router.get("/dashboard")
async def dashboard(user=Depends(require_restaurant)):
    r = await db.restaurants.find_one({"id": rid(user)})
    orders = await db.orders.find({"restaurant_id": rid(user)}, {"_id": 0}).to_list(5000)
    today = _today_start_iso()[:10]
    today_orders = [o for o in orders if (o.get("created_at") or "")[:10] == today and o.get("status") != "cancelled"]
    revenue = sum(o["total"] for o in today_orders)
    in_progress = [o for o in orders if o.get("status") in ("pending", "accepted", "preparing", "ready", "out_for_delivery")]

    # top products
    counter = {}
    for o in orders:
        if o.get("status") == "cancelled":
            continue
        for it in o.get("items", []):
            counter[it["product_name"]] = counter.get(it["product_name"], 0) + it.get("quantity", 1)
    top = sorted(counter.items(), key=lambda x: x[1], reverse=True)[:5]

    return {
        "orders_today": len(today_orders),
        "revenue_today": round(revenue, 2),
        "avg_ticket": round(revenue / len(today_orders), 2) if today_orders else 0,
        "in_progress": len(in_progress),
        "is_open": is_restaurant_open(r) if r else False,
        "is_open_manual": r.get("is_open_manual", True) if r else True,
        "top_products": [{"name": n, "qty": q} for n, q in top],
        "recent_orders": sorted(orders, key=lambda o: o.get("created_at", ""), reverse=True)[:8],
    }


@router.get("/reports")
async def reports(period: str = "7d", user=Depends(require_restaurant)):
    days = {"today": 1, "7d": 7, "30d": 30}.get(period, 7)
    try:
        from zoneinfo import ZoneInfo
        now = datetime.now(ZoneInfo("America/Sao_Paulo"))
    except Exception:
        now = datetime.now()
    start = (now - timedelta(days=days)).isoformat()
    orders = await db.orders.find(
        {"restaurant_id": rid(user), "created_at": {"$gte": start}, "status": {"$ne": "cancelled"}},
        {"_id": 0},
    ).to_list(5000)
    revenue = sum(o["total"] for o in orders)

    by_day = {}
    payment = {}
    prod = {}
    for o in orders:
        d = (o.get("created_at") or "")[:10]
        by_day[d] = by_day.get(d, 0) + o["total"]
        pm = o.get("payment_method", "—")
        payment[pm] = payment.get(pm, 0) + 1
        for it in o.get("items", []):
            prod[it["product_name"]] = prod.get(it["product_name"], 0) + it.get("quantity", 1)

    return {
        "total_orders": len(orders),
        "revenue": round(revenue, 2),
        "avg_ticket": round(revenue / len(orders), 2) if orders else 0,
        "by_day": [{"date": k, "total": round(v, 2)} for k, v in sorted(by_day.items())],
        "payment_methods": [{"method": k, "count": v} for k, v in sorted(payment.items(), key=lambda x: -x[1])],
        "top_products": [{"name": k, "qty": v} for k, v in sorted(prod.items(), key=lambda x: -x[1])[:8]],
    }
