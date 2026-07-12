import zipfile
import tensorflow as tf
import os
import shutil

zip_path = 'd:/NLP2026/models/packs/ASL_MobileNetV2_Final.zip'
extract_dir = 'd:/NLP2026/models/tmp_clean'
if os.path.exists(extract_dir):
    shutil.rmtree(extract_dir)
os.makedirs(extract_dir)

with zipfile.ZipFile(zip_path, 'r') as z:
    z.extract('assets/model.tflite', extract_dir)

interpreter = tf.lite.Interpreter(model_path=f'{extract_dir}/assets/model.tflite')
interpreter.allocate_tensors()
print("MobileNetV2 Final TFLite Input Shape:", interpreter.get_input_details()[0]['shape'])
print("MobileNetV2 Final TFLite Output Shape:", interpreter.get_output_details()[0]['shape'])
