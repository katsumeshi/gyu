import { glob } from 'glob';
import * as fs from 'fs';
import * as path from 'path';

// Supported video formats
const VIDEO_EXTENSIONS = ['.mp4', '.mov', '.avi', '.mkv', '.flv', '.wmv', '.webm', '.m4v'];

// Check if file is a video
function isVideoFile(filePath: string): boolean {
  const ext = path.extname(filePath).toLowerCase();
  return VIDEO_EXTENSIONS.includes(ext);
}

// Get video files from input list
export async function getVideoFiles(inputs: string[]): Promise<string[]> {
  const files: string[] = [];

  for (const input of inputs) {
    // Directory input
    if (fs.existsSync(input) && fs.statSync(input).isDirectory()) {
      const pattern = path.join(input, '**', '*');
      const dirFiles = await glob(pattern, { nodir: true });
      files.push(...dirFiles.filter(isVideoFile));
    }
    // Wildcard pattern
    else if (input.includes('*') || input.includes('?')) {
      const matchedFiles = await glob(input, { nodir: true });
      files.push(...matchedFiles.filter(isVideoFile));
    }
    // Regular file path
    else if (fs.existsSync(input)) {
      if (isVideoFile(input)) {
        files.push(input);
      }
    } else {
      console.warn(`⚠️  Warning: File not found: ${input}`);
    }
  }

  // Remove duplicates
  return [...new Set(files)];
}
