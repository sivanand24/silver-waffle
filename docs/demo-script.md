# ApniBaat — jury demo and submission

## Before the pitch

Use the updated public HTTPS site in Edge. Revoke the exposed API key and configure its replacement privately. Test actual spoken Hindi: **हाँ**, **नहीं**, **मेरे पास राशन कार्ड नहीं है**. Confirm visible text, not just a moving microphone. Keep a button/text demonstration ready.

## 90-second demo

1. **0–15 seconds:** “Our vertical is The Invisible Woman. ApniBaat helps a first-time woman user understand a government-service next step in Hindi. Three needs, one simple interface.” Show gas, bank and artisan choices.
2. **15–35 seconds:** Choose **गैस कनेक्शन**, then **हाँ, मदद चाहिए**. Record **हाँ**, stop recording, show the transcript and press **सही है**. Answer the remaining questions **नहीं → नहीं → हाँ** with buttons.
3. **35–50 seconds:** Choose **मेरे कागज़ देखें**. Mark Aadhaar and bank papers **है**, leave the rest missing/uncertain, and create the list. Show **2 ready / 4 remaining** and save it.
4. **50–70 seconds:** Open **चलें, एक बार आप बताइए?** and say or type **मैं आधार और बैंक की पासबुक ले जाऊँगी।** Show the missing-document reminders. Only call it live AI if the actual response indicates live processing.
5. **70–90 seconds:** Show **दूसरी सहायता चुनें**, confirm, and open **बैंक खाता**. Answer adult **हाँ**, existing account **हाँ**. Demonstrate that it changes the advice rather than encouraging another account. “The same engine applies separate reviewed rules for each service. Official institutions make the final decision.”

## Optional artisan demonstration

Choose **कारीगर सहायता**. Example: adult yes, existing artisan yes, covered trade yes (tailor), registered family member no, government job no, previous similar loan yes. The extra question appears: only fully repaid MUDRA/SVANidhi? Choose yes to show the exception; final official verification is still required. Unknown answers must show a verification step.

## Honest fallback wording

- Missing key/network: “Live transcription is unavailable in this run. The same guidance works with Hindi buttons and typed questions.”
- Saved guide answer: “This is reviewed saved information, not a live AI response.”
- Local preview: “This is the local production build.” Never call it a deployed site.
- Official handoff: “This prepares her next step; no application has been submitted.”

## Evaluation talking points

- **Logic:** unknown states preserved; duplicate-account guidance avoided; artisan loan exceptions asked conditionally.
- **Security:** API keys stay server-side; audio is temporary in the app; no identity numbers or document uploads requested.
- **Efficiency:** short recordings, one transcription request after stop, cancelled sessions release microphone and discard late replies.
- **Maintainability/testing:** shared scheme configuration, separate recording controller, 36 automated tests including lifecycle races and scheme isolation.
- **Accessibility:** Hindi, large labeled controls, transcript confirmation, keyboard navigation, reduced motion, and text/button alternatives.
- **Limits:** no government integration, no approval promise, no user study yet; provider audio processing requires internet and valid quota.

## Submission checklist

- [ ] Repository is public: https://github.com/sivanand24/silver-waffle
- [ ] All finished code committed and pushed on **main** only.
- [ ] README covers vertical, approach, logic, operation, assumptions and validation.
- [ ] Updated deployment verified: https://silver-waffle-eta.vercel.app
- [ ] Real microphone test passed in Edge with replacement key.
- [ ] LinkedIn post published; copy its URL into the event submission.
- [ ] Check organizer's submission document/form and deadline. The shared Google document was not accessible through the assistant's web tool; pasted requirements were used.

## LinkedIn draft (not published)

Today at HackArena 2026, I built ApniBaat / अपनी बात for “The Invisible Woman.”

The prototype helps a first-time woman user prepare for an essential service in Hindi: an Ujjwala gas connection, a Jan Dhan bank account, or PM Vishwakarma support for existing artisans.

It combines simple questions, document checklists, official next steps, and an understanding check. Gemini interprets questions and can transcribe recorded Hindi; reviewed rules keep the guidance grounded. Buttons and typing remain available when voice or connectivity fails.

This is an independent preparation guide, not a government application or approval service. My next step is usability testing with first-time users.

Demo: [INSERT VERIFIED UPDATED URL]
Code: https://github.com/sivanand24/silver-waffle

#HackArena2026 #BuildWithAI #DigitalInclusion #Gemini
