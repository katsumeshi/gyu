# gyu (ギュッ) 🎬

> Squeeze your videos down - Fast and simple video compression CLI

A simple command-line tool to compress video files easily. Wraps ffmpeg to achieve high-quality compression with simple commands.

## ✨ Features

- 🚀 **Simple** - No complex configuration, ready to use
- 📦 **Batch Processing** - Compress multiple files or entire directories at once
- 🎯 **Quality Selection** - Choose from high/medium/low presets
- 📊 **Progress Display** - Real-time compression status
- 🌍 **Multiple Formats** - Supports MP4, MOV, AVI, MKV, and more

## 📦 Installation

```bash
# Install globally via npm
npm install -g gyu-cli

# Or run directly with npx (no installation needed)
npx gyu-cli video.mp4
```

## 🚀 Usage

### Basic Usage

```bash
# Compress a single file
gyu video.mp4

# Compress multiple files
gyu video1.mp4 video2.mp4

# Batch compress with wildcards
gyu *.mp4

# Compress all videos in a directory
gyu videos/
```

### Options

```bash
# Specify quality level (high/medium/low)
gyu video.mp4 --quality high
gyu video.mp4 -q low

# Specify output directory
gyu video.mp4 --output compressed/
gyu *.mp4 -o output/

# Combine options
gyu *.mp4 -q high -o compressed/
```

### Quality Levels

| Level    | CRF | Use Case                               |
| -------- | --- | -------------------------------------- |
| `high`   | 20  | When you want to preserve high quality |
| `medium` | 23  | Balanced quality and size (default)    |
| `low`    | 28  | Prioritize file size reduction         |

## 📖 Examples

### Example 1: Compress videos from your phone

```bash
gyu DCIM/*.mp4 -o compressed/
```

### Example 2: High-quality compression for presentations

```bash
gyu presentation.mp4 -q high
```

### Example 3: Small files for Slack/Discord

```bash
gyu demo.mov -q low
```

## 📝 Output Files

Compressed files are named with `_compressed` appended to the original filename.

```
video.mp4 → video_compressed.mp4
demo.mov → demo_compressed.mov
```

## 🛠️ Development

### Local Development

```bash
# Clone the repository
git clone https://github.com/katsumeshi/gyu.git
cd gyu

# Install dependencies
npm install

# Build
npm run build

# Run
npm run dev -- video.mp4
```

### Build

```bash
npm run build
```

## 📄 License

MIT

## 🤝 Contributing

Issues and Pull Requests are welcome!

## ❓ FAQ

### Q: How much compression can I expect?

A: Depending on the video content, you can typically expect 30-70% file size reduction.

### Q: Will the quality degrade?

A: With CRF 23 (medium), the difference is barely noticeable to the human eye. Use `--quality high` if you need even better quality.

### Q: What video formats are supported?

A: MP4, MOV, AVI, MKV, FLV, WMV, M4V - basically any format that ffmpeg supports.

### Q: Is audio also compressed?

A: Yes. Audio is converted to AAC at 128kbps.

## 🙏 Acknowledgments

This tool uses [ffmpeg](https://ffmpeg.org/).

---

Made with ❤️ and ギュッ (gyu - squeeze!)
