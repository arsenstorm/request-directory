# Video DL API

This API is based on the work found
[here](https://github.com/ytdl-org/youtube-dl).

It’s designed to be used with Request Directory and you can find more details
[here](https://request.directory/video-dl).

## Development

```bash
uv run src/main.py
```

## Usage

By default, the API runs on port 7005.

```bash
docker run -it -p7005:7005 ghcr.io/arsenstorm/video-dl:latest
```

## API

To use the API, you need to send a POST request containing JSON data to the
`/download` endpoint with the following parameters:

#### Parameters

- `url`: The URL of the video to download.

#### Example Request

As an example, we’ll use the following URL:

```bash
curl -X POST http://localhost:7005/download -H "Content-Type: application/json" -d '{"url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ", "format": "medium"}'
```

#### Example Response

We get the following response:

```json
{
  "metadata": {
    "id": "dQw4w9WgXcQ",
    "title": "Rick Astley - Never Gonna Give You Up (Official Music Video)",
    "description": "The official video for “Never Gonna Give You Up” by Rick Astley...",
    "thumbnail": "https://i.ytimg.com/vi_webp/dQw4w9WgXcQ/maxresdefault.webp"
  },
  "provider": "youtube",
  "quality": "medium",
  "success": true,
  "urls": {
    "info": "https://cdn.request.directory/youtube/dQw4w9WgXcQ.json",
    "subtitle": "https://cdn.request.directory/youtube/dQw4w9WgXcQ.vtt",
    "video": "https://cdn.request.directory/youtube/dQw4w9WgXcQ-medium.mp4"
  },
  "video_id": "dQw4w9WgXcQ"
}
```

In this response, we’ve received these details:

- `metadata`: The metadata of the video.
- `provider`: The provider of the video.
- `quality`: The quality of the video.
- `success`: Whether the request was successful.
- `urls`: The URLs of the video, info, and subtitles.
- `video_id`: The ID of the video.

## Notes

- You’ll need to export your cookies to host this API as Google actively blocks
  requests is suspects of scraping.
