# सहेली · Saheli

A Hindi guide that helps a first-time woman user understand her next step toward a Pradhan Mantri Ujjwala Yojana (PMUY) LPG connection. Built for **HackArena 2026 — The Invisible Woman**.

The prototype focuses on one journey: answer a few simple questions, prepare the required documents, and continue through an official application channel. It is an independent project, not a government service.

## What the demo does

- Guides the user in Hindi, one question at a time, through adult age, existing household LPG/PNG connections, and preparation for the poverty declaration. Answers are **हाँ / नहीं / पता नहीं**.
- Offers large answer buttons, simple text questions in the help panel, and browser voice features where supported.
- Builds a document-readiness checklist with **है / नहीं है / पता नहीं**, saves it as a text file, and shows an official next step.
- Includes a practice step: the user describes which documents she will take, and Saheli reminds her of any main document groups she did not mention.
- Uses Gemini to understand the question and identify mentioned documents when configured. The server selects source-reviewed Hindi answers; Gemini does not generate new benefit rules. If Gemini is unavailable, local matching selects saved guidance and the response is labeled accordingly.
- Does not ask for Aadhaar numbers, bank-account numbers, or document uploads.

This is a readiness guide, **not an eligibility decision or submitted application**. The distributor verifies the application; required biometric e-KYC and other checks take place through the official process. See the [PMUY scheme page](https://www.pmuy.gov.in/ujjwala2.html) and [official FAQ](https://www.pmuy.gov.in/faq.html).

## Run locally

Use Node.js 20.19+ or 22.12+ and npm. From the project folder:

```powershell
npm install
npm run dev
```

Open the local address printed in the terminal. `npm run dev` starts both the Vite frontend and the local API. Leave that terminal running.

```powershell
npm test
npm run build
```

The app is React + Vite. The local Node API and Vercel's `api/guide.mjs` use the same guide logic. `npm run preview` previews the frontend build only; use the development command or a Vercel deployment to test the API too.

## Enable Gemini privately

1. Sign in to [Google AI Studio](https://aistudio.google.com/api-keys) with your own Google account.
2. Create an API key in an available project. If your existing Cloud project is missing, import it in AI Studio's Projects view first. Complete account prompts yourself.
3. Put the key in `.env.local` in the project root:

```dotenv
GEMINI_API_KEY=your_private_key_here
GEMINI_MODEL=gemini-3.5-flash-lite
```

4. Restart `npm run dev`. Open **मदद चाहिए**, ask **“कौन से कागज़ चाहिए?”**, and check the response label: **सहेली का जवाब** means a successful Gemini classification; **सहेजी गई जानकारी** is the fallback. The dialog header alone does not prove a successful live request.

Keep the key out of chat, screenshots, Git, and browser code. Do not use a `VITE_` prefix for it. `.env.local` is ignored by Git; the server reads the secret. Model access and quota depend on your account. [Google's key setup and security guide](https://ai.google.dev/gemini-api/docs/api-key).

When AI is used, the question and relevant readiness answers are sent through the server to Gemini. Browser speech recognition may use the browser provider's speech service. Use invented, non-sensitive demo answers.

## Deploy to Vercel

1. Make sure the final code is available in [sivanand24/silver-waffle](https://github.com/sivanand24/silver-waffle) on branch `codex/saheli-hackarena`.
2. In Vercel, create a project by importing that repository. Use **Vite**, root directory **`.`**, build command **`npm run build`**, and output directory **`dist`**. The included configuration supplies these build settings.
3. Set the project's Production Branch to `codex/saheli-hackarena`, or deploy that branch and promote the verified deployment to production.
4. Add `GEMINI_API_KEY` and `GEMINI_MODEL` in the project's environment variables for Production; add them to Preview too if testing a preview. Use the model value shown above. Redeploy after changing variables.
5. Open the public HTTPS link in a private window. Check the whole flow and AI response without your account being signed in. Resolve any deployment access protection before submitting the URL.

Do not upload only `dist` to a static host and expect Gemini to work: the `/api/guide` server endpoint is required. Deployment references: [GitHub integration](https://vercel.com/docs/git/vercel-for-github), [environment variables](https://vercel.com/docs/environment-variables).

## Demo verification

At documentation handoff, **live Gemini credentials, microphone input, and the public deployment remain unverified**. Before pitching:

- Run the tests and production build successfully.
- Complete the Hindi journey on the actual demo device.
- Try the microphone and Hindi playback; keep the buttons/text path ready if device support or permissions fail.
- Verify a successful live AI classification and its response label after setting the key.
- On the result screen, try **चलें, एक बार आप बताइए?** with **“मैं आधार और बैंक की पासबुक ले जाऊँगी।”** and check the document reminders.
- Open official links, reload the deployed app, and test it on a phone.
- Rehearse the [90-second demo and submission checklist](docs/demo-script.md).

## Sources and boundaries

Scheme guidance is based on the [official Ujjwala 2.0 page](https://www.pmuy.gov.in/ujjwala2.html) and [PMUY FAQ](https://www.pmuy.gov.in/faq.html), checked for this prototype on 1 October 2026. The FAQ covers distributor biometric e-KYC, pre-installation inspection, and the restriction concerning existing PNG connections. Refer to the official channel for current rules and final verification.

This prototype has not been evaluated with first-time users. Voice support varies by device, and no claim of full offline operation, guaranteed benefit approval, or completed government integration is made.
