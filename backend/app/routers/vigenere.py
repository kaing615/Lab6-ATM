from fastapi import APIRouter, UploadFile, File
from pydantic import BaseModel
from app.services.vigenere_solver import solve_vigenere as solve

router = APIRouter(prefix="/api/vigenere", tags=["Vigenere"])

class VigenereReq(BaseModel):
    ciphertext: str

@router.post("/solve")
def solve_cipher(req: VigenereReq):
    return solve(req.ciphertext)

@router.post("/upload")
async def upload_cipher(file: UploadFile = File(...)):
    text = (await file.read()).decode("utf-8", errors="ignore")
    return solve(text)