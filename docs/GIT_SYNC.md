# Multi-Repo Sync Guide

This repository is configured to work with two remote repositories:

1.  **origin (Primary)**: `https://github.com/jeremy-dai/hi-kevin`
2.  **mailmangroup (Secondary)**: `https://github.com/mailmangroup/hi-kevin.git`

## Default Behavior

When you run standard git commands, they interact with **origin** by default:

-   `git pull`: Fetches changes from `origin` (jeremy-dai).
-   `git push`: Pushes changes to `origin` (jeremy-dai).

## Syncing with Secondary Repo

To interact with the `mailmangroup` repository, you must specify the remote name explicitly.

### Pulling Updates

To get the latest changes from the `mailmangroup` repo:

```bash
git pull mailmangroup main
```

### Pushing Changes

To push your local changes to the `mailmangroup` repo:

```bash
git push mailmangroup main
```

## Checking Configuration

To view your current remote configuration:

```bash
git remote -v
```
