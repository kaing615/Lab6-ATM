from fastapi import APIRouter, HTTPException, UploadFile, File
from pydantic import BaseModel
from typing import List, Dict, Optional

# Import Class logic
from app.services.mono_solver import MonoalphabeticAnalyzer

router = APIRouter(
    prefix="/mono",
    tags=["Monoalphabetic Substitution"]
)

# --- Models ---
class CiphertextRequest(BaseModel):
    ciphertext: str

class MappingRequest(BaseModel):
    ciphertext: str
    mapping: Dict[str, str]

# --- Endpoints ---

@router.post("/uploadCiphertext")
async def upload_ciphertext(file: UploadFile = File(...)):
    """
    Sửa lỗi 404/422: Sử dụng UploadFile để nhận dữ liệu Multipart từ Frontend
    """
    try:
        content = await file.read()
        # Decode bytes sang string (utf-8)
        text = content.decode("utf-8")
        return {"ciphertext": text}
    except Exception as e:
        raise HTTPException(status_code=400, detail="Invalid file format")

@router.post("/stats")
async def get_statistics(req: CiphertextRequest):
    """Trả về danh sách thống kê tần suất"""
    if not req.ciphertext:
        return []
    # Hàm này trả về List[Dict], Frontend sẽ nhận trực tiếp mảng này
    stats = MonoalphabeticAnalyzer.get_letter_frequencies(req.ciphertext)
    return stats

@router.post("/initMapping")
async def init_mapping(req: CiphertextRequest):
    if not req.ciphertext:
        raise HTTPException(status_code=400, detail="Ciphertext is empty")
    
    try:
        MonoalphabeticAnalyzer.initialize_language_models()
    except Exception as e:
        print(f"Model init warning: {e}")

    key_list = MonoalphabeticAnalyzer.build_initial_mapping_by_frequency(req.ciphertext)
    
    # Chuyển List thành Dict {'a':'x'} để trả về Frontend
    mapping_dict = {}
    base_a = ord('a')
    for i, plain_char in enumerate(key_list):
        cipher_char = chr(base_a + i)
        mapping_dict[cipher_char] = plain_char
        
    preview = MonoalphabeticAnalyzer.apply_mapping(req.ciphertext, key_list)
    score = MonoalphabeticAnalyzer.compute_score(preview)

    return {
        "mapping": mapping_dict,
        "plaintext": preview,
        "score": score
    }

@router.post("/autoSolve")
async def auto_solve(req: CiphertextRequest):
    if not req.ciphertext:
        raise HTTPException(status_code=400, detail="Ciphertext is empty")

    try:
        # Add logging
        print(f"Attempting to solve ciphertext of length: {len(req.ciphertext)}")
        
        # Initialize models
        try:
            MonoalphabeticAnalyzer.initialize_language_models()
            print("Language models initialized successfully")
        except Exception as e:
            print(f"Model initialization error: {e}")
            raise HTTPException(status_code=500, detail=f"Model init failed: {str(e)}")
        
        # Solve
        print("Starting solve process...")
        best_key_list = MonoalphabeticAnalyzer.solve(
            req.ciphertext, 
            restarts=10, 
            iterations=2000
        )
        print(f"Solve completed. Key: {best_key_list}")
        
        # Build mapping
        mapping_dict = {}
        base_a = ord('a')
        for i, plain_char in enumerate(best_key_list):
            cipher_char = chr(base_a + i)
            mapping_dict[cipher_char] = plain_char

        plaintext = MonoalphabeticAnalyzer.apply_mapping(req.ciphertext, best_key_list)
        score = MonoalphabeticAnalyzer.compute_score(plaintext)

        return {
            "mapping": mapping_dict,
            "plaintext": plaintext,
            "score": score
        }
    except HTTPException:
        raise
    except Exception as e:
        # Log the full error
        import traceback
        print(f"Error in autoSolve: {str(e)}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Solve failed: {str(e)}")

@router.post("/applyMapping")
async def apply_custom_mapping(req: MappingRequest):
    # Convert Dict mapping từ Frontend thành List cho Backend xử lý
    key_list = ['?'] * 26
    base_a = ord('a')
    
    # Mapping gửi lên dạng {'a': 'x', 'b': 'y'}
    for cipher_char, plain_char in req.mapping.items():
        if len(cipher_char) == 1:
            idx = ord(cipher_char.lower()) - base_a
            if 0 <= idx < 26:
                key_list[idx] = plain_char.lower()
    
    # Fill ? nếu thiếu
    for i in range(26):
        if key_list[i] == '?': 
            key_list[i] = chr(base_a + i)

    plaintext = MonoalphabeticAnalyzer.apply_mapping(req.ciphertext, key_list)
    score = MonoalphabeticAnalyzer.compute_score(plaintext)
    
    return {
        "plaintext": plaintext,
        "score": score
    }