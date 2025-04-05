from pathlib import Path
import os
from dotenv import load_dotenv

load_dotenv()

PROJECT_ROOT = Path(os.path.dirname(os.path.abspath(__file__))).parent
DOWNLOAD_DIR = PROJECT_ROOT / 'downloads'
COOKIE_FILE = PROJECT_ROOT / 'cookies.txt'

DEBUG_MODE = os.getenv('VIDEODL_DEBUG', 'false').lower() == 'true'
PORT = int(os.getenv('VIDEODL_PORT', '7004'))

REQUIRED_ENV_VARS = ['R2_ENDPOINT', 'R2_ACCESS_KEY', 'R2_SECRET_KEY', 'R2_BUCKET_NAME', 'R2_PUBLIC_URL']

URL_PATTERNS = {
    "youtube": {
        "domains": ["youtube.com", "youtu.be", "m.youtube.com", "www.youtube.com"],
        "patterns": [
            r'(?:v=|\/v\/|\/embed\/|youtu\.be\/)([a-zA-Z0-9_-]{11})',
            r'(?:watch\?|&)v=([a-zA-Z0-9_-]{11})',
            r'(?:shorts\/)([a-zA-Z0-9_-]{11})',
        ]
    },
    "tiktok": {
        "domains": ["tiktok.com", "vm.tiktok.com", "vt.tiktok.com", "www.tiktok.com", "m.tiktok.com"],
        "patterns": [
            r'\/video\/(\d+)',
            r'vm\.tiktok\.com\/(\w+)',
            r'vt\.tiktok\.com\/(\w+)',
        ]
    }
}
