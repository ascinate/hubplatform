import os
from django.core.exceptions import ValidationError

ALLOWED_EXTENSIONS = {
    'pdf', 'png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp',
    'xlsx', 'xls', 'csv',
    'docx', 'doc',
    'pptx', 'ppt',
    'zip', 'rar',
}

MAX_FILE_SIZE = 50 * 1024 * 1024  # 50 MB


def validate_file_extension(file):
    ext = os.path.splitext(file.name)[1].lower().lstrip('.')
    if ext not in ALLOWED_EXTENSIONS:
        raise ValidationError(
            f'File type .{ext} is not allowed. Allowed: {", ".join(sorted(ALLOWED_EXTENSIONS))}'
        )
    return ext


def validate_file_size(file):
    if file.size > MAX_FILE_SIZE:
        max_mb = MAX_FILE_SIZE // (1024 * 1024)
        file_mb = round(file.size / (1024 * 1024), 1)
        raise ValidationError(
            f'File size {file_mb} MB exceeds maximum of {max_mb} MB.'
        )


def get_mime_type(file):
    try:
        import magic
        file.seek(0)
        mime = magic.from_buffer(file.read(2048), mime=True)
        file.seek(0)
        return mime
    except (ImportError, Exception):
        return ''
