import {ICommand, UserLevel} from "../ICommand";
import {BotMsgCtx} from "../util";


// noinspection JSUnusedGlobalSymbols
export default {
    trigger: /^имена/i,
    name: 'имена',
    description: 'выводит список имён бота',
    minAllowedLevel: UserLevel.user,
    shouldBotHaveAdmin: false,
    additionalHelpStrings: [],
    hideFromHelp: false,
    showInHelpAfter: null,
    async handler(trigger: string, args: string[], ctx: BotMsgCtx) {
        const names = ctx.groupChat.botNames;
        if (names.length === 0) {
            await ctx.reply('в этом чате нет имен у бота. бот откликается только на @упоминания или на /сообщениясослешем');
        } else if (names.length === 1) {
            await ctx.reply(`в этом чате бот откликается только на "${names[0]}"`);
        } else {
            await ctx.reply('имена бота:\n' + names.map(n => '- ' + n).join('\n'));
        }
    }
} as ICommand;