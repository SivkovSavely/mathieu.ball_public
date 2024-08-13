import {ICommand, UserLevel} from "../ICommand";
import {BotMsgCtx} from "../util";
import * as util from "util";


// noinspection JSUnusedGlobalSymbols
export default {
    trigger: /^##|жси|jsi/i,
    name: '##/жси/jsi',
    description: 'вызывает произвольный js код и форматирует его',
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
            await ctx.reply(`тип результата: ${resultType}\nрезультат: ${util.inspect(result)}`);
        } catch (e) {
            if (e instanceof Error) {
                await ctx.replyError(`ошибка: ${e.constructor.name}\nсообщение: ${e.message}`);
            } else {
                await ctx.replyError(`ошибка: ${e}`);
            }
        }
    }
} as ICommand;