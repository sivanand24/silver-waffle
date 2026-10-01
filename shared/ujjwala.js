export const SOURCE = 'https://www.pmuy.gov.in/ujjwala2.html';
export const FAQ = 'https://www.pmuy.gov.in/faq.html';
export const QUESTIONS = [
  { id: 'adult', title: 'क्या आपकी उम्र 18 साल या उससे ज़्यादा है?', hint: 'उज्ज्वला का नया कनेक्शन 18 साल या उससे अधिक उम्र की महिला के नाम पर मिलता है.', short: 'आपकी उम्र', icon: 'person' },
  { id: 'lpg', title: 'क्या आपके घर में किसी के नाम पर पहले से गैस सिलेंडर का कनेक्शन है?', hint: 'इसमें आपके साथ एक ही परिवार में रहने वाले सदस्यों का कनेक्शन भी शामिल है.', short: 'घर का कनेक्शन', icon: 'flame' },
  { id: 'png', title: 'क्या आपके घर में पाइप से आने वाली रसोई गैस है?', hint: 'यह दीवार से जुड़ी पाइप वाली गैस है, सिलेंडर वाली गैस नहीं.', short: 'पाइप वाली गैस', icon: 'home' },
  { id: 'declaration', title: 'यह योजना आर्थिक रूप से गरीब परिवारों के लिए है.', hint: 'आवेदन के साथ परिवार की स्थिति का एक सरकारी घोषणा-पत्र भरना होता है. क्या आप इस कागज़ की तैयारी समझना चाहेंगी?', short: 'परिवार की जानकारी', icon: 'file' }
];
export const DOCUMENTS = [
  { id: 'identity', title: 'आधार की प्रतियाँ', detail: 'अपना आधार और परिवार के कागज़ में लिखे सभी वयस्क सदस्यों के आधार की प्रतियाँ.', icon: 'id' },
  { id: 'family', title: 'परिवार का कागज़', detail: 'राशन कार्ड या परिवार के सदस्यों की जानकारी वाला सरकारी कागज़.', icon: 'users' },
  { id: 'bank', title: 'बैंक का कागज़', detail: 'अपने बैंक खाते की पासबुक की प्रति या रद्द किया हुआ चेक.', icon: 'bank' },
  { id: 'address', title: 'रहने के पते का सबूत', detail: 'अगर आधार पर अभी वाला पता है, तो वही काम आ सकता है. पता अलग है तो दूसरा मान्य सबूत चाहिए.', icon: 'home' },
  { id: 'kyc', title: 'आवेदन का फॉर्म और फोटो', detail: 'सरकारी आवेदन फॉर्म पर अपनी हाल की फोटो और हस्ताक्षर. फॉर्म गैस एजेंसी या सरकारी वेबसाइट से मिलेगा.', icon: 'file' },
  { id: 'declaration', title: 'परिवार की स्थिति का घोषणा-पत्र', detail: 'गरीब परिवार की स्थिति बताने वाला निर्धारित सरकारी घोषणा-पत्र. गैस एजेंसी इसे समझा सकती है.', icon: 'pen' }
];
export function getAssessment(answers) {
  if (answers.adult === 'no') return { kind: 'stop', title: 'यह कनेक्शन वयस्क महिला के नाम पर मिलता है.', message: 'आपने बताया कि आपकी उम्र 18 साल से कम है. अभी अपने नाम से नया उज्ज्वला कनेक्शन नहीं लिया जा सकता. सही जानकारी के लिए सरकारी हेल्पलाइन पर बात कर सकती हैं.' };
  if (answers.lpg === 'yes') return { kind: 'stop', title: 'पहले अपने मौजूदा कनेक्शन की जानकारी लें.', message: 'एक ही परिवार में पहले से गैस कनेक्शन हो, तो नया उज्ज्वला कनेक्शन नहीं मिलता. परिवार अलग हुआ हो या कनेक्शन की स्थिति साफ़ न हो, तो गैस एजेंसी से जाँच करवाएँ.' };
  if (answers.png === 'yes') return { kind: 'stop', title: 'पाइप वाली गैस के लिए अलग नियम हैं.', message: 'सरकारी जानकारी के अनुसार पाइप वाली रसोई गैस का कनेक्शन होने पर उज्ज्वला का कनेक्शन नहीं लिया जा सकता. अपनी गैस एजेंसी से अगला सही कदम पूछें.' };
  if (['adult', 'lpg', 'png'].some(k => answers[k] === 'unknown')) return { kind: 'check', title: 'एक बात की जाँच अभी बाकी है.', message: 'कुछ जवाब अभी पक्के नहीं हैं. गैस एजेंसी से इनकी जाँच करवाएँ. तब तक आप ज़रूरी कागज़ समझ सकती हैं.' };
  return { kind: 'prepare', title: 'अब कागज़ों की तैयारी करते हैं.', message: 'यह शुरुआती जानकारी है, पात्रता की पुष्टि नहीं. परिवार की स्थिति और दस्तावेज़ों की अंतिम जाँच गैस एजेंसी करेगी.' };
}
export function getDocumentSummary(documents) {
  return { ready: DOCUMENTS.filter(d => documents[d.id] === 'ready'), remaining: DOCUMENTS.filter(d => documents[d.id] !== 'ready') };
}
export function speechChoice(text) {
  const value = text.trim().toLowerCase();
  if (/पता नहीं|मालूम नहीं|शायद|नहीं जान|not sure|don't know|dont know/.test(value)) return 'unknown';
  if (/^(नहीं|नही|ना|न|no|nahin|nahi)([।.!\s]|$)/.test(value) || /नहीं है|नही है/.test(value)) return 'no';
  if (/^(हाँ|हां|जी हाँ|जी हां|yes|haan|han|ha)([।.!\s]|$)/.test(value)) return 'yes';
  return null;
}
