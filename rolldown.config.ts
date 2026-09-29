import { defineConfig } from 'rolldown';
import run from '@rollup/plugin-run';
// set to "true" by the Rolldown CLI when running with --watch
const isDev = process.env.ROLLDOWN_WATCH === 'true';
export default defineConfig({
input: 'src/server.ts',
output: {
file: 'dist/server.js',
format: 'esm',
sourcemap: true,
},
tsconfig: true,
plugins: [isDev && run({ allowRestarts: true })].filter(Boolean),
});