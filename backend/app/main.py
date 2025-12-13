from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers.caesar import router as caesar_router
from app.routers.vigenere import router as vigenere_router
from app.routers.des import router as des_router
from app.routers.aes import router as aes_router

app = FastAPI(title="Crypto Solver API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(caesar_router)
app.include_router(vigenere_router)
app.include_router(des_router)
app.include_router(aes_router)

@app.get("/")
def root():
    return {"status": "Backend running"}
