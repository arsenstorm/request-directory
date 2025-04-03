import os
import re
import uuid
import json
import logging
import requests
from pathlib import Path
import yt_dlp
from config import DOWNLOAD_DIR, URL_PATTERNS
from storage import R2Storage

logger = logging.getLogger(__name__)


class VideoService:
    def __init__(self, storage: R2Storage):
        self.storage = storage
        self.download_dir = DOWNLOAD_DIR

        # Define quality presets
        self.quality_presets = {
            'low': '480',
            'medium': '720',
            'high': '1080',
            'max': '2160'
        }

        # Format specifications for yt-dlp
        self.format_specs = {
            'low': 'bestvideo[height<=480]+bestaudio/best[height<=480]',
            'medium': 'bestvideo[height<=720]+bestaudio/best[height<=720]',
            'high': 'bestvideo[height<=1080]+bestaudio/best[height<=1080]',
            'max': 'bestvideo+bestaudio/best'
        }

    def _get_provider(self, url):
        """Determine the provider (youtube, tiktok, etc.) from the URL"""
        for provider, config in URL_PATTERNS.items():
            if any(domain in url for domain in config['domains']):
                return provider
        return "generic"

    def _extract_video_id(self, url, provider):
        """Extract the video ID from the URL based on provider patterns"""
        if provider in URL_PATTERNS:
            for pattern in URL_PATTERNS[provider]['patterns']:
                match = re.search(pattern, url)
                if match:
                    return match.group(1)

        # Fallback to UUID if no pattern matches or provider not found
        return str(uuid.uuid4())

    def _extract_minimal_info(self, info):
        """Extract minimal metadata from video info"""
        return {
            'id': info.get('id'),
            'title': info.get('title', ''),
            'description': info.get('description', ''),
            'thumbnail': info.get('thumbnail')
        }

    def _find_file_with_extensions(self, base_path, extensions):
        """Find a file with any of the given extensions"""
        for ext in extensions:
            path = f"{base_path}{ext}"
            if os.path.exists(path):
                return path
        return None

    def _cleanup_files(self, files):
        """Clean up temporary files"""
        for file_path in files:
            if file_path and os.path.exists(file_path):
                try:
                    os.remove(file_path)
                except Exception as e:
                    logger.warning(
                        f"Error cleaning up file {file_path}: {str(e)}")

    def get_available_formats(self, url):
        """List available formats for a video URL"""
        try:
            provider = self._get_provider(url)
            video_id = self._extract_video_id(url, provider)

            ydl_opts = {
                'quiet': True,
                'no_warnings': True,
                'skip_download': True,
                'writesubtitles': False,
                'writeinfojson': False,
            }

            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                info = ydl.extract_info(url, download=False)
                formats = info.get('formats', [])

                # Group formats by resolution
                resolution_groups = {
                    'low': {'formats': []},
                    'medium': {'formats': []},
                    'high': {'formats': []},
                    'max': {'formats': []}
                }

                for fmt in formats:
                    height = fmt.get('height')
                    if not height:
                        continue

                    if height <= 480:
                        resolution_groups['low']['formats'].append(fmt)
                    elif height <= 720:
                        resolution_groups['medium']['formats'].append(fmt)
                    elif height <= 1080:
                        resolution_groups['high']['formats'].append(fmt)
                    else:
                        resolution_groups['max']['formats'].append(fmt)

                available_formats = [
                    k for k, v in resolution_groups.items() if v['formats']]

                return {
                    'success': True,
                    'video_id': video_id,
                    'provider': provider,
                    'available_formats': available_formats,
                    'metadata': {
                        'id': info.get('id'),
                        'title': info.get('title', ''),
                        'thumbnail': info.get('thumbnail')
                    }
                }

        except Exception as e:
            logger.error(f"Error getting formats: {str(e)}", exc_info=True)
            return {'success': False, 'error': str(e)}

    def process_video(self, url, quality=None):
        """Download, process and store video with the given quality"""
        try:
            # If no quality is specified, just get metadata and subtitles
            if quality is None:
                return self.get_metadata_and_subtitles(url)

            provider = self._get_provider(url)
            video_id = self._extract_video_id(url, provider)

            # Check if video already exists in storage
            video_key = self.storage.get_key(
                video_id, provider, "mp4", quality)
            if self.storage.file_exists(video_key):
                logger.info(f"Video already exists in storage: {video_key}")

                # Get metadata and subtitle keys
                info_key = self.storage.get_key(video_id, provider, "json")
                subtitle_key = self.storage.get_key(video_id, provider, "vtt")

                # Get metadata
                metadata_url = self.storage.get_public_url(info_key)
                metadata_file = requests.get(metadata_url)
                metadata = json.loads(metadata_file.text)

                return {
                    'success': True,
                    'video_id': video_id,
                    'provider': provider,
                    'quality': quality,
                    'urls': {
                        'video': self.storage.get_public_url(video_key),
                        'info': metadata_url,
                        'subtitle': self.storage.get_public_url(subtitle_key) if self.storage.file_exists(subtitle_key) else None,
                    },
                    'metadata': metadata
                }

            # Prepare download directory
            os.makedirs(self.download_dir, exist_ok=True)
            temp_id = str(uuid.uuid4())
            output_path = Path(self.download_dir) / f"{temp_id}"

            # Configure download options based on quality
            format_spec = self.format_specs.get(
                quality, self.format_specs['medium'])

            ydl_opts = {
                'format': format_spec,
                'outtmpl': str(output_path) + '.%(ext)s',
                'writesubtitles': True,
                'writeautomaticsub': True,
                'subtitleslangs': ['en'],
                'subtitlesformat': 'vtt',
                'writeinfojson': False,
                'quiet': not logger.isEnabledFor(logging.DEBUG),
                'no_warnings': not logger.isEnabledFor(logging.DEBUG),
            }

            # Download the video
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                info = ydl.extract_info(url, download=True)
                downloaded_file = ydl.prepare_filename(info)

                # Find actual downloaded file
                if not os.path.exists(downloaded_file):
                    downloaded_file = self._find_file_with_extensions(
                        os.path.splitext(downloaded_file)[0],
                        ['.mp4', '.webm', '.mkv']
                    )

                # Find subtitle file
                subtitle_file = self._find_file_with_extensions(
                    os.path.splitext(downloaded_file)[0],
                    ['.en.vtt', '.vtt']
                )

                # Extract and save minimal metadata
                minimal_info = self._extract_minimal_info(info)
                minimal_info_file = f"{os.path.splitext(downloaded_file)[0]}.info.json"

                with open(minimal_info_file, 'w', encoding='utf-8') as f:
                    json.dump(minimal_info, f, ensure_ascii=False, indent=2)

                # Upload files to storage
                video_key = self.storage.get_key(
                    video_id, provider, "mp4", quality)
                video_url = self.storage.upload_file(
                    downloaded_file, video_key)

                info_key = self.storage.get_key(video_id, provider, "json")
                info_url = self.storage.upload_file(
                    minimal_info_file, info_key) if os.path.exists(minimal_info_file) else None

                subtitle_url = None
                if subtitle_file:
                    subtitle_key = self.storage.get_key(
                        video_id, provider, "vtt")
                    subtitle_url = self.storage.upload_file(
                        subtitle_file, subtitle_key)

                # Clean up
                self._cleanup_files(
                    [downloaded_file, subtitle_file, minimal_info_file])

                return {
                    'success': True,
                    'video_id': video_id,
                    'provider': provider,
                    'quality': quality,
                    'urls': {
                        'video': video_url,
                        'info': info_url,
                        'subtitle': subtitle_url,
                    },
                    'metadata': minimal_info
                }

        except Exception as e:
            logger.error(f"Error processing video: {str(e)}", exc_info=True)
            return {'success': False, 'error': str(e)}

    def get_metadata_and_subtitles(self, url):
        """Get metadata and subtitles for a video without downloading the video itself"""
        try:
            provider = self._get_provider(url)
            video_id = self._extract_video_id(url, provider)

            # Check if metadata already exists in storage
            info_key = self.storage.get_key(video_id, provider, "json")
            subtitle_key = self.storage.get_key(video_id, provider, "vtt")

            if self.storage.file_exists(info_key) and self.storage.file_exists(subtitle_key):
                info_url = self.storage.get_public_url(info_key)
                subtitle_url = self.storage.get_public_url(subtitle_key)

                # download the info file
                info_file = requests.get(info_url)
                info = json.loads(info_file.text)

                return {
                    'success': True,
                    'video_id': video_id,
                    'provider': provider,
                    'urls': {
                        'info': info_url,
                        'subtitle': subtitle_url,
                    },
                    'metadata': info
                }

            # Prepare download directory
            os.makedirs(self.download_dir, exist_ok=True)
            temp_id = str(uuid.uuid4())
            output_path = Path(self.download_dir) / f"{temp_id}"

            # Configure download options
            ydl_opts = {
                'skip_download': True,
                'writesubtitles': True,
                'writeautomaticsub': True,
                'subtitleslangs': ['en'],
                'subtitlesformat': 'vtt',
                'writeinfojson': False,
                'outtmpl': str(output_path) + '.%(ext)s',
                'quiet': not logger.isEnabledFor(logging.DEBUG),
                'no_warnings': not logger.isEnabledFor(logging.DEBUG),
            }

            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                info = ydl.extract_info(url, download=False)
                dummy_filename = ydl.prepare_filename(info)
                base_filename = os.path.splitext(dummy_filename)[0]

                # Extract subtitles
                ydl.process_info(info)

                # Find subtitle file
                subtitle_file = self._find_file_with_extensions(
                    base_filename, ['.en.vtt', '.vtt'])

                # Extract and save minimal metadata
                minimal_info = self._extract_minimal_info(info)
                minimal_info_file = f"{base_filename}.info.json"

                with open(minimal_info_file, 'w', encoding='utf-8') as f:
                    json.dump(minimal_info, f, ensure_ascii=False, indent=2)

                # Upload files to storage
                info_url = self.storage.upload_file(
                    minimal_info_file, info_key) if os.path.exists(minimal_info_file) else None

                subtitle_url = None
                if subtitle_file:
                    subtitle_url = self.storage.upload_file(
                        subtitle_file, subtitle_key)

                # Clean up
                self._cleanup_files([subtitle_file, minimal_info_file])

                return {
                    'success': True,
                    'video_id': video_id,
                    'provider': provider,
                    'urls': {
                        'info': info_url,
                        'subtitle': subtitle_url,
                    },
                    'metadata': minimal_info
                }

        except Exception as e:
            logger.error(f"Error getting metadata: {str(e)}", exc_info=True)
            return {'success': False, 'error': str(e)}
