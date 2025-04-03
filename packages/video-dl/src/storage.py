import boto3
from botocore.client import Config
import os
import math
from concurrent.futures import ThreadPoolExecutor

class R2Storage:
    def __init__(self):
        self.s3 = boto3.client('s3',
            endpoint_url=os.getenv('R2_ENDPOINT'),
            aws_access_key_id=os.getenv('R2_ACCESS_KEY'),
            aws_secret_access_key=os.getenv('R2_SECRET_KEY'),
            config=Config(signature_version='s3v4'),
            region_name='auto')
        self.bucket = os.getenv('R2_BUCKET_NAME')
        self.public_url = os.getenv('R2_PUBLIC_URL')

    def get_public_url(self, key):
        return f"{self.public_url}/{key}"

    def get_key(self, video_id, provider="video", file_type="mp4", quality=None):
        """
        Generate a storage key for the video or associated files.
        Includes quality in the key if specified.
        """
        if quality and file_type == "mp4":
            return f"{provider}/{video_id}-{quality}.{file_type}"
        else:
            return f"{provider}/{video_id}.{file_type}"

    def file_exists(self, key):
        try:
            self.s3.head_object(Bucket=self.bucket, Key=key)
            return True
        except self.s3.exceptions.ClientError:
            return False

    def upload_file(self, local_file, key):
        file_size = os.path.getsize(str(local_file))
        return self._upload_multipart(local_file, key) if file_size >= 100 * 1024 * 1024 else self._upload_single(local_file, key)

    def _upload_single(self, local_file, key):
        self.s3.upload_file(local_file, self.bucket, key)
        return self.get_public_url(key)

    def _upload_multipart(self, local_file, key):
        file_size = os.path.getsize(str(local_file))

        chunk_size = min(
            max(math.ceil(file_size / 10000), 10 * 1024 * 1024),
            100 * 1024 * 1024
        )

        multipart = self.s3.create_multipart_upload(
            Bucket=self.bucket,
            Key=key
        )

        parts = []
        threads = []
        with ThreadPoolExecutor(max_workers=10) as executor:
            with open(str(local_file), 'rb') as f:
                part_number = 1
                while True:
                    data = f.read(chunk_size)
                    if not data:
                        break

                    future = executor.submit(
                        self.s3.upload_part,
                        Bucket=self.bucket,
                        Key=key,
                        PartNumber=part_number,
                        UploadId=multipart['UploadId'],
                        Body=data
                    )
                    threads.append((part_number, future))
                    part_number += 1

        for part_number, future in threads:
            result = future.result()
            parts.append({
                'PartNumber': part_number,
                'ETag': result['ETag']
            })

        self.s3.complete_multipart_upload(
            Bucket=self.bucket,
            Key=key,
            UploadId=multipart['UploadId'],
            MultipartUpload={'Parts': sorted(parts, key=lambda x: x['PartNumber'])}
        )
        return self.get_public_url(key)
