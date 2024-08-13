import {ICommand, UserLevel} from "../ICommand";
import {BotMsgCtx, rand} from "../util";


// noinspection JSUnusedGlobalSymbols
export default {
    trigger: /^распределение/i,
    name: 'распределение',
    description: 'раскидывает рандомные проценты на указанные элементы. минимум 2. элементы могут быть как с новой строки, так и через запятую.',
    minAllowedLevel: UserLevel.user,
    shouldBotHaveAdmin: false,
    additionalHelpStrings: [],
    hideFromHelp: false,
    showInHelpAfter: null,
    async handler(trigger: string, args: string[], ctx: BotMsgCtx) {
        const argsSanitized = args.join(' ').trim();
        const argsSplit = (
            argsSanitized.includes('\n')
                ? argsSanitized.split('\n')
                : argsSanitized.split(',')
        ).map(x => x.trim());

        if (argsSplit.length < 2) {
            await ctx.replyError('вариантов должно быть минимум два');
        }

        let remainingPercentages = 100;
        let response = 'распределение:\n\n';
        for (const i of argsSplit.slice(0, argsSplit.length - 1)) {
            const dice = rand(0, remainingPercentages);
            remainingPercentages -= dice;
            response += `- ${i}: ${dice}%\n`;
        }
        response += `- ${argsSplit[argsSplit.length - 1]}: ${remainingPercentages}%\n`;

        await ctx.reply(response.trim());
    }
} as ICommand;