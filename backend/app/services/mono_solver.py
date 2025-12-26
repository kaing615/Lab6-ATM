import os
import math
import random
from collections import Counter

class MonoalphabeticAnalyzer:
    _mono = {}
    _bi = {}
    _tri = {}
    _quad = {}
    
    _mono_min = 0
    _bi_min = 0
    _tri_min = 0
    _quad_min = 0
    
    _language_model_loaded = False
    _english_frequency_order = "etaoinshrdlcumwfgypbvkjxqz"

    @staticmethod
    def initialize_language_models(folder_path=None):
        if MonoalphabeticAnalyzer._language_model_loaded:
            return

        if folder_path is None:
            current_file_path = os.path.abspath(__file__)
            services_dir = os.path.dirname(current_file_path)
            
            possible_paths = [
                os.path.join(services_dir, "..", "ngrams"),
                os.path.join(services_dir, "ngrams"),
                os.path.join(os.getcwd(), "ngrams"),
                os.path.join(os.getcwd(), "app", "ngrams"),
            ]
            
            folder_path = None
            for path in possible_paths:
                if os.path.exists(path):
                    folder_path = path
                    print(f"Found ngrams folder at: {folder_path}")
                    break
            
            if folder_path is None:
                print(f"WARNING: Could not find ngrams folder. Tried: {possible_paths}")
                MonoalphabeticAnalyzer._setup_minimal_fallback()
                return

        files = {
            'mono': "english_monograms.txt",
            'bi': "english_bigrams.txt",
            'tri': "english_trigrams.txt",
            'quad': "english_quadgrams.txt"
        }

        for key, filename in files.items():
            full_path = os.path.join(folder_path, filename)
            if not os.path.exists(full_path):
                print(f"WARNING: Could not find {full_path}")
                continue

            # Load file
            if key == 'mono':
                MonoalphabeticAnalyzer._mono, MonoalphabeticAnalyzer._mono_min = MonoalphabeticAnalyzer._load_ngram_file(full_path)
            elif key == 'bi':
                MonoalphabeticAnalyzer._bi, MonoalphabeticAnalyzer._bi_min = MonoalphabeticAnalyzer._load_ngram_file(full_path)
            elif key == 'tri':
                MonoalphabeticAnalyzer._tri, MonoalphabeticAnalyzer._tri_min = MonoalphabeticAnalyzer._load_ngram_file(full_path)
            elif key == 'quad':
                MonoalphabeticAnalyzer._quad, MonoalphabeticAnalyzer._quad_min = MonoalphabeticAnalyzer._load_ngram_file(full_path)

        if MonoalphabeticAnalyzer._mono:
            sorted_mono = sorted(MonoalphabeticAnalyzer._mono.items(), key=lambda item: item[1], reverse=True)
            MonoalphabeticAnalyzer._english_frequency_order = "".join([item[0] for item in sorted_mono])

        MonoalphabeticAnalyzer._language_model_loaded = True

    @staticmethod
    def _setup_minimal_fallback():
        print("Using minimal fallback frequency data")
        MonoalphabeticAnalyzer._english_frequency_order = "etaoinshrdlcumwfgypbvkjxqz"
        MonoalphabeticAnalyzer._language_model_loaded = True
        MonoalphabeticAnalyzer._mono_min = -10
        MonoalphabeticAnalyzer._bi_min = -10
        MonoalphabeticAnalyzer._tri_min = -10
        MonoalphabeticAnalyzer._quad_min = -10

    @staticmethod
    def _load_ngram_file(path):
        temp = []
        total_count = 0
        try:
            with open(path, 'r', encoding='utf-8') as f:
                for line in f:
                    parts = line.strip().split()
                    if len(parts) < 2: continue
                    gram = parts[0].lower()
                    try:
                        count = float(parts[1])
                        temp.append((gram, count))
                        total_count += count
                    except ValueError: continue
        except Exception:
            return {}, 0

        ngram_dict = {}
        min_score = float('inf')
        for gram, count in temp:
            log_prob = math.log10(count / total_count)
            ngram_dict[gram] = log_prob
            if log_prob < min_score: min_score = log_prob
        
        return ngram_dict, min_score - 1.0

    @staticmethod
    def filter_letters(text):
        return "".join([c.lower() for c in text if c.isalpha()])

    @staticmethod
    def compute_score(plaintext):
        s = MonoalphabeticAnalyzer.filter_letters(plaintext)
        if len(s) < 4: return -999999.0
        
        def score(dic, min_v, n):
            sc = 0
            cnt = 0
            for i in range(len(s) - n + 1):
                gram = s[i : i+n]
                sc += dic.get(gram, min_v)
                cnt += 1
            return sc / cnt if cnt > 0 else 0

        return (score(MonoalphabeticAnalyzer._quad, MonoalphabeticAnalyzer._quad_min, 4) * 1.0 +
                score(MonoalphabeticAnalyzer._tri, MonoalphabeticAnalyzer._tri_min, 3) * 0.5 +
                score(MonoalphabeticAnalyzer._bi, MonoalphabeticAnalyzer._bi_min, 2) * 0.2 +
                score(MonoalphabeticAnalyzer._mono, MonoalphabeticAnalyzer._mono_min, 1) * 0.1)

    @staticmethod
    def apply_mapping(ciphertext, key_list):
        result = []
        base_a = ord('a')
        for char in ciphertext:
            if 'a' <= char <= 'z':
                result.append(key_list[ord(char) - base_a])
            elif 'A' <= char <= 'Z':
                mapped = key_list[ord(char.lower()) - base_a]
                result.append(mapped.upper())
            else:
                result.append(char)
        return "".join(result)

    @staticmethod
    def build_initial_mapping_by_frequency(ciphertext):
        counts = Counter([c. lower() for c in ciphertext if c.isalpha()])
        sorted_cipher = [x[0] for x in counts.most_common()]
        
        all_chars = set("abcdefghijklmnopqrstuvwxyz")
        missing = list(all_chars - set(sorted_cipher))
        sorted_cipher.extend(missing)

        mapping = [''] * 26
        eng_order = MonoalphabeticAnalyzer._english_frequency_order
        used_plain = set()

        for i, c_char in enumerate(sorted_cipher):
            if not c_char.isalpha():
                continue
            c_char = c_char.lower()
            
            idx = ord(c_char) - ord('a')
            
            if idx < 0 or idx >= 26:
                continue
                
            if i < len(eng_order):
                p_char = eng_order[i]
            else:
                remain = list(all_chars - used_plain)
                p_char = remain[0] if remain else c_char
            
            mapping[idx] = p_char
            used_plain.add(p_char)
        
        for i in range(26):
            if mapping[i] == '':
                fallback = chr(ord('a') + i)
                if fallback not in used_plain: 
                    mapping[i] = fallback
                else:
                    for ch in all_chars:
                        if ch not in used_plain: 
                            mapping[i] = ch
                            used_plain.add(ch)
                            break
                    else:
                        mapping[i] = fallback
                
        return mapping

    @staticmethod
    def solve(ciphertext, restarts=30, iterations=4000):
        MonoalphabeticAnalyzer.initialize_language_models()
        best_key = None
        best_score = float('-inf')
        filtered = MonoalphabeticAnalyzer.filter_letters(ciphertext)

        for _ in range(restarts):
            key = MonoalphabeticAnalyzer.build_initial_mapping_by_frequency(ciphertext)
            for _ in range(15):
                a, b = random.randint(0, 25), random.randint(0, 25)
                key[a], key[b] = key[b], key[a]
            
            curr_score = MonoalphabeticAnalyzer.compute_score(MonoalphabeticAnalyzer.apply_mapping(filtered, key))

            for _ in range(iterations):
                next_key = key[:]
                a, b = random.randint(0, 25), random.randint(0, 25)
                while a == b: b = random.randint(0, 25)
                next_key[a], next_key[b] = next_key[b], next_key[a]
                
                next_score = MonoalphabeticAnalyzer.compute_score(MonoalphabeticAnalyzer.apply_mapping(filtered, next_key))
                if next_score > curr_score:
                    curr_score = next_score
                    key = next_key
            
            if curr_score > best_score:
                best_score = curr_score
                best_key = key[:]

        return best_key

    @staticmethod
    def get_letter_frequencies(ciphertext):
        """Trả về list dict cho frontend hiển thị bảng"""
        counts = Counter([c.lower() for c in ciphertext if c.isalpha()])
        total = sum(counts.values())
        
        stats = []
        for char_code in range(ord('a'), ord('z') + 1):
            char = chr(char_code)
            count = counts.get(char, 0)
            percent = (count / total * 100) if total > 0 else 0
            stats.append({
                "letter": char,
                "count": count,
                "frequency": f"{percent:.2f}%"
            })
        
        stats.sort(key=lambda x: x["count"], reverse=True)
        return stats