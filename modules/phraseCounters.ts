import {log} from "../util";
import {getDb, GroupChatDefaults, saveDb} from "../db";
import {vk} from "../index";

export function loadPhraseCounterModule() {
    log("Module phraseCounter loaded");
    setInterval(async () => {
        const date = new Date();
        const h = date.getHours();
        const m = date.getMinutes();
        const d = date.getDate();
        const mon = date.getMonth();
        const y = date.getFullYear();

        const groupChats = getDb().groupChats;
        for (const gc of groupChats) {
            for (const pc of (gc.phraseCounters ?? [])) {
                const lastSentDate = new Date(pc.lastSentDate);
                const lastSentD = lastSentDate.getDate();
                const lastSentMon = lastSentDate.getMonth();
                const lastSentY = lastSentDate.getFullYear();
                const [pcH, pcM] = pc.timeOfDayToPost;
                if (pcH === h && pcM === m && !(d === lastSentD && mon === lastSentMon && y === lastSentY)) {
                    await sendPhraseCounter(pc.phrase, pc.count, gc.vkPeerId);
                    pc.lastSentDate = Date.now();
                    pc.count++;
                    saveDb();
                }
            }
        }
    }, 10000);
}

async function sendPhraseCounter(phrase: string, phraseCount: number, peerId: number) {
    const message = `${phrase} день ${phraseCount}`;
    const randomId = Math.floor(Math.random() * 2**32);

    await vk.api.messages.send({ peer_id: peerId, message: message, random_id: randomId, disable_mentions: 1 });
}
