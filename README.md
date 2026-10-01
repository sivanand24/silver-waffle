# ApniBaat · अपनी बात

**HackArena 2026 vertical: The Invisible Woman.** A Hindi assistant for a first-time woman user with no English or prior digital knowledge. She chooses one practical task, answers simple questions, understands her documents, and leaves with a clear official next step.

Repository: https://github.com/sivanand24/silver-waffle

Existing deployment: https://silver-waffle-eta.vercel.app — the new version must be deployed and verified before submission.

Submission branch: **main**. Keep all progress on this branch.

## How it fits "The Invisible Woman"

The brief is a woman who has no English and little digital experience, yet needs a government service. Each design choice answers a specific barrier:

| Barrier | What ApniBaat does |
|---|---|
| Cannot read English | Every screen, error and answer is Hindi; the page language is `hi` |
| Reads slowly or not at all | Every screen is read aloud automatically; a replay button and a per-document speaker button are always visible; large icon-led buttons |
| Typing in Hindi is hard | She can speak instead. The transcript is **read back to her** ("आपने कहा: …"), so she can confirm by ear and fix it before it is used |
| Fear of getting it wrong or being judged | Plain yes / no / "पता नहीं"; unknown stays unknown and becomes a verification step, never a guess |
| Does not know what to carry | A saved preparation checklist and a practice round ("चलें, एक बार आप बताइए?") that points out papers she forgot |
| Distrust of apps asking for ID numbers | No Aadhaar/bank numbers, no document uploads, no account; the screen says so, and accidental numbers in text are masked |
| Overpromising | It prepares her next step only. It never submits, approves or confirms eligibility, and every result names the official office that decides |

## Approach and decision logic

Three focused journeys share the same accessible interface:

| Need | Journey | Context that changes guidance |
|---|---|---|
| Gas connection | PM Ujjwala | Adult age, existing household LPG/PNG, document readiness |
| Bank account | Jan Dhan | Adult journey versus guardian guidance; existing-account holders avoid duplicate-account guidance |
| Artisan support | PM Vishwakarma | Existing artisan work, one of 18 trades, family registration, government employment, previous loans and the fully repaid MUDRA/SVANidhi exception |

Unknown answers stay unknown. They produce a verification step, not a guessed yes/no. Each scheme owns its questions, checklist, official sources, next steps, and practice exercise. Switching clears the active journey only after confirmation. Returning to an earlier question and changing it invalidates later answers.

**AI has two real roles:** Gemini transcribes recorded Hindi/Hinglish into visible, editable text; it also classifies varied questions and identifies documents in a teach-back response. Reviewed content and deterministic rules control scheme guidance. The model cannot create new benefit rules or declare approval. Explicit questions about another scheme ask the user to switch rather than silently mixing rules.

## Microphone interaction

Press the microphone, grant access, speak, then press **बोल लिया — अब रोकें**. Recording stops automatically after 20 seconds. The app shows permission, recording, microphone level, transcription, and review states. On a journey question, review **आपने कहा…**, edit if necessary, and press **सही है**. In the help dialog, the transcription fills the editable question box.

This uses MediaRecorder and a server-side Gemini call, **not browser SpeechRecognition**. Old permission results, recordings, and network responses are ignored after cancellation/navigation. Tracks are stopped after recording. Silence, denied permission, missing hardware, timeouts, and unavailable AI produce explicit Hindi errors. Buttons and typing remain available.

## Run and test

Node.js 20.19+ or 22.12+, npm:

```powershell
npm install
npm test
npm run test:render
npm run build
npm run demo
```

Open **http://127.0.0.1:8787**. The demo server serves the production build **and** API routes. It avoids development dependency-optimizer issues in restricted Windows environments. For live editing use `npm run dev` (frontend 5173, API 8787). `npm run preview` alone is frontend-only.

If the Windows sandbox reports ancestor-path EPERM, set `$env:NODE_OPTIONS='--preserve-symlinks --preserve-symlinks-main'` for that terminal. The Vite configuration preserves symlink paths and uses the native config loader.

## Private Gemini configuration

Create a key at https://aistudio.google.com/apikey. **Revoke any key posted in chat, comments, or screenshots.** Store the replacement only in ignored `.env.local` or your hosting provider's server environment:

```dotenv
GEMINI_API_KEY=your_replacement_private_key
GEMINI_MODEL=gemini-3.5-flash-lite
GEMINI_AUDIO_MODEL=gemini-3.5-flash-lite
API_PORT=8787
```

Restart the server after changing configuration. Model access and quota depend on your account. No `VITE_` prefix is used for secrets. Missing/failed AI classification returns explicitly labeled saved guidance; **failed transcription never returns a fabricated transcript**. Health checks report configuration presence, not successful provider access.

## Code structure and API

- `shared/`: scheme data, conditional questions, assessment rules and checklist logic. The original Ujjwala exports remain compatible.
- `src/journey.js`, `src/checklist.js`, `src/speech-text.js`: pure, unit-tested rules for answering/going back, the saved checklist, and what is spoken aloud.
- `src/voice/recorder.js`: independently tested recording lifecycle and cancellation ownership.
- `src/hooks/`: `useSpeech` (Hindi text-to-speech), `useVoiceInput` (microphone), `useGuide` (help dialog and `/api/guide` calls).
- `src/screens/` and `src/components/`: one file per screen or UI piece. `src/App.jsx` only owns the journey state and wires these together.
- `src/styles.css` + `src/theme.css`: base layout, then the ApniBaat theme layered on top.
- `server/`: reviewed answers, intent mapping, local production/API server, backend tests.
- `api/`: the same handlers used by Vercel server functions.

| Endpoint | Input | Output |
|---|---|---|
| POST /api/guide | question, schemeId, context | answer, mode (live/offline), sourceUrl |
| POST /api/transcribe | audioBase64, mimeType | transcript; otherwise a structured error |
| GET /api/health | none | geminiConfigured (presence only) |

Guide requests without schemeId default to Ujjwala for compatibility. Unknown scheme IDs are rejected. Audio is capped at **2 MB decoded**, with MIME/container validation, an 18-second upstream timeout, and a 12-request/minute per-instance IP limit. Guide requests have separate size and rate limits. Limits use instance memory: production at scale needs a shared rate-limit store.

## Evaluation focus

| Criterion | Evidence |
|---|---|
| Smart, dynamic assistant | Hindi audio transcription, reviewed intent classification, teach-back, contextual/conditional questions |
| Code quality | Shared scheme records; small single-purpose hooks, screens and components instead of one large file; pure journey/checklist/speech modules; isolated recording controller; reusable local/deployed handlers |
| Security | Server-only keys, bounded audio and inputs, same-origin checks, safe error messages, no identity-document uploads |
| Efficiency | One short audio request after stopping; 20-second cap; 64 kbps recording; meter updates only re-render when the value changes; memoised derived data; repeated questions reuse the classified intent for 10 minutes; React split into a long-cached chunk; gzip and immutable asset caching on the demo server; cancellation releases resources |
| Testing | Automated flow, scheme-isolation, journey and checklist rules, HTTP, mocked Gemini, recording race, permission, silence and timeout checks, plus a render smoke test of every screen for all three schemes (`npm run test:render`) |
| Accessibility | Hindi page language, large labeled controls, editable transcripts, keyboard dialogs, focus restoration, reduced-motion support, text alternatives |

No app database is used. Application code does not persist audio, transcripts or answers, and does not log them. Audio and questions go through the server to Google when AI is used; Google's service policies still apply. Avoid personal details in demo speech. Numeric identifiers in text questions are masked before classification. Audio cannot be redacted before the transcription provider receives it, so the UI explicitly warns against speaking private numbers.

## Deployment

1. Commit and push the completed code to **main** in the public repository.
2. Import the repository into Vercel or use its existing project. Framework **Vite**, root **.**, build **npm run build**, output **dist**, production branch **main**.
3. Configure the replacement GEMINI_API_KEY and model variables on the server. Redeploy after changing variables. Never publish the exposed key.
4. Test the HTTPS URL in a private Edge window. Confirm it works without the developer's account or deployment protection.
5. Test both /api/guide and real Hindi speech via /api/transcribe. A static-only upload of dist does not provide these APIs.

## Sources, assumptions and limits

Content reviewed for this prototype on **1 October 2026**:

- Ujjwala: https://www.pmuy.gov.in/ujjwala2.html and https://www.pmuy.gov.in/faq.html
- Jan Dhan: https://financialservices.gov.in/pradhan-mantri-jan-dhan-yojana-pmjdy and https://www.pmjdy.gov.in/hi-scheme
- Bank KYC context: https://sbi.bank.in/web/personal-banking/accounts/saving-account/savings-bank-rulesabridged
- PM Vishwakarma: https://pmvishwakarma.gov.in/ and official overview https://www.pib.gov.in/PressNoteDetails.aspx?ModuleId=3&NoteId=155216&lang=2
- Detailed artisan guidance: https://www.dcmsme.gov.in/PMV-Ebook/PMV.pdf
- Gemini audio: https://ai.google.dev/gemini-api/docs/audio

The app is an independent **preparation and understanding guide**. It does not submit government applications, open accounts, authenticate Aadhaar, approve loans, confirm eligibility, or guarantee local scheme availability. Distributor/bank/CSC verification remains necessary. PM Vishwakarma is for existing eligible artisans, not guaranteed beginner training. Jan Dhan credit/insurance benefits are not promised. Scheme changes require content review; there is no automatic government integration.

**Verification status:** 45 automated tests, 28 render checks and the production build passed during implementation. These tests mock Gemini and microphone hardware; they do not establish live transcription quality. Final real spoken Edge verification and the updated public deployment remain pending until a replacement key and account access are ready. No user study or measured social-impact claim is made.

Submission checklist and 90-second pitch: [docs/demo-script.md](docs/demo-script.md).
