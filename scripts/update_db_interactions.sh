#!/bin/bash
# Regenerate DB_Interactions.md detailed sections with any new DB calls.
# Run from the bot/ directory.

OUTFILE="$(pwd)/DB_Interactions.md"
TMPALL=$(mktemp)
TMPREAD=$(mktemp)
TMPWRITE=$(mktemp)

# collect all DB call lines
grep -R --line-number "DB\." . --exclude-dir=.git --exclude-dir=node_modules > "$TMPALL"

# split into reads and writes
grep -E "set\(|update|remove|delete|new\(|insert|bulkWrite|expire|push|pull" "$TMPALL" > "$TMPWRITE"
grep -v -E "set\(|update|remove|delete|new\(|insert|bulkWrite|expire|push|pull" "$TMPALL" > "$TMPREAD"

# append new lines to markdown
{
  echo "\n## Detailed read operations (updated $(date))\n"
  sed 's/^/ - /' "$TMPREAD"
  echo "\n## Detailed write operations (updated $(date))\n"
  sed 's/^/ - /' "$TMPWRITE"
} >> "$OUTFILE"

echo "Appended DB interactions to $OUTFILE"

rm -f "$TMPALL" "$TMPREAD" "$TMPWRITE"
