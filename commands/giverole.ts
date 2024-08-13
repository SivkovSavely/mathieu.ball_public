import {ICommand, UserLevel} from "../ICommand";
import {
    BotMsgCtx, getNicknameOrFullName,
    getUserLevelNameAndIcon,
    getUserRolesNamesAndIcons, parseVkIdFromMention,
    tryGetConversationMembers,
    tryGetReplyingToMessageAuthorId,
    tryRegisterGroupChatUser
} from "../util";
import {vk} from "../index";
import {saveDb} from "../db";


// noinspection JSUnusedGlobalSymbols
export default {
    trigger: /^дать роль/i,
    name: 'дать роль <кому> <название роли>',
    description: 'дать существующую роль пользователю',
    minAllowedLevel: UserLevel.chatAdmin,
    shouldBotHaveAdmin: false,
    additionalHelpStrings: [],
    hideFromHelp: false,
    showInHelpAfter: null,
    async handler(trigger: string, args: string[], ctx: BotMsgCtx) {
        const vkId = parseVkIdFromMention(args.join(' '));
        const roleName = args.slice(1).join(' ').toLowerCase();

        const role = ctx.groupChat.roles.find(x => x.name.toLowerCase() === roleName.toLowerCase());
        if (role === undefined) {
            await ctx.replyError(`роли ${roleName} нет в этом чате`);
        }

        const gcu = ctx.groupChat.users.find(x => x.vkId === vkId);
        if (gcu === undefined) {
            return await ctx.replyError('такого юзера в чате нет');
        }

        if (gcu.roles.includes(roleName)) {
            return await ctx.replyError(`у юзера уже есть роль ${roleName}`);
        }

        gcu.roles.push(roleName);
        ctx.saveDb();

        await ctx.reply(`успешно дал роль '${roleName}' юзеру ${await getNicknameOrFullName(gcu, true, vkId)}`);
    }
} as ICommand;