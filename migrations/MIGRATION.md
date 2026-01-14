# Migrations

The migration tool ensures your database schema is up to date by applying versioned migration scripts in order.

It works as follows:
1. It determines the last executed migration version from the database (the `migration` collection/table).
2. It scans the `./scripts` directory for migration files named with the pattern `NNN__short_description.js` (three digits, double underscore).
3. If there are scripts with a version greater than the database’s last version:
   - It creates a database backup.
   - It executes all pending scripts sequentially (lowest to highest version).
   - It records each executed migration in the `migration` collection/table.
4. If all migrations succeed, the application proceeds to start normally.
5. If a migration fails, the tool attempts to restore the database from the backup and the application will not start.

#### Notes:
- Files are sorted lexicographically; the numeric prefix (`NNN`) defines the execution order.
- A migration file’s version is parsed from the first three characters of the filename.

## Configuration

- Automatic execution of missing scripts can be disabled by setting `auto_update_schema=false`.
  - When disabled and the schema is outdated, the application will not start.
- Backups directory is configurable via `backups_dir` ([see Backups section](#backups)).

#### Exemple :
```ini 
[migration]
auto_update_schema = true
backups_dir= /backup/directory
```
## Execution

- The migration tool runs automatically at application startup.
- You can also trigger it manually:
     ```shell
    node ./migrations/runMigration.js \
      --conf ./0-ini/conf_default.ini \
      --profiles ./0-ini/profiles.ini \
      --portal_conf ./0-ini/portal_conf_default.ini
    ```

## Migration scripts

- Location: `./scripts`
- Naming: `NNN__short_description.js`
  - Example: `001__migration_organization_status.js`
- Each script should be idempotent and reentrant when possible and must handle its own errors properly.

### Example registry

| Execution Rank | Script name                          | Creation date | Target Object        | Description                                                                                                                                                                                                      |
|----------------|--------------------------------------|---------------|----------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| 001            | 001__migration_organization_status.js | 2025-09-24    | MongoDB (Organization) | Finds organizations with no `organization_status` set, or with `organization_status='VALIDATED'` and no `linked_producer_status`. Updates targeted organizations to set the missing status to `'VALIDATED'`.          |

## Backups

- Location: controlled by `backups_dir`.
- Each backup is a full database dump created immediately before applying pending migrations.
- In case of failure, the tool attempts to restore the database from the latest backup created for that run.

## Operational details

- Detection of pending migrations: the tool compares the highest script version found with the last recorded version in the database.
- Ordering: files are filtered by the pattern `^\d{3}__.*\.js$` and sorted ascending.
- Recording: after each successful script, the tool records `{ version, file, date }` in the `migration` collection/table.

## Troubleshooting

- “No migration file found”: ensure your files follow `NNN__name.js` with a double underscore and live in `./scripts`.
- “Application cannot start; schemas must be updated beforehand.”: set `auto_update_schema=true` or apply migrations manually before starting.
- On failure, check:
  - The most recent backup in the directory defined by `backups_dir`.
  - Application logs for the failing script and restore status.

