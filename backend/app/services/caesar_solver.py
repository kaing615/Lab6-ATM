from app.utils.caesar import caesar_decrypt

COMMON_WORDS = {
    "THE", "AND", "IS", "TO", "OF", "IN", "THAT", "IT", "FOR", "ARE"
}

def score_text(text: str) -> int:
    words = [
        w for w in text.upper().split()
        if w.isalpha()
    ]
    return sum(1 for w in words if w in COMMON_WORDS)

def solve_caesar(ciphertext: str):
    all_candidates = []
    best = None
    best_score = -1

    for k in range(26):
        pt = caesar_decrypt(ciphertext, k)
        s = score_text(pt)
        all_candidates.append({"k": k, "pt": pt})

        if s > best_score:
            best_score = s
            best = (k, pt)

    return {
        "key": best[0],
        "plaintext": best[1],
        "allCandidates": all_candidates,
        "bestScore": best_score
    }
