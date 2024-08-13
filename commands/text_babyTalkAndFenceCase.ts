import {ICommand, UserLevel} from "../ICommand";
import {BotMsgCtx} from "../util";
import {convert as convertBabyTalk} from "./text_babyTalk";
import {convert as convertFenceCase} from "./text_fenceCase";


// noinspection JSUnusedGlobalSymbols
export default {
    trigger: /^(?:дразнилка\+заборчик|заборчик\+дразнилка)/i,
    name: 'дразнилка+заборчик',
    description: 'дЬяЗьНиЙкЯ и ЗяБёЙчИк',
    minAllowedLevel: UserLevel.user,
    shouldBotHaveAdmin: false,
    additionalHelpStrings: [],
    hideFromHelp: false,
    showInHelpAfter: null,
    async handler(trigger: string, args: string[], ctx: BotMsgCtx) {
        if (args.length === 0 && !ctx.hasReplyMessage && !ctx.hasForwards) {
            await ctx.replyError('введи сообщение после команды так: матье дразнилка+заборчик ghbdtn vbh!\n' +
                'либо перешли сообщение и введи просто "матье дразнилка+заборчик"');
            return;
        }

        const message = ctx.hasReplyMessage ? ctx.replyMessage?.text
            : ctx.hasForwards ? ctx.forwards.map(x => x.text ?? '').join('\n\n')
                : args.join(' ');

        if (message == undefined) {
            await ctx.replyError("че ты мне переслал(а)? где сообщение)");
            return;
        }

        await ctx.reply('пОдРаЗнИл:\n\n' + convertFenceCase(convertBabyTalk(message)));
    }
} as ICommand;
