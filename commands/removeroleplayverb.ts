import {ICommand, UserLevel} from "../ICommand";
import {BotMsgCtx} from "../util";


// noinspection JSUnusedGlobalSymbols
export default {
    trigger: /^-глагол/i,
    name: '-глагол',
    description: 'удаляет рп глагол у бота. только в этом чате',
    minAllowedLevel: UserLevel.user,
    shouldBotHaveAdmin: false,
    additionalHelpStrings: [],
    hideFromHelp: false,
    showInHelpAfter: '+глагол',
    async handler(trigger: string, args: string[], ctx: BotMsgCtx) {
        if (args.length > 1) {
            await ctx.replyError('рп глагол должен быть одним словом!');
            return;
        }
        if (args.length === 0) {
            await ctx.replyError('а где глагол-то?');
            return;
        }

        const verb = args[0]!.toLowerCase();
        if (!ctx.groupChat.rolePlayVerbs.includes(verb)) {
            await ctx.replyError('такого глагола и не было');
            return;
        }

        ctx.groupChat.rolePlayVerbs = ctx.groupChat.rolePlayVerbs.filter(v => v !== verb);
        ctx.saveDb();
        await ctx.reply(`глагол удален успешно!`);
    }
} as ICommand;