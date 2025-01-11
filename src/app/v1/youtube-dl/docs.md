# YouTube Downloader API

YouTube Downloader is a simple API for downloading YouTube videos.

## Sending a request

To make a request, send a JSON body.

### Using JSON

Send a POST request to the `/v1/youtube-dl` endpoint with a JSON body containing the YouTube URL.

Sample request:

```json
{
  "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
}
```

### Response

Sample response:

```json
{
  "result": {
    "video_id": "dQw4w9WgXcQ",
    "thumbnails": {
      "max": "https://i.ytimg.com/vi/dQw4w9WgXcQ/maxresdefault.jpg",
      "high": "https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg",
      "medium": "https://i.ytimg.com/vi/dQw4w9WgXcQ/mqdefault.jpg",
      "standard": "https://i.ytimg.com/vi/dQw4w9WgXcQ/sddefault.jpg",
      "default": "https://i.ytimg.com/vi/dQw4w9WgXcQ/default.jpg"
    },
    "download_url": "https://cdn.request.directory/..."
  },
  "success": true
}
```
