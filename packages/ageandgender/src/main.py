import os
import cv2
import base64
import numpy as np
from dotenv import load_dotenv
from flask import Flask, request, jsonify
load_dotenv()

DEBUG_MODE = os.getenv('AGEANDGENDER_DEBUG', 'false').lower() == 'true'
DIR = os.path.dirname(__file__)
FACE_PADDING = 20
AGES = ['(0-2)', '(4-6)', '(8-12)', '(15-20)',
        '(25-32)', '(38-43)', '(48-53)', '(60-100)']
GENDERS = ['Male', 'Female']

app = Flask(__name__)


def highlight_face(net, frame, conf_threshold=0.7):
    frame = frame.copy()
    height = frame.shape[0]
    width = frame.shape[1]
    blob = cv2.dnn.blobFromImage(frame, 1.0, (300, 300), [
                                 104, 117, 123], True, False)

    net.setInput(blob)
    detections = net.forward()
    faces = []
    for i in range(detections.shape[2]):
        confidence = detections[0, 0, i, 2]
        if confidence > conf_threshold:
            x1 = int(detections[0, 0, i, 3]*width)
            y1 = int(detections[0, 0, i, 4]*height)
            x2 = int(detections[0, 0, i, 5]*width)
            y2 = int(detections[0, 0, i, 6]*height)
            faces.append([x1, y1, x2, y2])
            cv2.rectangle(frame, (x1, y1), (x2, y2),
                          (0, 255, 0), 2)
    return frame, faces


def detect_age_gender(image):
    face_proto = f"{DIR}/models/opencv_face_detector.pbtxt"
    face_model = f"{DIR}/models/opencv_face_detector_uint8.pb"
    age_proto = f"{DIR}/models/age_deploy.prototxt"
    age_model = f"{DIR}/models/age_net.caffemodel"
    gender_proto = f"{DIR}/models/gender_deploy.prototxt"
    gender_model = f"{DIR}/models/gender_net.caffemodel"

    MODEL_MEAN_VALUES = (78.4263377603, 87.7689143744, 114.895847746)

    face_net = cv2.dnn.readNet(face_model, face_proto)
    age_net = cv2.dnn.readNet(age_model, age_proto)
    gender_net = cv2.dnn.readNet(gender_model, gender_proto)

    file_bytes = np.frombuffer(image.read(), np.uint8)
    frame = cv2.imdecode(file_bytes, cv2.IMREAD_COLOR)

    frame, faces = highlight_face(face_net, frame)

    result = []

    for face in faces:
        x1, y1, x2, y2 = face
        face_img = frame[max(0, y1-FACE_PADDING):
                         min(y2+FACE_PADDING, frame.shape[0]-1),
                         max(0, x1-FACE_PADDING):
                         min(x2+FACE_PADDING, frame.shape[1]-1)]

        blob = cv2.dnn.blobFromImage(
            face_img, 1.0, (227, 227), MODEL_MEAN_VALUES, swapRB=False)
        gender_net.setInput(blob)
        gender_preds = gender_net.forward()
        #print(gender_preds[0]) # [0.18877535 0.81122464]
        gender = GENDERS[int(gender_preds[0].argmax())]

        age_net.setInput(blob)
        age_preds = age_net.forward()
        # print(age_preds[0]) # [3.5946396e-05 2.8284523e-04 7.9400726e-02 6.2793056e-03 9.1232586e-01 3.0149089e-04 1.2374012e-03 1.3641208e-04]
        age = AGES[int(age_preds[0].argmax())]

        cv2.putText(frame, f'{gender}, {age}', (x1, y1 - 10),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 2)

        result.append({
            "gender": gender,
            "age": age,
            "bounds": {
                "x1": x1,
                "y1": y1,
                "x2": x2,
                "y2": y2
            }
        })

    image_bytes = cv2.imencode('.jpg', frame)[1].tobytes()
    image_base64 = base64.b64encode(image_bytes).decode('utf-8')

    return jsonify({
        "success": True,
        "faces": result,
        "image": image_base64
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

    try:
        return detect_age_gender(image)
    except Exception as e:
        return jsonify({
            "error": str(e),
            "success": False
        }), 500


if __name__ == '__main__':
    port = int(os.getenv('AGEANDGENDER_PORT', 7003))
    app.run(host='0.0.0.0', port=port, debug=DEBUG_MODE)
