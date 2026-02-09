#!/bin/bash
# Bulk close automated issues using GitHub CLI
# Usage: ./scripts/close-automated-issues.sh

echo "🔍 Fetching automated issues..."

# Get all issue numbers with "automated" label
ISSUES=$(gh issue list \
  --repo JonazWong/Looper-HQ \
  --label "automated" \
  --state open \
  --limit 200 \
  --json number \
  --jq '.[].number')

if [ -z "$ISSUES" ]; then
  echo "✅ No automated issues to close"
  exit 0
fi

COUNT=$(echo "$ISSUES" | wc -l)
echo "📋 Found $COUNT automated issues"

# Close each issue
while IFS= read -r issue_number; do
  gh issue close "$issue_number" \
    --repo JonazWong/Looper-HQ \
    --comment "🤖 Auto-closed: RSS Crawler workflow has been disabled."
  
  echo "✅ Closed #$issue_number"
  sleep 0.1  # Rate limiting
done <<< "$ISSUES"

echo ""
echo "🎉 Successfully closed $COUNT issues!"
