import {ICommand, UserLevel} from "../ICommand";
import {BotMsgCtx} from "../util";


// noinspection JSUnusedGlobalSymbols
export default {
    trigger: /^сч[её]тчики/i,
    name: 'счетчики',
    description: 'вывести все счетчики фраз в этом чате',
    minAllowedLevel: UserLevel.user,
    shouldBotHaveAdmin: false,
    additionalHelpStrings: [],
    hideFromHelp: false,
    showInHelpAfter: null,
    async handler(trigger: string, args: string[], ctx: BotMsgCtx) {
        if (ctx.groupChat.phraseCounters.length === 0) {
            await ctx.reply('в этом чате нет счетчиков фраз');
            return;
        }

        const pcs = [];

        for (const pc of ctx.groupChat.phraseCounters) {
            const pcTime = pc.timeOfDayToPost.map(x => x.toString().padStart(2, '0')).join(':');
            pcs.push(`- ${pc.phrase}\nотвечает в ${pcTime}\nсчет: ${pc.count}`);
        }

        await ctx.reply('счетчики в этом чате:\n\n' + pcs.join('\n\n'));
    }
} as ICommand;