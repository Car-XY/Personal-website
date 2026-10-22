"""Clean and fade the supplied ignition, rev, and horn recordings."""
from pathlib import Path
import argparse
import shutil
import subprocess

parser = argparse.ArgumentParser()
parser.add_argument('--ffmpeg', default=shutil.which('ffmpeg'))
parser.add_argument('--engine', default='tmp/new-r8-source.wav')
parser.add_argument('--horn', default='tmp/horn-source.wav')
args = parser.parse_args()
if not args.ffmpeg:
    parser.error('Provide --ffmpeg or install ffmpeg on PATH')

output = Path('public/audio')
output.mkdir(parents=True, exist_ok=True)
clean = 'highpass=f=35,lowpass=f=9000,afftdn=nr=8:nf=-35:tn=1:gs=5,alimiter=limit=0.94:level=0:latency=1'

def export(source, start, duration, filters, filename, codec):
    subprocess.run([args.ffmpeg, '-hide_banner', '-loglevel', 'error', '-y',
                    '-ss', str(start), '-i', source, '-t', str(duration),
                    '-af', filters, '-ar', '44100', '-ac', '2',
                    '-c:a', codec, str(output / filename)], check=True)

# Cut the low-level lead-in so the first rev begins immediately after its fade.
export(args.engine, 56.85, 6.15, clean + ',afade=t=in:d=0.15,afade=t=out:st=5.35:d=0.8',
       'engine-rev.wav', 'pcm_s16le')
# The same faded ignition is used for the initial start and each highway re-entry.
export(args.engine, 83, 6, clean + ',afade=t=in:d=0.2,afade=t=out:st=5.05:d=0.95',
       'engine-start.wav', 'pcm_s16le')
export(args.horn, 1.02, 1.78, 'highpass=f=60,afade=t=in:d=0.01,afade=t=out:st=1.7:d=0.08',
       'car-horn.mp3', 'libmp3lame')
