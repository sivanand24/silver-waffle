export const MAX_AUDIO_BYTES = 2 * 1024 * 1024;
export const MAX_RECORDING_MS = 20000;

export function microphoneError(error) {
  if (['NotAllowedError', 'SecurityError'].includes(error?.name)) return 'माइक की अनुमति नहीं मिली। पते वाली पट्टी से माइक्रोफ़ोन की अनुमति दें, या नीचे के बटन इस्तेमाल करें।';
  if (error?.name === 'NotFoundError') return 'माइक्रोफ़ोन नहीं मिला। माइक जोड़ें या लिखकर जवाब दें।';
  if (error?.name === 'NotReadableError') return 'माइक खुल नहीं पाया। दूसरे ऐप की कॉल बंद करके फिर कोशिश करें।';
  return 'माइक शुरू नहीं हुआ। फिर कोशिश करें या लिखकर जवाब दें।';
}

// Session ownership prevents late permission, stop, and fetch callbacks from
// changing a newer recording or a screen the user has already left.
export function createVoiceRecorder({ onChange, getUserMedia, Recorder, AudioContextClass, fetcher = fetch,
  setTimer = setTimeout, clearTimer = clearTimeout, setTicker = setInterval, clearTicker = clearInterval,
  durationMs = MAX_RECORDING_MS, permissionMs = 20000, requestMs = 25000 } = {}) {
  let version = 0, active = null;
  let state = { status: 'idle', transcript: '', target: 'answer', level: 0, seconds: 0, error: '' };
  const emit = patch => { state = { ...state, ...patch }; onChange?.(state); };
  const owns = s => active === s && version === s.id;
  function release(s) {
    if (!s) return;
    clearTimer(s.permissionTimer); clearTimer(s.stopTimer); clearTimer(s.requestTimer); clearTicker(s.ticker);
    if (s.released) return;
    s.released = true;
    s.stream?.getTracks().forEach(t => { t.onended = null; t.stop(); });
    s.audio?.close()?.catch?.(() => {});
  }
  function cancel(notify = true) {
    version++;
    const old = active; active = null;
    old?.controller?.abort();
    if (old?.recorder?.state === 'recording') { try { old.recorder.stop(); } catch {} }
    release(old);
    if (notify) emit({ status:'idle', transcript:'', error:'', level:0, seconds:0 });
  }
  function fail(s, message) {
    if (!owns(s)) return;
    cancel(false);
    emit({status:'error', error:message, level:0, seconds:0, transcript:''});
  }
  async function upload(s) {
    release(s);
    if (!owns(s)) return;
    const blob = new Blob(s.chunks, {type:s.mime}); s.chunks = [];
    if (blob.size < 64) return fail(s, 'आवाज़ नहीं मिली। माइक के पास बोलकर फिर कोशिश करें।');
    if (blob.size > MAX_AUDIO_BYTES) return fail(s, 'आवाज़ का संदेश बड़ा है। छोटा जवाब बोलकर फिर कोशिश करें।');
    emit({status:'transcribing', level:0});
    s.controller = new AbortController();
    s.requestTimer = setTimer(() => { if (owns(s)) { s.controller.abort(); fail(s,'जवाब आने में देर हो रही है। इंटरनेट जाँचें या लिखकर जवाब दें।'); } }, requestMs);
    try {
      const bytes = new Uint8Array(await blob.arrayBuffer());
      let binary = ''; for (let i=0;i<bytes.length;i+=8192) binary += String.fromCharCode(...bytes.subarray(i,i+8192));
      if (!owns(s)) return;
      const response = await fetcher('/api/transcribe', {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({audioBase64:btoa(binary),mimeType:s.mime.split(';')[0]}),signal:s.controller.signal});
      const result = await response.json();
      if (!owns(s)) return;
      if (!response.ok) return fail(s, typeof result.error === 'string' ? result.error : 'आवाज़ लिखी नहीं जा सकी। फिर कोशिश करें या लिखकर जवाब दें।');
      if (typeof result.transcript !== 'string' || !result.transcript.trim()) return fail(s,'साफ़ शब्द नहीं सुनाई दिए। पास से बोलकर फिर कोशिश करें।');
      emit({status:'review', transcript:result.transcript.trim().slice(0,1200),error:'',level:0});
    } catch { if (owns(s)) fail(s,'आवाज़ भेजी नहीं जा सकी। इंटरनेट जाँचें या लिखकर जवाब दें।'); }
    finally { clearTimer(s.requestTimer); }
  }
  function stop() {
    const s = active;
    if (!s || state.status !== 'recording') return;
    emit({status:'transcribing',level:0}); clearTimer(s.stopTimer);
    try { s.recorder.stop(); release(s); } catch { fail(s,'रिकॉर्डिंग रुक नहीं पाई। दोबारा कोशिश करें।'); }
  }
  async function start(target = 'answer') {
    if (state.status === 'recording') return stop();
    if (state.status === 'permission') return cancel();
    if (state.status === 'transcribing') return;
    cancel(false);
    const s = {id:version,target,chunks:[],bytes:0,released:false}; active=s;
    emit({status:'permission',target,transcript:'',error:'',level:0,seconds:0});
    if (!getUserMedia || !Recorder) return fail(s,'यहाँ आवाज़ रिकॉर्ड नहीं हो सकती। Edge में HTTPS वाला लिंक खोलें या लिखकर जवाब दें।');
    s.permissionTimer = setTimer(()=>fail(s,'माइक की अनुमति का इंतज़ार खत्म हुआ। अनुमति देकर फिर माइक दबाएँ।'),permissionMs);
    try {
      const stream = await getUserMedia({audio:{echoCancellation:true,noiseSuppression:true,channelCount:1}});
      if (!owns(s)) { stream.getTracks().forEach(t=>t.stop()); return; }
      clearTimer(s.permissionTimer); s.stream=stream;
      s.mime = ['audio/webm;codecs=opus','audio/webm','audio/ogg;codecs=opus','audio/mp4'].find(type=>Recorder.isTypeSupported(type));
      if (!s.mime) return fail(s,'इस ब्राउज़र का आवाज़ प्रारूप समर्थित नहीं है। Edge अपडेट करें या लिखकर जवाब दें।');
      s.recorder = new Recorder(stream, {mimeType:s.mime,audioBitsPerSecond:64000});
      for (const track of stream.getTracks()) track.onended=()=>{ if (!s.released) fail(s,'माइक का संपर्क टूट गया। उसे जोड़कर फिर कोशिश करें।'); };
      s.recorder.ondataavailable = event => {
        if (!owns(s) || !event.data.size) return;
        s.chunks.push(event.data); s.bytes+=event.data.size;
        if (s.bytes>MAX_AUDIO_BYTES) fail(s,'आवाज़ का संदेश बड़ा है। छोटा जवाब बोलें।');
      };
      s.recorder.onstop = () => { if (owns(s)) void upload(s); };
      s.recorder.onerror = () => fail(s,'रिकॉर्डिंग में समस्या हुई। माइक फिर दबाएँ या लिखकर जवाब दें।');
      try {
        if (AudioContextClass) {
          s.audio = new AudioContextClass(); s.audio.resume().catch(()=>{});
          s.analyser = s.audio.createAnalyser(); s.analyser.fftSize=256;
          s.audio.createMediaStreamSource(stream).connect(s.analyser);
          s.samples=new Uint8Array(s.analyser.fftSize);
        }
      } catch { /* Recording remains available without a level meter. */ }
      s.started=Date.now(); s.recorder.start(500);
      emit({status:'recording'});
      s.ticker=setTicker(()=>{
        if (!owns(s)) return;
        let level=0;
        if (s.analyser) { s.analyser.getByteTimeDomainData(s.samples); level=Math.min(1,Math.sqrt(s.samples.reduce((sum,v)=>sum+((v-128)/128)**2,0)/s.samples.length)*5); }
        emit({level,seconds:Math.min(20,Math.floor((Date.now()-s.started)/1000))});
      },100);
      s.stopTimer=setTimer(stop,durationMs);
    } catch (error) { fail(s,microphoneError(error)); }
  }
  return { start,stop,cancel,getState:()=>state,destroy:()=>cancel(false) };
}
