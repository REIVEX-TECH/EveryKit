# EveryKit Ringtone

Cut up to 60 seconds out of a song and save it as an MP3 ringtone. The song is
decoded, trimmed, faded and re-encoded in the browser, and never uploaded.

Part of [EveryKit](https://useeverykit.com), by [Reivex](https://reivex.io).
Lives at `ringtone.useeverykit.com`.

## Local setup

```bash
npm install
npm run dev
```

Then open http://localhost:3019.

```bash
npm run typecheck   # tsc --noEmit
npm run lint        # eslint
npm test            # vitest, against synthesised tones
npm run build       # production build
npm start           # serve the production build on 3019
```

## Environment variables

None are required; every one has a working default.

| Variable | Default | What it does |
| --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | `https://ringtone.useeverykit.com` | Canonicals, OG tags, sitemap |
| `NEXT_PUBLIC_HUB_URL` | `https://useeverykit.com` | Where `/kits.json` and `/api/subscribe` are read from |
| `NEXT_PUBLIC_PAYMENTS_ENABLED` | `false` | `false` runs the launch-week path: nothing is gated behind payment |
| `NEXT_PUBLIC_LEMONSQUEEZY_CHECKOUT_URL` | — | Only needed once payments are switched on |

## How it is put together

- `lib/ringtone/audio.ts` — the maths: selection clamping, fades, 16-bit
  conversion, and the waveform summary. Pure functions over `Float32Array`, so
  everything that decides what the ringtone sounds like is tested in Node with
  no `AudioContext` in sight.
- `lib/ringtone/encode.worker.ts` — the MP3 encoder, off the main thread.
- `lib/ringtone/encode.ts` — decoding a file with the browser's own decoder, and
  driving the worker.
- `components/ringtone/Workbench.tsx` — one client component: the waveform
  canvas, the handles, the fades, and the export.

Decoding uses `AudioContext.decodeAudioData`, so the formats on offer are
whatever the browser already understands. Encoding uses
[`@breezystack/lamejs`](https://www.npmjs.com/package/@breezystack/lamejs)
(LGPL-3.0), a maintained fork of lamejs. The original `lamejs` package throws
`MPEGMode is not defined` on import under a modern bundler, which is why the
fork is here.

This kit reaches the network for nothing. The CSP `connect-src` keeps the hub,
for the cross-promotion strip and the email ask, and the checkout host; there is
no CDN, no model and no audio service.

### The decisions worth knowing about

**Sixty seconds, capped by moving the end.** Phones cut a ringtone off around
there anyway, and a cap keeps the encode quick on a phone. When a drag would
take the selection past the limit, the end handle stops and the start stays
where it is: the start is the part someone chose deliberately.

**The waveform keeps both extremes per column.** A three minute track is eight
million samples and the canvas is a few hundred pixels wide, so drawing has to
work from a summary. Keeping the minimum and the maximum of each bucket is what
makes the picture look like the audio; averaging the absolute value instead
flattens every transient into the same sausage.

**Fades are linear, half a second, and clamped so they cannot overlap.** Over
half a second the difference between a linear and a logarithmic ramp is barely
audible, and a linear one is predictable to anyone reading the file. On a very
short clip, two half-second fades would otherwise attenuate the middle twice and
dip it, which sounds like a fault rather than a fade.

**Samples are clamped before they are scaled to 16-bit.** Floats out of an
`AudioContext` can exceed 1 after mixing, and letting those wrap round turns a
loud passage into a burst of noise.

**Encoding runs in a worker, with the channels transferred.** A minute of stereo
is a few hundred milliseconds of solid arithmetic, and a few hundred
milliseconds on the main thread is a tab that stops responding to the button
that started it. The buffers are transferred rather than copied, so a ten
megabyte track is moved rather than duplicated.

**Which handle is being dragged is read outside the state updater.** React runs
updaters when it renders, not when they are queued, so a ref read inside one can
have moved on by then: a move meant for the start handle would be applied to the
end handle, and the start would snap back. It is closed over instead.

**The iPhone limitation is stated rather than worked around.** iOS takes a
ringtone as a `.m4r` placed through a computer, and no web page can write into
that part of a phone. The page says so on the result and in the FAQ instead of
implying otherwise.

### What was measured

Against a synthesised 60 second stereo WAV (10.09 MB), production build, in
Chrome at 375 x 812:

- decode and draw: 201 ms
- a 30 second selection encoded in 1.01 s, with the worst main-thread gap at
  28 ms against a 25 ms timer, so the page never blocked
- the exported MP3 decoded back to 30.024 s, 24 ms from what was asked for
- the pitch at the start and end of the export matched the 15 s and 45 s marks
  of the source, so the trim lands where the handles say it does
- fades present: 0.04 peak in the first 50 ms and 0.07 in the last 50 ms,
  against 1.0 in the middle

## Deploy notes

Runs as the PM2 process `everykit-ringtone` on **port 3019**, behind nginx.

- Process definition: `ecosystem.config.js` at the repo root.
- nginx server block: `deploy/nginx/useeverykit.conf`
  (`ringtone.useeverykit.com` → `127.0.0.1:3019`).
- Build order and reload: `deploy.sh` at the repo root.
- DNS and the certbot step for this subdomain: `LAUNCH.md`.

The subdomain needs an `A` record and a certbot run that includes **every** name
already on the certificate plus this one; see `LAUNCH.md`. Adding only the new
name would drop the others.
