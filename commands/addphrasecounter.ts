import {ICommand, UserLevel} from "../ICommand";
import {BotMsgCtx} from "../util";


// noinspection JSUnusedGlobalSymbols
export default {
    trigger: /^\+сч[её]тчик/i,
    name: '+счетчик <ЧЧ:ММ> <фраза>',
    description: 'добавляет счетчик фразы. действует только в этом чате.',
    minAllowedLevel: UserLevel.botAdmin,
    shouldBotHaveAdmin: false,
    additionalHelpStrings: [],
    hideFromHelp: false,
    showInHelpAfter: null,
    async handler(trigger: string, args: string[], ctx: BotMsgCtx) {
        if (args.length < 2) {
            await ctx.replyError("использование: +счетчик <ЧЧ:ММ> <фраза>. пример: +счетчик 10:30 привет мир");
            return;
        }

        const hhmm = args[0]!.split(':').map(x => parseInt(x)).slice(0, 2);
        if (hhmm.length < 2 || hhmm.some(isNaN)) {
            await ctx.replyError("ЧЧ:ММ должно содержать два числа!");
            return;
        }

        if (hhmm[0]! < 0 || hhmm[0]! >= 24 || hhmm[1]! < 0 || hhmm[1]! >= 60) {
            await ctx.replyError("ЧЧ должно быть 0-23, ММ должно быть 0-59!");
            return;
        }

        const phrase = args.slice(1).join(' ');
        const phraseCounters = ctx.groupChat.phraseCounters;
        if (phraseCounters.find(x => x.timeOfDayToPost[0] === hhmm[0] && x.timeOfDayToPost[1] === hhmm[1])) {
            await ctx.replyError('в это время уже есть фраза');
            return;
        }

        ctx.groupChat.phraseCounters.push({
            phrase: phrase,
            timeOfDayToPost: hhmm as [number, number],
            count: 1,
            lastSentDate: 0,
        });
        ctx.saveDb();

        await ctx.reply('фраза добавлена');
    }
} as ICommand;
