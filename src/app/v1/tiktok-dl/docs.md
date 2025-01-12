# TikTok Downloader API

TikTok Downloader is a simple API for downloading TikTok videos.

## Sending a request

To make a request, send a JSON body.

### Using JSON

Send a POST request to the `/v1/tiktok-dl` endpoint with a JSON body containing the TikTok URL.

Sample request:

```json
{
  "url": "https://www.tiktok.com/@tiktok/video/1234567890"
}
```

### Response

Sample response:

```json
{
  "video_id": "1234567890",
  "download_url": "https://cdn.request.directory/...",
  "expires_at": "2025-01-01T00:00:00Z",
  "success": true
}
```
