import express from 'express';
import axios from 'axios';
import dotenv from 'dotenv';
import cors from 'cors';

dotenv.config();

const app = express();
const PORT = 4003;
const BRIDGE_URL = 'http://localhost:3001';

app.use(cors());
app.use(express.json());

const agentCard = {
    name: 'TranslatorAgent',
    role: 'Language Translator',
    description: 'Translates text between languages and detects the language of a given text.',
    capabilities: ['translate_text', 'detect_language'],
    endpoint: `http://localhost:${PORT}/a2a`,
    status: 'active',
    framework: 'Express',
    provider: 'Local',
};

// ─── Translation dictionary ───────────────────────────────────────────────────
// Structure: phrase (lowercase) → { fr, es, de, nl }
const dictionary: Record<string, Record<string, string>> = {
    'hello': { fr: 'Bonjour', es: 'Hola', de: 'Hallo', nl: 'Hallo' },
    'hello, how are you?': { fr: 'Bonjour, comment allez-vous ?', es: '¡Hola, ¿cómo estás?', de: 'Hallo, wie geht es Ihnen?', nl: 'Hallo, hoe gaat het?' },
    'good morning': { fr: 'Bonjour', es: 'Buenos días', de: 'Guten Morgen', nl: 'Goedemorgen' },
    'good evening': { fr: 'Bonsoir', es: 'Buenas noches', de: 'Guten Abend', nl: 'Goedenavond' },
    'good night': { fr: 'Bonne nuit', es: 'Buenas noches', de: 'Gute Nacht', nl: 'Goedenacht' },
    'thank you': { fr: 'Merci', es: 'Gracias', de: 'Danke', nl: 'Dank je' },
    'thank you very much': { fr: 'Merci beaucoup', es: 'Muchas gracias', de: 'Vielen Dank', nl: 'Heel erg bedankt' },
    'you\'re welcome': { fr: 'De rien', es: 'De nada', de: 'Bitte', nl: 'Graag gedaan' },
    'please': { fr: 'S\'il vous plaît', es: 'Por favor', de: 'Bitte', nl: 'Alsjeblieft' },
    'yes': { fr: 'Oui', es: 'Sí', de: 'Ja', nl: 'Ja' },
    'no': { fr: 'Non', es: 'No', de: 'Nein', nl: 'Nee' },
    'goodbye': { fr: 'Au revoir', es: 'Adiós', de: 'Auf Wiedersehen', nl: 'Tot ziens' },
    'how are you?': { fr: 'Comment allez-vous ?', es: '¿Cómo estás?', de: 'Wie geht es Ihnen?', nl: 'Hoe gaat het?' },
    'i love you': { fr: 'Je t\'aime', es: 'Te quiero', de: 'Ich liebe dich', nl: 'Ik hou van je' },
    'where is the bathroom?': { fr: 'Où sont les toilettes ?', es: '¿Dónde está el baño?', de: 'Wo ist die Toilette?', nl: 'Waar is de badkamer?' },
    'i need help': { fr: 'J\'ai besoin d\'aide', es: 'Necesito ayuda', de: 'Ich brauche Hilfe', nl: 'Ik heb hulp nodig' },
    'what is your name?': { fr: 'Comment vous appelez-vous ?', es: '¿Cómo te llamas?', de: 'Wie heißen Sie?', nl: 'Hoe heet je?' },
    'my name is': { fr: 'Je m\'appelle', es: 'Me llamo', de: 'Ich heiße', nl: 'Mijn naam is' },
    'i don\'t understand': { fr: 'Je ne comprends pas', es: 'No entiendo', de: 'Ich verstehe nicht', nl: 'Ik begrijp het niet' },
    'speak slowly please': { fr: 'Parlez lentement s\'il vous plaît', es: 'Hable despacio por favor', de: 'Sprechen Sie bitte langsam', nl: 'Spreek alstublieft langzaam' },
    'how much does this cost?': { fr: 'Combien ça coûte ?', es: '¿Cuánto cuesta esto?', de: 'Wie viel kostet das?', nl: 'Hoeveel kost dit?' },
    'i am hungry': { fr: 'J\'ai faim', es: 'Tengo hambre', de: 'Ich habe Hunger', nl: 'Ik heb honger' },
    'i am tired': { fr: 'Je suis fatigué', es: 'Estoy cansado', de: 'Ich bin müde', nl: 'Ik ben moe' },
    'the weather is nice today': { fr: 'Il fait beau aujourd\'hui', es: 'El tiempo está agradable hoy', de: 'Das Wetter ist heute schön', nl: 'Het weer is mooi vandaag' },
    'artificial intelligence': { fr: 'Intelligence artificielle', es: 'Inteligencia artificial', de: 'Künstliche Intelligenz', nl: 'Kunstmatige intelligentie' },
};

// Reverse lookup: translate FROM another language TO English
const reverseDict: Record<string, Record<string, string>> = {};
for (const [en, translations] of Object.entries(dictionary)) {
    for (const [lang, phrase] of Object.entries(translations)) {
        if (!reverseDict[lang]) reverseDict[lang] = {};
        reverseDict[lang][phrase.toLowerCase()] = en.charAt(0).toUpperCase() + en.slice(1);
    }
}

// ─── Language detection patterns ──────────────────────────────────────────────
const langPatterns: Array<{ lang: string; name: string; words: string[] }> = [
    { lang: 'fr', name: 'French', words: ['le', 'la', 'les', 'de', 'du', 'un', 'une', 'est', 'sont', 'avec', 'pour', 'dans', 'sur', 'bonjour', 'merci', 'oui', 'non', 'vous', 'nous', 'je', 'il', 'elle', 'comment', 'allez'] },
    { lang: 'es', name: 'Spanish', words: ['el', 'la', 'los', 'las', 'de', 'del', 'un', 'una', 'es', 'son', 'con', 'para', 'en', 'hola', 'gracias', 'sí', 'no', 'usted', 'nosotros', 'yo', 'él', 'ella', 'cómo', 'está'] },
    { lang: 'de', name: 'German', words: ['der', 'die', 'das', 'ein', 'eine', 'ist', 'sind', 'mit', 'für', 'in', 'auf', 'hallo', 'danke', 'ja', 'nein', 'sie', 'wir', 'ich', 'er', 'wie', 'geht', 'bitte', 'und', 'nicht'] },
    { lang: 'nl', name: 'Dutch', words: ['de', 'het', 'een', 'is', 'zijn', 'met', 'voor', 'in', 'op', 'hallo', 'dank', 'ja', 'nee', 'u', 'wij', 'ik', 'hij', 'zij', 'hoe', 'gaat', 'alsjeblieft', 'en', 'niet'] },
    { lang: 'en', name: 'English', words: ['the', 'a', 'an', 'is', 'are', 'with', 'for', 'in', 'on', 'hello', 'thank', 'yes', 'no', 'you', 'we', 'i', 'he', 'she', 'how', 'please', 'and', 'not', 'this', 'that'] },
];

const detectLanguage = (text: string): { language: string; code: string; confidence: string } => {
    const words = text.toLowerCase().split(/\s+/);
    const scores: Record<string, number> = {};

    for (const { lang, words: patterns } of langPatterns) {
        scores[lang] = words.filter(w => patterns.includes(w.replace(/[^a-záéíóúàèìòùäöüñ]/gi, ''))).length;
    }

    const best = Object.entries(scores).sort((a, b) => b[1] - a[1])[0];
    const langInfo = langPatterns.find(l => l.lang === best[0])!;
    const total = Object.values(scores).reduce((a, b) => a + b, 0);
    const confidence = total === 0 ? 'low' : best[1] / total > 0.6 ? 'high' : best[1] / total > 0.3 ? 'medium' : 'low';

    return { language: langInfo.name, code: best[0], confidence };
};

const translateText = (text: string, targetLanguage: string): string => {
    const target = targetLanguage.toLowerCase().trim();
    // Map full language names to codes
    const codeMap: Record<string, string> = { french: 'fr', spanish: 'es', german: 'de', dutch: 'nl', english: 'en', fr: 'fr', es: 'es', de: 'de', nl: 'nl', en: 'en' };
    const targetCode = codeMap[target];

    if (!targetCode) return `[Unsupported target language: "${targetLanguage}". Supported: English, French, Spanish, German, Dutch]`;

    const key = text.toLowerCase().trim();

    // Direct lookup (EN → target)
    if (dictionary[key] && targetCode !== 'en') {
        return dictionary[key][targetCode] ?? `[No translation available for "${text}" → ${targetLanguage}]`;
    }

    // Reverse lookup (other → EN)
    if (targetCode === 'en') {
        for (const [, phrases] of Object.entries(reverseDict)) {
            if (phrases[key]) return phrases[key];
        }
    }

    // Cross-language: detect source, go via English
    const detected = detectLanguage(text);
    if (detected.code !== 'en' && reverseDict[detected.code]?.[key]) {
        const inEnglish = reverseDict[detected.code][key].toLowerCase();
        if (dictionary[inEnglish] && targetCode !== 'en') {
            return dictionary[inEnglish][targetCode] ?? `[No translation available for "${text}" → ${targetLanguage}]`;
        }
        if (targetCode === 'en') return reverseDict[detected.code][key];
    }

    return `[No translation found for "${text}" → ${targetLanguage}. Try a common phrase like "hello", "thank you", or "good morning".]`;
};

// ─── Task store ───────────────────────────────────────────────────────────────
const tasks = new Map<string, any>();

app.post('/a2a/task', (req: any, res: any) => {
    const { capability, payload } = req.body;
    const taskId = Math.random().toString(36).substring(7);

    let result: any;

    if (capability === 'translate_text') {
        const { text, targetLanguage } = payload;
        if (!text || !targetLanguage) {
            return res.status(400).json({ error: 'translate_text requires { text, targetLanguage }' });
        }
        const translation = translateText(text, targetLanguage);
        const detected = detectLanguage(text);
        result = {
            original: text,
            translation,
            targetLanguage,
            detectedSourceLanguage: detected.language,
        };
    } else if (capability === 'detect_language') {
        const { text } = payload;
        if (!text) {
            return res.status(400).json({ error: 'detect_language requires { text }' });
        }
        result = detectLanguage(text);
    } else {
        return res.status(400).json({ error: `Unsupported capability: ${capability}` });
    }

    const task: any = {
        id: taskId,
        status: 'completed',
        result,
        createdAt: Date.now(),
        updatedAt: Date.now(),
    };
    tasks.set(taskId, task);
    res.status(200).json(task);
});

app.get('/a2a/task/:id', (req: any, res: any) => {
    const task = tasks.get(req.params.id);
    if (!task) return res.status(404).json({ error: 'Task not found' });
    res.json(task);
});

// ─── Registration & heartbeat ─────────────────────────────────────────────────
const register = async (): Promise<boolean> => {
    try {
        await axios.post(`${BRIDGE_URL}/agents/register`, agentCard);
        console.log('Registered with AstralBridge');
        return true;
    } catch (err: any) {
        console.error('Registration failed:', err.message);
        return false;
    }
};

app.listen(PORT, async () => {
    console.log(`TranslatorAgent running on port ${PORT}`);
    await register();

    setInterval(async () => {
        try {
            await axios.post(`${BRIDGE_URL}/agents/${agentCard.name}/heartbeat`, { status: 'active' });
        } catch (err: any) {
            console.warn('Heartbeat failed, attempting re-registration...');
            await register();
        }
    }, 5000);
});
