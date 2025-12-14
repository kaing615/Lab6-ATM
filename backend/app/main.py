from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ===== Include routers =====
from app.routers import caesar, vigenere, mono, des, aes

app.include_router(caesar.router)
app.include_router(vigenere.router)
app.include_router(mono.router)
app.include_router(des.router)
app.include_router(aes.router)

@app.get("/")
def root():
    return {"message":  "Crypto API is running"}