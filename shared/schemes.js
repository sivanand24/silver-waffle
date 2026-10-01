import {
  QUESTIONS as UJJWALA_QUESTIONS,
  DOCUMENTS as UJJWALA_DOCUMENTS,
  getAssessment as ujjwalaAssessment,
} from "./ujjwala.js";
export const VERIFIED_ON = "2026-10-01";
const question = (id, title, hint, icon = "file", extra = {}) => ({
  id,
  title,
  hint,
  icon,
  ...extra,
});
const document = (id, title, detail, icon, aliases) => ({
  id,
  title,
  detail,
  icon,
  aliases,
});
export const SCHEMES = {
  ujjwala: {
    id: "ujjwala",
    name: "प्रधानमंत्री उज्ज्वला योजना",
    shortName: "उज्ज्वला",
    label: "गैस कनेक्शन",
    icon: "flame",
    headline: "अपने घर की गैस,",
    description: "नया गैस कनेक्शन लेने की तैयारी समझें।",
    source: "https://www.pmuy.gov.in/ujjwala2.html",
    faq: "https://www.pmuy.gov.in/faq.html",
    helpline: "14438",
    authority: "गैस एजेंसी",
    destination: "अपने कागज़ लेकर गैस एजेंसी जाएँ।",
    handoff:
      "वहाँ आवेदन, आधार की उँगली वाली पहचान और आगे की जाँच होगी। कनेक्शन से पहले घर की जाँच भी होगी। सरकारी वेबसाइट से आवेदन शुरू करने का विकल्प भी है।",
    note: "प्रवासी परिवारों के लिए कुछ कागज़ों की जगह निर्धारित स्व-घोषणा का विकल्प है। गैस एजेंसी से सही प्रारूप पूछें।",
    questions: UJJWALA_QUESTIONS.map((q) => ({
      ...q,
      stopOn:
        q.id === "adult"
          ? "no"
          : ["lpg", "png"].includes(q.id)
            ? "yes"
            : undefined,
    })),
    documents: UJJWALA_DOCUMENTS.map((d) => ({
      ...d,
      aliases: {
        identity: ["आधार", "aadhaar", "aadhar"],
        family: ["राशन", "परिवार", "ration"],
        bank: ["बैंक", "पासबुक", "bank"],
        address: ["पता", "पते", "address"],
        kyc: ["फोटो", "फॉर्म", "आवेदन", "photo", "form"],
        declaration: ["घोषणा", "declaration"],
      }[d.id],
    })),
    suggestions: [
      "उज्ज्वला योजना क्या है?",
      "कौन से कागज़ चाहिए?",
      "क्या सारे सिलेंडर मुफ़्त हैं?",
    ],
    overview:
      "उज्ज्वला गरीब परिवारों की वयस्क महिलाओं के लिए गैस कनेक्शन की योजना है। नियम पूरे होने पर कनेक्शन, पहला रिफिल और चूल्हा मिलता है; आगे के सभी सिलेंडर मुफ्त नहीं हैं। अंतिम जाँच गैस एजेंसी करती है।",
  },
  jandhan: {
    id: "jandhan",
    name: "प्रधानमंत्री जन धन योजना",
    shortName: "जन धन",
    label: "बैंक खाता",
    icon: "bank",
    headline: "अपना बैंक खाता,",
    description: "पहला बैंक खाता खोलने का रास्ता जानें।",
    source:
      "https://financialservices.gov.in/pradhan-mantri-jan-dhan-yojana-pmjdy",
    faq: "https://www.pmjdy.gov.in/hi-scheme",
    helpline: "1800110001",
    authority: "बैंक या बैंक मित्र",
    destination: "अपने कागज़ लेकर बैंक या बैंक मित्र के पास जाएँ।",
    handoff:
      "जन धन खाता खुलवाने के बारे में पूछें। बैंक आपकी पहचान, कागज़ और मौजूदा खाते की जाँच करेगा। इस ऐप से खाता नहीं खुलता।",
    note: "आधार न हो तो दूसरा मान्य पहचान-पत्र या सीमित “छोटे खाते” का विकल्प बैंक से पूछें। कोई कागज़ न होने को अपने आप अंतिम मनाही न समझें।",
    questions: [
      question(
        "adult",
        "क्या आपकी उम्र 18 साल या उससे ज़्यादा है?",
        "यह रास्ता बिना बैंक खाते वाले वयस्क के लिए है। कम उम्र होने पर बैंक से अभिभावक वाले खाते की प्रक्रिया पूछें।",
        "person",
        { stopOn: "no" },
      ),
      question(
        "hasAccount",
        "क्या आपके नाम पर पहले से कोई बैंक खाता है?",
        "पुराना या इस्तेमाल न होने वाला खाता भी इसमें शामिल है।",
        "bank",
        { stopOn: "yes" },
      ),
    ],
    documents: [
      document(
        "identity",
        "पहचान का मान्य कागज़",
        "आधार या बैंक को मान्य दूसरा पहचान-पत्र। पहचान-पत्र नहीं है तो छोटे खाते के नियम बैंक से पूछें।",
        "id",
        ["आधार", "पहचान", "aadhaar", "identity"],
      ),
      document(
        "address",
        "अभी के पते की जानकारी",
        "अपना वर्तमान पता बताने वाला मान्य कागज़। पता बदला है तो बैंक से मान्य घोषणा या दूसरे सबूत की जानकारी लें।",
        "home",
        ["पता", "पते", "address"],
      ),
      document(
        "photo",
        "अपनी हाल की फोटो",
        "बैंक की खाता खोलने की प्रक्रिया के लिए अपनी हाल की फोटो साथ रखें।",
        "person",
        ["फोटो", "तस्वीर", "photo"],
      ),
      document(
        "form",
        "खाता खोलने का फॉर्म",
        "फॉर्म बैंक या बैंक मित्र से लें। PAN या उसके अभाव में Form 60 और बाकी ज़रूरतें बैंक से जाँचें। नंबर यहाँ न लिखें।",
        "file",
        ["फॉर्म", "आवेदन", "पैन", "form", "pan"],
      ),
    ],
    suggestions: [
      "जन धन खाता क्या है?",
      "पहले से बैंक खाता है",
      "आधार नहीं है",
    ],
    overview:
      "जन धन बिना बैंक खाते वाले लोगों तक बुनियादी बैंकिंग पहुँचाने की योजना है। इस खाते में न्यूनतम बैलेंस रखने की शर्त नहीं है। खाता खोलने और सही कागज़ों की जाँच बैंक या बैंक मित्र करेगा। ऋण या बीमा का लाभ अपने आप मिलने की गारंटी नहीं है।",
  },
  vishwakarma: {
    id: "vishwakarma",
    name: "प्रधानमंत्री विश्वकर्मा योजना",
    shortName: "पीएम विश्वकर्मा",
    label: "कारीगर सहायता",
    icon: "pen",
    headline: "अपने हुनर को आगे,",
    description: "पहले से काम कर रही कारीगरों के लिए मार्गदर्शन।",
    source: "https://pmvishwakarma.gov.in/",
    faq: "https://www.pib.gov.in/PressNoteDetails.aspx?ModuleId=3&NoteId=155216&lang=2",
    helpline: null,
    authority: "जन सेवा केंद्र (CSC)",
    destination: "अपने कागज़ लेकर जन सेवा केंद्र जाएँ।",
    handoff:
      "अपने काम और पीएम विश्वकर्मा पंजीकरण के बारे में पूछें। केंद्र पर आधार की बायोमेट्रिक पहचान और आगे आधिकारिक जाँच होगी। क्षेत्र में पंजीकरण की उपलब्धता भी वहीं जाँचें।",
    note: "यह पहले से हाथ और औज़ार से काम करने वाले कारीगरों के लिए है। केवल नया काम सीखने की इच्छा से लाभ पक्का नहीं होता। ऋण, प्रशिक्षण या मंज़ूरी की गारंटी नहीं है।",
    questions: [
      question(
        "adult",
        "क्या आपकी उम्र 18 साल या उससे ज़्यादा है?",
        "पंजीकरण के दिन कम से कम 18 साल की उम्र ज़रूरी है।",
        "person",
        { stopOn: "no" },
      ),
      question(
        "artisan",
        "क्या आप पहले से अपने हाथ और औज़ार से कारीगरी का काम करती हैं?",
        "जैसे सिलाई, टोकरी बनाना या मिट्टी का काम। केवल सीखना चाहना और पहले से काम करना अलग बातें हैं।",
        "pen",
        { stopOn: "no" },
      ),
      question(
        "coveredTrade",
        "क्या आपका काम योजना के 18 पारंपरिक कामों में आता है?",
        "सूची नीचे दी है। पक्का न हो तो “पता नहीं” चुनें; केंद्र काम की जाँच करेगा।",
        "pen",
      ),
      question(
        "familyMember",
        "क्या आपके पति या अविवाहित बच्चों में से कोई इस योजना में पंजीकृत है?",
        "लाभ परिवार के एक सदस्य तक सीमित है। परिवार में पति, पत्नी और अविवाहित बच्चे गिने जाते हैं।",
        "users",
        { stopOn: "yes" },
      ),
      question(
        "governmentJob",
        "क्या आप, आपके पति या अविवाहित बच्चे सरकारी नौकरी में हैं?",
        "सरकारी सेवा वाले व्यक्ति और उनके परिवार के लिए योजना की मनाही है।",
        "users",
        { stopOn: "yes" },
      ),
      question(
        "similarLoan",
        "क्या पिछले 5 साल में ऐसे काम के लिए सरकारी ऋण योजना का लाभ लिया है?",
        "उदाहरण: PMEGP, मुद्रा या स्वनिधि। पक्का न हो तो “पता नहीं” चुनें।",
        "bank",
      ),
      question(
        "repaidException",
        "क्या वह केवल मुद्रा या स्वनिधि का ऋण था, जिसे पूरी तरह चुका दिया है?",
        "इन चुकाए हुए ऋणों के लिए नियम में अपवाद है। बाकी शर्तें और दस्तावेज़ केंद्र जाँचेगा।",
        "bank",
        { when: (a) => a.similarLoan === "yes" },
      ),
    ],
    documents: [
      document(
        "identity",
        "अपना आधार",
        "पंजीकरण में आधार और बायोमेट्रिक पहचान की ज़रूरत होगी। नंबर या फोटो यहाँ न भेजें।",
        "id",
        ["आधार", "aadhaar", "aadhar"],
      ),
      document(
        "mobile",
        "अपना मोबाइल नंबर साथ रखें",
        "केंद्र पर पंजीकरण के लिए मोबाइल की जानकारी चाहिए। नंबर या OTP यहाँ न लिखें।",
        "person",
        ["मोबाइल", "फोन", "mobile", "phone"],
      ),
      document(
        "bank",
        "बैंक खाते की जानकारी",
        "बैंक खाते का कागज़ साथ रखें। खाता नहीं है तो केंद्र से खाता खुलवाने में सहायता पूछें।",
        "bank",
        ["बैंक", "पासबुक", "bank"],
      ),
      document(
        "family",
        "राशन कार्ड / परिवार की जानकारी",
        "राशन कार्ड साथ रखें। न हो तो परिवार के सदस्यों की आधार जानकारी वाला विकल्प केंद्र से पूछें। निजी नंबर यहाँ न दें।",
        "users",
        ["राशन", "परिवार", "ration", "family"],
      ),
    ],
    suggestions: [
      "विश्वकर्मा योजना क्या है?",
      "मैं सिलाई का काम करती हूँ",
      "पहले ऋण लिया है",
    ],
    overview:
      "पीएम विश्वकर्मा हाथ और औज़ार से पहले से काम कर रहे पारंपरिक कारीगरों की सहायता की योजना है। दर्जी सहित 18 काम इसमें आते हैं। पहचान, परिवार, पुराने ऋण और काम की शर्तें जाँची जाती हैं। पंजीकरण जन सेवा केंद्र से होता है; लाभ या ऋण की मंज़ूरी पक्की नहीं है।",
  },
};
export const TRADES = [
  "बढ़ई",
  "नाव बनाने वाले",
  "अस्त्र बनाने वाले",
  "लोहार",
  "हथौड़ा / औज़ार बनाने वाले",
  "ताला बनाने वाले",
  "सुनार",
  "कुम्हार",
  "मूर्तिकार / पत्थर का काम",
  "मोची",
  "राजमिस्त्री",
  "टोकरी / चटाई / झाड़ू / नारियल रेशा बुनने वाले",
  "पारंपरिक गुड़िया / खिलौने बनाने वाले",
  "नाई",
  "माला बनाने वाले",
  "धोबी",
  "दर्जी",
  "मछली पकड़ने का जाल बनाने वाले",
];
export function getScheme(id = "ujjwala") {
  return Object.hasOwn(SCHEMES, id) ? SCHEMES[id] : null;
}
export function getQuestions(id, answers = {}) {
  return getScheme(id).questions.filter((q) => !q.when || q.when(answers));
}
export function schemeAssessment(id, answers = {}) {
  const scheme = getScheme(id);
  const stop = (message) => ({
    kind: "stop",
    title: "पहले अपनी स्थिति की जाँच करवाएँ।",
    message,
  });
  if (id === "ujjwala") {
    const result = ujjwalaAssessment(answers);
    if (result.kind !== "prepare") return result;
  } else if (id === "jandhan") {
    if (answers.adult === "no")
      return stop(
        "यह वयस्कों के लिए तैयारी का रास्ता है। बैंक से अभिभावक के साथ कम उम्र वाले खाते की प्रक्रिया पूछें।",
      );
    if (answers.hasAccount === "yes")
      return stop(
        "आपके नाम पर पहले से खाता है। दूसरा जन धन खाता खुलवाने के बजाय अपने बैंक से उसी खाते की स्थिति, सेवा या उपयुक्त बदलाव के बारे में पूछें।",
      );
  } else {
    if (answers.adult === "no")
      return stop(
        "पीएम विश्वकर्मा में पंजीकरण के लिए उम्र कम से कम 18 साल होनी चाहिए।",
      );
    if (answers.artisan === "no")
      return stop(
        "यह योजना पहले से काम कर रहे कारीगरों के लिए है। शुरुआती कौशल प्रशिक्षण का अलग रास्ता केंद्र से पूछें।",
      );
    if (answers.coveredTrade === "no")
      return stop(
        "यह योजना 18 सूचीबद्ध कामों तक सीमित है। अपने काम के लिए दूसरी सहायता जन सेवा केंद्र से पूछें।",
      );
    if (answers.familyMember === "yes")
      return stop(
        "लाभ परिवार के एक सदस्य तक सीमित है। परिवार के मौजूदा पंजीकरण की जानकारी केंद्र से जाँचें।",
      );
    if (answers.governmentJob === "yes")
      return stop(
        "सरकारी नौकरी वाले व्यक्ति और उनके परिवार इस योजना में शामिल नहीं हो सकते। केंद्र से दूसरी उपयुक्त सहायता पूछें।",
      );
    if (answers.similarLoan === "yes" && answers.repaidException === "no")
      return stop(
        "पिछले 5 साल में समान ऋण योजना लेने की पाबंदी है। मुद्रा या स्वनिधि का पूरा चुकाया ऋण अपवाद हो सकता है। अपने ऋण के कागज़ केंद्र से जँचवाएँ।",
      );
  }
  const uncertain = getQuestions(id, answers).some(
    (q) => q.id !== "declaration" && !["yes", "no"].includes(answers[q.id]),
  );
  if (uncertain)
    return {
      kind: "check",
      title: "कुछ जानकारी की जाँच बाकी है।",
      message: `आपके कुछ जवाब अभी पक्के नहीं हैं। ${scheme.authority} से इन्हें जाँचें। तब तक ज़रूरी कागज़ समझ सकती हैं।`,
    };
  return {
    kind: "prepare",
    title: "अब कागज़ों की तैयारी करते हैं।",
    message: `यह शुरुआती मार्गदर्शन है, पात्रता की पुष्टि नहीं। अंतिम जाँच ${scheme.authority} करेगा।`,
  };
}
export function documentSummary(id, values = {}) {
  const docs = getScheme(id).documents;
  return {
    ready: docs.filter((d) => values[d.id] === "ready"),
    remaining: docs.filter((d) => values[d.id] !== "ready"),
  };
}
export function schemeTeachback(id, text, knownIds = []) {
  const scheme = getScheme(id),
    normalized = text
      .normalize("NFD")
      .replace(/\u093c/g, "")
      .toLowerCase();
  const known = scheme.documents.filter(
    (d) =>
      knownIds.includes(d.id) || d.aliases.some((a) => normalized.includes(a)),
  );
  const missing = scheme.documents.filter((d) => !known.includes(d));
  return `${known.length ? `आपने ${known.map((d) => d.title).join(", ")} बताया।` : "चलिए, कागज़ साथ में याद करते हैं।"} ${missing.length ? `यह भी याद रखें: ${missing.map((d) => d.title).join(", ")}।` : "मुख्य तैयारी आपने याद कर ली है।"} अंतिम जाँच ${scheme.authority} करेगा; यह आवेदन जमा होने की पुष्टि नहीं है।`;
}
