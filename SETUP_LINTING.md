# Linting and Formatting Setup

This project uses **ESLint** for linting and **Prettier** for code formatting.

## Installation

Run the following command to install all dependencies:

```bash
npm install
```

This will install:
- ESLint and TypeScript ESLint plugins
- Prettier
- All other project dependencies

## Configuration Files

### ESLint (`.eslintrc.json`)
- Uses TypeScript ESLint parser
- Extends recommended ESLint and TypeScript rules
- Integrates with Prettier to avoid conflicts
- Configured for ESM modules

### Prettier (`.prettierrc`)
- Single quotes
- 2 spaces indentation
- 100 character line width
- Semicolons enabled
- Trailing commas (ES5)

### Ignore Files
- `.eslintignore` - Files/directories ESLint should ignore
- `.prettierignore` - Files/directories Prettier should ignore

## Available Scripts

### Linting
```bash
# Check for linting errors
npm run lint

# Fix auto-fixable linting errors
npm run lint:fix
```

### Formatting
```bash
# Format all files
npm run format

# Check if files are formatted (CI/CD)
npm run format:check
```

### Type Checking
```bash
# Check TypeScript types without building
npm run type-check
```

## Usage

### Before Committing
It's recommended to run linting and formatting before committing:

```bash
npm run lint:fix
npm run format
npm run type-check
```

### In Your Editor
For the best experience, install these VS Code extensions:
- **ESLint** (dbaeumer.vscode-eslint)
- **Prettier** (esbenp.prettier-vscode)

Then add to your VS Code settings (`.vscode/settings.json`):
```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "[typescript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  }
}
```

## Rules Overview

### ESLint Rules
- **Warnings**: Unused variables (with `_` prefix ignored), `any` types, unsafe operations
- **Errors**: Floating promises, var usage
- **Disabled**: Explicit return types (inferred from TypeScript)

### Prettier Rules
- Consistent code formatting across the project
- Automatic formatting on save (if configured)

## CI/CD Integration

For CI/CD pipelines, use:
```bash
npm run lint
npm run format:check
npm run type-check
```

These commands will exit with non-zero codes if there are issues, making them suitable for CI/CD.




