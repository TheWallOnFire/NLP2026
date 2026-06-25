import tensorflow as tf

model = tf.keras.models.load_model('d:/NLP2026/model/asl_mobilenetv2_final.keras', compile=False)
last_layer = model.layers[-1]

print("Last layer name:", last_layer.name)
print("Last layer config:", last_layer.get_config())
