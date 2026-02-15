#!/usr/bin/env node

import { Command } from 'commander';
import { compressVideo, compressMultipleVideos } from './compress';
import { getVideoFiles } from './utils';
import * as fs from 'fs';
import * as os from 'os';
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
  .option('-p, --parallel [n]', 'Compress N videos in parallel (default: number of CPU cores)')
  .action(async (files: string[], options) => {
    try {
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

      // Parse parallel option
      let parallel = 1;
      if (options.parallel !== undefined) {
        if (options.parallel === true) {
          // Flag present without value: --parallel
          parallel = os.cpus().length;
        } else {
          parallel = parseInt(options.parallel, 10);
          if (isNaN(parallel) || parallel < 1) {
            console.error('❌ Error: --parallel must be a positive integer');
            process.exit(1);
          }
        }
        const cpuCores = os.cpus().length;
        if (parallel > cpuCores) {
          parallel = cpuCores;
        }
      }

      console.log(`\n🎬 Compressing ${videoFiles.length} file(s)${parallel > 1 ? ` (${parallel} parallel)` : ''}...\n`);

      // Compress multiple files
      const results = await compressMultipleVideos(videoFiles, {
        quality: options.quality,
        outputDir: options.output,
        parallel,
      });

      const failures = results.filter(r => !r.success);
      if (failures.length === 0) {
        console.log('\n✅ All files compressed successfully!\n');
      } else {
        console.log(`\n⚠️  ${results.length - failures.length}/${results.length} files compressed successfully.`);
        console.log(`❌ ${failures.length} file(s) failed:`);
        for (const f of failures) {
          console.log(`   - ${path.basename(f.inputPath)}: ${f.error}`);
        }
        console.log('');
        process.exit(1);
      }
    } catch (error) {
      console.error('\n❌ An error occurred:', error);
      process.exit(1);
    }
  });

program.parse();
