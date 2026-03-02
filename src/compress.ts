import ffmpeg from "fluent-ffmpeg";
import ffmpegInstaller from "@ffmpeg-installer/ffmpeg";
import * as path from "path";
import * as fs from "fs";

ffmpeg.setFfmpegPath(ffmpegInstaller.path);

export interface CompressOptions {
  quality?: string;
  outputDir?: string;
}

function getCRF(quality: string): number {
  switch (quality.toLowerCase()) {
    case "high":
      return 20;
    case "low":
      return 28;
    case "medium":
    default:
      return 23;
  }
}

const KB = 1024;
const MB = 1024 * KB;
const GB = 1024 * MB;

function formatFileSize(bytes: number): string {
  if (bytes < KB) return bytes + " B";
  if (bytes < MB) return (bytes / KB).toFixed(2) + " KB";
  if (bytes < GB) return (bytes / MB).toFixed(2) + " MB";
  return (bytes / GB).toFixed(2) + " GB";
}

export async function compressVideo(
  inputPath: string,
  options: CompressOptions = {},
): Promise<void> {
  return new Promise((resolve, reject) => {
    const crf = getCRF(options.quality || "medium");
    const inputDir = path.dirname(inputPath);
    const inputName = path.basename(inputPath, path.extname(inputPath));
    const inputExt = path.extname(inputPath);

    const outputDir = options.outputDir || inputDir;
    const outputPath = path.join(
      outputDir,
      `${inputName}_compressed${inputExt}`,
    );

    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const startTime = Date.now();
    const inputSize = fs.statSync(inputPath).size;

    console.log(`📹 Compressing: ${path.basename(inputPath)}`);
    console.log(`   Quality: ${options.quality || "medium"} (CRF: ${crf})`);
    console.log(`   Original size: ${formatFileSize(inputSize)}`);

    ffmpeg(inputPath)
      .outputOptions([
        `-c:v libx264`,
        `-crf ${crf}`,
        `-preset medium`, // balance between encoding speed and compression ratio
        `-c:a aac`,
        `-b:a 128k`,
      ])
      .on("progress", (progress) => {
        if (progress.percent) {
          process.stdout.write(
            `\r   Progress: ${progress.percent.toFixed(1)}%`,
          );
        }
      })
      .on("end", () => {
        const endTime = Date.now();
        const duration = ((endTime - startTime) / 1000).toFixed(1);
        const outputSize = fs.statSync(outputPath).size;
        const reduction = ((1 - outputSize / inputSize) * 100).toFixed(1);

        console.log(`\r   Progress: 100.0%`);
        console.log(`   Compressed: ${formatFileSize(outputSize)}`);
        console.log(`   Reduction: ${reduction}%`);
        console.log(`   Duration: ${duration}s`);
        console.log(`   ✓ Done: ${path.basename(outputPath)}\n`);
        resolve();
      })
      .on("error", (err) => {
        console.error(`\n   ❌ Error: ${err.message}\n`);
        reject(err);
      })
      .save(outputPath);
  });
}

export async function compressMultipleVideos(
  files: string[],
  options: CompressOptions = {},
): Promise<void> {
  for (let i = 0; i < files.length; i++) {
    console.log(`[${i + 1}/${files.length}]`);
    await compressVideo(files[i], options);
  }
}
