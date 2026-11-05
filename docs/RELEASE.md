# How to release a new version

### 1. Ensure the latest changes are available

```bash
git checkout main
git pull
```

### 2. Run the release script...

```bash
# Ensure that the dependencies match those in package.json
rm -rf node_modules; npm i
npm run release
```

The release script takes care of 2 things:

- Execute the compilation tasks (`npm run build`).

- Start the interactive release process itself.

### 3. Pick version type (major, minor, patch)

### 4. Test the new release.
