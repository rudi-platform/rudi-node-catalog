# Backups

Backups created by the migration tool are stored in `backups_dir` to allow rollbacks if a migration fails.

## When backups are created

- A backup is created automatically right before applying any pending migration scripts.
- Only one backup is created per migration run, regardless of the number of scripts to execute.

## File format and naming

- Files are JSON dumps of the database.
- Naming convention: `db_backup_<ISO-like timestamp>.json`, e.g. `db_backup_2025-09-25T07-51-54-462Z.json`.
- The timestamp reflects the moment the dump was produced.

## What is backed up

- The full database used by the catalog service (all collections).
- This ensures a consistent restore point if any step of the migration fails.

## Restore behavior

- If a migration fails, the tool attempts to restore the database from the backup generated at the start of that run.
- After a successful restore, the application will not start automatically; you should inspect logs, fix the issue, and re-run the migrations.

## Manual restore (advanced)

If you need to restore manually (e.g., in a dev environment), you can:
1. Stop the application using the database.
2. Restore the dump using your usual MongoDB tooling (mongosh/mongoimport) or a custom script compatible with the backup format.
3. Restart the application and re-run migrations if needed.

Note: The exact command depends on your environment and the dump structure. Always test restore procedures on a non-production environment first.

## Retention and housekeeping

- Backups accumulate in this directory and are not automatically pruned.
- Recommended practices:
    - Keep at least the most recent successful backup for each environment.
    - Periodically clean older backups to save disk space.
    - Never delete a backup associated with a failed migration until the issue is resolved.

## Security and compliance

- Backups may contain sensitive data. Ensure:
    - Proper file permissions on the `backups_dir`
    - Backups are excluded from public artifacts and untrusted shares.
    - If exported off-host, use encrypted storage and secure transfer.
