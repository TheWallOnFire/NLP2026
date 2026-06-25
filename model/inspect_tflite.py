import zipfile
import tensorflow as tf

with zipfile.ZipFile('d:/NLP2026/model/packs/ASL_MobileNetV2_Final.zip', 'r') as z:
    z.extract('assets/model.tflite', 'd:/NLP2026/model/tmp')

interpreter = tf.lite.Interpreter(model_path='d:/NLP2026/model/tmp/assets/model.tflite')
interpreter.allocate_tensors()
input_details = interpreter.get_input_details()
output_details = interpreter.get_output_details()

print("Input details:")
for det in input_details:
    print(det['shape'], det['dtype'])

import numpy as np

input_data = np.ones((1, 224, 224, 3), dtype=np.float32)
interpreter.set_tensor(input_details[0]['index'], input_data)
interpreter.invoke()
output_data = interpreter.get_tensor(output_details[0]['index'])

print("Zero input output max value:", np.max(output_data))
print("Zero input output max index:", np.argmax(output_data))
print("Output:", output_data)
