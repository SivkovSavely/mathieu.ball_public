import {ICommand, UserLevel} from "../ICommand";
import {BotMsgCtx} from "../util";


// noinspection JSUnusedGlobalSymbols
export default {
    trigger: /^\+глагол/i,
    name: '+глагол',
    description: 'добавляет рп глагол боту. только в этом чате',
    minAllowedLevel: UserLevel.user,
    shouldBotHaveAdmin: false,
    additionalHelpStrings: [],
    hideFromHelp: false,
    showInHelpAfter: 'глаголы',
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
        if (ctx.groupChat.rolePlayVerbs.includes(verb)) {
            await ctx.replyError('такой глагол уже есть');
            return;
        }

        ctx.groupChat.rolePlayVerbs.push(verb);
        ctx.saveDb();
        const firstBotName = ctx.groupChat.botNames[0];
        await ctx.reply(`глагол добавлен успешно!
пример использования: "${firstBotName === undefined ? '/' : firstBotName + ' '} ${verb} [фраза]"`);
    }
} as ICommand;