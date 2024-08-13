import {APIError, ContextDefaultState, MessageContext} from "vk-io";
import {getDb, GroupChat, GroupChatUser, IDb, IGroupChatUser, IRole, RoleName, saveDb, User} from "./db";
import {vk} from "./index";
import {UserLevel} from "./ICommand";
import {MessagesConversationMember} from "vk-io/lib/api/schemas/objects";
import {pipeline} from "node:stream";
import {createGzip} from "node:zlib";
import {createReadStream, createWriteStream} from "node:fs";
import {promisify} from "node:util";
import fs from "fs";
import {createGunzip} from "zlib";
import * as util from "util";

const pipe = promisify(pipeline);


export type BotMsgCtx = MessageContext<ContextDefaultState>
    & { user: User, groupChat: GroupChat, groupChatUser: GroupChatUser }
    & { replyError(message: string): Promise<void> }
    & { db(): IDb }
    & { saveDb(): void }
    & { getMaxUserLevel(): UserLevel }
    & { vk: typeof vk }

export function log(message: string): void {
    const date = new Date().toISOString().split('Z')[0];
    console.log(`[${date}] ${message}`);
}

export function rand(from: number, toIncl: number) {
    return Math.floor(Math.random() * (toIncl - from + 1)) + from;
}

export function decline(n: number, word: [string, string, string], includeNumber = false): string {
    if (n == null) {
        return `<NULL> ${word[2]}`;
    }
    
    const numberPrefix = includeNumber ? `${n} ` : '';
    
    if (n >= 10 && n <= 19) {
        return numberPrefix + word[2];
    }
    if (n % 10 === 1) {
        return numberPrefix + word[0];
    }
    if (n % 10 > 1 && n % 10 <= 4) {
        return numberPrefix + word[1];
    }
    return numberPrefix + word[2];
}

export async function getUserOrBotName(
    vkId: number, mention: boolean = false, nameCase: "nom" | "gen" | "dat" | "acc" | "ins" | "abl" | undefined = "nom") {
    if (vkId < 0) {
        const group = (await vk.api.groups.getById({group_ids: [vkId]}))[0];
        if (group == undefined) {
            throw new Error("group is undefined in getUserOrBotName");
        }
        return mention ? `[club${-vkId}|${group.name}]` : (group.name ?? "");
    }

    let firstName: string, lastName: string;
    const botUser = getDb().users.find(x => x.vkId === vkId);
    if (botUser !== undefined) {
        console.log(`${vkId}: botUser !== undefined`);
        console.log(`${vkId}: botUser.firstName = ${util.inspect(botUser.firstName)}`);
        console.log(`${vkId}: botUser.lastName = ${util.inspect(botUser.lastName)}`);
        if (!botUser.firstName || !botUser.lastName) {
            console.log(`${vkId}: some of the names is undefined, calling vk api to set them`);
            const vkUser = (await vk.api.users.get({user_ids: [vkId], name_case: nameCase}))[0];
            if (!botUser.firstName) botUser.firstName = vkUser.first_name;
            if (!botUser.lastName) botUser.lastName = vkUser.last_name;
            saveDb();
        }

        console.log(`${vkId}: firstName = ${botUser.firstName}, lastName = ${botUser.lastName}`);
        firstName = botUser.firstName;
        lastName = botUser.lastName;
    } else {
        console.log(`${vkId}: botUser === undefined, calling vk api to set them`);
        const vkUser = (await vk.api.users.get({user_ids: [vkId], name_case: nameCase}))[0];
        firstName = vkUser.first_name;
        lastName = vkUser.last_name;
        console.log(`${vkId}: firstName = ${vkUser.first_name}, lastName = ${vkUser.last_name}`);
    }

    return mention ? `[id${vkId}|${firstName} ${lastName}]` : `${firstName} ${lastName}`;
}

export function getUserRoles(userRoleList: RoleName[], chatRoleList: IRole[]) {
    return chatRoleList.filter(role => userRoleList.includes(role.name));
}

export function getUserRolesNamesAndIcons(userRoleList: RoleName[], chatRoleList: IRole[]) {
    return getUserRoles(userRoleList, chatRoleList)
        .map(x => `${x.symbol ? x.symbol + ' ' : ''}${x.name}`)
        .join(', ');
}

export function getUserLevelNameAndIcon(level: UserLevel) {
    return {
        [UserLevel.user]: 'пользователь',
        [UserLevel.juniorModer]: '👑🥉 младший админ',
        [UserLevel.seniorModer]: '👑🥈 старший админ',
        [UserLevel.chatAdmin]: '👑🥇 админ чата',
        [UserLevel.botAdmin]: '👮 админ бота',
    }[level];
}

export async function getNicknameOrFullName(groupChatUser: GroupChatUser, isMention: boolean = false, vkId?: number) {
    let textPartOfMention: string;

    if (!groupChatUser) {
        textPartOfMention = await getUserOrBotName(vkId!);
    } else if (groupChatUser.nickname === null) {
        // const u = (await vk.api.users.get({ user_ids: [groupChatUser.vkId] }))[0];
        // textPartOfMention = u.first_name;
        textPartOfMention = await getUserOrBotName(groupChatUser.vkId);
    } else {
        textPartOfMention = groupChatUser.nickname;
    }

    if (isMention) {
        return `[id${groupChatUser.vkId}|${textPartOfMention}]`;
    }

    return textPartOfMention;
}

export async function tryGetConversationMembers(ctx: BotMsgCtx): Promise<[success: boolean, members: MessagesConversationMember[]]> {
    try {
        const users = await vk.api.messages.getConversationMembers({peer_id: ctx.peerId});
        if (users.items === undefined) {
            await ctx.replyError('не смог получить доступ к участникам беседы.');
            return [false, []];
        }
        return [true, users.items]
    } catch (e) {
        if (e instanceof APIError && e.code == 917) {
            await ctx.replyError('я не админ в этом чате');
        }
        return [false, []];
    }
}

export function verbInfinitiveToPastTense(verb: string, isFemale: boolean): string {
    verb = verb.toLowerCase();
    if (verb.endsWith('нуть')) return verb.replace(/нуть$/, isFemale ? 'нула' : 'нул');
    if (verb.endsWith('ить')) return verb.replace(/ить$/, isFemale ? 'ила' : 'ил');
    if (verb.endsWith('ать')) return verb.replace(/ать$/, isFemale ? 'ала' : 'ал');
    if (verb.endsWith('ть')) return verb.replace(/ть$/, isFemale ? 'ла' : 'л');
    return verb;
}

export function setDefaults<T extends Object>(defaults: T, object: T) {
    for (const key in defaults) {
        if (!defaults.hasOwnProperty(key)) continue;

        if (!(key in object)) {
            // @ts-ignore
            object[key] = defaults[key];
        }
    }
}

export function isDateToday(date: Date): boolean;
export function isDateToday(timestamp: number): boolean;
/**
 * Checks if dateOrTimestamp provided is today (same D, M and Y) relative to local computer time.
 * @param dateOrTimestamp Date or timestamp for the date.
 */
export function isDateToday(dateOrTimestamp: Date | number): boolean {
    const today = new Date();
    const then = typeof dateOrTimestamp === 'number' ? new Date(dateOrTimestamp) : dateOrTimestamp;
    return today.getDate() == then.getDate()
        && today.getMonth() == then.getMonth()
        && today.getFullYear() == then.getFullYear();
}

export function tryRegisterUser(vkId: number): User {
    const user = getDb().users.find(x => x.vkId === vkId);
    if (user === undefined) {
        return registerUser(vkId);
    }

    return user;
}

export function registerUser(vkId: number): User {
    const user = new User();
    user.vkId = vkId;

    const users = getDb().users;
    if (users.find(x => x.vkId === vkId)) {
        throw new Error(`User with vkId=${vkId} already exists in the database!`);
    }

    users.push(user);
    saveDb();

    return user;
}

export function tryRegisterGroupChatUser(vkId: number, groupChat: GroupChat): GroupChatUser {
    const groupChatUser = groupChat.users.find(x => x.vkId === vkId);
    if (groupChatUser === undefined) {
        return registerGroupChatUser(vkId, groupChat);
    }

    return groupChatUser;
}

export function registerGroupChatUser(vkId: number, groupChat: GroupChat): GroupChatUser {
    const groupChatUsers = groupChat.users;
    if (groupChatUsers.find(x => x.vkId === vkId)) {
        throw new Error(`GroupChatUser with vkId=${vkId} and groupChat ID=${groupChat.id} already exists in the database!`);
    }

    const groupChatUser = new GroupChatUser();
    groupChatUser.vkId = vkId;

    tryRegisterUser(vkId);
    groupChatUsers.push(groupChatUser);
    saveDb();

    return groupChatUser;
}

export function tryGetReplyingToMessageAuthorId(ctx: BotMsgCtx): number|null {
    if (ctx.hasReplyMessage) {
        return ctx.replyMessage?.senderId ?? null;
    }

    if (ctx.hasForwards) {
        return ctx.forwards?.[0]?.senderId ?? null;
    }

    return null;
}

export async function gzipify(fileName: string): Promise<string> {
    const tempFileName = 'temp_' + Math.floor(Math.random() * 2**32).toString(36) + Date.now() + '.json';

    const gzip = createGzip();
    const source = createReadStream(fileName);
    const destination = createWriteStream(tempFileName);
    await pipe(source, gzip, destination);

    const destinationContentsBuf = await fs.promises.readFile(tempFileName);
    const destinationContents = destinationContentsBuf.toString();

    await fs.promises.rm(tempFileName);

    return destinationContents;
}

export async function ungzipify(gzFileName: string): Promise<string> {
    const tempFileName = 'temp_' + Math.floor(Math.random() * 2**32).toString(36) + Date.now() + '.json';

    const gzip = createGunzip();
    const source = createReadStream(gzFileName);
    const destination = createWriteStream(tempFileName);
    await pipe(source, gzip, destination);

    const destinationContentsBuf = await fs.promises.readFile(tempFileName);
    const destinationContents = destinationContentsBuf.toString();

    await fs.promises.rm(tempFileName);

    return destinationContents;
}

export function parseVkIdFromMention(mentionInSquareBracketForm: string): number | undefined {
    const match = mentionInSquareBracketForm.match(/(\[id(\d+)\|([^\]]+)])/);

    if (match === null || match.length < 3) {
        console.error(`Mention ${mentionInSquareBracketForm} is in the wrong form!`);
        return undefined;
    }

    if (match[3] != null && match[3].split(' ').length > 1) {
        throw 'в упоминании не может быть больше одного слова!';
    }

    return parseInt(match[2]!);
}