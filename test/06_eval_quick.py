import os
import tensorflow as tf
import numpy as np
from sklearn.metrics import classification_report

os.environ['TF_CPP_MIN_LOG_LEVEL'] = '2'

models = [
    'models/model/asl_mobilenetv2_final.keras',
    'models/model/mobilenet_best.keras'
]

data_dir = 'asl_alphabet_train'

print("[*] Creating validation subset for detailed evaluation...")
dataset = tf.keras.utils.image_dataset_from_directory(
    data_dir,
    labels='inferred',
    label_mode='categorical',
    batch_size=64,
    image_size=(224, 224),
    shuffle=True,
    seed=42,
    validation_split=0.02, # ~1740 images for speed
    subset='validation'
)
class_names = dataset.class_names
dataset = dataset.map(lambda x, y: (x / 255.0, y))

for model_name in models:
    print("\n" + "="*50)
    print(f"Evaluating: {model_name}")
    print("="*50)
    try:
        model = tf.keras.models.load_model(model_name, compile=False)
        
        all_preds = []
        all_labels = []
        for x, y in dataset:
            preds = model.predict(x, verbose=0)
            all_preds.extend(np.argmax(preds, axis=1))
            all_labels.extend(np.argmax(y.numpy(), axis=1))
            
        acc = np.mean(np.array(all_preds) == np.array(all_labels))
        print(f"Accuracy: {acc*100:.2f}%\n")
        print("Classification Report:")
        print(classification_report(all_labels, all_preds, target_names=class_names, zero_division=0))
    except Exception as e:
        print(f"Error: {e}\n")
