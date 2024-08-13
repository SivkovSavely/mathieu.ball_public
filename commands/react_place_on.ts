import {ICommand, UserLevel} from "../ICommand";
import {BotMsgCtx, getNicknameOrFullName, parseVkIdFromMention} from "../util";
import {lastChatMessages, vk} from "../index";
import {reactsList} from "./reacts";

export const reactsOnList: {vkId: number, peerId: number, reactNumber: number}[] = [];

// noinspection JSUnusedGlobalSymbols
export default {
    trigger: /^проставь реакты на/i,
    name: 'проставь реакты на <юзер> <эмодзи реакта> [кол-во сообщений = 10]',
    description: 'бот проставит реакцию на предыдущие сообщения человека. конфигурируемо',
    minAllowedLevel: UserLevel.user,
    shouldBotHaveAdmin: false,
    additionalHelpStrings: [],
    hideFromHelp: false,
    showInHelpAfter: 'имена',
    async handler(trigger: string, args: string[], ctx: BotMsgCtx) {
        const vkId = parseVkIdFromMention(args.join(' '));
        const reactName = args[1];

        const gcu = ctx.groupChat.users.find(x => x.vkId === vkId);
        if (gcu === undefined) {
            return await ctx.replyError('такого юзера в чате нет');
        }

        let count = parseInt(args[2] ?? '10');
        let attempts = 1;
        while (attempts++ < 1000) {
            const msgs = await vk.api.messages.getByConversationMessageId({
                peer_id: ctx.peerId,
                conversation_message_ids: lastChatMessages[ctx.peerId]! - attempts
            });
            const msg = msgs.items[0];

            console.log('msg:', msg);

            if (msg && msg.from_id === vkId) {
                console.log('sending reaction');
                await vk.api.call("messages.sendReaction", {
                    peer_id: ctx.peerId,
                    cmid: msg.conversation_message_id ?? msg.id,
                    reaction_id: parseInt(Object.entries(reactsList).find(x => x[1] === reactName)![0]),
                });
            }

            count--;
            if (count <= 0) break;
        }
    }
} as ICommand;