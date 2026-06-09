import os
import json
import io
from datetime import datetime
from pathlib import Path
from typing import Dict, Any, List, Optional, BinaryIO
from loguru import logger

PROJECT_ROOT = Path(__file__).parent.parent
IMAGES_DIR = PROJECT_ROOT / "images"
METADATA_FILE = PROJECT_ROOT / "image_metadata.json"
METADATA_KEY = "image_metadata.json"


class Storage:
    def save_image(self, key: str, data: bytes) -> None: ...

    def get_image(self, key: str) -> Optional[bytes]: ...

    def delete_image(self, key: str) -> None: ...

    def list_images(self) -> List[str]: ...

    def save_metadata(self, data: Dict[str, Any]) -> None: ...

    def load_metadata(self) -> Dict[str, Any]: ...

    def health_check(self) -> dict: ...


class LocalStorage(Storage):
    def __init__(self):
        IMAGES_DIR.mkdir(exist_ok=True)

    def save_image(self, key: str, data: bytes) -> None:
        path = IMAGES_DIR / key
        path.write_bytes(data)

    def get_image(self, key: str) -> Optional[bytes]:
        path = IMAGES_DIR / key
        if not path.exists():
            return None
        return path.read_bytes()

    def delete_image(self, key: str) -> None:
        path = IMAGES_DIR / key
        if path.exists():
            path.unlink()

    def list_images(self) -> List[str]:
        valid = {'.png', '.jpg', '.jpeg', '.webp'}
        return [
            f.name for f in IMAGES_DIR.iterdir()
            if f.is_file() and f.suffix.lower() in valid
        ]

    def save_metadata(self, data: Dict[str, Any]) -> None:
        with open(METADATA_FILE, 'w') as f:
            json.dump(data, f, indent=2)

    def load_metadata(self) -> Dict[str, Any]:
        try:
            with open(METADATA_FILE) as f:
                return json.load(f)
        except FileNotFoundError:
            return {}

    def health_check(self) -> dict:
        return {
            "storage": "local",
            "healthy": True,
            "detail": None,
        }


class R2Storage(Storage):
    def __init__(self):
        import boto3
        self.bucket = os.environ["R2_BUCKET"]
        self.client = boto3.client(
            service_name="s3",
            endpoint_url=os.environ["R2_ENDPOINT"],
            aws_access_key_id=os.environ["R2_ACCESS_KEY"],
            aws_secret_access_key=os.environ["R2_SECRET_KEY"],
            region_name="auto",
        )

    def _image_key(self, filename: str) -> str:
        return f"images/{filename}"

    def _r2_call(self, method, *args, **kwargs):
        try:
            return method(*args, **kwargs)
        except Exception as e:
            logger.error(f"R2 {method.__name__} error: {e}")
            return None

    def save_image(self, key: str, data: bytes) -> None:
        self._r2_call(self.client.put_object,
            Bucket=self.bucket,
            Key=self._image_key(key),
            Body=data,
            ContentType="image/png",
        )

    def get_image(self, key: str) -> Optional[bytes]:
        resp = self._r2_call(self.client.get_object,
            Bucket=self.bucket, Key=self._image_key(key)
        )
        if resp is None:
            return None
        return resp["Body"].read()

    def delete_image(self, key: str) -> None:
        self._r2_call(self.client.delete_object,
            Bucket=self.bucket, Key=self._image_key(key)
        )

    def list_images(self) -> List[str]:
        resp = self._r2_call(self.client.list_objects_v2,
            Bucket=self.bucket, Prefix="images/",
        )
        if resp is None:
            return []
        return [
            obj["Key"][len("images/"):]
            for obj in resp.get("Contents", [])
            if obj["Key"][len("images/"):]
        ]

    def save_metadata(self, data: Dict[str, Any]) -> None:
        body = json.dumps(data, indent=2).encode()
        self._r2_call(self.client.put_object,
            Bucket=self.bucket,
            Key=METADATA_KEY,
            Body=body,
            ContentType="application/json",
        )

    def load_metadata(self) -> Dict[str, Any]:
        resp = self._r2_call(self.client.get_object,
            Bucket=self.bucket, Key=METADATA_KEY
        )
        if resp is None:
            return {}
        try:
            return json.loads(resp["Body"].read())
        except Exception as e:
            logger.error(f"R2 load_metadata parse error: {e}")
            return {}

    def health_check(self) -> dict:
        try:
            self.client.head_bucket(Bucket=self.bucket)
            return {
                "storage": "r2",
                "healthy": True,
                "detail": None,
            }
        except Exception as e:
            return {
                "storage": "r2",
                "healthy": False,
                "detail": str(e),
            }


def create_storage() -> Storage:
    has_r2 = all(k in os.environ for k in (
        "R2_BUCKET", "R2_ACCESS_KEY", "R2_SECRET_KEY", "R2_ENDPOINT"
    ))
    if has_r2:
        logger.info("Using R2 storage")
        return R2Storage()
    logger.info("Using local filesystem storage")
    return LocalStorage()
