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
    await compressVideo(inputPath);

    const outputPath = path.join(tmpDir, 'input_compressed.mp4');
    expect(fs.existsSync(outputPath)).toBe(true);
    expect(fs.statSync(outputPath).size).toBeGreaterThan(0);
  });

  it('creates output directory when outputDir does not exist', async () => {
    const subdir = path.join(tmpDir, 'custom-output');

    await compressVideo(inputPath, { outputDir: subdir });

    const outputPath = path.join(subdir, 'input_compressed.mp4');
    expect(fs.existsSync(subdir)).toBe(true);
    expect(fs.existsSync(outputPath)).toBe(true);
    expect(fs.statSync(outputPath).size).toBeGreaterThan(0);
  });

  it('compresses with quality "low" successfully', async () => {
    const subdir = path.join(tmpDir, 'low-quality');

    await compressVideo(inputPath, { quality: 'low', outputDir: subdir });

    const outputPath = path.join(subdir, 'input_compressed.mp4');
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

    await compressVideo(input, { outputDir: outDir });

    const outputPath = path.join(outDir, 'test_compressed.mov');
    expect(fs.existsSync(outputPath)).toBe(true);
    expect(fs.statSync(outputPath).size).toBeGreaterThan(0);
  });

  it('compresses .avi files successfully', async () => {
    const input = path.join(tmpDir, 'test.avi');
    fs.copyFileSync(inputPath, input);
    const outDir = path.join(tmpDir, 'out-avi');

    await compressVideo(input, { outputDir: outDir });

    const outputPath = path.join(outDir, 'test_compressed.avi');
    expect(fs.existsSync(outputPath)).toBe(true);
    expect(fs.statSync(outputPath).size).toBeGreaterThan(0);
  });

  it('compresses .mkv files successfully', async () => {
    const input = path.join(tmpDir, 'test.mkv');
    fs.copyFileSync(inputPath, input);
    const outDir = path.join(tmpDir, 'out-mkv');

    await compressVideo(input, { outputDir: outDir });

    const outputPath = path.join(outDir, 'test_compressed.mkv');
    expect(fs.existsSync(outputPath)).toBe(true);
    expect(fs.statSync(outputPath).size).toBeGreaterThan(0);
  });

  it('compresses .flv files successfully', async () => {
    const input = path.join(tmpDir, 'test.flv');
    fs.copyFileSync(inputPath, input);
    const outDir = path.join(tmpDir, 'out-flv');

    await compressVideo(input, { outputDir: outDir });

    const outputPath = path.join(outDir, 'test_compressed.flv');
    expect(fs.existsSync(outputPath)).toBe(true);
    expect(fs.statSync(outputPath).size).toBeGreaterThan(0);
  });

  it('compresses .wmv files successfully', async () => {
    const input = path.join(tmpDir, 'test.wmv');
    fs.copyFileSync(inputPath, input);
    const outDir = path.join(tmpDir, 'out-wmv');

    await compressVideo(input, { outputDir: outDir });

    const outputPath = path.join(outDir, 'test_compressed.wmv');
    expect(fs.existsSync(outputPath)).toBe(true);
    expect(fs.statSync(outputPath).size).toBeGreaterThan(0);
  });

  it('compresses .m4v files successfully', async () => {
    const input = path.join(tmpDir, 'test.m4v');
    fs.copyFileSync(inputPath, input);
    const outDir = path.join(tmpDir, 'out-m4v');

    await compressVideo(input, { outputDir: outDir });

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
    await compressMultipleVideos([inputPath, input2], { outputDir: outDir });

    expect(fs.existsSync(path.join(outDir, 'input_compressed.mp4'))).toBe(true);
    expect(fs.existsSync(path.join(outDir, 'input2_compressed.mp4'))).toBe(true);
  });
});
