import re

print("Masukkan PHP ENUM Anda (Ketik '/exit' lalu Enter untuk memproses):")
text = ""

while True:
    try:
        newText = input("")
        if newText.strip() == "/exit":
            break
        text += "\n" + newText
    except EOFError:
        break

class_match = re.search(r"enum\s+(\w+)", text)

if class_match:
    class_name = class_match.group(1)
    filename = f"{class_name}.txt"
else:
    filename = "result.txt"

matches = re.findall(r"case\s+(\w+)(?:\s*=\s*['\"]([^'\"]+)['\"])?", text)

result_lines = []

# 3. Logika Format Output
for key, value in matches:
    if value and value.lower() != key.lower():
        line = f"{value} -> {key}"
    else:
        line = key
    
    result_lines.append(line)

with open(filename, 'w') as f:
    for line in result_lines:
        f.write(line + '\n')
        print(line)

print(f"\nData berhasil disimpan ke: {filename}")