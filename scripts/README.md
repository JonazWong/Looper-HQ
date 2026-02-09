# Scripts

## close-automated-issues.js

Bulk close automated RSS crawler failure issues.

### Prerequisites

```bash
pnpm add @octokit/rest
```

### Usage

```bash
# Set GitHub token
export GITHUB_TOKEN="your_github_token"

# Run script
node scripts/close-automated-issues.js
```

Or using the package.json script:

```bash
pnpm close-issues
```

### What it does

1. Fetches all open issues with the "automated" label
2. Closes each issue with a comment explaining why
3. Handles pagination (up to 100 issues per run)
4. Rate limits requests (100ms delay between issues)

## close-automated-issues.sh

Bash alternative using GitHub CLI (`gh`).

### Prerequisites

Install GitHub CLI:
```bash
# macOS
brew install gh

# Linux (Debian/Ubuntu)
sudo apt install gh

# Authenticate
gh auth login
```

### Usage

```bash
chmod +x scripts/close-automated-issues.sh
./scripts/close-automated-issues.sh
```

Or using the package.json script:

```bash
pnpm close-issues:bash
```

### What it does

Same as the Node.js version but uses the `gh` CLI tool instead.

## Environment Variables

### For Node.js Script

- `GITHUB_TOKEN` - GitHub personal access token with `repo` scope

To create a token:
1. Go to GitHub → Settings → Developer settings → Personal access tokens
2. Generate new token (classic)
3. Select scopes: `repo` (full control of private repositories)
4. Copy the token

### For Bash Script

No environment variables needed - uses `gh` CLI authentication.

## Troubleshooting

### "401 Unauthorized" error

Your GitHub token is invalid or expired. Generate a new token.

### "403 Forbidden" error

Your token doesn't have the required permissions. Make sure it has `repo` scope.

### Script runs but closes 0 issues

Either:
- No issues with "automated" label exist
- Issues are already closed
- You're looking at the wrong repository

Check manually:
```bash
gh issue list --repo JonazWong/Looper-HQ --label "automated" --state open
```

### More than 100 issues

Run the script multiple times. It processes 100 issues per run due to GitHub API pagination limits.

## Related Documentation

- [RSS Crawler Disabled](../docs/archive/rss-crawler-disabled.md) - Why the crawler was disabled
- [RSS Implementation Status](../docs/RSS_IMPLEMENTATION_STATUS.md) - RSS crawler implementation details
