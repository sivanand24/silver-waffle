# ApniBaat: 90-second jury demo

## Before walking on stage

Open the deployed app on the demo device. Test audio once, grant microphone permission if using it, and reset the journey. Keep this script and the public URL available. Use fictional details; never enter real identity or bank numbers.

## The demonstration

| Time | Say / do |
|---|---|
| 0–15 sec | **“Imagine a woman who wants an LPG connection but cannot read an English website and has nobody to guide her. ApniBaat helps her understand the next step in Hindi, one question at a time.”** |
| 15–30 sec | Press **हाँ, मदद चाहिए**. Answer the four questions **हाँ → नहीं → नहीं → हाँ**. Say: **“She can tap a clear answer or use supported voice input. She can also type questions in the help panel.”** |
| 30–45 sec | Press **मेरे कागज़ देखें**. Mark the document statuses using the example below, then press **मेरी तैयारी की सूची बनाएँ**. Say: **“She only tells us which papers she has. We never ask her to upload identity documents.”** |
| 45–60 sec | Show the ready/remaining counts and press **मेरी सूची सेव करें**. Say: **“She leaves with a checklist and a clear next step. Her application has not been submitted or approved.”** |
| 60–80 sec | Press **चलें, एक बार आप बताइए?** Type **“मैं आधार और बैंक की पासबुक ले जाऊँगी।”** and press **मेरा जवाब देखें**. Show the reminders for the omitted main document groups. If the response says **अपनी बात का जवाब**, say: **“Gemini recognizes what she means, and ApniBaat uses reviewed Hindi guidance to help her remember the rest.”** If it says **सहेजी गई जानकारी**, use the fallback wording below. |
| 80–90 sec | **“The next step is an official application and distributor verification, including required biometric e-KYC. Our prototype focuses on one service and one language, so we can demonstrate a complete guidance journey.”** |

## Exact example answers

Use these actual button labels. For microphone input, say the short answer **हाँ** or **नहीं**; do not enter an age number.

1. **क्या आपकी उम्र 18 साल या उससे ज़्यादा है?** → **हाँ**.
2. Existing household cylinder connection → **नहीं**.
3. Existing piped cooking gas → **नहीं**.
4. Learn to prepare the family declaration → **हाँ**. This is willingness to understand the document, not a submitted declaration.

Press **मेरे कागज़ देखें**, then use:

| Document | Demo status |
|---|---|
| आधार की प्रतियाँ | है |
| परिवार का कागज़ | नहीं है |
| बैंक का कागज़ | है |
| रहने के पते का सबूत | पता नहीं |
| आवेदन का फॉर्म और फोटो | नहीं है |
| परिवार की स्थिति का घोषणा-पत्र | नहीं है |

The result should show **2 कागज़ तैयार** and **4 तैयारी / जाँच बाकी**. The downloaded file is **ApniBaat-Ujjwala-Checklist.txt**.

The practice answer **“मैं आधार और बैंक की पासबुक ले जाऊँगी।”** mentions two groups. ApniBaat should also remind her about the family document and declaration, with further preparation details. If there is time after the main demo, open **मदद चाहिए** and choose **कौन से कागज़ चाहिए?**.

Present this as a fictional example. Readiness is not final eligibility; the official declaration and verification still apply.

## If something fails

- **Microphone or Hindi voice unavailable:** switch immediately to the answer buttons or type the Hindi question. Say, **“This device's voice service is unavailable; the same journey works through simple choices.”**
- **Gemini unavailable, missing key, or quota exhausted:** use the saved guidance and say, **“This answer is saved scheme information. The live AI connection is unavailable in this run.”** Never call this a live Gemini result.
- **Venue connection drops:** use the already-running local version if available. Say it is local. Do not imply that the public deployment or live AI is working until tested.
- **Official site needs a separate process:** show the handoff and explain it. Do not imply that ApniBaat submits an application, verifies identity, or completes e-KYC.

## Likely jury questions

**What does AI add?** Gemini classifies varied questions and recognizes document groups in the user's own words. The app uses that result to select reviewed Hindi guidance and practice reminders. Benefit rules are fixed in reviewed content. Without Gemini, local matching supplies clearly labeled saved guidance.

**Why one scheme?** Four hours is enough to demonstrate one focused journey. More services and languages need verified content, testing, and feedback from the people who would use them.

**Have you measured impact?** No user study has been completed. The prototype demonstrates the flow; usability and completion rates need testing with first-time users.

**Where does the user's information go?** No Aadhaar or bank numbers are requested. AI questions and relevant readiness answers go through the server to Gemini. Voice recognition may use the browser provider's speech service.

## Required submissions

- [ ] Public deployed URL: **[ADD VERIFIED URL]**. Test in a private browser window and on a phone.
- [ ] GitHub: **https://github.com/sivanand24/silver-waffle**. Confirm the final code is visible to judges on the submitted branch.
- [ ] LinkedIn post URL: **[ADD AFTER PUBLISHING]**.
- [ ] Confirm the organizer's submission form and deadline; the event announcement requires all three items above.

## LinkedIn draft

Replace the deployed link and verify every feature against the final build before posting. This is a draft, not a published submission.

Today at HackArena 2026, I built **ApniBaat / अपनी बात** for the challenge “The Invisible Woman.”

The idea: help a first-time woman user understand the next step toward a PMUY LPG connection through a simple Hindi journey.

The prototype combines one-question-at-a-time guidance, a downloadable document checklist, official application links, and a practice step where the user explains what she will take. Optional Gemini integration interprets her questions and document descriptions, while the app returns reviewed Hindi guidance. Voice features are available on supported browsers, with buttons and text as alternatives.

ApniBaat is an independent prototype. It does not submit applications or guarantee eligibility; official verification remains with the distributor. My next step would be testing the experience with first-time users and improving it from their feedback.

Try it: [ADD VERIFIED DEPLOYED URL]

Code: https://github.com/sivanand24/silver-waffle

#HackArena2026 #BuildWithAI #DigitalInclusion #Gemini #WomenInTech
