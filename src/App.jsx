import React, { useEffect, useRef, useState } from 'react';
import { HeartHandshake, Mic, Volume2, VolumeX, Check, X, HelpCircle, Flame, Home, UserRound, FileText, UsersRound, Landmark, IdCard, PenLine, ChevronLeft, RotateCcw, Phone, ExternalLink, Download, MessageCircle, ShieldCheck, Headphones, CircleCheck, Pause, Send, BookOpen, LoaderCircle } from 'lucide-react';
import { QUESTIONS, DOCUMENTS, SOURCE, FAQ, getAssessment, getDocumentSummary, speechChoice } from './flow.js';

const ICONS = { person: UserRound, flame: Flame, home: Home, file: FileText, id: IdCard, users: UsersRound, bank: Landmark, pen: PenLine };
function ItemIcon({ name, ...props }) { const Icon = ICONS[name] || FileText; return <Icon {...props} />; }
const initialAnswers = {};

export default function App() {
  const [screen, setScreen] = useState('welcome');
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState(initialAnswers);
  const [documents, setDocuments] = useState({});
  const [audioOn, setAudioOn] = useState(true);
  const [speaking, setSpeaking] = useState(false);
  const [listening, setListening] = useState(false);
  const [live, setLive] = useState('');
  const [notice, setNotice] = useState('');
  const [guide, setGuide] = useState(false);
  const [teachback, setTeachback] = useState(false);
  const [query, setQuery] = useState('');
  const [reply, setReply] = useState(null);
  const [busy, setBusy] = useState(false);
  const [configured, setConfigured] = useState(false);
  const [sourcesOpen, setSourcesOpen] = useState(false);
  const recognition = useRef(null);
  const request = useRef(null);
  const heading = useRef(null);
  const modalInput = useRef(null);
  const guideTrigger = useRef(null);
  const dialogRef = useRef(null);
  const started = useRef(false);
  const utterance = useRef(null);
  const listeningRef = useRef(false);
  const resultHandler = useRef(null);
  const currentQuestion = QUESTIONS[questionIndex];
  const assessment = getAssessment(answers);
  const summary = getDocumentSummary(documents);
  const progress = screen === 'welcome' ? 0 : screen === 'questions' ? 1 : screen === 'assessment' ? 1 : screen === 'documents' ? 2 : 3;

  useEffect(() => {
    fetch('/api/health').then(r => r.ok ? r.json() : {}).then(r => setConfigured(Boolean(r.geminiConfigured))).catch(() => {});
    const synth = window.speechSynthesis;
    const warm = () => synth?.getVoices();
    warm(); synth?.addEventListener?.('voiceschanged', warm);
    return () => { synth?.removeEventListener?.('voiceschanged', warm); recognition.current?.abort(); request.current?.abort(); window.speechSynthesis?.cancel(); };
  }, []);

  function speak(text, force = false) {
    if (!audioOn && !force) return;
    const synth = window.speechSynthesis;
    if (!synth) { setNotice('इस ब्राउज़र पर आवाज़ उपलब्ध नहीं है. आप नीचे के बड़े बटन इस्तेमाल कर सकती हैं.'); return; }
    if (listeningRef.current) return; // never talk over the microphone
    synth.cancel();
    const speech = new SpeechSynthesisUtterance(text);
    utterance.current = speech;
    const hindi = synth.getVoices().find(v => v.lang.replace('_', '-').toLowerCase().startsWith('hi'));
    speech.lang = 'hi-IN'; speech.rate = 0.9; speech.pitch = 1;
    if (hindi) speech.voice = hindi;
    speech.onstart = () => { if (utterance.current === speech) setSpeaking(true); };
    speech.onend = () => { if (utterance.current === speech) setSpeaking(false); };
    speech.onerror = e => {
      if (utterance.current !== speech) return;
      setSpeaking(false);
      if (e.error !== 'interrupted' && e.error !== 'canceled') setNotice('हिंदी आवाज़ नहीं चल पाई. नीचे लिखे सवाल और बड़े बटन से आगे बढ़ें.');
    };
    // Chrome drops speak() issued in the same tick as cancel()
    setTimeout(() => { if (utterance.current === speech) synth.speak(speech); }, 60);
  }

  function screenSpeech() {
    if (screen === 'welcome') return 'नमस्ते. मैं अपनी बात हूँ. उज्ज्वला योजना के गैस कनेक्शन की तैयारी में आपकी मदद करूँगी. शुरू करने के लिए हाँ, मदद चाहिए वाला बटन दबाएँ.';
    if (screen === 'questions') return `${currentQuestion.title} ${currentQuestion.hint} आप हाँ, नहीं, या पता नहीं चुन सकती हैं.`;
    if (screen === 'assessment') return `${assessment.title} ${assessment.message}`;
    if (screen === 'documents') return 'अब कागज़ों को एक एक करके देखें. जो आपके पास है, उसके लिए है चुनें. नहीं है तो नहीं है चुनें. आधार या बैंक का नंबर यहाँ न लिखें.';
    return `आपकी तैयारी की सूची बन गई है. ${summary.ready.length} तरह के कागज़ तैयार हैं. ${summary.remaining.length} की तैयारी या जाँच बाकी है. आवेदन अभी जमा नहीं हुआ है. अंतिम जाँच और उँगली की पहचान गैस एजेंसी करेगी.`;
  }

  useEffect(() => {
    if (!started.current) return;
    heading.current?.focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: 'smooth' });
    speak(screenSpeech());
  }, [screen, questionIndex]);

  useEffect(() => {
    if (guide) { dialogRef.current?.showModal(); modalInput.current?.focus(); }
    else dialogRef.current?.close();
  }, [guide]);

  function start() { started.current = true; setNotice(''); setScreen('questions'); }
  function choose(value) {
    setAnswers(prev => ({ ...prev, [currentQuestion.id]: value }));
    setNotice('');
    if ((currentQuestion.id === 'adult' && value === 'no') || (['lpg','png'].includes(currentQuestion.id) && value === 'yes')) setScreen('assessment');
    else if (questionIndex < QUESTIONS.length - 1) setQuestionIndex(i => i + 1);
    else setScreen('assessment');
  }
  function previous() {
    if (screen === 'questions') { if (questionIndex) setQuestionIndex(i => i - 1); else setScreen('welcome'); }
    else if (screen === 'assessment') setScreen('questions');
    else if (screen === 'documents') setScreen('assessment');
    else setScreen('documents');
  }
  function reset() {
    recognition.current?.abort(); request.current?.abort(); request.current = null; window.speechSynthesis?.cancel();
    started.current = false; setScreen('welcome'); setQuestionIndex(0); setAnswers({}); setDocuments({}); setGuide(false); setReply(null); setQuery(''); setBusy(false); setNotice(''); setSpeaking(false); setMic(false);
  }
  function openGuide(isTeachback = false) {
    guideTrigger.current = document.activeElement;
    setTeachback(isTeachback); setQuery(''); setReply(null); setGuide(true);
    if (isTeachback) speak('अब आप बताइए. गैस एजेंसी जाते समय आप कौन से कागज़ ले जाएँगी? बोलकर या लिखकर बताइए.');
  }
  function closeGuide() {
    recognition.current?.abort(); request.current?.abort(); request.current = null; stopSpeaking();
    setGuide(false); setBusy(false); guideTrigger.current?.focus();
  }
  async function ask(text = query) {
    if (!text.trim() || busy) return;
    setQuery(text); setBusy(true); setReply(null);
    const controller = new AbortController(); request.current = controller;
    const timer = setTimeout(() => controller.abort(), 25000);
    try {
      const response = await fetch('/api/guide', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({question:text,context:{step:teachback?'teachback':screen==='questions'?currentQuestion.id:screen,answers,documents}}), signal:controller.signal });
      if (!response.ok) throw new Error('unavailable');
      const data = await response.json();
      if (typeof data.answer !== 'string') throw new Error('invalid');
      if (request.current !== controller) return;
      setReply(data); speak(data.answer);
    } catch {
      if (request.current !== controller) return;
      const data = { answer:'अभी सवाल का जवाब नहीं मिल पाया. आपकी तैयारी जारी रह सकती है. सरकारी जानकारी के लिए उज्ज्वला हेल्पलाइन 14438 पर बात करें.', mode:'unavailable', sourceUrl:SOURCE };
      setReply(data); speak(data.answer);
    } finally { clearTimeout(timer); if (request.current === controller) setBusy(false); }
  }
  function stopSpeaking() { utterance.current = null; window.speechSynthesis?.cancel(); setSpeaking(false); }
  function setMic(on) { listeningRef.current = on; setListening(on); if (!on) setLive(''); }
  const starting = useRef(false);
  async function listen(target = 'answer') {
    if (listeningRef.current) { recognition.current?.stop(); return; }
    if (starting.current) return;
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Recognition) { setNotice('इस ब्राउज़र में बोलकर जवाब देना उपलब्ध नहीं है. Chrome या Edge इस्तेमाल करें, या बड़े बटन दबाएँ.'); if (target === 'guide') modalInput.current?.focus(); return; }
    stopSpeaking();
    recognition.current?.abort();
    starting.current = true; setNotice('माइक्रोफ़ोन चालू हो रहा है…');
    // explicit permission check: surfaces a blocked / missing / busy mic instead of failing silently
    try {
      if (navigator.mediaDevices?.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach(t => t.stop());
      }
    } catch (err) {
      starting.current = false;
      setNotice(err?.name === 'NotAllowedError' || err?.name === 'SecurityError' ? 'माइक्रोफ़ोन की अनुमति बंद है. पते वाली पट्टी में 🔒 दबाकर माइक को “अनुमति दें” करें, फिर पेज रीलोड करें.'
        : err?.name === 'NotFoundError' ? 'कोई माइक्रोफ़ोन नहीं मिला. माइक जोड़ें और Windows की Sound > Input सेटिंग जाँचें.'
        : 'माइक्रोफ़ोन इस समय दूसरे ऐप में चल रहा है. उसे बंद करके दोबारा दबाएँ. (' + (err?.name || 'error') + ')');
      return;
    }
    await new Promise(r => setTimeout(r, 300)); // let the speaker / mic hand over after our own voice stops
    starting.current = false;
    const onScreen = screen;
    resultHandler.current = text => {
      setNotice(`आपने कहा: “${text}”`);
      if (target === 'guide') { setQuery(text); return; }
      const choice = speechChoice(text);
      if (onScreen === 'questions' && choice) choose(choice);
      else { openGuide(); setQuery(text); }
    };
    const rec = new Recognition(); recognition.current = rec;
    let heard = false, failed = false;
    rec.lang = 'hi-IN'; rec.interimResults = true; rec.continuous = false; rec.maxAlternatives = 3;
    rec.onstart = () => { setMic(true); setLive(''); setNotice(''); };
    rec.onspeechstart = () => setLive('…');
    rec.onresult = event => {
      const last = event.results[event.results.length - 1];
      if (!last.isFinal) { setLive(Array.from(event.results).map(r => r[0].transcript).join(' ')); return; }
      const alts = Array.from(last || []);
      // for yes/no questions prefer whichever alternative maps to a clear choice
      const best = (target === 'answer' && onScreen === 'questions' && alts.find(x => speechChoice(x.transcript))) || alts[0];
      if (!best?.transcript?.trim()) return;
      heard = true; setMic(false);
      if (recognition.current === rec) resultHandler.current?.(best.transcript.trim());
    };
    rec.onerror = e => {
      failed = true;
      if (e.error === 'aborted') return;
      console.warn('speech recognition error:', e.error);
      setNotice(e.error === 'not-allowed' || e.error === 'service-not-allowed' ? 'माइक्रोफ़ोन की अनुमति बंद है. ब्राउज़र के पते वाली पट्टी में माइक की अनुमति दें, फिर दोबारा दबाएँ.'
        : e.error === 'no-speech' ? 'कुछ सुनाई नहीं दिया. माइक का बटन दबाकर पास से बोलें.'
        : e.error === 'audio-capture' ? 'माइक्रोफ़ोन नहीं मिला. उसे जोड़ें या नीचे के बटन इस्तेमाल करें.'
        : e.error === 'network' ? 'आवाज़ पहचानने के लिए इंटरनेट चाहिए. नीचे के बटन इस्तेमाल करें.'
        : 'आवाज़ नहीं मिली. दोबारा कोशिश करें या नीचे के बटन इस्तेमाल करें. (' + e.error + ')');
    };
    rec.onend = () => {
      if (recognition.current === rec) recognition.current = null;
      setMic(false);
      if (!heard && !failed) setNotice('कुछ सुनाई नहीं दिया. दोबारा बोलकर देखें.');
    };
    try { rec.start(); } catch { recognition.current = null; setMic(false); setNotice('माइक्रोफ़ोन शुरू नहीं हुआ. एक पल बाद दोबारा दबाएँ.'); }
  }
  function toggleAudio() { if (audioOn) stopSpeaking(); else speak(screenSpeech(), true); setAudioOn(!audioOn); }
  function downloadChecklist() {
    const lines = ['ApniBaat — मेरी उज्ज्वला तैयारी', '', 'आवेदन जमा नहीं हुआ है. अंतिम जाँच गैस एजेंसी करेगी.', '', ...DOCUMENTS.map(d => `${documents[d.id]==='ready'?'तैयार':'जाँच / तैयारी बाकी'}: ${d.title}\n${d.detail}`), '', 'गैस एजेंसी पर आधार की बायोमेट्रिक पहचान और घर पर जाँच ज़रूरी है.', 'प्रवासी परिवारों के लिए निर्धारित स्व-घोषणा का विकल्प हो सकता है. गैस एजेंसी से पूछें.', 'सरकारी हेल्पलाइन: 14438', `सरकारी जानकारी: ${SOURCE}`, `नियम और सवाल: ${FAQ}`, 'जानकारी देखी गई: 1 अक्टूबर 2026'];
    const url = URL.createObjectURL(new Blob(['\uFEFF'+lines.join('\n')], { type:'text/plain;charset=utf-8' }));
    const a = document.createElement('a'); a.href = url; a.download='ApniBaat-Ujjwala-Checklist.txt'; a.click(); setTimeout(() => URL.revokeObjectURL(url),1000);
    setNotice('आपकी सूची फ़ोन या कंप्यूटर में सेव हो गई है.');
  }

  return <div className="app-shell">
    <header className="header">
      <a className="brand" href="#" onClick={e=>{e.preventDefault(); if(screen==='welcome') speak(screenSpeech(),true);}} aria-label="ApniBaat"><span className="brand-icon"><HeartHandshake size={25}/></span><span>ApniBaat<small>हर कदम पर, आपके साथ</small></span></a>
      <div className="header-actions"><span className="language">हिंदी</span><button className={`audio-toggle ${audioOn?'active':''}`} onClick={toggleAudio} aria-pressed={audioOn}>{audioOn?<Volume2 size={19}/>:<VolumeX size={19}/>}<span>आवाज़ {audioOn?'चालू':'बंद'}</span></button></div>
    </header>

    <main className="workspace">
      <aside className="companion">
        <div className="companion-top"><span className="eyebrow">आपकी अपनी साथी</span><span className="petal-mark">✳</span></div>
        <div className={`voice-orb ${speaking||listening?'is-active':''}`} aria-hidden="true"><div className="orb-ring ring-one"/><div className="orb-ring ring-two"/><div className="orb-core"><HeartHandshake size={52} strokeWidth={1.4}/></div><div className="voice-bars">{[1,2,3,4,5].map(i=><i key={i} style={{'--i':i}}/>)}</div></div>
        <div className="companion-copy"><h2>{listening?'मैं सुन रही हूँ…':speaking?'सुनिए, मैं बताती हूँ…':'नमस्ते, मैं अपनी बात हूँ।'}</h2><p>धीरे-धीरे, एक कदम साथ चलेंगे।<br/>आप कभी भी दोबारा पूछ सकती हैं।</p></div>
        <button className="listen-button" onClick={()=>{if(speaking)stopSpeaking();else speak(screenSpeech(),true);}}>{speaking?<Pause size={19}/>:<Volume2 size={19}/>} {speaking?'आवाज़ रोकें':'मेरी बात सुनें'}</button>
        <div className="journey" aria-label="आपकी तैयारी के चरण">{['थोड़ी सी जानकारी','कागज़ों की तैयारी','आपका अगला कदम'].map((label,i)=><div className={`journey-step ${progress>i?'current':''}`} key={label}><span>{progress>i+1?<Check size={15}/>:i+1}</span><p>{label}</p>{progress===i+1&&<span className="step-here">अभी</span>}</div>)}</div>
        <div className="private-note"><ShieldCheck size={19}/><span>यहाँ आधार या बैंक का नंबर<br/>नहीं माँगा जाएगा।</span></div>
      </aside>

      <section className="main-panel">
        <div className="panel-top"><div className="scheme-label"><span><Flame size={17}/></span> प्रधानमंत्री उज्ज्वला योजना</div>{screen!=='welcome'&&<button className="text-button" onClick={previous}><ChevronLeft size={17}/> पिछला कदम</button>}</div>
        <div className="screen" key={`${screen}-${questionIndex}`}>
          {screen==='welcome'&&<>
            <span className="section-kicker">आज की शुरुआत, आपके नाम</span>
            <h1 ref={heading} tabIndex={-1}>अपने घर की गैस,<br/><span>अपने दम पर।</span></h1>
            <p className="lead">नया उज्ज्वला गैस कनेक्शन लेना चाहती हैं?<br/>मैं आपको आसान हिंदी में तैयारी बताऊँगी।</p>
            <div className="welcome-points"><div><Headphones size={22}/><span>सुनिए और बोलिए</span></div><div><FileText size={22}/><span>अपने कागज़ जानिए</span></div></div>
            <button className="primary start-button" onClick={start}><Mic size={23}/> हाँ, मदद चाहिए</button>
            <button className="secondary welcome-secondary" onClick={()=>{openGuide();setQuery('उज्ज्वला योजना क्या है?');}}>पहले योजना समझाइए</button>
            <p className="reassurance"><Check size={16}/> कोई खाता बनाने की ज़रूरत नहीं</p>
            <div className="welcome-footnote"><span className="little-flower">✳</span><p>आपकी रफ़्तार, आपका फ़ैसला।<br/><strong>जल्दी नहीं है। हम साथ हैं।</strong></p></div>
          </>}

          {screen==='questions'&&<>
            <span className="section-kicker">सवाल {questionIndex+1} / {QUESTIONS.length}</span>
            <div className="question-symbol"><ItemIcon name={currentQuestion.icon} size={31}/></div>
            <h1 className="question-title" ref={heading} tabIndex={-1}>{currentQuestion.title}</h1>
            <p className="lead question-hint">{currentQuestion.hint}</p>
            <div className="answer-options">
              <button className={`choice yes ${answers[currentQuestion.id]==='yes'?'selected':''}`} onClick={()=>choose('yes')}><span><Check size={27}/></span>हाँ</button>
              <button className={`choice no ${answers[currentQuestion.id]==='no'?'selected':''}`} onClick={()=>choose('no')}><span><X size={25}/></span>नहीं</button>
              <button className={`choice unsure ${answers[currentQuestion.id]==='unknown'?'selected':''}`} onClick={()=>choose('unknown')}><span><HelpCircle size={25}/></span>पता नहीं</button>
            </div>
            <button className={`voice-answer ${listening?'recording':''}`} onClick={()=>listen()}><Mic size={23}/>{listening?'सुन रही हूँ… रोकें':'या बोलकर जवाब दें'}</button>
            {listening&&<div className="live-caption" role="status" aria-live="polite"><span className="live-dot"/><div><small>सुन रही हूँ… बोलिए</small><p>{live||'आपकी आवाज़ यहाँ दिखेगी'}</p></div></div>}
            <p className="micro-hint">कुछ समझ न आए तो नीचे “मदद चाहिए” दबाएँ।</p>
          </>}

          {screen==='assessment'&&<>
            <span className="section-kicker">आपके जवाबों के अनुसार</span>
            <div className={`question-symbol ${assessment.kind==='stop'?'amber':''}`}><BookOpen size={32}/></div>
            <h1 className="question-title" ref={heading} tabIndex={-1}>{assessment.title}</h1>
            <p className="lead">{assessment.message}</p>
            {assessment.kind!=='stop'?<button className="primary" onClick={()=>setScreen('documents')}><FileText size={22}/> मेरे कागज़ देखें</button>:<a className="primary" href="tel:14438"><Phone size={22}/> सरकारी हेल्पलाइन से बात करें</a>}
            <button className="secondary" onClick={()=>{openGuide();setQuery('मेरे जवाबों के अनुसार अगला सही कदम क्या है?');}}>मुझे थोड़ा और समझाइए</button>
            <div className="info-note"><ShieldCheck size={21}/><p>यह आवेदन की तैयारी है। अंतिम मंज़ूरी सरकारी प्रक्रिया से होगी।</p></div>
          </>}

          {screen==='documents'&&<>
            <span className="section-kicker">कागज़ों की तैयारी</span>
            <h1 className="question-title" ref={heading} tabIndex={-1}>आपके पास क्या-क्या है?</h1>
            <p className="lead compact">कागज़ की फोटो भेजने की ज़रूरत नहीं।<br/>बस बताइए — है, नहीं है, या पता नहीं।</p>
            <div className="document-list">{DOCUMENTS.map(d=><article className={`document-card ${documents[d.id]==='ready'?'ready':''}`} key={d.id}><div className="doc-heading"><span className="doc-icon"><ItemIcon name={d.icon} size={24}/></span><h2>{d.title}</h2><button className="icon-button" onClick={()=>speak(`${d.title}. ${d.detail}`,true)} aria-label={`${d.title} के बारे में सुनें`}><Volume2 size={21}/></button></div><p>{d.detail}</p><div className="doc-options" role="group" aria-label={d.title}>{[['ready','है',Check],['missing','नहीं है',X],['unsure','पता नहीं',HelpCircle]].map(([value,label,Icon])=><button key={value} aria-pressed={documents[d.id]===value} className={documents[d.id]===value?'selected':''} onClick={()=>setDocuments(prev=>({...prev,[d.id]:value}))}><Icon size={16}/>{label}</button>)}</div></article>)}</div>
            <div className="info-note"><Home size={22}/><p>दूसरी जगह से आकर रह रही हैं? प्रवासी परिवारों के लिए कुछ कागज़ों की जगह निर्धारित स्व-घोषणा का विकल्प है। गैस एजेंसी से पूछें।</p></div>
            <button className="primary" onClick={()=>setScreen('result')}><CircleCheck size={22}/> मेरी तैयारी की सूची बनाएँ</button>
          </>}

          {screen==='result'&&<>
            <span className="section-kicker">आपका अगला कदम</span>
            <div className="result-heading"><div className="question-symbol"><Check size={33}/></div><h1 className="question-title" ref={heading} tabIndex={-1}>अब राह थोड़ी आसान है।</h1></div>
            <p className="lead compact">आपकी अपनी तैयारी की सूची बन गई है।</p>
            <div className="readiness-summary"><div><strong>{summary.ready.length}</strong><span>कागज़ तैयार</span></div><div><strong>{summary.remaining.length}</strong><span>तैयारी / जाँच बाकी</span></div><span className="summary-icon"><FileText size={33}/></span></div>
            {summary.remaining.length>0&&<div className="remaining"><h2>अब इनकी तैयारी करें</h2>{summary.remaining.map(d=><div key={d.id}><span className="small-ring"/><span>{d.title}</span><button className="icon-button" onClick={()=>speak(d.detail,true)} aria-label={`${d.title} की मदद सुनें`}><Volume2 size={18}/></button></div>)}</div>}
            <div className="next-step"><span>अगला कदम</span><h2>अपने कागज़ लेकर गैस एजेंसी जाएँ।</h2><p>वहाँ आवेदन, आधार की उँगली वाली पहचान और आगे की जाँच होगी। चाहें तो सरकारी वेबसाइट से आवेदन शुरू कर सकती हैं।</p><strong>आवेदन अभी जमा नहीं हुआ है।</strong></div>
            <div className="result-actions"><button className="primary" onClick={downloadChecklist}><Download size={21}/> मेरी सूची सेव करें</button><button className="secondary" onClick={()=>speak(screenSpeech()+ ' '+summary.remaining.map(d=>d.title).join('। '),true)}><Volume2 size={21}/> मेरी सूची सुनाएँ</button></div>
            <button className="teachback-card" onClick={()=>openGuide(true)}><span><MessageCircle size={27}/></span><div><strong>चलें, एक बार आप बताइए?</strong><small>कौन से कागज़ ले जाएँगी? बोलकर अभ्यास करें।</small></div><Mic size={23}/></button>
            <div className="official-actions"><a href={SOURCE} target="_blank" rel="noreferrer"><ExternalLink size={17}/> सरकारी वेबसाइट खोलें</a><a href="tel:14438"><Phone size={17}/> सरकारी मदद: 14438</a></div>
          </>}
        </div>
        {notice&&<div className="notice" role="status">{notice}</div>}
        <div className="help-bar"><span><HeartHandshake size={19}/> समझ न आए, तो पूछिए।</span><button onClick={()=>openGuide()}><MessageCircle size={19}/> मदद चाहिए</button></div>
      </section>
    </main>

    <footer className="footer"><div><ShieldCheck size={16}/><span>सरकारी जानकारी पर आधारित · स्वतंत्र सहायता, सरकारी वेबसाइट नहीं</span></div><div><button onClick={()=>setSourcesOpen(!sourcesOpen)} aria-expanded={sourcesOpen}>जानकारी का स्रोत</button>{screen!=='welcome'&&<button onClick={reset}><RotateCcw size={14}/> फिर से शुरू करें</button>}</div></footer>
    {sourcesOpen&&<section className="sources"><h2>हमारी जानकारी कहाँ से आती है?</h2><p>योजना की जानकारी 1 अक्टूबर 2026 को आधिकारिक उज्ज्वला वेबसाइट से जाँची गई। नियम बदल सकते हैं। अंतिम पुष्टि गैस एजेंसी करेगी।</p><a href={SOURCE} target="_blank" rel="noreferrer">आवेदन और कागज़ों की सरकारी जानकारी <ExternalLink size={14}/></a><a href={FAQ} target="_blank" rel="noreferrer">सरकारी सवाल-जवाब <ExternalLink size={14}/></a><p>आवाज़ पहचानने के लिए आपका ब्राउज़र आवाज़ को अपनी सेवा तक भेज सकता है। पूछे गए सवाल AI सेवा तक जा सकते हैं। आधार, बैंक नंबर या दूसरी निजी जानकारी यहाँ न लिखें।</p></section>}

    <dialog ref={dialogRef} className="guide-dialog" onCancel={e=>{e.preventDefault();closeGuide();}} onClick={e=>{if(e.target===dialogRef.current)closeGuide();}} aria-labelledby="guide-title">
      <div className="dialog-body"><div className="dialog-header"><span className="dialog-icon"><HeartHandshake size={28}/></span><div><h2 id="guide-title">{teachback?'एक छोटा-सा अभ्यास':'पूछिए, मैं साथ हूँ।'}</h2><p>{configured?'ApniBaat · AI की मदद से':'ApniBaat · सहेजी गई जानकारी'}</p></div><button className="icon-button" onClick={closeGuide} aria-label="मदद बंद करें"><X size={23}/></button></div>
      <p className="dialog-intro">{teachback?'गैस एजेंसी जाते समय आप कौन से कागज़ साथ ले जाएँगी? अपने शब्दों में बताइए।':'अपना सवाल बोलकर या आसान शब्दों में लिखकर पूछिए।'}</p>
      {!teachback&&<div className="suggestions">{['कौन से कागज़ चाहिए?','राशन कार्ड नहीं है','क्या सारे सिलेंडर मुफ़्त हैं?'].map(q=><button key={q} disabled={busy} onClick={()=>ask(q)}>{q}</button>)}</div>}
      {listening&&<div className="live-caption" role="status" aria-live="polite"><span className="live-dot"/><div><small>सुन रही हूँ… बोलिए</small><p>{live||'आपकी आवाज़ यहाँ दिखेगी'}</p></div></div>}
      <form onSubmit={e=>{e.preventDefault();ask();}}><label htmlFor="question-input">{teachback?'आपका जवाब':'आपका सवाल'}</label><textarea id="question-input" ref={modalInput} value={query} onChange={e=>setQuery(e.target.value)} maxLength={1200} placeholder={teachback?'मैं अपने साथ…':'यहाँ लिखिए…'} rows={3}/><div className="query-actions"><button type="button" className={`secondary ${listening?'recording':''}`} onClick={()=>listen('guide')}><Mic size={21}/>{listening?'सुन रही हूँ…':'बोलकर लिखें'}</button><button className="primary" disabled={!query.trim()||busy} type="submit">{busy?<LoaderCircle size={21} className="spin"/>:<Send size={19}/>} {busy?'एक पल…':teachback?'मेरा जवाब देखें':'जवाब बताएँ'}</button></div></form>
      {reply&&<div className="reply" role="status"><div><span>{reply.mode==='live'?'ApniBaat का जवाब':reply.mode==='offline'?'सहेजी गई जानकारी':'अभी संपर्क नहीं हुआ'}</span><button className="icon-button" aria-label="जवाब सुनें" onClick={()=>speak(reply.answer,true)}><Volume2 size={21}/></button></div><p>{reply.answer}</p>{reply.mode==='offline'&&<small>अभी AI से बात नहीं हुई। यह पहले से जाँची हुई सामान्य जानकारी है।</small>}<a href={reply.sourceUrl||SOURCE} target="_blank" rel="noreferrer">सरकारी स्रोत देखें <ExternalLink size={14}/></a></div>}
      {notice&&<p className="dialog-notice" role="status">{notice}</p>}<p className="privacy-line"><ShieldCheck size={15}/> आधार या बैंक का नंबर यहाँ न लिखें।</p></div>
    </dialog>
  </div>;
}
