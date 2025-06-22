#!/usr/bin/env node

import { copyFileSync, existsSync } from 'fs';
import { resolve } from 'path';

const source = resolve('node_modules/mermaid/dist/mermaid.min.js');
const target = resolve('public/mermaid.min.js');

if (!existsSync(source)) {
  console.error('Mermaid source file not found:', source);
  process.exit(1);
}

try {
  copyFileSync(source, target);
  console.log('✅ Mermaid library copied to public directory');
} catch (error) {
  console.error('❌ Failed to copy Mermaid library:', error);
  process.exit(1);
} 