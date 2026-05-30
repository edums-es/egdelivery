"""Public (customer-facing) menu endpoints — no auth required."""
import random
from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException

from db import db
from models import OrderIn, clean, is_restaurant_open, new_id, now_iso

router = APIRouter(prefix="/api/public", tags=["public"])


async def _get_restaurant_or_404(slug: str):
    r = await db.restaurants.find_one({"slug": slug})
    if not r or r.get("status") == "suspended":
        raise HTTPException(status_code=404, detail="Restaurante não encontrado")
    return r


@router.get("/restaurants/{slug}")
async def get_menu(slug: str):
    r = await _get_restaurant_or_404(slug)
    categories = await db.categories.find(
        {"restaurant_id": r["id"], "is_active": True}, {"_id": 0}
    ).sort("sort_order", 1).to_list(200)
    products = await db.products.find(
        {"restaurant_id": r["id"]}, {"_id": 0}
    ).sort("sort_order", 1).to_list(1000)
    banners = await db.banners.find(
        {"restaurant_id": r["id"], "is_active": True}, {"_id": 0}
    ).sort("sort_order", 1).to_list(50)
    reviews = await db.reviews.find(
        {"restaurant_id": r["id"]}, {"_id": 0}
    ).sort("created_at", -1).to_list(200)
    avg = round(sum(rv["rating"] for rv in reviews) / len(reviews), 1) if reviews else 0
    restaurant = clean(r)
    restaurant["is_open"] = is_restaurant_open(r)
    return {
        "restaurant": restaurant,
        "categories": categories,
        "products": products,
        "banners": banners,
        "reviews": reviews[:20],
        "reviews_summary": {"average": avg, "count": len(reviews)},
    }


@router.post("/restaurants/{slug}/validate-coupon")
async def validate_coupon(slug: str, payload: dict):
    r = await _get_restaurant_or_404(slug)
    code = (payload.get("code") or "").strip().upper()
    subtotal = float(payload.get("subtotal") or 0)
    coupon = await db.coupons.find_one(
        {"restaurant_id": r["id"], "code": code, "is_active": True}
    )
    if not coupon:
        raise HTTPException(status_code=404, detail="Cupom inválido")
    if subtotal < coupon.get("min_order", 0):
        raise HTTPException(
            status_code=400,
            detail=f"Pedido mínimo de R$ {coupon['min_order']:.2f} para este cupom",
        )
    if coupon.get("usage_limit") and coupon.get("used_count", 0) >= coupon["usage_limit"]:
        raise HTTPException(status_code=400, detail="Cupom esgotado")
    discount = 0.0
    if coupon["discount_type"] == "percent":
        discount = round(subtotal * coupon["discount_value"] / 100, 2)
    else:
        discount = coupon["discount_value"]
    return {
        "code": coupon["code"],
        "discount_type": coupon["discount_type"],
        "discount_value": coupon["discount_value"],
        "discount": discount,
        "free_delivery": coupon.get("free_delivery", False),
    }


@router.post("/restaurants/{slug}/orders")
async def create_order(slug: str, order: OrderIn):
    r = await _get_restaurant_or_404(slug)
    if not is_restaurant_open(r):
        raise HTTPException(status_code=400, detail="Loja fechada no momento")
    if order.subtotal < (r.get("minimum_order") or 0):
        raise HTTPException(
            status_code=400,
            detail=f"Pedido mínimo de R$ {r.get('minimum_order'):.2f}",
        )
    count = await db.orders.count_documents({"restaurant_id": r["id"]})
    order_number = count + 1
    doc = order.model_dump()
    doc.update({
        "id": new_id(),
        "restaurant_id": r["id"],
        "order_number": order_number,
        "status": "pending",
        "payment_status": "pending",
        "created_at": now_iso(),
        "updated_at": now_iso(),
    })
    await db.orders.insert_one(doc)
    if order.coupon_code:
        await db.coupons.update_one(
            {"restaurant_id": r["id"], "code": order.coupon_code.upper()},
            {"$inc": {"used_count": 1}},
        )
    return clean(doc)


@router.get("/orders/{order_id}")
async def track_order(order_id: str):
    o = await db.orders.find_one({"id": order_id}, {"_id": 0})
    if not o:
        raise HTTPException(status_code=404, detail="Pedido não encontrado")
    return {"id": o["id"], "order_number": o["order_number"], "status": o["status"]}


@router.post("/restaurants/{slug}/reviews")
async def create_review(slug: str, payload: dict):
    r = await _get_restaurant_or_404(slug)
    rating = int(payload.get("rating") or 0)
    if rating < 1 or rating > 5:
        raise HTTPException(status_code=400, detail="Nota deve ser entre 1 e 5")
    doc = {
        "id": new_id(),
        "restaurant_id": r["id"],
        "name": payload.get("name") or "Cliente",
        "rating": rating,
        "comment": payload.get("comment") or "",
        "created_at": now_iso(),
    }
    await db.reviews.insert_one(doc)
    return clean(doc)
