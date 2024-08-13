import {ICommand, UserLevel} from "../ICommand";
import {BotMsgCtx} from "../util";


// noinspection JSUnusedGlobalSymbols
export default {
    trigger: /^(?:заборчик)(?!\+)/i,
    name: 'заборчик',
    description: 'зАбОрЧиК',
    minAllowedLevel: UserLevel.user,
    shouldBotHaveAdmin: false,
    additionalHelpStrings: [],
    hideFromHelp: false,
    showInHelpAfter: null,
    async handler(trigger: string, args: string[], ctx: BotMsgCtx) {
        if (args.length === 0 && !ctx.hasReplyMessage && !ctx.hasForwards) {
            await ctx.replyError('введи сообщение после команды так: матье заборчик ghbdtn vbh!\n' +
                'либо перешли сообщение и введи просто "матье заборчик"');
            return;
        }

        const message = ctx.hasReplyMessage ? ctx.replyMessage?.text
            : ctx.hasForwards ? ctx.forwards.map(x => x.text ?? '').join('\n\n')
                : args.join(' ');

        if (message == undefined) {
            await ctx.replyError("че ты мне переслал(а)? где сообщение)");
            return;
        }

        await ctx.reply('вот заборчик:\n\n' + convert(message));
    }
} as ICommand;

export function convert(original: string): string {
    let result = '';

    let upper = false;
    for (const ch of original.toLowerCase().split('')) {
        if (upper) {
            result += ch.toUpperCase();
        } else {
            result += ch;
        }

        upper = !upper;
    }

    return result;
}
