import zipfile

with zipfile.ZipFile('d:/NLP2026/model/packs/ASL_MobileNetV2_Final.zip', 'r') as z:
    print(z.namelist())
