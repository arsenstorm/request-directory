import os
import cv2
import base64
import numpy as np
from dotenv import load_dotenv
from nudenet import NudeDetector
from flask import Flask, request, jsonify


load_dotenv()

DEBUG_MODE = os.getenv('NUDENET_DEBUG', 'false').lower() == 'true'
USE_640M_WEIGHTS = os.getenv('NUDENET_USE_640M', 'false').lower() == 'true'

app = Flask(__name__)

default_options_to_censor = {
    "FEMALE_GENITALIA_COVERED": True,
    "FEMALE_GENITALIA_EXPOSED": True,
    "BUTTOCKS_EXPOSED": True,
    "FEMALE_BREAST_EXPOSED": True,
    "MALE_GENITALIA_EXPOSED": True,
    "ANUS_EXPOSED": True,
}


def censor_image(image, detections, options):
    """Applies censoring to the image based on the provided detection boxes."""
    for detection in detections:
        label = detection['class']
        confidence = detection['score']
        x, y, w, h = detection['box']

        if options.get(label, False) and confidence >= options.get('threshold', 0.5):
            cv2.rectangle(image, (x, y), (x + w, y + h), (0, 0, 0), -1)

    return image


def label_image(image, detections):
    """Labels the image based on the provided detection boxes."""
    for detection in detections:
        x, y, w, h = detection['box']
        confidence = detection['score']
        label = detection['class']

        cv2.rectangle(image, (x, y), (x + w, y + h), (0, 255, 0), 2)
        cv2.putText(image, f'{label}: {confidence:.2f}',
                    (x, y - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 2)

    return image


def detect_nudity(image, options):
    """This function detects nudity in an image and returns a censored version of the image."""
    if USE_640M_WEIGHTS:
        # print what's in the current directory
        print(os.listdir())

        detector = NudeDetector(model_path='./640m.onnx',
                                inference_resolution=640)
    else:
        detector = NudeDetector()

    image_bytes = image.read()
    image_array = cv2.imdecode(np.frombuffer(image_bytes, np.uint8), -1)

    detections = detector.detect(image_array)

    # Censor & label the image based on options
    labelled_image = label_image(image_array.copy(), detections)
    censored_image = censor_image(image_array.copy(), detections, options)

    # Convert images to base64 for response
    labelled_image_bytes = cv2.imencode('.jpg', labelled_image)[1].tobytes()
    censored_image_bytes = cv2.imencode('.jpg', censored_image)[1].tobytes()

    labelled_image_base64 = base64.b64encode(
        labelled_image_bytes).decode('utf-8')
    censored_image_base64 = base64.b64encode(
        censored_image_bytes).decode('utf-8')

    return jsonify({
        "success": True,
        "result": detections,
        "labelled_image": labelled_image_base64,
        "censored_image": censored_image_base64
    }), 200


@app.route('/infer', methods=['POST'])
def infer():
    if 'image' not in request.files:
        return jsonify({
            "error": "You haven’t included an image in the `image` parameter.",
            "success": False
        }), 400

    image = request.files['image']

    if image.filename == '':
        return jsonify({
            "error": "The file you have uploaded is invalid.",
            "success": False
        }), 400

    options = request.form.to_dict()

    for key in default_options_to_censor:
        options[key] = options.get(
            key, str(default_options_to_censor[key])).lower() == 'true'

    try:
        return detect_nudity(image, options)
    except Exception as e:
        return jsonify({
            "error": str(e),
            "success": False
        }), 500


if __name__ == '__main__':
    port = int(os.getenv('NUDENET_PORT', 7001))
    app.run(host='0.0.0.0', port=port, debug=DEBUG_MODE)
