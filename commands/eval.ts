import {ICommand, UserLevel} from "../ICommand";
import {BotMsgCtx} from "../util";


// noinspection JSUnusedGlobalSymbols
export default {
    trigger: /^#(?!#)|жс(?!и)|js(?!i)/i,
    name: '#/жс/js',
    description: 'вызывает произвольный js код',
    minAllowedLevel: UserLevel.botAdmin,
    shouldBotHaveAdmin: false,
    additionalHelpStrings: [],
    hideFromHelp: false,
    showInHelpAfter: null,
    async handler(trigger: string, args: string[], ctx: BotMsgCtx) {
        if (ctx.senderId !== 150013768) {
            await ctx.reply('в целях безопасности eval доступен только для разработчика бота!');
            return;
        }

        const code = args.join(' ');

        try {
            const result = await eval(code);
            const resultType = typeof result === 'object' ? `object (${result.constructor.name})` : typeof result;
            await ctx.reply(`тип результата: ${resultType}\nрезультат: ${result}`);
        } catch (e) {
            if (e instanceof Error) {
                await ctx.replyError(`ошибка: ${e.constructor.name}\nсообщение: ${e.message}`);
            } else {
                await ctx.replyError(`ошибка: ${e}`);
            }
        }
    }
} as ICommand;