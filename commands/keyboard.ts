import {ICommand, UserLevel} from "../ICommand";
import {BotMsgCtx} from "../util";
import {vk} from "../index";


// noinspection JSUnusedGlobalSymbols
export default {
    trigger: /^(?:клавиатура|раскладка|пунто|punto|rkfdbfnehf|geynj|hfcrkflrf|згтещ|переведи|gthtdtlb|блять|,kznm)/i,
    name: 'клавиатура/раскладка/пунто/punto',
    description: 'меняет раскладку с ghbdtn на привет и обратно.',
    minAllowedLevel: UserLevel.user,
    shouldBotHaveAdmin: false,
    additionalHelpStrings: [],
    hideFromHelp: false,
    showInHelpAfter: null,
    async handler(trigger: string, args: string[], ctx: BotMsgCtx) {
        if (args.length === 0 && !ctx.hasReplyMessage && !ctx.hasForwards) {
            const historyResponse = await vk.api.messages.getByConversationMessageId({
                peer_id: ctx.peerId,
                conversation_message_ids: ctx.conversationMessageId! - 1
            });
            const lastMessage = historyResponse.items[0];
            
            if (lastMessage === undefined) {
                await ctx.replyError('введи сообщение после команды так: матье клавиатура ghbdtn vbh!\n' +
                    'либо перешли сообщение и введи просто "матье клавиатура"');
                return;
            }

            if (lastMessage.text == undefined || lastMessage.text == "") {
                await ctx.replyError("че ты мне переслал(а)? где сообщение)");
                return;
            }

            await ctx.reply('конвертировал:\n\n' + convert(lastMessage.text));
            return;
        }

        const message = ctx.hasReplyMessage ? ctx.replyMessage?.text
            : ctx.hasForwards ? ctx.forwards.map(x => x.text ?? '').join('\n\n')
                : args.join(' ');

        if (message == undefined) {
            await ctx.replyError("че ты мне переслал(а)? где сообщение)");
            return;
        }

        await ctx.reply('конвертировал:\n\n' + convert(message));
    }
} as ICommand;

const cyril = `йцукенгшщзхъфывапролджэячсмитьбю.ЙЦУКЕНГШЩЗХЪФЫВАПРОЛДЖЭЯЧСМИТЬБЮ,ёЁ?`;
const latin = `qwertyuiop[]asdfghjkl;'zxcvbnm,./QWERTYUIOP{}ASDFGHJKL:"ZXCVBNM<>?\`~&`;

function convert(original: string): string {
    let converted = "";
    let language = "";
    for (const ch of original.split('')) {
        const cyr = cyril.includes(ch);
        const lat = latin.includes(ch);

        if (language == "" || !(cyr && lat)) {
          language = cyr ? "cyr" : lat ? "lat" : language;
        }

        if (language == "cyr") {
            let idx = cyril.indexOf(ch);
            converted += idx === -1 ? ch : latin[idx];
        } else if (language == "lat") {
            let idx = latin.indexOf(ch);
            converted += idx === -1 ? ch : cyril[idx];
        } else {
            converted += ch;
        }
    }
    return converted;
}
