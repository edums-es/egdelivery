"""Super admin endpoints — platform owner only."""
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, EmailStr

from db import db
from auth import require_roles, hash_password
from models import slugify, clean, now_iso
from datetime import datetime, timezone

router = APIRouter(prefix="/api/super", tags=["super"])

SUPER = require_roles("super_admin")


class CreateRestaurant(BaseModel):
    restaurant_name: str
    owner_name: str
    owner_email: EmailStr
    owner_password: str
    plan: str = "basic"


class UpdateRestaurant(BaseModel):
    status: str = None
    plan: str = None
    name: str = None


@router.get("/restaurants")
async def list_restaurants(user=Depends(SUPER)):
    restaurants = await db.restaurants.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    for r in restaurants:
        r["order_count"] = await db.orders.count_documents({"restaurant_id": r["id"]})
        r["product_count"] = await db.products.count_documents({"restaurant_id": r["id"]})
    return restaurants


@router.post("/restaurants")
async def create_restaurant(data: CreateRestaurant, user=Depends(SUPER)):
    from seed import create_restaurant_with_owner
    if await db.users.find_one({"email": data.owner_email.lower()}):
        raise HTTPException(status_code=400, detail="E-mail do dono já cadastrado")
    base = slugify(data.restaurant_name)
    slug = base
    n = 1
    while await db.restaurants.find_one({"slug": slug}):
        n += 1
        slug = f"{base}-{n}"
    rid = await create_restaurant_with_owner(
        restaurant_name=data.restaurant_name, slug=slug,
        owner_name=data.owner_name, owner_email=data.owner_email,
        owner_password=data.owner_password, with_demo_data=False, plan=data.plan,
    )
    return {"id": rid, "slug": slug}


@router.put("/restaurants/{rid}")
async def update_restaurant(rid: str, data: UpdateRestaurant, user=Depends(SUPER)):
    updates = {k: v for k, v in data.model_dump().items() if v is not None}
    if not updates:
        raise HTTPException(status_code=400, detail="Nada para atualizar")
    updates["updated_at"] = now_iso()
    res = await db.restaurants.update_one({"id": rid}, {"$set": updates})
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Restaurante não encontrado")
    return await db.restaurants.find_one({"id": rid}, {"_id": 0})


@router.get("/users")
async def list_users(user=Depends(SUPER)):
    users = await db.users.find({}, {"password_hash": 0}).to_list(1000)
    out = []
    for u in users:
        out.append({
            "id": str(u["_id"]), "email": u["email"], "name": u.get("name"),
            "role": u.get("role"), "restaurant_id": u.get("restaurant_id"),
        })
    return out


@router.get("/metrics")
async def metrics(user=Depends(SUPER)):
    total_restaurants = await db.restaurants.count_documents({})
    active = await db.restaurants.count_documents({"status": "active"})
    suspended = await db.restaurants.count_documents({"status": "suspended"})
    total_orders = await db.orders.count_documents({})
    total_users = await db.users.count_documents({})
    orders = await db.orders.find({"status": {"$ne": "cancelled"}}, {"total": 1, "_id": 0}).to_list(50000)
    gmv = round(sum(o.get("total", 0) for o in orders), 2)

    plans = {}
    async for r in db.restaurants.find({}, {"plan": 1, "_id": 0}):
        p = r.get("plan", "basic")
        plans[p] = plans.get(p, 0) + 1

    return {
        "total_restaurants": total_restaurants,
        "active": active,
        "suspended": suspended,
        "total_orders": total_orders,
        "total_users": total_users,
        "gmv": gmv,
        "plans": [{"plan": k, "count": v} for k, v in plans.items()],
    }
