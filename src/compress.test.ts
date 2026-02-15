import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { execSync } from 'child_process';
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';
import { compressVideo, compressMultipleVideos } from './compress';

let tmpDir: string;
let inputPath: string;

beforeAll(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'gyu-compress-test-'));
  inputPath = path.join(tmpDir, 'input.mp4');

  // Generate a tiny 1-second 16x16 black video using real ffmpeg
  execSync(
    `"${ffmpegInstaller.path}" -f lavfi -i color=black:s=16x16:d=1 -c:v libx264 -t 1 "${inputPath}" -y`,
    { stdio: 'ignore' }
  );

  // Suppress console output during tests
  vi.spyOn(console, 'log').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
});

afterAll(() => {
  vi.restoreAllMocks();
  fs.rmSync(tmpDir, { recursive: true });
});

describe('compressVideo', { timeout: 30_000 }, () => {
  it('compresses with default options and creates output file', async () => {
    const result = await compressVideo(inputPath);

    const outputPath = path.join(tmpDir, 'input_compressed.mp4');
    expect(result.success).toBe(true);
    expect(result.outputPath).toBe(outputPath);
    expect(fs.existsSync(outputPath)).toBe(true);
    expect(fs.statSync(outputPath).size).toBeGreaterThan(0);
  });

  it('creates output directory when outputDir does not exist', async () => {
    const subdir = path.join(tmpDir, 'custom-output');

    const result = await compressVideo(inputPath, { outputDir: subdir });

    const outputPath = path.join(subdir, 'input_compressed.mp4');
    expect(result.success).toBe(true);
    expect(fs.existsSync(subdir)).toBe(true);
    expect(fs.existsSync(outputPath)).toBe(true);
    expect(fs.statSync(outputPath).size).toBeGreaterThan(0);
  });

  it('compresses with quality "low" successfully', async () => {
    const subdir = path.join(tmpDir, 'low-quality');

    const result = await compressVideo(inputPath, { quality: 'low', outputDir: subdir });

    const outputPath = path.join(subdir, 'input_compressed.mp4');
    expect(result.success).toBe(true);
    expect(fs.existsSync(outputPath)).toBe(true);
    expect(fs.statSync(outputPath).size).toBeGreaterThan(0);
  });

  it('rejects when given a non-existent input file', async () => {
    const bogus = path.join(tmpDir, 'does-not-exist.mp4');

    await expect(compressVideo(bogus)).rejects.toThrow();
  });

  it('compresses .mov files successfully', async () => {
    const input = path.join(tmpDir, 'test.mov');
    fs.copyFileSync(inputPath, input);
    const outDir = path.join(tmpDir, 'out-mov');

    const result = await compressVideo(input, { outputDir: outDir });

    expect(result.success).toBe(true);
    const outputPath = path.join(outDir, 'test_compressed.mov');
    expect(fs.existsSync(outputPath)).toBe(true);
    expect(fs.statSync(outputPath).size).toBeGreaterThan(0);
  });

  it('compresses .avi files successfully', async () => {
    const input = path.join(tmpDir, 'test.avi');
    fs.copyFileSync(inputPath, input);
    const outDir = path.join(tmpDir, 'out-avi');

    const result = await compressVideo(input, { outputDir: outDir });

    expect(result.success).toBe(true);
    const outputPath = path.join(outDir, 'test_compressed.avi');
    expect(fs.existsSync(outputPath)).toBe(true);
    expect(fs.statSync(outputPath).size).toBeGreaterThan(0);
  });

  it('compresses .mkv files successfully', async () => {
    const input = path.join(tmpDir, 'test.mkv');
    fs.copyFileSync(inputPath, input);
    const outDir = path.join(tmpDir, 'out-mkv');

    const result = await compressVideo(input, { outputDir: outDir });

    expect(result.success).toBe(true);
    const outputPath = path.join(outDir, 'test_compressed.mkv');
    expect(fs.existsSync(outputPath)).toBe(true);
    expect(fs.statSync(outputPath).size).toBeGreaterThan(0);
  });

  it('compresses .flv files successfully', async () => {
    const input = path.join(tmpDir, 'test.flv');
    fs.copyFileSync(inputPath, input);
    const outDir = path.join(tmpDir, 'out-flv');

    const result = await compressVideo(input, { outputDir: outDir });

    expect(result.success).toBe(true);
    const outputPath = path.join(outDir, 'test_compressed.flv');
    expect(fs.existsSync(outputPath)).toBe(true);
    expect(fs.statSync(outputPath).size).toBeGreaterThan(0);
  });

  it('compresses .wmv files successfully', async () => {
    const input = path.join(tmpDir, 'test.wmv');
    fs.copyFileSync(inputPath, input);
    const outDir = path.join(tmpDir, 'out-wmv');

    const result = await compressVideo(input, { outputDir: outDir });

    expect(result.success).toBe(true);
    const outputPath = path.join(outDir, 'test_compressed.wmv');
    expect(fs.existsSync(outputPath)).toBe(true);
    expect(fs.statSync(outputPath).size).toBeGreaterThan(0);
  });

  it('compresses .m4v files successfully', async () => {
    const input = path.join(tmpDir, 'test.m4v');
    fs.copyFileSync(inputPath, input);
    const outDir = path.join(tmpDir, 'out-m4v');

    const result = await compressVideo(input, { outputDir: outDir });

    expect(result.success).toBe(true);
    const outputPath = path.join(outDir, 'test_compressed.m4v');
    expect(fs.existsSync(outputPath)).toBe(true);
    expect(fs.statSync(outputPath).size).toBeGreaterThan(0);
  });

  // webm container does not support libx264+aac — ffmpeg errors
  it('rejects .webm since the container is incompatible with libx264+aac', async () => {
    const input = path.join(tmpDir, 'format_test_webm.webm');
    fs.copyFileSync(inputPath, input);
    const outDir = path.join(tmpDir, 'out-webm');

    await expect(compressVideo(input, { outputDir: outDir })).rejects.toThrow();
  });
});

describe('compressMultipleVideos', { timeout: 30_000 }, () => {
  it('compresses multiple input files', async () => {
    // Create a second tiny input
    const input2 = path.join(tmpDir, 'input2.mp4');
    execSync(
      `"${ffmpegInstaller.path}" -f lavfi -i color=black:s=16x16:d=1 -c:v libx264 -t 1 "${input2}" -y`,
      { stdio: 'ignore' }
    );

    const outDir = path.join(tmpDir, 'multi-output');
    const results = await compressMultipleVideos([inputPath, input2], { outputDir: outDir });

    expect(results).toHaveLength(2);
    expect(results[0].success).toBe(true);
    expect(results[1].success).toBe(true);
    expect(fs.existsSync(path.join(outDir, 'input_compressed.mp4'))).toBe(true);
    expect(fs.existsSync(path.join(outDir, 'input2_compressed.mp4'))).toBe(true);
  });
});

describe('compressMultipleVideos parallel', { timeout: 60_000 }, () => {
  it('compresses multiple files in parallel', async () => {
    const input2 = path.join(tmpDir, 'par_input2.mp4');
    const input3 = path.join(tmpDir, 'par_input3.mp4');
    execSync(
      `"${ffmpegInstaller.path}" -f lavfi -i color=black:s=16x16:d=1 -c:v libx264 -t 1 "${input2}" -y`,
      { stdio: 'ignore' }
    );
    execSync(
      `"${ffmpegInstaller.path}" -f lavfi -i color=black:s=16x16:d=1 -c:v libx264 -t 1 "${input3}" -y`,
      { stdio: 'ignore' }
    );

    const outDir = path.join(tmpDir, 'parallel-output');
    const results = await compressMultipleVideos([inputPath, input2, input3], {
      outputDir: outDir,
      parallel: 2,
    });

    expect(results).toHaveLength(3);
    expect(results[0].success).toBe(true);
    expect(results[1].success).toBe(true);
    expect(results[2].success).toBe(true);
    expect(fs.existsSync(path.join(outDir, 'input_compressed.mp4'))).toBe(true);
    expect(fs.existsSync(path.join(outDir, 'par_input2_compressed.mp4'))).toBe(true);
    expect(fs.existsSync(path.join(outDir, 'par_input3_compressed.mp4'))).toBe(true);
  });

  it('continues when one file fails in parallel', async () => {
    const validInput = path.join(tmpDir, 'par_valid.mp4');
    execSync(
      `"${ffmpegInstaller.path}" -f lavfi -i color=black:s=16x16:d=1 -c:v libx264 -t 1 "${validInput}" -y`,
      { stdio: 'ignore' }
    );
    const bogus = path.join(tmpDir, 'does-not-exist-parallel.mp4');

    const outDir = path.join(tmpDir, 'parallel-partial');
    const results = await compressMultipleVideos([bogus, validInput], {
      outputDir: outDir,
      parallel: 2,
    });

    expect(results).toHaveLength(2);
    const failure = results.find(r => !r.success);
    const success = results.find(r => r.success);
    expect(failure).toBeDefined();
    expect(failure!.inputPath).toBe(bogus);
    expect(success).toBeDefined();
    expect(success!.inputPath).toBe(validInput);
  });

  it('parallel=1 behaves like sequential', async () => {
    const outDir = path.join(tmpDir, 'parallel-one');
    const results = await compressMultipleVideos([inputPath], {
      outputDir: outDir,
      parallel: 1,
    });

    expect(results).toHaveLength(1);
    expect(results[0].success).toBe(true);
    expect(fs.existsSync(path.join(outDir, 'input_compressed.mp4'))).toBe(true);
  });
});
