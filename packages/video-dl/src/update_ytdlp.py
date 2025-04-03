#!/usr/bin/env python3
import subprocess
import time
import logging
import sys
import importlib

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[logging.StreamHandler(sys.stdout)]
)
logger = logging.getLogger('yt-dlp-updater')

def check_for_updates():
    """Check for yt-dlp updates and install if available"""
    try:
        logger.info("Checking for yt-dlp updates...")
        # Use subprocess to call pip/uv to check for updates
        result = subprocess.run(
            ["uv", "pip", "install", "-U", "--pre", "yt-dlp"],
            capture_output=True,
            text=True,
            check=False
        )
        
        if result.returncode == 0:
            if "already satisfied" in result.stdout:
                logger.info("yt-dlp is already up-to-date")
            else:
                logger.info("yt-dlp has been updated: %s", result.stdout.strip())
                # Try to reload yt-dlp module if it's already imported
                if 'yt_dlp' in sys.modules:
                    try:
                        logger.info("Reloading yt_dlp module...")
                        importlib.reload(sys.modules['yt_dlp'])
                        logger.info("yt_dlp module successfully reloaded")
                    except Exception as e:
                        logger.warning(f"Could not reload yt_dlp module: {str(e)}")
                        logger.info("New instances will use the updated version")
        else:
            logger.error("Error updating yt-dlp: %s", result.stderr.strip())
            
    except Exception as e:
        logger.error("Exception during update check: %s", str(e))


def main():
    """Main function to periodically check for updates"""
    logger.info("Starting yt-dlp update checker")
    
    # Update interval in seconds (15 minutes = 900 seconds)
    update_interval = 900
    
    while True:
        check_for_updates()
        logger.info(f"Next check in {update_interval//60} minutes")
        time.sleep(update_interval)


if __name__ == "__main__":
    main() 