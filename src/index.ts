#!/usr/bin/env node

import { Command } from 'commander';
import { compressVideo, compressMultipleVideos } from './compress';
import { getVideoFiles } from './utils';
import * as fs from 'fs';
import * as path from 'path';

const program = new Command();

// Read package.json
const packageJson = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../package.json'), 'utf-8')
);

program
  .name('gyu')
  .description('Squeeze your videos down - Fast and simple video compression CLI')
  .version(packageJson.version);

program
  .argument('[files...]', 'Video files to compress (multiple allowed, wildcards supported)')
  .option('-o, --output <dir>', 'Output directory')
  .option('-q, --quality <level>', 'Compression quality (high/medium/low)', 'medium')
  .action(async (files: string[], options) => {
    try {
      const VALID_QUALITIES = ['high', 'medium', 'low'];
      if (!VALID_QUALITIES.includes(options.quality)) {
        console.error(`❌ Error: Invalid quality "${options.quality}". Must be: high, medium, or low`);
        process.exit(1);
      }

      if (!files || files.length === 0) {
        console.error('❌ Error: Please specify files to compress');
        console.log('\nUsage:');
        console.log('  gyu video.mp4');
        console.log('  gyu video1.mp4 video2.mp4');
        console.log('  gyu *.mp4');
        console.log('  gyu videos/');
        process.exit(1);
      }

      // Get list of video files
      const videoFiles = await getVideoFiles(files);

      if (videoFiles.length === 0) {
        console.error('❌ Error: No compressible video files found');
        process.exit(1);
      }

      console.log(`\n🎬 Compressing ${videoFiles.length} file(s)...\n`);

      // Compress multiple files
      await compressMultipleVideos(videoFiles, {
        quality: options.quality,
        outputDir: options.output,
      });

      console.log('\n✅ All files compressed successfully!\n');
    } catch (error) {
      console.error('\n❌ An error occurred:', error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

program.parse();
