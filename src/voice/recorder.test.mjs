import test from "node:test";
import assert from "node:assert/strict";
import { createVoiceRecorder } from "./recorder.js";
const tick = () => new Promise((r) => setTimeout(r, 8));
function fixture(extra = {}) {
  const states = [],
    recorders = [],
    tracks = [];
  class Recorder {
    static isTypeSupported(type) {
      return type.startsWith("audio/webm");
    }
    constructor() {
      this.state = "inactive";
      recorders.push(this);
    }
    start() {
      this.state = "recording";
    }
    stop() {
      this.state = "inactive";
      queueMicrotask(() => {
        this.ondataavailable?.({
          data: new Blob([new Uint8Array(128)], { type: "audio/webm" }),
        });
        this.onstop?.();
      });
    }
  }
  const stream = () => {
    const t = {
      stopped: false,
      stop() {
        this.stopped = true;
      },
    };
    tracks.push(t);
    return { getTracks: () => [t] };
  };
  const controller = createVoiceRecorder({
    onChange: (s) => states.push({ ...s }),
    Recorder,
    getUserMedia: async () => stream(),
    fetcher: async () => ({
      ok: true,
      json: async () => ({ transcript: "हाँ" }),
    }),
    ...extra,
  });
  return { controller, states, recorders, tracks, stream };
}
test("record stop releases hardware and surfaces transcript for review", async () => {
  const f = fixture();
  try {
    await f.controller.start("answer");
    assert.equal(f.controller.getState().status, "recording");
    f.controller.stop();
    await tick();
    assert.ok(f.tracks.every((t) => t.stopped));
    assert.equal(f.controller.getState().status, "review");
    assert.equal(f.controller.getState().transcript, "हाँ");
  } finally {
    f.controller.destroy();
  }
});
test("permission resolving after navigation is discarded and stream stopped", async () => {
  let grant;
  const f = fixture({ getUserMedia: () => new Promise((r) => (grant = r)) });
  const pending = f.controller.start();
  f.controller.cancel();
  grant(f.stream());
  await pending;
  assert.equal(f.recorders.length, 0);
  assert.equal(f.tracks[0].stopped, true);
  assert.equal(f.controller.getState().status, "idle");
  f.controller.destroy();
});
test("late old recording callbacks cannot clear or apply to a newer session", async () => {
  const f = fixture();
  await f.controller.start();
  const old = f.recorders[0];
  f.controller.cancel();
  await f.controller.start();
  old.onstop();
  await tick();
  assert.equal(f.controller.getState().status, "recording");
  f.controller.destroy();
});
test("cancel ignores pending transcription and aborts its request", async () => {
  let resolveFetch, signal;
  const f = fixture({
    fetcher: (_url, options) => {
      signal = options.signal;
      return new Promise((r) => (resolveFetch = r));
    },
  });
  await f.controller.start("guide");
  f.controller.stop();
  await tick();
  f.controller.cancel();
  assert.equal(signal.aborted, true);
  resolveFetch({ ok: true, json: async () => ({ transcript: "पुराना जवाब" }) });
  await tick();
  assert.equal(f.controller.getState().status, "idle");
  assert.equal(f.controller.getState().transcript, "");
  f.controller.destroy();
});
test("automatic stop ends recording without another button press", async () => {
  const f = fixture({ durationMs: 5 });
  await f.controller.start();
  await new Promise((r) => setTimeout(r, 25));
  assert.equal(f.controller.getState().status, "review");
  assert.ok(f.tracks[0].stopped);
  f.controller.destroy();
});
test("permission denial and silent audio responses produce usable errors", async () => {
  const f = fixture({
    getUserMedia: async () => {
      throw Object.assign(Error(), { name: "NotAllowedError" });
    },
  });
  await f.controller.start();
  assert.equal(f.controller.getState().status, "error");
  assert.match(f.controller.getState().error, /अनुमति/);
  f.controller.destroy();
  const silent = fixture({
    fetcher: async () => ({
      ok: false,
      json: async () => ({ error: "साफ़ शब्द नहीं सुनाई दिए।" }),
    }),
  });
  await silent.controller.start();
  silent.controller.stop();
  await tick();
  assert.equal(silent.controller.getState().status, "error");
  assert.ok(silent.tracks[0].stopped);
  silent.controller.destroy();
});
test("disconnected microphone stops the session", async () => {
  const f = fixture();
  await f.controller.start();
  f.tracks[0].onended();
  await tick();
  assert.equal(f.controller.getState().status, "error");
  assert.match(f.controller.getState().error, /संपर्क/);
  f.controller.destroy();
});
test("permission timeout releases a subsequently granted microphone", async () => {
  let grant;
  const f = fixture({
    permissionMs: 5,
    getUserMedia: () => new Promise((r) => (grant = r)),
  });
  const pending = f.controller.start();
  await new Promise((r) => setTimeout(r, 15));
  grant(f.stream());
  await pending;
  assert.equal(f.controller.getState().status, "error");
  assert.ok(f.tracks[0].stopped);
  f.controller.destroy();
});
