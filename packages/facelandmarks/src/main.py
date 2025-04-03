import io
import os
import cv2
import torch
import base64
import numpy as np
from PIL import Image
from dotenv import load_dotenv
from torchvision import transforms
from faceland import FaceLanndInference
from hdface.hdface import hdface_detector
from flask import Flask, request, jsonify

load_dotenv()

DEBUG_MODE = os.getenv('FACELANDMARKS_DEBUG', 'false').lower() == 'true'

app = Flask(__name__)


def detect_landmarks(image):
    """This function detects face landmarks on an image."""
    det = hdface_detector(use_cuda=False)
    checkpoint = torch.load(f'{os.path.dirname(__file__)}/faceland.pth', map_location=torch.device('cpu'), weights_only=True)

    plfd_backbone = FaceLanndInference()
    plfd_backbone.load_state_dict(checkpoint)
    plfd_backbone.eval()
    transform = transforms.Compose([transforms.ToTensor()])

    image = Image.open(io.BytesIO(image.read()))
    image = cv2.cvtColor(np.array(image), cv2.COLOR_RGB2BGR)

    if image is not None:
        height, width = image.shape[:2]
        img_det = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        # this takes EXTREMELY long on macOS, but roughly 4 seconds on Windows
        # if it’s like this in a Docker container, I‘ll probably fork and rewrite hdface
        result = det.detect_face(img_det)
        for i in range(len(result)):
            box = result[i]['box']
            cls = result[i]['cls']
            pts = result[i]['pts']

            points = {
                "left_eye": {"x": pts["leye"][0], "y": pts["leye"][1]},
                "left_mouth": {"x": pts["lmouse"][0], "y": pts["lmouse"][1]},
                "nose": {"x": pts["nose"][0], "y": pts["nose"][1]},
                "right_eye": {"x": pts["reye"][0], "y": pts["reye"][1]},
                "right_mouth": {"x": pts["rmouse"][0], "y": pts["rmouse"][1]}
            }

            bounds = {
                "x1": box[0],
                "y1": box[1],
                "x2": box[2],
                "y2": box[3]
            }

            try:
                confidence = cls.tolist()[0] or "unknown"
            except (IndexError, AttributeError):
                confidence = "unknown"

            # Calculate the box dimensions and center as before
            x1, y1, x2, y2 = box

            w = x2 - x1 + 1
            h = y2 - y1 + 1

            size_w = int(max([w, h]) * 0.8)
            size_h = int(max([w, h]) * 0.8)
            cx = x1 + w // 2
            cy = y1 + h // 2
            x1 = cx - size_w // 2
            x2 = x1 + size_w
            y1 = cy - int(size_h * 0.4)
            y2 = y1 + size_h

            # Clip the coordinates to ensure they stay within the image boundaries
            x1 = max(0, int(x1))
            y1 = max(0, int(y1))
            x2 = min(width, int(x2))
            y2 = min(height, int(y2))

            # Create the bounding box on the original image
            cv2.rectangle(image, (x1, y1), (x2, y2), (0, 255, 0))

            # Prepare the cropped version for landmark detection, but the landmarks will be mapped back to the full image
            cropped = image[y1:y2, x1:x2]
            cropped = cv2.resize(cropped, (112, 112))

            image_input = cv2.resize(cropped, (112, 112))
            image_input = cv2.cvtColor(image_input, cv2.COLOR_BGR2RGB)
            image_input = transform(image_input).unsqueeze(0)
            landmarks = plfd_backbone(image_input)

            # Get the landmark positions in the cropped space
            pre_landmark = landmarks[0]
            pre_landmark = pre_landmark.cpu().detach(
            ).numpy().reshape(-1, 2) * [size_w, size_h]

            # Map the landmarks back to the original image coordinates
            for (x, y) in pre_landmark.astype(np.int32):
                absolute_x = x1 + x  # Adjust x relative to the whole image
                absolute_y = y1 + y  # Adjust y relative to the whole image
                cv2.circle(image, (absolute_x, absolute_y),
                           2, (255, 0, 255), 2)

            # Return the original image landmarks relative to the whole image
            landmarks_full_image = [
                {"x": int(x1 + x), "y": int(y1 + y)} for (x, y) in pre_landmark]

            # Return the image with landmarks in base64
            _, buffer = cv2.imencode('.jpg', image)
            image_base64 = base64.b64encode(buffer).decode('utf-8')

            return jsonify({
                "bounds": bounds,
                "confidence": confidence,
                "face": points,
                "landmarks": landmarks_full_image,
                "image": image_base64,
                "success": True
            }), 200
    else:
        return jsonify({"error": "The file you have uploaded is invalid.", "success": False}), 400


@app.route('/infer', methods=['POST'])
def infer():
    if 'image' not in request.files:
        return jsonify({"error": "You haven’t included an image in the `image` parameter.", "success": False}), 400

    image = request.files['image']

    if image.filename == '':
        return jsonify({"error": "The file you have uploaded is invalid.", "success": False}), 400

    try:
        return detect_landmarks(image)
    except Exception as e:
        return jsonify({"error": str(e), "success": False}), 500


if __name__ == '__main__':
    port = int(os.getenv('FACELANDMARKS_PORT', 7002))
    app.run(host='0.0.0.0', port=port, debug=DEBUG_MODE)
