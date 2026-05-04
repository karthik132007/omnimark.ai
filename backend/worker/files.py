import shutil
from fastapi import UploadFile


def save_upload_file(upload: UploadFile, destination: str) -> None:
    with open(destination, "wb") as out_file:
        shutil.copyfileobj(upload.file, out_file)
