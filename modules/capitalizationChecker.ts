import {BotMsgCtx, log} from "../util";

export async function countCapitalization(ctx: BotMsgCtx) : Promise<void>;
export async function countCapitalization(message: string) : Promise<void>;
export async function countCapitalization(ctxOrMessage: BotMsgCtx | string) {
    const message = typeof ctxOrMessage === 'string' ? ctxOrMessage : ctxOrMessage.text;
    if (!message) return;
    
    const sentences = message.split(/\.!?/).map(x => x.trim());
    
    if (typeof ctxOrMessage !== 'string') {
        console.log('ctx', ctxOrMessage);
        console.log('ctx.text', ctxOrMessage.text);
        console.log('ctx.peerId', ctxOrMessage.peerId);
        console.log('ctx.senderId', ctxOrMessage.senderId);
        console.log('sentences', sentences);
    }
    
    const allLower = 0; //sentences.every(x => lowerCaseLetters.includes(x[0]!));
    const allProper = sentences.every(s => isSentenceProperCase(s)); //sentences.every(x => upperCaseLetters.includes(x[0]!));
    const someLower = 0; //sentences.some(x => lowerCaseLetters.includes(x[0]!));
    const someProper = 0; //sentences.some(x => upperCaseLetters.includes(x[0]!));
    
    let dbDirty = false;

    if (typeof ctxOrMessage !== 'string') {
        console.log('ctx.user.capitalizations before', ctxOrMessage.user.capitalizations);

        if (allLower) {
            log(`Incremented ctx.user.capitalizations.lowerCase`);
            ctxOrMessage.user.capitalizations.lowerCase++;
            dbDirty = true;
        } else if (allProper) {
            log(`Incremented ctx.user.capitalizations.properCase`);
            ctxOrMessage.user.capitalizations.properCase++;
            dbDirty = true;
        } else if (someLower && someProper) {
            log(`Incremented ctx.user.capitalizations.mixedCase`);
            ctxOrMessage.user.capitalizations.mixedCase++;
            dbDirty = true;
        }

        if (dbDirty) {
            console.log('ctx.user.capitalizations', ctxOrMessage.user.capitalizations);
            ctxOrMessage.saveDb();
        }
    }
}

const upperCaseLetters: string = 'АБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ';
const lowerCaseLetters: string = upperCaseLetters.toLowerCase();

function isWordCaps(word: string) {
    const letters = word.split('');
    const upperCaseLetterCount = letters.filter(x => upperCaseLetters.includes(x)).length;
    const lowerCaseLetterCount = letters.filter(x => lowerCaseLetters.includes(x)).length;
    
    return lowerCaseLetterCount === 0 && upperCaseLetterCount > 0;
}

function isSentenceProperCase(sentence: string) {
    const words = sentence.split(/ ,;/);
    const firstWord = words[0];
    if (!firstWord) return false;

    const firstLetter = firstWord[0];
    if (!firstLetter) return false;

    if (words.every(w => isWordCaps(w))) {
        return false;
    }
    
    if (lowerCaseLetters.includes(firstLetter)) {
        return false;
    }
    
    return upperCaseLetters.includes(firstLetter);
}

function isSentenceLowerCase(sentence: string) {
    const words = sentence.split(/ ,;/);
    const firstWord = words[0];
    if (!firstWord) return false;

    const firstLetter = firstWord[0];
    if (!firstLetter) return false;

    if (words.every(w => isWordCaps(w))) {
        return false;
    }
    
    if (lowerCaseLetters.includes(firstLetter)) {
        return true;
    }
    
    return upperCaseLetters.includes(firstLetter);
}