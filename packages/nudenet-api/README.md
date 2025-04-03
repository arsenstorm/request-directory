# NudeNet API

This API is based on the work found
[here](https://github.com/notAI-team/NudeNet).

It’s designed to be used with Request Directory and you can find more details
[here](https://request.directory/nudenet)

## Development

```bash
uv run src/main.py
```

## Usage

By default, the API runs on port 7001.

```bash
docker run -it -p7001:7001 ghcr.io/arsenstorm/nudenet:latest
```

## API

To use the API, you need to send a POST request containing form data to the
`/infer` endpoint with the following parameters:

#### Parameters

- `image`: The image to detect nudity on.

#### Example Request

As an example, we’ll upload the unblurred version of this image:

<img src="../.github/nudenet/example_input_blurred.jpg" alt="example_input" style="max-width: 500px;">

```bash
curl -X POST http://localhost:7001/infer -F "image=@.github/nudenet/example_input.jpg"
```

> [!NOTE]
>
> In this example, the image was submitted unblurred. You can find the unblurred
> version [here](../.github/nudenet/example_input.jpg).

#### Example Response

We get the following response:

```json
{
  "censored_image": "/9j/4AAQSkZJRgABAQAAAQABAAD...", // shortened for brevity
  "labelled_image": "/9j/4AAQSkZJRgABAQAAAQABAAD...", // shortened for brevity
  "result": [
    {
      "box": [
        188,
        93,
        111,
        117
      ],
      "class": "FACE_FEMALE",
      "score": 0.8920598030090332
    },
    {
      "box": [
        249,
        311,
        108,
        117
      ],
      "class": "FEMALE_BREAST_EXPOSED",
      "score": 0.8745406866073608
    },
    {
      "box": [
        130,
        304,
        107,
        117
      ],
      "class": "FEMALE_BREAST_EXPOSED",
      "score": 0.8547856211662292
    },
    {
      "box": [
        174,
        438,
        168,
        189
      ],
      "class": "BELLY_EXPOSED",
      "score": 0.8226107358932495
    },
    {
      "box": [
        244,
        641,
        71,
        70
      ],
      "class": "FEMALE_GENITALIA_EXPOSED",
      "score": 0.791488528251648
    },
    {
      "box": [
        116,
        286,
        40,
        64
      ],
      "class": "ARMPITS_EXPOSED",
      "score": 0.7321463823318481
    }
  ],
  "success": true
}
```

In this response, we’ve received these details:

- `censored_image`: The censored version of the image.
- `labelled_image`: The labelled version of the image.
- `result`: The details of the detections.
- `success`: Whether the request was successful.

The images have not been included in this README, but you can view the unblurred
versions of the labelled and censored images
[here](../.github/nudenet/example_response_labelled.jpg) and
[here](../.github/nudenet/example_response_censored.jpg) respectively.

## Notes

- There appears to be some kind of bug with the 640M model, for now, it’s
  recommended to use the default model.
