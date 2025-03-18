import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  dts: true,
  clean: true,
  sourcemap: true,
  target: 'node18',
  outDir: 'dist',
  // Ensure all dependencies are external
  external: [
    '@innerflame/ai-tools',
    '@innerflame/types',
    '@innerflame/utils',
    '@langchain/langgraph',
    '@supabase/supabase-js',
    '@trpc/server',
    'cors',
    'dotenv',
    'express',
    'zod'
  ]
}); 