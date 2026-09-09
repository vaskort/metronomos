import { fileURLToPath, URL } from 'node:url';

const resolve = (path: string) =>
  fileURLToPath(new URL(path, import.meta.url));

/**
 * Shared by the app build (vite.config.ts) and the test runner
 * (vitest.config.ts). Mirrors the `paths` block in tsconfig.json — keep the
 * two in step.
 */
const aliases = {
  '@app': resolve('./src/app'),
  '@audio': resolve('./src/app/audio'),
  '@components': resolve('./src/app/components'),
  '@hooks': resolve('./src/app/hooks'),
  '@utils': resolve('./src/app/utils'),
  '@assets': resolve('./assets'),
};

export default aliases;
