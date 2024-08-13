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


// noinspection JSUnusedGlobalSymbols
export default {
    trigger: /^профиль/i,
    name: 'профиль',
    description: 'показывает ваш профиль',
    minAllowedLevel: UserLevel.user,
    shouldBotHaveAdmin: false,
    additionalHelpStrings: [],
    hideFromHelp: false,
    showInHelpAfter: null,
    async handler(trigger: string, args: string[], ctx: BotMsgCtx) {
        const todayWhoami = new Date();
        const thenWhoami = new Date(ctx.groupChatUser.whoamiChanged ?? 0);
        const isDifferentDayWhoami = todayWhoami.getDate() !== thenWhoami.getDate()
            || todayWhoami.getMonth() !== thenWhoami.getMonth()
            || todayWhoami.getFullYear() !== thenWhoami.getFullYear();

        const replyingToMessageAuthorId = tryGetReplyingToMessageAuthorId(ctx);
        let profileUserId: number | null;

        if (replyingToMessageAuthorId !== null) {
            profileUserId = tryGetReplyingToMessageAuthorId(ctx);
        } else if (args.length > 0) {
            let idToFetch: number | null = null;
            const rest = args.join(' ');
            const id = rest.match(/\[(.*?)\|.*?]|vk\.com\/([^ ]*)/);
            if (id === null) {
                await ctx.replyError('укажите первым аргументом ссылку на профиль или упоминание');
                return;
            } else {
                if (id[1] !== undefined) {
                    idToFetch = parseInt(id[1].replace(/[^\d]/, ''));
                } else if (id[2] !== undefined) {
                    idToFetch = (await vk.api.users.get({ user_ids: [id[2]] }))[0].id;
                } else {
                    await ctx.replyError('не смог распарсить аргумент');
                    return;
                }

                if (idToFetch == null) {
                    await ctx.replyError("не смог получить айди");
                    return;
                }

                profileUserId = idToFetch;
            }
        } else {
            profileUserId = ctx.groupChatUser.vkId;
        }

        const [success, members] = await tryGetConversationMembers(ctx);
        if (!success) {
            return;
        }

        const conversationMember = members.find(x => x.member_id === profileUserId);
        if (conversationMember === undefined) {
            await ctx.replyError("этот пользователь не состоит в этой беседе");
            return;
        }

        const gcu = tryRegisterGroupChatUser(conversationMember!.member_id!, ctx.groupChat);

        let user = ctx.db().users.find(x => x.vkId === gcu.vkId);
        if (user === undefined) {
            await ctx.replyError("этот пользователь не найден в базе данных бота");
            return;
        }

        const isMe = profileUserId === ctx.groupChatUser.vkId;

        await ctx.reply(`${isMe ? 'ваш профиль' : 'профиль участника'}:
id вконтакте: ${gcu.vkId}
никнейм: ${gcu.nickname ?? "нет никнейма"}
кто ${isMe ? 'вы' : 'пользователь'} сегодня: ${isDifferentDayWhoami
            ? (isMe ? 'вы не вызывали' : 'пользователь не вызывал') + " \"кто я\" сегодня"
            : gcu.whoami}
${isMe ? 'ваш статус' : 'статус пользователя'} в боте: ${getUserLevelNameAndIcon(user.level)}
${isMe ? 'ваши роли' : 'роли пользователя'} в беседе: ${getUserRolesNamesAndIcons(gcu.roles, ctx.groupChat.roles)}`);
    }
} as ICommand;