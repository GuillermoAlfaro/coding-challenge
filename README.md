# Deduplicate JSON Records

This script deduplicates JSON records based on specific rules for IDs and emails. Duplicate records are reconciled by prioritizing the newest entry and generating a `changeLog` for merged fields.

## Prerequisites

- Node.js must be installed on your system.

## How to Run

1. Place the input JSON file (`leads.json`) in the same directory as this script.
2. Run the script with the following command:

   ```bash
   node deduplicate.js
   ```

## Output

The script outputs the deduplicated records as JSON directly to the console. 

See `output.json`

## Assumptions Made

- If a new entry has duplicates by both ID and email, the records are consolidated based on their entry date-times:
  1. **Least Recent Entry**: If the new entry is the least recent, it is absorbed by the middle-recency record. The new entry’s changes are added to the middle record’s `changeLog`. Since its contents are overwritten, it is no longer treated as a duplicate of the other record.
  2. **Middle Recency Entry**: If the new entry is in the middle of the date order, the least recent record becomes dependent (added to `changeLog` as the `before` state). The new entry is then consolidated into the most recent record, forming a chain of changes.
  3. **Most Recent Entry**: If the new entry is the most recent, it consolidates both other records into itself, becoming the final version with all changes reflected in its `changeLog`.
