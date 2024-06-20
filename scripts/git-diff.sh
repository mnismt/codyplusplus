#!/bin/bash

# Get the current branch name
current_branch=$(git rev-parse --abbrev-ref HEAD)

# Get the previous branch name from reflog
previous_branch=$(git reflog | grep -m 1 'checkout: moving' | awk '{print $6}')

# Count the number of commits
commit_count=$(git rev-list --count $previous_branch..$current_branch)

# Generate the summary message
echo "The current branch $current_branch branch contains $commit_count commits that have been added since branching from $previous_branch."

# Loop through each commit and append details to the file
git log $previous_branch..$current_branch --format="%h" | while read commit_hash; do
  # Append the commit message with the shorthand hash
  echo "Commit: $commit_hash"
  git log --pretty=format:"%B" -n 1 $commit_hash
  echo ""

  # Print the diff
  git diff $commit_hash^!
  echo ""
done
