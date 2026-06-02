"""
WhatsApp QR-code session management — proxy para o whatsapp-service Node.js.
Cada restaurante tem sua própria sessão independente.
"""
import os
import logging
import httpx
from fastapi import APIRouter, Depends, HTTPException

from auth import require_restaurant
from db import db
from models import now_iso

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/admin/whatsapp", tags=["whatsapp"])

WA_URL = os.environ.get("WA_SERVICE_URL", "http://whatsapp-service:3001")
TIMEOUT = 10


def rid(user):
    return user["restaurant_id"]


async def _wa(method: str, path: str, **kwargs):
    """Faz requisição ao whatsapp-service com tratamento de erro."""
    try:
        async with httpx.AsyncClient(timeout=TIMEOUT) as client:
            resp = await getattr(client, method)(f"{WA_URL}{path}", **kwargs)
            return resp.json()
    except httpx.ConnectError:
        raise HTTPException(503, "Serviço WhatsApp indisponível. Verifique o container.")
    except httpx.TimeoutException:
        raise HTTPException(504, "Timeout ao conectar ao serviço WhatsApp.")
    except Exception as e:
        raise HTTPException(500, f"Erro no serviço WhatsApp: {str(e)}")


# ── Status da sessão ─────────────────────────────────────────────────────────

@router.get("/status")
async def wa_status(user=Depends(require_restaurant)):
    """Retorna o status da sessão WhatsApp do restaurante."""
    data = await _wa("get", f"/session/{rid(user)}/status")
    # Salva status no banco para histórico
    await db.restaurants.update_one(
        {"id": rid(user)},
        {"$set": {"wa_status": data.get("status"), "wa_updated_at": now_iso()}},
    )
    return data


# ── Iniciar sessão / obter QR code ───────────────────────────────────────────

@router.get("/qr")
async def wa_qr(user=Depends(require_restaurant)):
    """
    Inicia sessão e retorna QR code para escanear.
    Enquanto não escaneado: { status: 'qr', qr: 'data:image/png;base64,...' }
    Após escanear: { status: 'connected', qr: null }
    """
    return await _wa("get", f"/session/{rid(user)}/qr")


# ── Desconectar ──────────────────────────────────────────────────────────────

@router.delete("/disconnect")
async def wa_disconnect(user=Depends(require_restaurant)):
    """Desconecta o WhatsApp do restaurante e limpa a sessão salva."""
    data = await _wa("delete", f"/session/{rid(user)}")
    await db.restaurants.update_one(
        {"id": rid(user)},
        {"$set": {"wa_status": "disconnected", "wa_updated_at": now_iso()}},
    )
    return data


# ── Configurações de notificação ─────────────────────────────────────────────

@router.get("/settings")
async def wa_get_settings(user=Depends(require_restaurant)):
    """Retorna quais status de pedido disparam notificação ao cliente."""
    r = await db.restaurants.find_one({"id": rid(user)}, {"wa_notify_statuses": 1, "_id": 0})
    default = ["accepted", "preparing", "ready", "out_for_delivery", "completed", "cancelled"]
    return {"notify_statuses": (r or {}).get("wa_notify_statuses", default)}


@router.put("/settings")
async def wa_update_settings(body: dict, user=Depends(require_restaurant)):
    """Salva quais status de pedido disparam notificação ao cliente."""
    statuses = body.get("notify_statuses", [])
    await db.restaurants.update_one(
        {"id": rid(user)},
        {"$set": {"wa_notify_statuses": statuses, "updated_at": now_iso()}},
    )
    return {"ok": True, "notify_statuses": statuses}


# ── Teste de envio ────────────────────────────────────────────────────────────

@router.post("/test")
async def wa_send_test(body: dict, user=Depends(require_restaurant)):
    """Envia mensagem de teste para um número."""
    phone = body.get("phone", "")
    if not phone:
        raise HTTPException(400, "Informe o número de telefone")
    message = f"✅ Teste de notificação do *Menu Digital*!\nSeu WhatsApp está configurado e funcionando corretamente."
    return await _wa("post", f"/session/{rid(user)}/send", json={"phone": phone, "message": message})
