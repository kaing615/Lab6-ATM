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

def safe_hex(x:  str, name="value"):
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
        req.plaintext. encode(),
        key,
        req. mode. upper(),
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
    try:
        if req.ciphertextHex:
            ct = safe_hex(req.ciphertextHex, "ciphertextHex")
        elif req.ciphertextBase64:
            try:
                ct = base64.b64decode(req. ciphertextBase64)
            except Exception as e:
                raise HTTPException(400, f"Invalid base64 ciphertext: {str(e)}")
        else:
            raise HTTPException(400, "ciphertextHex or ciphertextBase64 required")

        key = safe_hex(req.keyHex, "keyHex")
        iv = safe_hex(req.ivHex, "ivHex") if req.ivHex else None

        print(f"[DEBUG] Ciphertext length: {len(ct)}")
        print(f"[DEBUG] Key length: {len(key)}")
        print(f"[DEBUG] IV length: {len(iv) if iv else 'None'}")
        print(f"[DEBUG] Mode: {req.mode}")

        pt = decrypt(
            ct,
            key,
            req.mode. upper(),
            iv
        )

        return {
            "plaintextHex": hx(pt),
            "plaintextBase64": b64e(pt),
            "plaintextUtf8": pt.decode("utf-8", errors="replace")
        }
    
    except ValueError as e:
        print(f"[ERROR] ValueError: {str(e)}")
        raise HTTPException(400, f"Decryption failed: {str(e)}")
    except Exception as e:
        print(f"[ERROR] Exception: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(500, f"Internal error: {str(e)}")


# ===== Encrypt file =====
@router.post("/upload")
async def aes_upload_encrypt(
    file: UploadFile = File(...),
    keyHex: str = Form(...),
    mode: str = Form(... ),
    ivHex: str | None = Form(None)
):
    raw = await file.read()
    ct, iv = encrypt(
        raw,
        bh(keyHex),
        mode. upper(),
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
# FIX: Xử lý đúng định dạng input
@router.post("/upload-decrypt")
async def aes_upload_decrypt(
    file: UploadFile = File(...),
    keyHex: str = Form(...),
    mode: str = Form(...),
    ivHex: str | None = Form(None),
    inputEnc: str = Form("hex")  # "hex" hoặc "base64"
):
    raw = await file.read()
    
    # Decode theo định dạng
    try:
        if inputEnc == "hex":
            # File chứa hex string
            ct = bh(raw. decode().strip())
        elif inputEnc == "base64": 
            # File chứa base64 string
            ct = b64d(raw.decode().strip())
        else:
            # File là binary thuần
            ct = raw
    except Exception as e:
        raise HTTPException(400, f"Failed to decode ciphertext: {str(e)}")

    # Decrypt
    try:
        pt = decrypt(
            ct,
            bh(keyHex),
            mode.upper(),
            bh(ivHex) if ivHex else None
        )
    except Exception as e: 
        raise HTTPException(400, f"Decryption failed: {str(e)}")

    return {
        "filename": file. filename,
        "plaintextHex": hx(pt),
        "plaintextBase64": b64e(pt),
        "plaintext": pt.decode("utf-8", errors="replace")
    }