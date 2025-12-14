from collections import Counter
import math

# English letter frequency (A-Z)
ENGLISH_FREQ = [
    0.08167, 0.01492, 0.02782, 0.04253, 0.12702, 0.02228, 0.02015,
    0.06094, 0.06966, 0.00153, 0.00772, 0.04025, 0.02406, 0.06749,
    0.07507, 0.01929, 0.00095, 0.05987, 0.06327, 0.09056, 0.02758,
    0.00978, 0.02360, 0.00150, 0.01974, 0.00074
]

ENGLISH_IC = 0.0667  # Index of Coincidence for English

def clean_text(text:  str) -> str:
    """Extract only alphabetic characters and convert to uppercase"""
    return "".join(c.upper() for c in text if c.isalpha())

def calculate_ic(text: str) -> float:
    """Calculate Index of Coincidence for a text"""
    if not text or len(text) <= 1:
        return 0.0
    
    n = len(text)
    counts = Counter(text)
    
    # IC = sum(f_i * (f_i - 1)) / (N * (N - 1))
    numerator = sum(count * (count - 1) for count in counts.values())
    denominator = n * (n - 1)
    
    return numerator / denominator if denominator > 0 else 0.0

def find_key_length(ciphertext: str, max_len=20) -> int:
    """Find most likely key length using Index of Coincidence"""
    clean = clean_text(ciphertext)
    
    if len(clean) < 100:
        return 1
    
    best_len = 1
    best_avg_ic = 0.0
    
    for key_len in range(1, min(max_len + 1, len(clean) // 20)):
        # Calculate average IC across all columns
        ic_sum = 0.0
        
        for offset in range(key_len):
            column = clean[offset:: key_len]
            if len(column) > 1:
                ic_sum += calculate_ic(column)
        
        avg_ic = ic_sum / key_len
        
        # IC closer to English IC (0.0667) is better
        if abs(avg_ic - ENGLISH_IC) < abs(best_avg_ic - ENGLISH_IC):
            best_avg_ic = avg_ic
            best_len = key_len
    
    return best_len

def chi_squared(observed_counts: list, text_length: int) -> float:
    """Calculate chi-squared statistic against English frequency"""
    chi2 = 0.0
    
    for i in range(26):
        expected = ENGLISH_FREQ[i] * text_length
        observed = observed_counts[i]
        
        if expected > 0:
            chi2 += ((observed - expected) ** 2) / expected
    
    return chi2

def solve_caesar_column(column: str) -> str:
    """Find best Caesar shift for a single column using chi-squared"""
    if not column:
        return 'A'
    
    n = len(column)
    best_shift = 0
    min_chi2 = float('inf')
    
    for shift in range(26):
        # Decrypt with this shift
        observed = [0] * 26
        
        for char in column:
            decrypted_idx = (ord(char) - ord('A') - shift) % 26
            observed[decrypted_idx] += 1
        
        # Calculate chi-squared
        chi2 = chi_squared(observed, n)
        
        if chi2 < min_chi2:
            min_chi2 = chi2
            best_shift = shift
    
    return chr(ord('A') + best_shift)

def find_key(ciphertext: str, key_len: int) -> str:
    """Find the key by solving each Caesar-shifted column"""
    clean = clean_text(ciphertext)
    key_chars = []
    
    for offset in range(key_len):
        column = clean[offset:: key_len]
        key_char = solve_caesar_column(column)
        key_chars.append(key_char)
    
    return "".join(key_chars)

def decrypt_vigenere(ciphertext: str, key: str) -> str:
    """Decrypt Vigenere cipher, preserving non-alphabetic characters"""
    if not key: 
        return ciphertext
    
    result = []
    key_upper = key.upper()
    key_index = 0
    
    for char in ciphertext:
        if char.isalpha():
            # Determine if uppercase or lowercase
            is_upper = char.isupper()
            char_upper = char.upper()
            
            # Get indices
            c_idx = ord(char_upper) - ord('A')
            k_idx = ord(key_upper[key_index % len(key_upper)]) - ord('A')
            
            # Decrypt:  P = (C - K) mod 26
            p_idx = (c_idx - k_idx) % 26
            
            # Convert back to character
            decrypted = chr(p_idx + ord('A'))
            
            # Preserve case
            if not is_upper:
                decrypted = decrypted.lower()
            
            result.append(decrypted)
            key_index += 1
        else: 
            # Keep non-alphabetic characters as-is
            result.append(char)
    
    return "".join(result)

def normalize_key(key: str) -> str:
    """Reduce key to shortest repeating pattern"""
    n = len(key)
    
    for length in range(1, n + 1):
        if n % length == 0:
            candidate = key[: length]
            # Check if this pattern repeats to form the full key
            if candidate * (n // length) == key:
                return candidate
    
    return key

def get_canonical_key(key:  str) -> str:
    """Return the lexicographically smallest rotation of the key"""
    key = key.lower()
    n = len(key)
    
    # Generate all rotations
    rotations = [key[i:] + key[:i] for i in range(n)]
    
    # Return the smallest one alphabetically
    return min(rotations)

def get_all_rotations(key:  str) -> list:
    """Get all rotations of a key"""
    key = key.lower()
    n = len(key)
    return [key[i: ] + key[:i] for i in range(n)]

def solve_vigenere(ciphertext:  str, max_key_len=20):
    """Main solver function"""
    key_len = find_key_length(ciphertext, max_key_len)
    raw_key = find_key(ciphertext, key_len)
    key = normalize_key(raw_key)
    
    all_rotations = get_all_rotations(key)
    canonical = get_canonical_key(key)
    
    plaintext = decrypt_vigenere(ciphertext, key)
    
    return {
        "keyLen": len(key),
        "key": key. lower(),
        "displayKey": key. lower(),
        "canonicalKey": canonical,
        "allRotations": all_rotations,
        "plaintext":  plaintext,
        "candidates": []
    }