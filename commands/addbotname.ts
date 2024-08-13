import {ICommand, UserLevel} from "../ICommand";
import {BotMsgCtx} from "../util";


// noinspection JSUnusedGlobalSymbols
export default {
    trigger: /^\+имя/i,
    name: '+имя',
    description: 'добавляет имя боту. действует только в этом чате.',
    minAllowedLevel: UserLevel.user,
    shouldBotHaveAdmin: false,
    additionalHelpStrings: [],
    hideFromHelp: false,
    showInHelpAfter: 'имена',
    async handler(trigger: string, args: string[], ctx: BotMsgCtx) {
        if (args.length > 1) {
            await ctx.replyError('имя может состоять только из одного слова');
            return;
        }
        if (args.length === 0) {
            await ctx.replyError('а где имя-то?');
            return;
        }

        ctx.groupChat.botNames.push(args[0]!.toLowerCase());
        ctx.saveDb();
        await ctx.reply('поздравляю с новым именем!');
    }
} as ICommand;