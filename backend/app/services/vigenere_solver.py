from collections import Counter

ENGLISH_FREQ = [
    0.08167, 0.01492, 0.02782, 0.04253, 0.12702, 0.02228, 0.02015,
    0.06094, 0.06966, 0.00153, 0.00772, 0.04025, 0.02406, 0.06749,
    0.07507, 0.01929, 0.00095, 0.05987, 0.06327, 0.09056, 0.02758,
    0.00978, 0.02360, 0.00150, 0.01974, 0.00074
]

def normalize_key(key: str) -> str:
    """
    Rút gọn key bị lặp (messimessimessi -> messi)
    """
    n = len(key)
    for size in range(1, n + 1):
        if n % size == 0:
            candidate = key[:size]
            if candidate * (n // size) == key:
                return candidate
    return key

def clean_text(text: str) -> str:
    return "".join(c.upper() for c in text if c.isalpha())

def calculate_ic(text: str) -> float:
    n = len(text)
    if n <= 1:
        return 0.0

    counts = Counter(text)
    return sum(v * (v - 1) for v in counts.values()) / (n * (n - 1))

def find_key_length(ciphertext: str, max_len=20) -> int:
    clean = clean_text(ciphertext)

    best_len = 1
    best_diff = float("inf")

    for key_len in range(1, max_len + 1):
        avg_ic = 0.0

        for i in range(key_len):
            avg_ic += calculate_ic(clean[i::key_len])

        avg_ic /= key_len
        diff = abs(avg_ic - 0.065)

        if diff < best_diff:
            best_diff = diff
            best_len = key_len

    return best_len

def solve_caesar_shift(text: str) -> str:
    n = len(text)
    best_shift = 0
    min_chi = float("inf")

    for shift in range(26):
        observed = [0] * 26

        for c in text:
            decrypted_pos = (ord(c) - ord('A') - shift) % 26
            observed[decrypted_pos] += 1

        chi = 0.0
        for i in range(26):
            expected = ENGLISH_FREQ[i] * n
            diff = observed[i] - expected
            chi += (diff * diff) / expected

        if chi < min_chi:
            min_chi = chi
            best_shift = shift

    return chr(ord('A') + best_shift)

def find_key(ciphertext: str, key_len: int) -> str:
    clean = clean_text(ciphertext)
    key = []

    for i in range(key_len):
        column = clean[i::key_len]
        key.append(solve_caesar_shift(column))

    return "".join(key)

def decrypt_vigenere(ciphertext: str, key: str) -> str:
    result = []
    key = key.upper()
    key_index = 0

    for c in ciphertext:
        if c.isalpha():
            base = ord('A') if c.isupper() else ord('a')
            c_index = ord(c.upper()) - ord('A')
            k_index = ord(key[key_index % len(key)]) - ord('A')

            p_index = (c_index - k_index + 26) % 26
            result.append(chr(p_index + base))

            key_index += 1
        else:
            result.append(c)

    return "".join(result)

def solve_vigenere(ciphertext: str):
    key_len = find_key_length(ciphertext)
    raw_key = find_key(ciphertext, key_len)

    key = normalize_key(raw_key)
    plaintext = decrypt_vigenere(ciphertext, key)

    return {
        "keyLen": key_len,
        "rawKey": raw_key,
        "key": key.lower(),
        "displayKey": key.lower(),
        "plaintext": plaintext,
        "candidates": []  
    }
