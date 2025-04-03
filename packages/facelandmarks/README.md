# Face Landmark Detection

This API is based on the work found
[here](https://github.com/midasklr/facelandmarks).

It’s designed to be used with Request Directory and you can find more details
[here](https://request.directory/facelandmarks)

## Development

```bash
uv run src/main.py
```

## Usage

By default, the API runs on port 7002.

```bash
docker run -it -p7002:7002 ghcr.io/arsenstorm/facelandmarks:latest
```

## API

To use the API, you need to send a POST request containing form data to the
`/infer` endpoint with the following parameters:

#### Parameters

- `image`: The image to detect landmarks on.

#### Example Request

As an example, we’ll upload this image:

<img src="../../.github/facelandmarks/example_input.jpg" alt="example_input" style="max-width: 500px;">

```bash
curl -X POST http://localhost:7002/infer -F "image=@.github/facelandmarks/example_input.jpg"
```

#### Example Response

We get the following response:

```json
{
  "bounds": {
    "x1": 339,
    "x2": 670,
    "y1": 188,
    "y2": 605
  },
  "confidence": 0.9646592140197754,
  "face": {
    "left_eye": {
      "x": 425,
      "y": 375
    },
    "left_mouth": {
      "x": 476,
      "y": 494
    },
    "nose": {
      "x": 518,
      "y": 412
    },
    "right_eye": {
      "x": 560,
      "y": 315
    },
    "right_mouth": {
      "x": 615,
      "y": 438
    }
  },
  "image": "/9j/4AAQSkZJRgA...", // shortened for brevity
  "landmarks": [
    {
      "x": 362,
      "y": 395
    },
    // ...
    {
      "x": 550,
      "y": 324
    }
  ],
  "success": true
}
```

A total of 98 landmarks are returned, alongside the face bounds and the
confidence of the detection.

The image is returned as a base64 encoded string, which can be decoded where
it’ll look like this:

<img src="../../.github/facelandmarks/example_output.jpg" alt="example_output" style="max-width: 500px;">

> [!TIP]
>
> You can test out the API using
> [Request Directory](https://request.directory/facelandmarks) without needing
> to run it locally.

## Notes

- Testing indicates that the API needs roughly 2GB of memory to run most
  optimally.
- When no API requests are running, the memory usage is roughly in the range of
  0.8-1.0GB.
