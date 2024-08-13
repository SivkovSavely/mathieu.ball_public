import {ICommand, UserLevel} from "../ICommand";
import {BotMsgCtx} from "../util";


// noinspection JSUnusedGlobalSymbols
export default {
    trigger: /^-сч[её]тчик/i,
    name: '+счетчик <ЧЧ:ММ> <фраза>',
    description: 'удаляет существующий счетчик фразы. действует только в этом чате.',
    minAllowedLevel: UserLevel.user,
    shouldBotHaveAdmin: false,
    additionalHelpStrings: [],
    hideFromHelp: false,
    showInHelpAfter: null,
    async handler(trigger: string, args: string[], ctx: BotMsgCtx) {
        if (args.length < 1) {
            await ctx.replyError("использование: -счетчик <ЧЧ:ММ>. пример: -счетчик 10:30");
            return;
        }

        const hhmm = args[0]!.split(':').map(x => parseInt(x)).slice(0, 2);
        if (hhmm.length < 2 || hhmm.some(isNaN)) {
            await ctx.replyError("ЧЧ:ММ должно содержать два числа!");
            return;
        }

        const phrase = args.slice(1).join(' ');
        const phraseCounters = ctx.groupChat.phraseCounters;
        const counterIndex = phraseCounters.findIndex(x => x.timeOfDayToPost[0] === hhmm[0] && x.timeOfDayToPost[1] === hhmm[1]);
        const counter = phraseCounters[counterIndex]
        if (counterIndex < 0) {
            await ctx.replyError('счетчик в это время не найден. введите /счетчики чтобы увидеть все счетчики в этом чате');
            return;
        }

        const removedPhrase = ctx.groupChat.phraseCounters.splice(counterIndex, 1);
        ctx.saveDb();

        await ctx.reply(`фраза "${removedPhrase[0]!.phrase}" удалена`);
    }
} as ICommand;