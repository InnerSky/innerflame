# InnerFlame

## Setup Instructions

### Prerequisites
- Node.js 18 or higher
- PNPM 10.10.0 (exact version matters)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/InnerSky/innerflame.git
cd innerflame
```

2. Install PNPM if you don't have it:
```bash
npm install -g pnpm@10.10.0
```

3. Install dependencies:
```bash
pnpm install
```

### Troubleshooting Installation Issues

If you encounter workspace resolution errors (like "@innerflame/ai-tools is not in the npm registry"), try these solutions:

1. Make sure you're using the correct PNPM version:
```bash
pnpm --version  # Should be 10.10.0
```

2. Try installing with workspace flags:
```bash
pnpm install --link-workspace-packages --prefer-workspace-packages
```

3. Run the workspace fix script:
```bash
node scripts/fix-workspace-links.js
```

4. If all else fails, try a clean installation:
```bash
rm -rf node_modules
rm -rf **/node_modules
pnpm store prune
pnpm install
```

## Development

Start the development server:
```bash
pnpm dev
```

Build the project:
```bash
pnpm build
``` 