import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { getVideoFiles } from './utils';

let tmpDir: string;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'gyu-utils-test-'));

  // All supported video extensions
  fs.writeFileSync(path.join(tmpDir, 'video.mp4'), '');
  fs.writeFileSync(path.join(tmpDir, 'clip.mov'), '');
  fs.writeFileSync(path.join(tmpDir, 'song.avi'), '');
  fs.writeFileSync(path.join(tmpDir, 'stream.flv'), '');
  fs.writeFileSync(path.join(tmpDir, 'screen.wmv'), '');
  fs.writeFileSync(path.join(tmpDir, 'web.webm'), '');
  fs.writeFileSync(path.join(tmpDir, 'apple.m4v'), '');

  // Non-video files
  fs.writeFileSync(path.join(tmpDir, 'photo.jpg'), '');
  fs.writeFileSync(path.join(tmpDir, 'readme.txt'), '');
  fs.writeFileSync(path.join(tmpDir, 'data.csv'), '');
  fs.writeFileSync(path.join(tmpDir, 'style.css'), '');

  // Nested subdirectory with a video
  fs.mkdirSync(path.join(tmpDir, 'sub'));
  fs.writeFileSync(path.join(tmpDir, 'sub', 'nested.mkv'), '');
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true });
});

describe('getVideoFiles', () => {
  it('returns only video files from a directory (including nested)', async () => {
    const result = await getVideoFiles([tmpDir]);

    // All 8 supported extensions are found
    expect(result).toContain(path.join(tmpDir, 'video.mp4'));
    expect(result).toContain(path.join(tmpDir, 'clip.mov'));
    expect(result).toContain(path.join(tmpDir, 'song.avi'));
    expect(result).toContain(path.join(tmpDir, 'sub', 'nested.mkv'));
    expect(result).toContain(path.join(tmpDir, 'stream.flv'));
    expect(result).toContain(path.join(tmpDir, 'screen.wmv'));
    expect(result).toContain(path.join(tmpDir, 'web.webm'));
    expect(result).toContain(path.join(tmpDir, 'apple.m4v'));

    // Non-video files are excluded
    expect(result).not.toContain(path.join(tmpDir, 'photo.jpg'));
    expect(result).not.toContain(path.join(tmpDir, 'readme.txt'));
    expect(result).not.toContain(path.join(tmpDir, 'data.csv'));
    expect(result).not.toContain(path.join(tmpDir, 'style.css'));

    expect(result).toHaveLength(8);
  });

  it('recognizes .mp4 as a video file', async () => {
    const filePath = path.join(tmpDir, 'video.mp4');
    const result = await getVideoFiles([filePath]);
    expect(result).toEqual([filePath]);
  });

  it('recognizes .mov as a video file', async () => {
    const filePath = path.join(tmpDir, 'clip.mov');
    const result = await getVideoFiles([filePath]);
    expect(result).toEqual([filePath]);
  });

  it('recognizes .avi as a video file', async () => {
    const filePath = path.join(tmpDir, 'song.avi');
    const result = await getVideoFiles([filePath]);
    expect(result).toEqual([filePath]);
  });

  it('recognizes .mkv as a video file', async () => {
    const filePath = path.join(tmpDir, 'sub/nested.mkv');
    const result = await getVideoFiles([filePath]);
    expect(result).toEqual([filePath]);
  });

  it('recognizes .flv as a video file', async () => {
    const filePath = path.join(tmpDir, 'stream.flv');
    const result = await getVideoFiles([filePath]);
    expect(result).toEqual([filePath]);
  });

  it('recognizes .wmv as a video file', async () => {
    const filePath = path.join(tmpDir, 'screen.wmv');
    const result = await getVideoFiles([filePath]);
    expect(result).toEqual([filePath]);
  });

  it('recognizes .webm as a video file', async () => {
    const filePath = path.join(tmpDir, 'web.webm');
    const result = await getVideoFiles([filePath]);
    expect(result).toEqual([filePath]);
  });

  it('recognizes .m4v as a video file', async () => {
    const filePath = path.join(tmpDir, 'apple.m4v');
    const result = await getVideoFiles([filePath]);
    expect(result).toEqual([filePath]);
  });

  it('rejects .jpg as a non-video file', async () => {
    const filePath = path.join(tmpDir, 'photo.jpg');
    const result = await getVideoFiles([filePath]);
    expect(result).toEqual([]);
  });

  it('rejects .txt as a non-video file', async () => {
    const filePath = path.join(tmpDir, 'readme.txt');
    const result = await getVideoFiles([filePath]);
    expect(result).toEqual([]);
  });

  it('rejects .csv as a non-video file', async () => {
    const filePath = path.join(tmpDir, 'data.csv');
    const result = await getVideoFiles([filePath]);
    expect(result).toEqual([]);
  });

  it('rejects .css as a non-video file', async () => {
    const filePath = path.join(tmpDir, 'style.css');
    const result = await getVideoFiles([filePath]);
    expect(result).toEqual([]);
  });

  it('handles wildcard patterns', async () => {
    const result = await getVideoFiles([path.join(tmpDir, '*.mp4')]);

    expect(result).toEqual([path.join(tmpDir, 'video.mp4')]);
  });

  it('includes a regular video file path', async () => {
    const filePath = path.join(tmpDir, 'video.mp4');
    const result = await getVideoFiles([filePath]);

    expect(result).toEqual([filePath]);
  });

  it('excludes a non-video regular file path', async () => {
    const result = await getVideoFiles([path.join(tmpDir, 'readme.txt')]);

    expect(result).toEqual([]);
  });

  it('warns and returns empty for a non-existent file', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const bogus = path.join(tmpDir, 'no-such-file.mp4');

    const result = await getVideoFiles([bogus]);

    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining(bogus));
    expect(result).toEqual([]);

    warnSpy.mockRestore();
  });

  it('deduplicates file paths', async () => {
    const filePath = path.join(tmpDir, 'video.mp4');
    const result = await getVideoFiles([filePath, filePath]);

    expect(result).toEqual([filePath]);
  });
});
