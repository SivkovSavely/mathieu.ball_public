import {ICommand, UserLevel} from "../ICommand";
import {BotMsgCtx, getNicknameOrFullName, getUserOrBotName, isDateToday, log, rand, ungzipify} from "../util";
import {vk} from "../index";
import {APIError} from "vk-io";
import fs from "fs";

//region whoami stuff
type Adjective = {word: string, gender: string, case: string, is_plural: boolean, is_short_form: boolean};
type Noun = {word: string, gender: string, case: string, is_plural: boolean, is_animate: boolean};
type PartOfSpeech = "conj"|"intj"|"part"|"s"|"s.PROP"|"a"|"v"|"adv"|"spro"|"pr"|"num"|"apro"|"advpro"|"anum";
type FrequencyEntry = {word: string, partOfSpeech: PartOfSpeech, frequency: number};

let adjStr: string;
let nounStr: string;
let freqStr: string;

let adjectives: Adjective[];
let nouns: Noun[];
let frequencyEntries: FrequencyEntry[];

(async () => {
    log('| Reading adjectives for whoami...');
    adjStr = await ungzipify('./adjectives.json.gz');
    log('| Reading nouns for whoami...');
    nounStr = await ungzipify('./nouns.json.gz');
    log('| Reading frequency words for whoami...');
    freqStr = (await fs.promises.readFile('./freq_words.csv')).toString();
    log('| Done reading nouns and adjectives for whoami');

    adjectives = JSON.parse(adjStr);
    nouns = JSON.parse(nounStr);
    frequencyEntries = freqStr.split('\n').map(x => x.split(',')).map(x => ({ word: x[0]!, partOfSpeech: x[1] as PartOfSpeech, frequency: parseFloat(x[2]!) }));
})();

function randomNoun(filter?: (n: Noun) => boolean, frequencyThreshold?: number): Noun {
    if (filter === undefined) {
        filter = _ => true;
    }

    let applicableNouns = nouns.filter(filter);

    if (frequencyThreshold !== undefined) {
        const freqs = frequencyEntries.filter(x => x.partOfSpeech === 's' && x.frequency > frequencyThreshold).map(f => f.word.toLowerCase().trim());
        applicableNouns = applicableNouns.filter(x => freqs.includes(x.word.toLowerCase().trim()));
    }

    return applicableNouns[rand(0, applicableNouns.length - 1)]!;
}

function randomAdjective(linkedNoun: Noun, frequencyThreshold?: number): Adjective {
    let applicableAdjectives = adjectives
        .filter(a => a.gender === linkedNoun.gender
            && a.is_plural === linkedNoun.is_plural
            && a.case === linkedNoun.case);

    if (frequencyThreshold !== undefined) {
        const freqs = frequencyEntries.filter(x => x.partOfSpeech === 'a' && x.frequency > frequencyThreshold).map(f => f.word.toLowerCase().trim());
        applicableAdjectives = applicableAdjectives.filter(x => freqs.includes(x.word.toLowerCase().trim()));
    }

    console.log('linkedNoun', linkedNoun);
    console.log('applicableAdjectives', applicableAdjectives);
    return applicableAdjectives[rand(0, applicableAdjectives.length - 1)]!;
}

function randomAdjectiveNoun(frequencyThreshold?: number) {
    let n = randomNoun(n => n.case === 'им', frequencyThreshold);
    let a = randomAdjective(n, frequencyThreshold);
    while (a == null) {
        console.log(`Couldn't find adjective for noun ${n.word}, trying again`);
        n = randomNoun(n => n.case === 'им', frequencyThreshold);
        a = randomAdjective(n, frequencyThreshold);
    }
    return `${a.word} ${n.word}`;
}
// endregion

const randomInterjections = [
    "без сомнения",
    "явно",
    "безусловно",
    "именно",
    "непременно",
    "естественно",
    "очевидно",
    "по всей видимости",
    "неудивительно",
    "совсем не удивительно",
    "подтверждено",
    "известно, что",
    "легко предсказуемо",
    "неизбежно",
    "бесподобно",
    "по совпадению",
    "подозрительно",
    "совершенно точно",
    "так и есть",
    "отлично сказано",
    "неслучайно",
    "однозначно",
    "совсем не случайно",
    "с уверенностью",
    "чистое совпадение",
    "подтверждаю",
    "совершенно верно",
    "отменно",
    "весомо",
    "без всякого сомнения",
    "по законам логики",
    "по всем законам",
    "предсказуемо",
    "неотразимо",
    "по всем канонам",
    "неоспоримо",
    "беспрецедентно",
    "вне всяких сомнений",
    "верно угадано",
    "заслуженно",
    "как ни странно",
    "не поспоришь",
    "совершенно неожиданно",
    "по общему мнению",
    "интересно заметить",
    "неожиданно для всех",
    "неожиданно, но",
    "практически очевидно",
    "без всякой предвзятости",
    "что и следовало ожидать"
];


// noinspection JSUnusedGlobalSymbols
export default {
    trigger: /^(кто|кого|кому|кем|о ком)/i,
    name: 'кто/кого/кому/кем/о ком',
    description: 'ищет рандомного человека в беседе по запросу.',
    minAllowedLevel: UserLevel.user,
    shouldBotHaveAdmin: true,
    additionalHelpStrings: [
        'кто я: показывает случайное словосочетание. обновляется раз в день. по умолчанию генератор содержит не все слова, введите "кто я все" чтобы генерировать из всех слов',
        'кто ... дня: показывает случайного человека по запросу и запоминает его на день',
        'кто все: показывает всех, кто сегодня вводил команду "кто я"'
    ],
    hideFromHelp: false,
    showInHelpAfter: null,
    async handler(trigger: string, args: string[], ctx: BotMsgCtx) {
        if (trigger === 'кто' && args[args.length - 1]?.toLowerCase() === 'дня') {
            await handleWhoOfTheDay(trigger, args, ctx);
            return;
        }
        if (trigger === 'кто' && args.length === 1 && args[0]?.toLowerCase() === 'я') {
            await handleWhoAmI(trigger, args, ctx);
            return;
        }
        if (trigger === 'кто' && args.length === 2 && args[0]?.toLowerCase() === 'я' && args[1]?.toLowerCase() === 'все') {
            await handleWhoAmI(trigger, args, ctx);
            return;
        }
        if (trigger === 'кто' && args.length === 2 && args[0]?.toLowerCase() === 'я' && args[1]?.toLowerCase() === 'сброс') {
            await handleWhoAmI(trigger, args, ctx);
            return;
        }
        if (trigger === 'кто' && args.length === 1 && args[0]?.toLowerCase() === 'все') {
            await handleWhoIsEveryone(trigger, args, ctx);
            return;
        }

        await handleRegularWho(trigger, args, ctx);
    }
} as ICommand;

async function handleWhoOfTheDay(trigger: string, args: string[], ctx: BotMsgCtx) {
    let ofTheDay = ctx.groupChat.ofTheDay;
    if (ofTheDay === undefined) {
        ctx.groupChat.ofTheDay = ofTheDay = { created: Date.now(), wordToVkUserId: {} };
        ctx.saveDb();
    } else {
        const today = new Date();
        const then = new Date(ofTheDay.created);
        const isLastDay = today.getDate() !== then.getDate()
            || today.getMonth() !== then.getMonth()
            || today.getFullYear() !== then.getFullYear();

        if (isLastDay) {
            ctx.groupChat.ofTheDay = ofTheDay = { created: Date.now(), wordToVkUserId: {} };
            ctx.saveDb();
        }
    }

    if (args.length === 1) {
        await ctx.replyError('кто кто дня?');
        return;
    }

    const query = args.slice(0, args.length - 1).join(' ');
    let vkUserId = ofTheDay.wordToVkUserId[query];

    if (vkUserId === undefined) {
        try {
            const users = await vk.api.messages.getConversationMembers({peer_id: ctx.peerId});
            if (users.items === undefined) {
                await ctx.replyError('не смог получить доступ к участникам беседы.');
                return;
            }
            const randomUser = users.items[rand(0, users.items.length - 1)];
            if (randomUser == undefined) {
                // noinspection ExceptionCaughtLocallyJS - rethrows
                throw new Error("randomUser is undefined in who command");
            }
            ofTheDay.wordToVkUserId[query] = randomUser.member_id!;
            vkUserId = ofTheDay.wordToVkUserId[query]
            ctx.saveDb();
        } catch (e) {
            if (e instanceof APIError && e.code == 917) {
                await ctx.replyError('я не админ в этом чате');
            } else {
                throw e;
            }
        }
    }

    const randomInterjection = randomInterjections[Math.floor(Math.random() * randomInterjections.length)]!;

    const u = await getUserOrBotName(vkUserId!, true);
    await ctx.reply(`${randomInterjection}, ${query} дня -- ${u}!`)
}

async function handleWhoAmI(trigger: string, args: string[], ctx: BotMsgCtx) {
    if (ctx.groupChatUser.whoamiChanged === null) {
        ctx.groupChatUser.whoamiChanged = 0;
    }

    if (args[1]?.toLowerCase() === 'сброс') {
        // кто я сброс = сбросить себе whoami. доступно только для разработчика бота.

        if (ctx.user.level < 4) {
            await ctx.replyError('недостаточно прав для сброса "кто я"');
            return;
        }

        ctx.groupChatUser.whoami = null;
        ctx.groupChatUser.whoamiChanged = null;
        ctx.saveDb();

        await ctx.reply('кто я сброшено. повторная генерация сгенерирует новую комбинацию.');
        return;
    }

    const allWords = args[1]?.toLowerCase() === 'все';

    const today = new Date();
    const then = new Date(ctx.groupChatUser.whoamiChanged);
    const isDifferentDay = today.getDate() !== then.getDate()
        || today.getMonth() !== then.getMonth()
        || today.getFullYear() !== then.getFullYear();

    if (isDifferentDay) {
        ctx.groupChatUser.whoami = randomAdjectiveNoun(allWords ? undefined : 30);
        ctx.groupChatUser.whoamiChanged = Date.now();
        ctx.saveDb();
    }

    const randomInterjection = randomInterjections[Math.floor(Math.random() * randomInterjections.length)]!;

    await ctx.reply(`${randomInterjection}, вы -- ${ctx.groupChatUser.whoami ?? "никто"}`);
}

async function handleWhoIsEveryone(trigger: string, args: string[], ctx: BotMsgCtx) {
    const list = [];

    debugger;
    for (const groupChatUser of ctx.groupChat.users) {
        if (groupChatUser.whoamiChanged !== null && isDateToday(groupChatUser.whoamiChanged)) {
            list.push(`${await getNicknameOrFullName(groupChatUser, true)} -- ${groupChatUser.whoami}`);
        }
    }

    if (list.length === 0) {
        await ctx.reply('никто еще не вызывал "кто все" в этой беседе сегодня');
    } else {
        await ctx.reply(list.join('\n'));
    }
}

async function handleRegularWho(trigger: string, args: string[], ctx: BotMsgCtx) {
    const nameCase = {
        'кто': 'nom',
        'кого': 'gen',
        'кому': 'dat',
        'кем': 'ins',
        'о ком': 'abl',
    }[trigger] as "nom" | "gen" | "dat" | "ins" | "abl" | undefined;

    const query = args.join(' ');

    try {
        const users = await vk.api.messages.getConversationMembers({peer_id: ctx.peerId});
        if (users.items === undefined) {
            await ctx.replyError('не смог получить доступ к участникам беседы.');
            return;
        }
        const randomUser = users.items[rand(0, users.items.length - 1)];
        if (randomUser == undefined) {
            // noinspection ExceptionCaughtLocallyJS
            throw new Error("randomUser is undefined in who command");
        }
        const id = randomUser.member_id!;
        //log(`id = ${id}`)
        /*if (id < 0) {
            const group = (await vk.api.groups.getById({group_ids: [id]}))[0];
            const name = (trigger === 'о ком' ? 'о ' : '') + `[club${-id}|${group.name}]`;
            await ctx.reply(`${query} ${name}`, { disable_mentions: true });
        } else {
            const user = (await vk.api.users.get({user_ids: [id], name_case: nameCase}))[0];
            const name = (trigger === 'о ком' ? 'о ' : '') + `[id${id}|${user.first_name} ${user.last_name}]`;
            await ctx.reply(`${query} ${name}`, { disable_mentions: true });
        }*/

        const randomInterjection = randomInterjections[Math.floor(Math.random() * randomInterjections.length)]!;
        const name = (trigger === 'о ком' ? 'о ' : '') + await getUserOrBotName(id, true, nameCase);
        await ctx.reply(`${randomInterjection}, ${query} ${name}`, { disable_mentions: true });
    } catch (e) {
        if (e instanceof APIError && e.code == 917) {
            await ctx.replyError('я не админ в этом чате');
        }
    }
}