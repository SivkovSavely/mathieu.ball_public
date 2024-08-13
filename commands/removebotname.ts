import {ICommand, UserLevel} from "../ICommand";
import {BotMsgCtx} from "../util";


// noinspection JSUnusedGlobalSymbols
export default {
    trigger: /^\-имя/i,
    name: '-имя',
    description: 'убирает имя боту. убирает только из этого чата.',
    minAllowedLevel: UserLevel.user,
    shouldBotHaveAdmin: false,
    additionalHelpStrings: [],
    hideFromHelp: false,
    showInHelpAfter: '+имя',
    async handler(trigger: string, args: string[], ctx: BotMsgCtx) {
        if (args.length > 1) {
            await ctx.replyError('имя может состоять только из одного слова');
            return;
        }
        if (args.length === 0) {
            await ctx.replyError('а где имя-то?');
            return;
        }

        ctx.groupChat.botNames = ctx.groupChat.botNames.filter(name => name !== args[0]!.toLowerCase());
        ctx.saveDb();
        if (ctx.groupChat.botNames.length === 0) {
            await ctx.reply('было удалено последнее имя. теперь бот откликается только на @упоминания или на /сообщениясослешем');
        } else {
            await ctx.reply('имя удалено');
        }
    }
} as ICommand;