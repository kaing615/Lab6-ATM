from fastapi import APIRouter, UploadFile, File
from pydantic import BaseModel
from app.services.caesar_solver import solve_caesar

router = APIRouter(prefix="/api/caesar", tags=["Caesar"])

class CaesarReq(BaseModel):
    ciphertext: str

@router.post("/bruteforce")
def bruteforce(req: CaesarReq):
    return solve_caesar(req.ciphertext)

@router.post("/upload")
async def upload(file: UploadFile = File(...)):
    content = (await file.read()).decode("utf-8", errors="ignore")
    return solve_caesar(content)
