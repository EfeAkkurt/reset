# Git Worktrees Cheatsheet

## Basic Worktree Setup

### Create a new worktree for a feature
```bash
git worktree add ../feature-branch-name feature-branch-name
```

### Create a worktree and branch simultaneously
```bash
git worktree add ../task-directory -b new-feature-branch
```

## Common Workflow Patterns

### Parallel development setup
```bash
# Main worktree (current directory)
git worktree add ../feature-auth auth-feature
git worktree add ../bugfix-login login-bugfix
git worktree add ../refactor-api api-refactor
```

### Safe experimentation
```bash
git worktree add ../experiment -b experimental-feature
cd ../experiment
# Work without affecting main codebase
```

## Worktree Management

### List all worktrees
```bash
git worktree list
```

### Remove a worktree when done
```bash
git worktree remove ../feature-branch-name
```

### Clean up after removal
```bash
git worktree prune
```

## Best Practices

- ✅ Use descriptive directory names that match the task
- ✅ Worktrees share the same `.git` directory, so commits are synchronized
- ✅ Each worktree can have different files checked out simultaneously
- ✅ Perfect for context switching between different features or bug fixes
- ✅ No need to stash changes when switching tasks

## Use Cases

- **Parallel Development**: Work on multiple features simultaneously
- **Context Switching**: Jump between tasks without stashing
- **Safe Experimentation**: Try ideas without affecting main codebase
- **Bug Fixing**: Fix urgent bugs while preserving current work
- **Code Review**: Test PRs in isolated environments