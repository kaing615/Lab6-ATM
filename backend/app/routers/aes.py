from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from pydantic import BaseModel
import binascii, base64
from app.services.aes_solver import encrypt, decrypt

router = APIRouter(prefix="/api/aes", tags=["AES"])

# ===== Helpers =====
hx = lambda b: binascii.hexlify(b).decode()
bh = lambda x: binascii.unhexlify(x)
b64e = lambda b: base64.b64encode(b).decode()
b64d = lambda s: base64.b64decode(s)

def safe_hex(x: str, name="value"):
    if len(x) % 2 != 0:
        raise HTTPException(400, f"{name} must have even length")
    try:
        return binascii.unhexlify(x)
    except Exception:
        raise HTTPException(400, f"{name} must be valid hex")

# ===== Request Models =====
class EncReq(BaseModel):
    plaintext: str
    keyHex: str
    mode: str
    ivHex: str | None = None

class DecReq(BaseModel):
    ciphertextHex: str | None = None
    ciphertextBase64: str | None = None
    keyHex: str
    mode: str
    ivHex: str | None = None

@router.post("/encrypt")
def aes_encrypt(req: EncReq):
    key = safe_hex(req.keyHex, "keyHex")
    iv = safe_hex(req.ivHex, "ivHex") if req.ivHex else None

    ct, iv = encrypt(
        req.plaintext.encode(),
        key,
        req.mode.upper(),
        iv
    )

    return {
        "ciphertextHex": hx(ct),
        "ciphertextBase64": b64e(ct),
        "ivHex": hx(iv) if iv else None,
        "ivBase64": b64e(iv) if iv else None
    }


@router.post("/decrypt")
def aes_decrypt(req: DecReq):
    if req.ciphertextHex:
        ct = safe_hex(req.ciphertextHex, "ciphertextHex")
    elif req.ciphertextBase64:
        try:
            ct = base64.b64decode(req.ciphertextBase64)
        except Exception:
            raise HTTPException(400, "Invalid base64 ciphertext")
    else:
        raise HTTPException(400, "ciphertextHex or ciphertextBase64 required")

    key = safe_hex(req.keyHex, "keyHex")
    iv = safe_hex(req.ivHex, "ivHex") if req.ivHex else None

    pt = decrypt(
        ct,
        key,
        req.mode.upper(),
        iv
    )

    return {
        "plaintextHex": hx(pt),
        "plaintextBase64": b64e(pt),
        "plaintextUtf8": pt.decode("utf-8", errors="replace")
    }


# ===== Encrypt file =====
@router.post("/upload")
async def aes_upload_encrypt(
    file: UploadFile = File(...),
    keyHex: str = Form(...),
    mode: str = Form(...),
    ivHex: str | None = Form(None)
):
    raw = await file.read()
    ct, iv = encrypt(
        raw,
        bh(keyHex),
        mode.upper(),
        bh(ivHex) if ivHex else None
    )
    return {
        "filename": file.filename,
        "ciphertextHex": hx(ct),
        "ciphertextBase64": b64e(ct),
        "ivHex": hx(iv) if iv else None,
        "ivBase64": b64e(iv) if iv else None
    }

# ===== Decrypt file =====
@router.post("/upload-decrypt")
async def aes_upload_decrypt(
    file: UploadFile = File(...),
    keyHex: str = Form(...),
    mode: str = Form(...),
    ivHex: str | None = Form(None)
):
    raw = await file.read()
    ct = bh(raw.decode().strip())

    pt = decrypt(
        ct,
        bh(keyHex),
        mode.upper(),
        bh(ivHex) if ivHex else None
    )

    return {
        "filename": file.filename,
        "plaintextHex": hx(pt),
        "plaintextBase64": b64e(pt),
        "plaintextUtf8": pt.decode("utf-8", errors="replace")
    }
