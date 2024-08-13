import {ICommand, UserLevel} from "../ICommand";
import {
    BotMsgCtx,
    getUserLevelNameAndIcon,
    getUserRolesNamesAndIcons,
    tryGetConversationMembers,
    tryGetReplyingToMessageAuthorId,
    tryRegisterGroupChatUser
} from "../util";
import {vk} from "../index";

const inMemoryWarnDb: Record<string, number> = {}; // key = `${peer_id}:${vk_id}`

// noinspection JSUnusedGlobalSymbols
export default {
    trigger: /^прeд/i,
    name: 'пред',
    description: 'дает предупреждение пользователю',
    minAllowedLevel: UserLevel.botAdmin,
    shouldBotHaveAdmin: false,
    additionalHelpStrings: [],
    hideFromHelp: false,
    showInHelpAfter: null,
    async handler(trigger: string, args: string[], ctx: BotMsgCtx) {
        if (!ctx.hasReplyMessage && !ctx.hasForwards) {
            return ctx.replyError('ответьте на сообщение человеку, которому нужно поставить пред')
        }
        const key = ctx.peerId + ":" + (ctx.replyMessage ?? ctx.forwards?.[0])?.senderId;

        let currentWarns = 0;
        if (key in inMemoryWarnDb) {
            currentWarns = inMemoryWarnDb[key] ?? 0;
        }

        inMemoryWarnDb[key] = currentWarns + 1;

        await ctx.reply(`выдано предупреждение ${currentWarns + 1}/3.`)
    }
} as ICommand;