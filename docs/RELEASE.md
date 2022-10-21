# How to release a new version

### 1. Ensure the latest changes are available

```bash
git checkout develop
git pull
git checkout main
git pull
```

### 2. Merge develop into main

```bash
git merge develop --no-ff
```

### 3. Run the release script...

```bash
# Ensure that the dependencies match those in package.json
rm -rf node_modules; npm i
npm run release
```

The release script takes care of 2 things:

- Execute the compilation tasks specified in the gulp file (transpiling, copying the binary, etc.) and leaving the artifact ready in lib

- Start the interactive release process itself.

### 4. Pick version type (major, minor, path)

### 5. Test the new release.
