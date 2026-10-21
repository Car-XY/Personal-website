"""Prepare the recorded cruise sustain. Input must be a full-length PCM16 WAV."""
from pathlib import Path
import argparse
import wave
import numpy as np

parser = argparse.ArgumentParser()
parser.add_argument('source', nargs='?', default='tmp/new-r8-source.wav')
parser.add_argument('--start', type=float, default=22)
parser.add_argument('--end', type=float, default=34)
parser.add_argument('--crossfade', type=float, default=.12)
parser.add_argument('--output', default='public/audio/engine-cruise.wav')
args = parser.parse_args()
with wave.open(args.source, 'rb') as stream:
    if stream.getsampwidth() != 2:
        raise ValueError('Decode the original to PCM16 first')
    rate, channels = stream.getframerate(), stream.getnchannels()
    stream.setpos(round(args.start * rate))
    part = np.frombuffer(stream.readframes(round((args.end-args.start)*rate)), dtype='<i2').reshape(-1, channels).astype(float)/32768

count = round(rate*args.crossfade)
if len(part) < count*4:
    raise ValueError('The source passage is too short')
part -= part.mean(axis=0)
head, tail = part[:count], part[-count:]
weight = (.5-.5*np.cos(np.pi*np.arange(count)/count))[:,None]
correlation = np.clip(np.sum(head*tail)/np.sqrt(np.sum(head**2)*np.sum(tail**2)), -.5, 1)
correction = np.minimum(1.35, 1/np.sqrt((1-weight)**2+weight**2+2*correlation*weight*(1-weight)))
join = (tail*(1-weight)+head*weight)*correction
# Ends continue into adjacent original PCM frames instead of fading to silence.
loop = np.concatenate((part[count:-count], join))
loop *= min(.12/np.sqrt(np.mean(loop**2)), .9/max(abs(loop).max(), 1e-9))
output = Path(args.output)
with wave.open(str(output), 'wb') as stream:
    stream.setnchannels(channels); stream.setsampwidth(2); stream.setframerate(rate)
    stream.writeframes((loop*32767).astype('<i2').tobytes())
chunk = round(rate*.1)
levels = np.array([np.sqrt(np.mean(loop[i:i+chunk]**2)) for i in range(0,len(loop)-chunk,chunk)])
adjacent = np.sqrt(np.mean(np.diff(loop,axis=0)**2))
seam = np.sqrt(np.mean((loop[-1]-loop[0])**2))
print(f'Source {args.start:.2f}-{args.end:.2f}s; loop {len(loop)/rate:.2f}s; envelope CV {levels.std()/levels.mean():.3f}; seam/adjacent {seam/adjacent:.2f}')
