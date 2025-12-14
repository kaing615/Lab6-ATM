import os

S_BOX = [
    0x63, 0x7c, 0x77, 0x7b, 0xf2, 0x6b, 0x6f, 0xc5, 0x30, 0x01, 0x67, 0x2b, 0xfe, 0xd7, 0xab, 0x76,
    0xca, 0x82, 0xc9, 0x7d, 0xfa, 0x59, 0x47, 0xf0, 0xad, 0xd4, 0xa2, 0xaf, 0x9c, 0xa4, 0x72, 0xc0,
    0xb7, 0xfd, 0x93, 0x26, 0x36, 0x3f, 0xf7, 0xcc, 0x34, 0xa5, 0xe5, 0xf1, 0x71, 0xd8, 0x31, 0x15,
    0x04, 0xc7, 0x23, 0xc3, 0x18, 0x96, 0x05, 0x9a, 0x07, 0x12, 0x80, 0xe2, 0xeb, 0x27, 0xb2, 0x75,
    0x09, 0x83, 0x2c, 0x1a, 0x1b, 0x6e, 0x5a, 0xa0, 0x52, 0x3b, 0xd6, 0xb3, 0x29, 0xe3, 0x2f, 0x84,
    0x53, 0xd1, 0x00, 0xed, 0x20, 0xfc, 0xb1, 0x5b, 0x6a, 0xcb, 0xbe, 0x39, 0x4a, 0x4c, 0x58, 0xcf,
    0xd0, 0xef, 0xaa, 0xfb, 0x43, 0x4d, 0x33, 0x85, 0x45, 0xf9, 0x02, 0x7f, 0x50, 0x3c, 0x9f, 0xa8,
    0x51, 0xa3, 0x40, 0x8f, 0x92, 0x9d, 0x38, 0xf5, 0xbc, 0xb6, 0xda, 0x21, 0x10, 0xff, 0xf3, 0xd2,
    0xcd, 0x0c, 0x13, 0xec, 0x5f, 0x97, 0x44, 0x17, 0xc4, 0xa7, 0x7e, 0x3d, 0x64, 0x5d, 0x19, 0x73,
    0x60, 0x81, 0x4f, 0xdc, 0x22, 0x2a, 0x90, 0x88, 0x46, 0xee, 0xb8, 0x14, 0xde, 0x5e, 0x0b, 0xdb,
    0xe0, 0x32, 0x3a, 0x0a, 0x49, 0x06, 0x24, 0x5c, 0xc2, 0xd3, 0xac, 0x62, 0x91, 0x95, 0xe4, 0x79,
    0xe7, 0xc8, 0x37, 0x6d, 0x8d, 0xd5, 0x4e, 0xa9, 0x6c, 0x56, 0xf4, 0xea, 0x65, 0x7a, 0xae, 0x08,
    0xba, 0x78, 0x25, 0x2e, 0x1c, 0xa6, 0xb4, 0xc6, 0xe8, 0xdd, 0x74, 0x1f, 0x4b, 0xbd, 0x8b, 0x8a,
    0x70, 0x3e, 0xb5, 0x66, 0x48, 0x03, 0xf6, 0x0e, 0x61, 0x35, 0x57, 0xb9, 0x86, 0xc1, 0x1d, 0x9e,
    0xe1, 0xf8, 0x98, 0x11, 0x69, 0xd9, 0x8e, 0x94, 0x9b, 0x1e, 0x87, 0xe9, 0xce, 0x55, 0x28, 0xdf,
    0x8c, 0xa1, 0x89, 0x0d, 0xbf, 0xe6, 0x42, 0x68, 0x41, 0x99, 0x2d, 0x0f, 0xb0, 0x54, 0xbb, 0x16
]

INV_S_BOX = [0] * 256
for i, v in enumerate(S_BOX):
    INV_S_BOX[v] = i

RCON = [0x00, 0x01, 0x02, 0x04, 0x08, 0x10, 0x20, 0x40, 0x80, 0x1B, 0x36]

def xtime(a):
    return ((a << 1) ^ 0x1B) & 0xFF if a & 0x80 else (a << 1)

def gmul(a, b):
    r = 0
    for _ in range(8):
        if b & 1:
            r ^= a
        a = xtime(a)
        b >>= 1
    return r & 0xFF

def add_round_key(state, round_key):
    for i in range(16):
        state[i] ^= round_key[i]

def sub_bytes(state, inv=False):
    box = INV_S_BOX if inv else S_BOX
    for i in range(16):
        state[i] = box[state[i]]

def shift_rows(state, inv=False):  
    if inv:
        state[1], state[5], state[9], state[13] = state[13], state[1], state[5], state[9]
        state[2], state[6], state[10], state[14] = state[10], state[14], state[2], state[6]
        state[3], state[7], state[11], state[15] = state[7], state[11], state[15], state[3]
    else:
        state[1], state[5], state[9], state[13] = state[5], state[9], state[13], state[1]
        state[2], state[6], state[10], state[14] = state[10], state[14], state[2], state[6]
        state[3], state[7], state[11], state[15] = state[15], state[3], state[7], state[11]

def mix_columns(state, inv=False):
    for i in range(4):
        col = [state[i * 4 + j] for j in range(4)]
        
        if inv:
            state[i * 4] = gmul(col[0], 14) ^ gmul(col[1], 11) ^ gmul(col[2], 13) ^ gmul(col[3], 9)
            state[i * 4 + 1] = gmul(col[0], 9) ^ gmul(col[1], 14) ^ gmul(col[2], 11) ^ gmul(col[3], 13)
            state[i * 4 + 2] = gmul(col[0], 13) ^ gmul(col[1], 9) ^ gmul(col[2], 14) ^ gmul(col[3], 11)
            state[i * 4 + 3] = gmul(col[0], 11) ^ gmul(col[1], 13) ^ gmul(col[2], 9) ^ gmul(col[3], 14)
        else:
            state[i * 4] = gmul(col[0], 2) ^ gmul(col[1], 3) ^ col[2] ^ col[3]
            state[i * 4 + 1] = col[0] ^ gmul(col[1], 2) ^ gmul(col[2], 3) ^ col[3]
            state[i * 4 + 2] = col[0] ^ col[1] ^ gmul(col[2], 2) ^ gmul(col[3], 3)
            state[i * 4 + 3] = gmul(col[0], 3) ^ col[1] ^ col[2] ^ gmul(col[3], 2)

def key_expansion(key):
    key_len = len(key)
    Nk = key_len // 4 
    Nr = Nk + 6
    
    w = list(key)
    
    def sub_word(word):
        return [S_BOX[b] for b in word]
    
    def rot_word(word):
        return word[1:] + word[: 1]
    
    i = Nk
    while len(w) < 16 * (Nr + 1):
        temp = w[-4:]
        
        if i % Nk == 0:
            temp = sub_word(rot_word(temp))
            temp[0] ^= RCON[i // Nk]
        elif Nk > 6 and i % Nk == 4:
            temp = sub_word(temp)
        
        w.extend([w[-4 * Nk + j] ^ temp[j] for j in range(4)])
        i += 1
    
    return [w[i:i + 16] for i in range(0, len(w), 16)]

def aes_encrypt_block(block, round_keys):
    state = list(block)
    Nr = len(round_keys) - 1
    
    add_round_key(state, round_keys[0])
    
    for r in range(1, Nr):
        sub_bytes(state)
        shift_rows(state)
        mix_columns(state)
        add_round_key(state, round_keys[r])
    
    sub_bytes(state)
    shift_rows(state)
    add_round_key(state, round_keys[Nr])
    
    return bytes(state)

def aes_decrypt_block(block, round_keys):
    state = list(block)
    Nr = len(round_keys) - 1
    
    add_round_key(state, round_keys[Nr])
    
    for r in range(Nr - 1, 0, -1):
        shift_rows(state, inv=True)
        sub_bytes(state, inv=True)
        add_round_key(state, round_keys[r])
        mix_columns(state, inv=True)
    
    shift_rows(state, inv=True)
    sub_bytes(state, inv=True)
    add_round_key(state, round_keys[0])
    
    return bytes(state)

def pad(data):
    padding_len = 16 - (len(data) % 16)
    return data + bytes([padding_len] * padding_len)

def unpad(data):
    if len(data) == 0:
        raise ValueError("Cannot unpad empty data")
    
    padding_len = data[-1]
    
    if padding_len == 0 or padding_len > 16:
        raise ValueError(f"Invalid padding length: {padding_len}")
    
    if len(data) < padding_len:
        raise ValueError(f"Data too short for padding:  {len(data)} < {padding_len}")
    
    if data[-padding_len:] != bytes([padding_len] * padding_len):
        raise ValueError("Invalid padding")
    
    return data[:-padding_len]

def encrypt(plaintext, key, mode, iv=None):
    if len(key) not in (16, 24, 32):
        raise ValueError("Key must be 16, 24, or 32 bytes")
    
    round_keys = key_expansion(key)
    padded = pad(plaintext)
    ciphertext = b""
    
    if mode == "ECB":
        for i in range(0, len(padded), 16):
            block = padded[i:i + 16]
            ciphertext += aes_encrypt_block(block, round_keys)
        return ciphertext, None
    
    elif mode == "CBC":
        if iv is None:
            iv = os.urandom(16)
        if len(iv) != 16:
            raise ValueError("IV must be 16 bytes")
        
        prev = iv
        for i in range(0, len(padded), 16):
            block = padded[i:i + 16]
            # XOR with previous ciphertext (or IV)
            xored = bytes(a ^ b for a, b in zip(block, prev))
            encrypted = aes_encrypt_block(xored, round_keys)
            ciphertext += encrypted
            prev = encrypted
        
        return ciphertext, iv
    
    else:
        raise ValueError(f"Unsupported mode: {mode}")

def decrypt(ciphertext, key, mode, iv=None):
    if len(key) not in (16, 24, 32):
        raise ValueError("Key must be 16, 24, or 32 bytes")
    
    if len(ciphertext) % 16 != 0:
        raise ValueError("Ciphertext length must be a multiple of 16")
    
    if len(ciphertext) == 0:
        raise ValueError("Ciphertext cannot be empty")
    
    round_keys = key_expansion(key)
    plaintext = b""
    
    if mode == "ECB": 
        for i in range(0, len(ciphertext), 16):
            block = ciphertext[i:i + 16]
            plaintext += aes_decrypt_block(block, round_keys)
        return unpad(plaintext)
    
    elif mode == "CBC": 
        if iv is None:
            raise ValueError("IV required for CBC mode")
        if len(iv) != 16:
            raise ValueError("IV must be 16 bytes")
        
        prev = iv
        for i in range(0, len(ciphertext), 16):
            block = ciphertext[i: i + 16]
            decrypted = aes_decrypt_block(block, round_keys)
            plaintext += bytes(a ^ b for a, b in zip(decrypted, prev))
            prev = block
        
        return unpad(plaintext)
    
    else:
        raise ValueError(f"Unsupported mode: {mode}") 