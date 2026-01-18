// CRITICAL: Polyfill must be the FIRST thing executed
// Polyfill for Array.prototype.toReversed (required for Node.js < 20)
(function() {
  if (!Array.prototype.toReversed) {
    Array.prototype.toReversed = function() {
      return [...this].reverse();
    };
  }
  if (!Array.prototype.toSorted) {
    Array.prototype.toSorted = function(compareFn) {
      return [...this].sort(compareFn);
    };
  }
  if (!Array.prototype.toSpliced) {
    Array.prototype.toSpliced = function(start, deleteCount, ...items) {
      const copy = [...this];
      copy.splice(start, deleteCount, ...items);
      return copy;
    };
  }
})();

// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');
const fs = require('fs');
const path = require('path');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Fix for metro-cache FileStore export error
// Use default cache instead of FileStore
if (config.cacheStores) {
  config.cacheStores = [];
}

// Fix for web bundling - resolve React Native modules for web
const defaultResolver = config.resolver || {};
const originalResolveRequest = defaultResolver.resolveRequest;

config.resolver = {
  ...defaultResolver,
  sourceExts: [...(defaultResolver.sourceExts || [])],
  platforms: ['ios', 'android', 'web'],
  resolveRequest: (context, moduleName, platform) => {
    // Try to resolve platform-specific files first for web
    if (platform === 'web') {
      const platformSpecificExtensions = ['.web.tsx', '.web.ts', '.web.jsx', '.web.js'];
      const originDir = context.originModulePath ? path.dirname(context.originModulePath) : context.projectRoot;

      // Only try platform-specific resolution for relative imports
      if (moduleName.startsWith('.')) {
        for (const ext of platformSpecificExtensions) {
          try {
            const platformFile = moduleName.replace(/\.(tsx?|jsx?)$/, '') + ext;
            const fullPath = path.resolve(originDir, platformFile);
            if (fs.existsSync(fullPath)) {
              return {
                filePath: fullPath,
                type: 'sourceFile',
              };
            }
          } catch (e) {
            // Continue trying
          }
        }
      }
    }

    // Block react-native-maps on web (we use Google Maps instead)
    if (platform === 'web' && moduleName.startsWith('react-native-maps')) {
      return {
        type: 'empty',
      };
    }

    // Handle React Native Platform module for web
    if (platform === 'web') {
      const originPath = context.originModulePath || '';

      // Handle relative path imports to Platform from React Native files
      if (originPath.includes('react-native') && moduleName.startsWith('../')) {
        try {
          // Resolve the full path
          const fullPath = path.resolve(path.dirname(originPath), moduleName);

          // Check if it's trying to access Utilities/Platform
          if (fullPath.includes('react-native') && fullPath.includes('Utilities/Platform')) {
            return {
              filePath: require.resolve('react-native-web/dist/exports/Platform'),
              type: 'sourceFile',
            };
          }
        } catch (e) {
          // Continue to default resolver
        }
      }

      // Direct check for Platform module
      if (moduleName.includes('Utilities/Platform') || moduleName === '../Utilities/Platform') {
        try {
          return {
            filePath: require.resolve('react-native-web/dist/exports/Platform'),
            type: 'sourceFile',
          };
        } catch (e) {
          // Continue to default resolver
        }
      }
    }

    // Use default resolver
    if (originalResolveRequest) {
      return originalResolveRequest(context, moduleName, platform);
    }
    // Fallback to Metro's default resolver
    return context.resolveRequest(context, moduleName, platform);
  },
};

module.exports = config;
