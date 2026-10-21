"""Build a level, periodic sustain from the supplied real R8 recording."""
from pathlib import Path
import wave
import numpy as np

source = Path('tmp/r8-source.wav')
with wave.open(str(source), 'rb') as stream:
    rate, channels = stream.getframerate(), stream.getnchannels()
    samples = np.frombuffer(stream.readframes(stream.getnframes()), dtype='<i2').reshape(-1, channels).astype(float) / 32768

# Choose the most stable audible 1.8-second passage, avoiding silence and shifts.
frame = int(rate * .06)
mono = samples.mean(axis=1)
features = []
for start in range(0, len(mono)-frame, frame):
    part = mono[start:start+frame]
    power = abs(np.fft.rfft(part * np.hanning(frame))) ** 2
    frequencies = np.fft.rfftfreq(frame, 1/rate)
    rms = np.sqrt(np.mean(part*part))
    centroid = np.sum(power * frequencies) / max(np.sum(power), 1e-12)
    features.append((rms,centroid))
features = np.array(features)
span = 30
candidates = []
for i in range(len(features)-span):
    window = features[i:i+span]
    if window[:,0].mean() < .025:
        continue
    score = np.std(np.log(window[:,0]+1e-6)) + np.std(np.log(window[:,1]+1))
    candidates.append((score,i))
_, selected = min(candidates)
start = selected * frame
half = int(rate * .9)
part = samples[start:start+half*2]

# Half-cosine overlap: the last frame continues naturally into the first frame.
weight = (.5-.5*np.cos(np.pi*np.arange(half)/half))[:,None]
loop = part[:half]*weight + part[half:half*2]*(1-weight)

# Flatten the slow amplitude envelope with a circular gain curve (no end fades).
chunk = int(rate*.03)
levels = np.array([np.sqrt(np.mean(loop[i:i+chunk]**2)) for i in range(0,len(loop),chunk)])
smoothed = sum(np.roll(levels,shift) for shift in range(-3,4))/7
gain = np.interp(np.arange(half),np.arange(len(levels))*chunk,np.clip(.12/(smoothed+1e-6),.4,3),period=half)
loop = np.clip(loop*gain[:,None],-.95,.95)
output = Path('public/audio/r8-cruise-steady.wav')
with wave.open(str(output), 'wb') as stream:
    stream.setnchannels(channels); stream.setsampwidth(2); stream.setframerate(rate)
    stream.writeframes((loop*32767).astype('<i2').tobytes())
adjacent = np.sqrt(np.mean(np.diff(loop,axis=0)**2))
seam = np.sqrt(np.mean((loop[-1]-loop[0])**2))
out_levels = np.array([np.sqrt(np.mean(loop[i:i+chunk]**2)) for i in range(0,len(loop),chunk)])
print(f'Recorded sustain: source {start/rate:.2f}s, loop {len(loop)/rate:.2f}s, RMS variation {out_levels.std()/out_levels.mean():.3f}, seam/adjacent-step {seam/adjacent:.2f}')
