from flask import Flask, request, jsonify
from config import DEBUG_MODE, PORT, REQUIRED_ENV_VARS, DOWNLOAD_DIR
from storage import R2Storage
from video_service import VideoService
import os
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO if DEBUG_MODE else logging.WARNING,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Validate environment variables
missing_vars = [var for var in REQUIRED_ENV_VARS if not os.getenv(var)]
if missing_vars:
    raise ValueError(
        f"Missing required environment variables: {', '.join(missing_vars)}")

# Ensure download directory exists
DOWNLOAD_DIR.mkdir(exist_ok=True)

app = Flask(__name__)
storage = R2Storage()
video_service = VideoService(storage)


@app.route('/download', methods=['POST'])
def download():
    data = request.get_json()
    if not data or 'url' not in data:
        logger.warning("Request received without URL")
        return jsonify({"error": "No URL provided.", "success": False}), 400

    format_quality = data.get('format')

    # If format is not specified, we'll just get metadata and subtitles
    if format_quality is None:
        try:
            logger.info(f"Processing metadata from URL: {data['url']}")
            result = video_service.process_video(data['url'])
            logger.info(
                f"Successfully processed metadata: {result.get('video_id')}")
            return jsonify(result)
        except Exception as e:
            logger.error(f"Error processing metadata: {str(e)}", exc_info=True)
            return jsonify({"error": "Failed to process metadata.", "success": False}), 500

    valid_formats = ['low', 'medium', 'high', 'max']

    if format_quality not in valid_formats:
        logger.warning(f"Invalid format requested: {format_quality}")
        return jsonify({
            "error": f"Invalid format: {format_quality}. Valid options are: {', '.join(valid_formats)}",
            "success": False
        }), 400

    try:
        logger.info(
            f"Processing video from URL: {data['url']} with format: {format_quality}")
        result = video_service.process_video(data['url'], format_quality)
        logger.info(f"Successfully processed video: {result.get('video_id')}")
        return jsonify(result)
    except Exception as e:
        logger.error(f"Error processing video: {str(e)}", exc_info=True)
        return jsonify({"error": "Failed to process the video.", "success": False}), 500


@app.route('/list', methods=['POST'])
def list_formats():
    data = request.get_json()
    if not data or 'url' not in data:
        logger.warning("Request received without URL")
        return jsonify({"error": "No URL provided.", "success": False}), 400

    try:
        logger.info(f"Listing formats for URL: {data['url']}")
        result = video_service.get_available_formats(data['url'])
        return jsonify(result)
    except Exception as e:
        logger.error(f"Error listing formats: {str(e)}", exc_info=True)
        return jsonify({"error": "Failed to list formats.", "success": False}), 500


@app.route('/health', methods=['GET'])
def health():
    return jsonify({
        "success": True,
        "message": "OK"
    }), 200


if __name__ == '__main__':
    logger.info(f"Starting Video-DL service on port {PORT}")
    app.run(host='0.0.0.0', port=PORT, debug=DEBUG_MODE)
