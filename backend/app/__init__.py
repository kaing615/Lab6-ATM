from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

def create_app():
    app = FastAPI(
        title="Crypto Tools API",
        description="API for Caesar, Vigenère, Monoalphabetic, DES, AES",
        version="1.0.0"
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],  # Allow all origins in development
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    from app.routers import caesar, vigenere, mono, des, aes
    
    app.include_router(caesar.router)
    app.include_router(vigenere.router)
    app.include_router(mono.router)
    app.include_router(des.router)
    app.include_router(aes.router)

    return app

app = create_app()