import os
import shutil
import json

base_dir = r"d:\VScode\Python\Project\NLP2026\model"
train_dir = os.path.join(base_dir, "asl_alphabet_train")
demo_dir = os.path.join(base_dir, "demo")

os.makedirs(demo_dir, exist_ok=True)

classes = [d for d in os.listdir(train_dir) if os.path.isdir(os.path.join(train_dir, d))]

for cls in classes:
    cls_train_dir = os.path.join(train_dir, cls)
    cls_demo_dir = os.path.join(demo_dir, cls)
    os.makedirs(cls_demo_dir, exist_ok=True)
    
    files = [f for f in os.listdir(cls_train_dir) if f.lower().endswith(('.png', '.jpg', '.jpeg'))]
    if files:
        first_file = files[0]
        src_path = os.path.join(cls_train_dir, first_file)
        dst_path = os.path.join(cls_demo_dir, "demo_image.jpg")
        shutil.copy2(src_path, dst_path)

config_path = os.path.join(base_dir, "models_config.json")
with open(config_path, "r", encoding="utf-8") as f:
    config = json.load(f)

for item in config:
    item["word_image_url"] = "file:///d:/VScode/Python/Project/NLP2026/model/demo/{word}/demo_image.jpg"

with open(config_path, "w", encoding="utf-8") as f:
    json.dump(config, f, indent=2, ensure_ascii=False)

print("Done")
