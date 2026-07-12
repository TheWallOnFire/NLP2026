import zipfile
import tensorflow as tf
import numpy as np
import cv2

# Extract tflite model
with zipfile.ZipFile('d:/NLP2026/models/packs/ASL_MobileNetV2_Final.zip', 'r') as z:
    z.extract('assets/model.tflite', 'd:/NLP2026/models/tmp')

interpreter = tf.lite.Interpreter(model_path='d:/NLP2026/models/tmp/assets/model.tflite')
interpreter.allocate_tensors()
input_details = interpreter.get_input_details()
output_details = interpreter.get_output_details()

# Load real image
img_path = 'd:/NLP2026/models/demo/A/demo_image.jpg'
img = cv2.imread(img_path)
img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
img = cv2.resize(img, (96, 96))
img_array = np.expand_dims(img, axis=0).astype(np.float32) / 255.0

print(f"Input shape: {img_array.shape}, dtype: {img_array.dtype}")
print(f"Input sum: {np.sum(img_array)}")

# Run inference
interpreter.set_tensor(input_details[0]['index'], img_array)
interpreter.invoke()
output_data = interpreter.get_tensor(output_details[0]['index'])

print("Output shape:", output_data.shape)
max_idx = np.argmax(output_data)
max_val = output_data[0][max_idx]
print(f"Max Idx: {max_idx}, Max Val: {max_val:.4f}")
print("Output array:", output_data)
