import * as tf from "@tensorflow/tfjs";

let model: tf.LayersModel | null = null;

export async function loadModel() {
  if (!model) {
    model = await tf.loadLayersModel("/model/model.json");
    console.log("Model berhasil dimuat!");
  }

  return model;
}
