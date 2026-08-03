import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts', 'src/guards/index.ts', 'src/assertions/index.ts', 'src/csv/index.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: false,
  treeshake: true,
  minify: false,
  target: 'es2020',
  outDir: 'dist',
});
