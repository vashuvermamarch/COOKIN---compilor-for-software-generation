import os

src_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "frontend", "src")
print(f"Scanning directory: {src_dir}")

fixed_count = 0
for root, dirs, files in os.walk(src_dir):
    for file in files:
        if file.endswith(".jsx") or file.endswith(".js"):
            path = os.path.join(root, file)
            with open(path, "r", encoding="utf-8") as f:
                content = f.read()
            
            # Replace class=" with className="
            if ' class="' in content:
                updated = content.replace(' class="', ' className="')
                with open(path, "w", encoding="utf-8") as f:
                    f.write(updated)
                print(f"Fixed classes in: {path}")
                fixed_count += 1

print(f"React class attributes migration finished. {fixed_count} files patched.")
