def caesar_decrypt(text: str, k: int) -> str:
    res = []
    for ch in text:
        if "A" <= ch <= "Z":
            res.append(chr((ord(ch) - 65 - k) % 26 + 65))
        elif "a" <= ch <= "z":
            res.append(chr((ord(ch) - 97 - k) % 26 + 97))
        else:
            res.append(ch)
    return "".join(res)
