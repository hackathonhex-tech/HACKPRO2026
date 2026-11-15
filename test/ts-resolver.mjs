import { resolve as pathResolve, extname, dirname, join } from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import fs from 'fs';

const projectRoot = pathResolve('.');

export async function resolve(specifier, context, nextResolve) {
  let target = specifier;

  if (target.startsWith('@/')) {
    const rel = target.slice(2);
    let resolved = pathResolve(projectRoot, 'src', rel);
    if (!extname(resolved)) {
      if (fs.existsSync(resolved + '.ts')) resolved += '.ts';
      else if (fs.existsSync(resolved + '.tsx')) resolved += '.tsx';
      else if (fs.existsSync(resolved + '.js')) resolved += '.js';
    }
    return nextResolve(pathToFileURL(resolved).href, { ...context, format: 'module' });
  }

  if (target.startsWith('./') || target.startsWith('../')) {
    if (context.parentURL) {
      const parentDir = dirname(fileURLToPath(context.parentURL));
      let resolved = pathResolve(parentDir, target);
      if (!extname(resolved)) {
        if (fs.existsSync(resolved + '.ts')) resolved += '.ts';
        else if (fs.existsSync(resolved + '.tsx')) resolved += '.tsx';
        else if (fs.existsSync(resolved + '.js')) resolved += '.js';
        else if (fs.existsSync(join(resolved, 'index.ts'))) resolved = join(resolved, 'index.ts');
      }
      return nextResolve(pathToFileURL(resolved).href, { ...context, format: 'module' });
    }
  }

  return nextResolve(target, context);
}

export async function load(url, context, nextLoad) {
  if (url.endsWith('.ts') || url.endsWith('.tsx')) {
    return nextLoad(url, { ...context, format: 'module' });
  }
  return nextLoad(url, context);
}
