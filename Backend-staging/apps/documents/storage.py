"""
Cloudflare R2 storage backend for DMS Phase 3.
S3-compatible API via boto3. Falls back to local filesystem if R2 not configured.
"""

import logging
import uuid
from datetime import timedelta

import boto3
from botocore.config import Config as BotoConfig
from botocore.exceptions import ClientError
from django.conf import settings

logger = logging.getLogger(__name__)


def is_r2_configured():
    """Check if R2 environment variables are set."""
    return all([
        getattr(settings, 'R2_ACCOUNT_ID', ''),
        getattr(settings, 'R2_ACCESS_KEY', ''),
        getattr(settings, 'R2_SECRET_KEY', ''),
        getattr(settings, 'R2_BUCKET_NAME', ''),
    ])


def _get_r2_client():
    """Create a boto3 S3 client configured for Cloudflare R2."""
    account_id = settings.R2_ACCOUNT_ID
    return boto3.client(
        's3',
        endpoint_url=f'https://{account_id}.r2.cloudflarestorage.com',
        aws_access_key_id=settings.R2_ACCESS_KEY,
        aws_secret_access_key=settings.R2_SECRET_KEY,
        config=BotoConfig(
            signature_version='s3v4',
            retries={'max_attempts': 3, 'mode': 'standard'},
        ),
        region_name='auto',
    )


def generate_storage_key(organization_id, file_type, original_name=''):
    """Generate a unique storage key for R2."""
    unique_id = uuid.uuid4().hex[:12]
    ext = file_type.lower() if file_type else 'bin'
    return f'dms/{organization_id}/{unique_id}.{ext}'


def upload_to_r2(file_obj, storage_key, mime_type='application/octet-stream'):
    """
    Upload a file to R2.
    Returns True on success, False on failure.
    """
    if not is_r2_configured():
        return False

    try:
        client = _get_r2_client()
        file_obj.seek(0)
        client.upload_fileobj(
            file_obj,
            settings.R2_BUCKET_NAME,
            storage_key,
            ExtraArgs={
                'ContentType': mime_type,
            },
        )
        logger.info(f'Uploaded to R2: {storage_key}')
        return True
    except ClientError as e:
        logger.error(f'R2 upload failed for {storage_key}: {e}')
        return False
    except Exception as e:
        logger.error(f'R2 upload error for {storage_key}: {e}')
        return False


def download_from_r2(storage_key):
    """
    Download a file from R2.
    Returns file bytes or None on failure.
    """
    if not is_r2_configured() or not storage_key:
        return None

    try:
        client = _get_r2_client()
        response = client.get_object(
            Bucket=settings.R2_BUCKET_NAME,
            Key=storage_key,
        )
        return response['Body'].read()
    except ClientError as e:
        logger.error(f'R2 download failed for {storage_key}: {e}')
        return None


def get_presigned_url(storage_key, expires_seconds=900, filename=None):
    """
    Generate a pre-signed download URL (default 15 min expiry).
    Returns URL string or None on failure.
    """
    if not is_r2_configured() or not storage_key:
        return None

    try:
        client = _get_r2_client()
        params = {
            'Bucket': settings.R2_BUCKET_NAME,
            'Key': storage_key,
        }
        if filename:
            params['ResponseContentDisposition'] = f'attachment; filename="{filename}"'

        url = client.generate_presigned_url(
            'get_object',
            Params=params,
            ExpiresIn=expires_seconds,
        )
        return url
    except ClientError as e:
        logger.error(f'R2 presigned URL failed for {storage_key}: {e}')
        return None


def delete_from_r2(storage_key):
    """Delete a file from R2. Returns True on success."""
    if not is_r2_configured() or not storage_key:
        return False

    try:
        client = _get_r2_client()
        client.delete_object(
            Bucket=settings.R2_BUCKET_NAME,
            Key=storage_key,
        )
        logger.info(f'Deleted from R2: {storage_key}')
        return True
    except ClientError as e:
        logger.error(f'R2 delete failed for {storage_key}: {e}')
        return False


def check_r2_connection():
    """Test R2 connectivity. Returns (success, message)."""
    if not is_r2_configured():
        return False, 'R2 not configured (missing env vars)'

    try:
        client = _get_r2_client()
        client.head_bucket(Bucket=settings.R2_BUCKET_NAME)
        return True, f'Connected to R2 bucket: {settings.R2_BUCKET_NAME}'
    except ClientError as e:
        return False, f'R2 connection failed: {e}'
