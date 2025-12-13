from fastapi import APIRouter
from pydantic import BaseModel
import binascii
from app.services.des_solver import encrypt, decrypt

router = APIRouter(prefix="/api/des", tags=["DES"])

def hx(b): return binascii.hexlify(b).decode()
def bh(x): return binascii.unhexlify(x)


class EncryptReq(BaseModel):
    plaintext: str
    keyHex: str
    mode: str
    ivHex: str | None = None


class DecryptReq(BaseModel):
    ciphertextHex: str
    keyHex: str
    mode: str
    ivHex: str | None = None


@router.post("/encrypt")
def des_encrypt(req: EncryptReq):
    key = bh(req.keyHex)
    iv = bh(req.ivHex) if req.ivHex else None

    ct, iv_out = encrypt(
        req.plaintext.encode(),
        key,
        req.mode.upper(),
        iv
    )

    return {
        "ciphertextHex": hx(ct),
        "ivHex": hx(iv_out) if iv_out else None
    }


@router.post("/decrypt")
def des_decrypt(req: DecryptReq):
    key = bh(req.keyHex)
    iv = bh(req.ivHex) if req.ivHex else None

    pt = decrypt(
        bh(req.ciphertextHex),
        key,
        req.mode.upper(),
        iv
    )

    return {
        "plaintext": pt.decode(errors="ignore")
    }
