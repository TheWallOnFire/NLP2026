import os
import tensorflow as tf
import numpy as np
from sklearn.metrics import classification_report
import cv2

os.environ['TF_CPP_MIN_LOG_LEVEL'] = '2'

data_dir = 'asl_alphabet_train'
tflite_path = 'mobilenet_best.tflite'

print("[*] Creating validation subset for detailed evaluation...")
dataset = tf.keras.utils.image_dataset_from_directory(
    data_dir,
    labels='inferred',
    label_mode='categorical',
    batch_size=1,
    image_size=(96, 96), # mobilenetv2 is 96x96
    shuffle=True,
    seed=42,
    validation_split=0.02, # ~1740 images
    subset='validation'
)
class_names = dataset.class_names

print(f"\n==================================================")
print(f"Evaluating TFLite: {tflite_path}")
print(f"==================================================")

interpreter = tf.lite.Interpreter(model_path=tflite_path)
interpreter.allocate_tensors()
input_details = interpreter.get_input_details()
output_details = interpreter.get_output_details()

all_preds = []
all_labels = []

count = 0
for x, y in dataset:
    # x is shape (1, 96, 96, 3), float32 but scale is 0-255
    img_array = (x.numpy() / 255.0).astype(np.float32)
    
    interpreter.set_tensor(input_details[0]['index'], img_array)
    interpreter.invoke()
    output_data = interpreter.get_tensor(output_details[0]['index'])
    
    all_preds.append(np.argmax(output_data))
    all_labels.append(np.argmax(y.numpy()[0]))
    count += 1
    if count % 100 == 0:
        print(f"Processed {count} images...")

acc = np.mean(np.array(all_preds) == np.array(all_labels))
print(f"\nAccuracy: {acc*100:.2f}%")
print("Classification Report:")
print(classification_report(all_labels, all_preds, target_names=class_names, zero_division=0))
