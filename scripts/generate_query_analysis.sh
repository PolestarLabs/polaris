#!/bin/bash
# Generate basic per-query analysis entries from grep results
# outputs to stdout; use redirection to append to DB_Interactions.md

grep -R --line-number "DB\." . --exclude-dir=.git --exclude-dir=node_modules | \
while IFS=: read -r file line rest; do
  op=$(echo "$rest" | sed 's/^[[:space:]]*//')
  # determine read/write by keyword
  if echo "$op" | grep -Eq "set\(|update|remove|delete|new\(|insert|bulkWrite|expire|push|pull"; then
    rw="Write"
  else
    rw="Read"
  fi
  cat <<EOF
### ${file}

- **Line ${line}** (${rw}) – 
  ```js
  ${op}
  ```
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

EOF

done
