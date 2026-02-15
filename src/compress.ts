import ffmpeg from 'fluent-ffmpeg';
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';
import * as path from 'path';
import * as fs from 'fs';
import cliProgress from 'cli-progress';

ffmpeg.setFfmpegPath(ffmpegInstaller.path);

export interface CompressionResult {
  inputPath: string;
  outputPath: string;
  success: boolean;
  error?: string;
  inputSize?: number;
  outputSize?: number;
  reductionPercent?: number;
  durationSeconds?: number;
}

export interface CompressOptions {
  quality?: string;
  outputDir?: string;
  parallel?: number;
  quietProgress?: boolean;
  label?: string;
  onProgress?: (percent: number) => void;
}

// Get CRF value for the given quality level
function getCRF(quality: string): number {
  switch (quality.toLowerCase()) {
    case 'high':
      return 20; // high quality
    case 'low':
      return 28; // low quality (high compression)
    case 'medium':
    default:
      return 23; // medium quality (default)
  }
}

// Format file size to human-readable string
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
  if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
}

// Compress a single video
export async function compressVideo(
  inputPath: string,
  options: CompressOptions = {}
): Promise<CompressionResult> {
  return new Promise((resolve, reject) => {
    const crf = getCRF(options.quality || 'medium');
    const inputDir = path.dirname(inputPath);
    const inputName = path.basename(inputPath, path.extname(inputPath));
    const inputExt = path.extname(inputPath);

    // Determine output path
    const outputDir = options.outputDir || inputDir;
    const outputPath = path.join(outputDir, `${inputName}_compressed${inputExt}`);

    // Create output directory if it doesn't exist
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const startTime = Date.now();
    const inputSize = fs.statSync(inputPath).size;
    const prefix = options.label ? `${options.label} ` : '';

    console.log(`${prefix}📹 Compressing: ${path.basename(inputPath)}`);
    console.log(`${prefix}   Quality: ${options.quality || 'medium'} (CRF: ${crf})`);
    console.log(`${prefix}   Original size: ${formatFileSize(inputSize)}`);

    ffmpeg(inputPath)
      .outputOptions([
        `-c:v libx264`, // H.264 codec
        `-crf ${crf}`, // quality setting
        `-preset medium`, // balance between encoding speed and compression ratio
        `-c:a aac`, // audio codec
        `-b:a 128k`, // audio bitrate
      ])
      .on('start', (commandLine) => {
        // Debug (uncomment if needed)
        // console.log('   ffmpeg command:', commandLine);
      })
      .on('progress', (progress) => {
        if (progress.percent) {
          if (options.onProgress) {
            options.onProgress(progress.percent);
          } else if (!options.quietProgress) {
            process.stdout.write(`\r${prefix}   Progress: ${progress.percent.toFixed(1)}%`);
          }
        }
      })
      .on('end', () => {
        const endTime = Date.now();
        const durationSeconds = (endTime - startTime) / 1000;
        const outputSize = fs.statSync(outputPath).size;
        const reductionPercent = (1 - outputSize / inputSize) * 100;

        if (!options.quietProgress) {
          console.log(`\r${prefix}   Progress: 100.0%`);
          console.log(`${prefix}   Compressed: ${formatFileSize(outputSize)}`);
          console.log(`${prefix}   Reduction: ${reductionPercent.toFixed(1)}%`);
          console.log(`${prefix}   Duration: ${durationSeconds.toFixed(1)}s`);
          console.log(`${prefix}   ✓ Done: ${path.basename(outputPath)}\n`);
        }

        resolve({
          inputPath,
          outputPath,
          success: true,
          inputSize,
          outputSize,
          reductionPercent,
          durationSeconds,
        });
      })
      .on('error', (err) => {
        console.error(`\n${prefix}   ❌ Error: ${err.message}\n`);
        reject(err);
      })
      .save(outputPath);
  });
}

// Compress multiple videos
export async function compressMultipleVideos(
  files: string[],
  options: CompressOptions = {}
): Promise<CompressionResult[]> {
  const parallel = options.parallel || 1;

  if (parallel <= 1) {
    // Sequential mode (preserves current behavior)
    const results: CompressionResult[] = [];
    for (let i = 0; i < files.length; i++) {
      const label = `[${i + 1}/${files.length}]`;
      console.log(label);
      try {
        const result = await compressVideo(files[i], { ...options, label });
        results.push(result);
      } catch (err) {
        results.push({
          inputPath: files[i],
          outputPath: '',
          success: false,
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }
    return results;
  }

  // Parallel mode
  const results: CompressionResult[] = new Array(files.length);
  const multiBar = new cliProgress.MultiBar({
    format: ' {bar} | {filename} | {percentage}%',
    clearOnComplete: false,
    hideCursor: true,
  }, cliProgress.Presets.shades_grey);

  let nextIndex = 0;

  async function runWorker(): Promise<void> {
    while (nextIndex < files.length) {
      const i = nextIndex++;
      const file = files[i];
      const filename = path.basename(file);
      const bar = multiBar.create(100, 0, { filename });

      try {
        const result = await compressVideo(file, {
          ...options,
          quietProgress: true,
          onProgress: (percent) => {
            bar.update(Math.round(percent), { filename });
          },
        });
        bar.update(100, { filename });
        multiBar.remove(bar);
        console.log(`   ✓ Done: ${path.basename(result.outputPath)}`);
        results[i] = result;
      } catch (err) {
        bar.update(0, { filename: `${filename} (failed)` });
        multiBar.remove(bar);
        console.log(`   ❌ Failed: ${filename}`);
        results[i] = {
          inputPath: file,
          outputPath: '',
          success: false,
          error: err instanceof Error ? err.message : String(err),
        };
      }
    }
  }

  const workers: Promise<void>[] = [];
  for (let w = 0; w < Math.min(parallel, files.length); w++) {
    workers.push(runWorker());
  }
  await Promise.all(workers);

  multiBar.stop();
  return results;
}
