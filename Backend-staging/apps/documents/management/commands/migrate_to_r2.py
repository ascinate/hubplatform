"""
Management command to migrate local DMS files to Cloudflare R2.
Usage: python manage.py migrate_to_r2 [--dry-run] [--batch-size 50]
"""

import os
from django.core.management.base import BaseCommand
from apps.documents.models import ManagedDocument
from apps.documents.storage import (
    is_r2_configured, upload_to_r2, generate_storage_key, check_r2_connection,
)


class Command(BaseCommand):
    help = 'Migrate local DMS files to Cloudflare R2 cloud storage'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be migrated without actually uploading',
        )
        parser.add_argument(
            '--batch-size',
            type=int,
            default=50,
            help='Number of files to process per batch (default: 50)',
        )
        parser.add_argument(
            '--skip-existing',
            action='store_true',
            default=True,
            help='Skip files that already have a storage_key (default: True)',
        )

    def handle(self, *args, **options):
        dry_run = options['dry_run']
        batch_size = options['batch_size']
        skip_existing = options['skip_existing']

        # Check R2 connection
        if not dry_run:
            if not is_r2_configured():
                self.stderr.write(self.style.ERROR(
                    'R2 is not configured. Set R2_ACCOUNT_ID, R2_ACCESS_KEY, '
                    'R2_SECRET_KEY, R2_BUCKET_NAME in .env'
                ))
                return

            success, msg = check_r2_connection()
            if not success:
                self.stderr.write(self.style.ERROR(f'R2 connection failed: {msg}'))
                return
            self.stdout.write(self.style.SUCCESS(f'R2 connected: {msg}'))

        # Query documents
        qs = ManagedDocument.objects.filter(is_deleted=False)
        if skip_existing:
            qs = qs.filter(storage_key='')

        total = qs.count()
        if total == 0:
            self.stdout.write(self.style.SUCCESS('No files to migrate.'))
            return

        self.stdout.write(f'Found {total} files to migrate to R2.')

        if dry_run:
            self.stdout.write(self.style.WARNING('DRY RUN — no files will be uploaded.'))
            for doc in qs[:20]:
                local_exists = os.path.exists(doc.file.path) if doc.file else False
                key = generate_storage_key(str(doc.organization_id), doc.file_type)
                self.stdout.write(
                    f'  [{doc.id}] {doc.name}.{doc.file_type} '
                    f'({doc.file_size} bytes) → {key} '
                    f'{"✓ local exists" if local_exists else "✗ MISSING locally"}'
                )
            if total > 20:
                self.stdout.write(f'  ... and {total - 20} more files')
            return

        # Process in batches
        migrated = 0
        failed = 0
        skipped = 0

        for offset in range(0, total, batch_size):
            batch = qs[offset:offset + batch_size]
            for doc in batch:
                # Check local file exists
                try:
                    file_path = doc.file.path
                except ValueError:
                    self.stdout.write(self.style.WARNING(
                        f'  SKIP [{doc.id}] {doc.name} — no file field'
                    ))
                    skipped += 1
                    continue

                if not os.path.exists(file_path):
                    self.stdout.write(self.style.WARNING(
                        f'  SKIP [{doc.id}] {doc.name} — local file missing'
                    ))
                    skipped += 1
                    continue

                # Generate key and upload
                storage_key = generate_storage_key(
                    str(doc.organization_id), doc.file_type, doc.name
                )

                with open(file_path, 'rb') as f:
                    success = upload_to_r2(
                        f, storage_key,
                        mime_type=doc.mime_type or 'application/octet-stream',
                    )

                if success:
                    doc.storage_key = storage_key
                    doc.save(update_fields=['storage_key'])
                    migrated += 1
                    self.stdout.write(
                        f'  ✓ [{doc.id}] {doc.name}.{doc.file_type} → {storage_key}'
                    )
                else:
                    failed += 1
                    self.stderr.write(self.style.ERROR(
                        f'  ✗ [{doc.id}] {doc.name} — upload failed'
                    ))

            self.stdout.write(f'  Batch progress: {min(offset + batch_size, total)}/{total}')

        self.stdout.write('')
        self.stdout.write(self.style.SUCCESS(
            f'Migration complete: {migrated} migrated, {failed} failed, {skipped} skipped'
        ))
