import { glob } from 'glob';
import * as fs from 'fs';
import * as path from 'path';

const VIDEO_EXTENSIONS = ['.mp4', '.mov', '.avi', '.mkv', '.flv', '.wmv', '.m4v'];

function isVideoFile(filePath: string): boolean {
  const ext = path.extname(filePath).toLowerCase();
  return VIDEO_EXTENSIONS.includes(ext);
}

function isCompressedFile(filePath: string): boolean {
  const name = path.basename(filePath, path.extname(filePath));
  return name.endsWith('_compressed');
}

export async function getVideoFiles(inputs: string[]): Promise<string[]> {
  const files: string[] = [];

  for (const input of inputs) {
    if (fs.existsSync(input) && fs.statSync(input).isDirectory()) {
      const pattern = path.join(input, '**', '*');
      const dirFiles = await glob(pattern, { nodir: true });
      files.push(...dirFiles.filter(f => isVideoFile(f) && !isCompressedFile(f)));
    } else if (input.includes('*') || input.includes('?')) {
      const matchedFiles = await glob(input, { nodir: true });
      files.push(...matchedFiles.filter(f => isVideoFile(f) && !isCompressedFile(f)));
    } else if (fs.existsSync(input)) {
      if (isVideoFile(input) && !isCompressedFile(input)) {
        files.push(input);
      }
    } else {
      console.warn(`⚠️  Warning: File not found: ${input}`);
    }
  }

  return [...new Set(files)];
}
