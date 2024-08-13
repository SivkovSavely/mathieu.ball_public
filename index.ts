import * as dotenv from 'dotenv';
dotenv.config();
dotenv.config({
    path: './.env.local'
});

import {IMessageContextSendOptions, VK} from "vk-io";
import {BotMsgCtx, getNicknameOrFullName, log, setDefaults} from "./util";
import * as db from "./db";
import * as fs from "fs";
import {addCommand, ICommand, executeCommand, getCommandsCount, getCommands} from "./ICommand";
import {getDb, GroupChat, GroupChatDefaults, GroupChatUser, GroupChatUserDefaults, User, UserDefaults} from "./db";
import {MessagesSendParams} from "vk-io/lib/api/schemas/params";
import {loadPhraseCounterModule} from "./modules/phraseCounters";
import {reactsOnList} from "./commands/react_on";
import {countCapitalization} from "./modules/capitalizationChecker";

const environment: "BETA"|"PROD" = (process.env[`MATHIEU_ENVIRONMENT`] as "BETA"|"PROD"|undefined) ?? "BETA";
const token = process.env[`${environment}_TOKEN`]!;
export const vk = new VK({ token, pollingGroupId: +process.env[`${environment}_GROUP_ID`]!, language: "uk" });
log('VK client initialized.');

db.load();

(async () => {
    for (const commandFile of fs.readdirSync('./commands')) {
        if (!commandFile.endsWith('.js')) continue;

        const command: ICommand = (await import('./commands/' + commandFile)).default;
        addCommand(command);
        log(`Added command ${command.name}`);
    }
})().then(() => log(`Loaded ${getCommandsCount()} commands.`)).then(() => {
    const sortedCommands = [...getCommands()].sort((a, b) => a.name.localeCompare(b.name));
    console.log(`commands:\n${sortedCommands.map(x => x.name).join('\n')}`);
});

loadPhraseCounterModule();

const joinedUsers = new Set<number>();
const leftUsers = new Set<number>();
const sentGreetings: { [peerId: number]: [welcomeStickerMessageId: number, greetingTextMessageId?: number][] } = {};
const sentFarewells: { [peerId: number]: [messageId: number][] } = {};

vk.updates.on('chat_invite_user_by_link', async (ctx: BotMsgCtx) => {
    joinedUsers.add(ctx.peerId);
});
vk.updates.on('chat_invite_user', async (ctx: BotMsgCtx) => {
    joinedUsers.add(ctx.peerId);
});
vk.updates.on('chat_kick_user', async (ctx: BotMsgCtx) => {
    leftUsers.add(ctx.peerId);
});

setInterval(async () => {
    if (joinedUsers.size > 0) {
        try {
            for (const peerId of joinedUsers.values()) {
                const tuple: [number,  number|undefined] = [-1, undefined];
                
                const sentStickerMessage = await vk.api.messages.send({
                    peer_ids: [peerId],
                    sticker_id: 2158, // хлеб да соль
                    random_id: Math.floor(Math.random() * Number.MAX_SAFE_INTEGER),
                }) as unknown as { peer_id: number, conversation_message_id: number }[];
                console.log('sentStickerMessage joined', sentStickerMessage);
                tuple[0] = sentStickerMessage[0]!.conversation_message_id;

                const gc = getDb().groupChats.filter(gc => gc.vkPeerId === peerId)[0];
                if (gc && gc.greeting) {
                    const sentGreetingMessage = await vk.api.messages.send({
                        peer_ids: [peerId],
                        message: gc.greeting,
                        attachment: gc.greetingAttachment,
                        random_id: Math.floor(Math.random() * Number.MAX_SAFE_INTEGER),
                    }) as unknown as { peer_id: number, conversation_message_id: number }[];
                    console.log('sentGreetingMessage joined', sentGreetingMessage);
                    tuple[1] = sentGreetingMessage[0]!.conversation_message_id;
                }

                sentGreetings[peerId] ??= [];
                sentGreetings[peerId]!.push(tuple);
            }

            try {
                console.log("Deleting all sentGreetings messaqes except the last one. sentGreetings:", sentGreetings);
                for (const [peerId, messageIds] of Object.entries(sentGreetings)) {
                    for (const [welcomeStickerMessageId, greetingTextMessageId] of messageIds.slice(0, -1)) {
                        await vk.api.messages.delete({
                            peer_id: +peerId,
                            cmids: +welcomeStickerMessageId,
                            delete_for_all: true
                        });
                        
                        if (greetingTextMessageId !== undefined) {
                            await vk.api.messages.delete({
                                peer_id: +peerId,
                                cmids: +greetingTextMessageId,
                                delete_for_all: true
                            });
                        }
                    }
                }
            } finally {
                console.log("Removing all keys from sentGreetings except the last one");
                Object.keys(sentGreetings).forEach(key => {
                    sentGreetings[+key]!.reverse();
                    sentGreetings[+key]!.length = 1;
                });
            }
        } finally {
            joinedUsers.clear();
        }
    }
    if (leftUsers.size > 0) {
        try {
            for (const peerId of leftUsers.values()) {
                const sentStickerMessage = await vk.api.messages.send({
                    peer_ids: [peerId],
                    sticker_id: 83539, // покеда мышка сосиска
                    random_id: Math.floor(Math.random() * Number.MAX_SAFE_INTEGER),
                }) as unknown as { peer_id: number, conversation_message_id: number }[];
                console.log('sentStickerMessage left', sentStickerMessage);
                sentFarewells[peerId] ??= [];
                sentFarewells[peerId]!.push([sentStickerMessage[0]!.conversation_message_id]);
            }

            try {
                console.log("Deleting all sentGreetings messaqes except the last one. sentGreetings:", sentFarewells);
                for (const [peerId, messageIds] of Object.entries(sentFarewells)) {
                    for (const [messageId] of messageIds.slice(0, -1)) {
                        await vk.api.messages.delete({
                            peer_id: +peerId,
                            cmids: messageId,
                            delete_for_all: true
                        });
                    }
                }
            } finally {
                console.log("Removing all keys from sentFarewells except the last one");
                Object.keys(sentFarewells).forEach(key => {
                    sentFarewells[+key]!.reverse();
                    sentFarewells[+key]!.length = 1;
                });
            }
        } finally {
            leftUsers.clear();
        }
    }
}, 3000);

export const lastChatMessages: Record<number, number> = {};

vk.updates.on('message_new', async (ctx: BotMsgCtx) => {
    log(`Message ${ctx.conversationMessageId} from ${ctx.senderId} in ${ctx.peerId > 2e9 ? ('c' + (ctx.peerId - 2e9)) : ctx.peerId}: ${ctx.text ?? "<no text>"}`);

    lastChatMessages[ctx.peerId] = ctx.conversationMessageId ?? ctx.id;

    const reactsOnIndex = reactsOnList.findIndex(x => x.peerId === ctx.peerId && x.vkId === ctx.senderId);
    if (reactsOnIndex >= 0) {
        await vk.api.call("messages.sendReaction", {
            peer_id: ctx.peerId,
            cmid: ctx.conversationMessageId,
            reaction_id: reactsOnList[reactsOnIndex]!.reactNumber
        });
    }

    const localBotRunPrefix = process.env['IS_IN_PRODUCTION'] !== 'true' ? '[LOCAL] ' : '';

    const originalCtxSend = ctx.send;
    ctx.send = async (text: string | MessagesSendParams, params: IMessageContextSendOptions | undefined): Promise<BotMsgCtx> => {
        if (params !== undefined) {
            params.disable_mentions = true;
        }
        if (typeof text === 'string') {
            text = localBotRunPrefix + text;
            if (ctx.groupChatUser.nickname !== null) {
                text = localBotRunPrefix + await getNicknameOrFullName(ctx.groupChatUser, true) + ', ' + text;
            }
        } else {
            text.disable_mentions = true;
            text.message = localBotRunPrefix + text.message;
            if (ctx.groupChatUser.nickname !== null) {
                text.message = await getNicknameOrFullName(ctx.groupChatUser, true) + ', ' + text.message;
            }
        }
        await originalCtxSend.apply(ctx, [text, params]);
        return ctx;
    };

    let user = db.tryGetUserByVkId(ctx.senderId);
    if (user === undefined) {
        log('New user, registering...');
        user = new db.User();
        user.vkId = ctx.senderId;
        db.getDb().users.push(user);
        db.saveDb();
    } else {
        //user = { ...UserDefaults, ...user };
        setDefaults(UserDefaults, user);
    }

    let groupChat = db.tryGetGroupChat(ctx.peerId);
    if (groupChat === undefined) {
        log('New group chat, registering...');
        groupChat = new db.GroupChat();
        groupChat.vkPeerId = ctx.peerId;
        db.getDb().groupChats.push(groupChat);
        db.saveDb();
    } else {
        //groupChat = { ...GroupChatDefaults, ...groupChat, get vkChatId() { return 2e9 - this.vkPeerId; } };
        setDefaults(GroupChatDefaults, groupChat);
    }

    let groupChatUser = groupChat.users.find(u => u.vkId === user!.vkId);
    if (groupChatUser === undefined) {
        log('User not found in this group chat, registering...');
        groupChatUser = new db.GroupChatUser();
        groupChatUser.vkId = user.vkId;
        groupChatUser.groupChatId = groupChat.id;
        groupChat.users.push(groupChatUser);
        db.saveDb();
    } else {
        /*for (const key in GroupChatUserDefaults) {
            if (!GroupChatUserDefaults.hasOwnProperty(key)) continue;

            if (!(key in groupChatUser)) {
                // @ts-ignore
                groupChatUser[key] = GroupChatUserDefaults[key];
            }
        }*/
        setDefaults(GroupChatUserDefaults, groupChatUser);
    }

    configureCtx(ctx, groupChatUser, groupChat, user);

    if (typeof ctx.text !== 'string') return;

    let isBotBeingAddressed = false;

    const doesMessageStartWithSlash = ctx.text.startsWith('/');
    const doesMessageStartWithBotName = groupChat.botNames.some(botName => ctx.text?.toLowerCase().startsWith(botName + ' '));
    const botMentionRegex = /^\[club214756324\|.*?]/;
    const doesMessageStartWithBotMention = ctx.text.match(botMentionRegex) !== null;
    const usedBotName = groupChat.botNames.find(botName => ctx.text?.toLowerCase().startsWith(botName));

    let message = ctx.text;
    if (doesMessageStartWithSlash) {
        isBotBeingAddressed = true;
        message = message.replace(/^\//, '');
    }
    if (doesMessageStartWithBotName) {
        isBotBeingAddressed = true;
        message = message.replace(new RegExp(`^${usedBotName} `, 'i'), '');
    }
    if (doesMessageStartWithBotMention) {
        isBotBeingAddressed = true;
        message = message.replace(botMentionRegex, '');
    }
    message = message.trim();

    if (isBotBeingAddressed) {
        await executeCommand(message, ctx);
    } else {
        await countCapitalization(ctx);
    }
});

vk.updates.startPolling().then(() => {
    log('Started polling.');
});

function configureCtx(ctx: BotMsgCtx, gcu: GroupChatUser, gc: GroupChat, u: User) {
    ctx.groupChatUser = gcu;
    ctx.groupChat = gc;
    ctx.user = u;
    ctx.replyError = async m => { await ctx.reply(`⛔ ошибка: ${m}`); }
    ctx.db = db.getDb;
    ctx.saveDb = db.saveDb;
    ctx.getMaxUserLevel = (function() { // @ts-ignore
        return Math.max(this.user.level, this.groupChatUser.level) }).bind(ctx);
    ctx.vk = vk;
}

setTimeout(() => {
    if (fs.existsSync("remindAboutRestart.txt")) {
        try {
            const peerId = +fs.readFileSync("remindAboutRestart.txt").toString("utf-8");
            vk.api.messages.send({
                peer_id: peerId,
                message: "я перезапущен!",
                random_id: Math.floor(Math.random() * Number.MAX_SAFE_INTEGER),
            }).then();
        } finally {
            fs.rmSync("remindAboutRestart.txt", {force: true, maxRetries: 5});
        }
    }
}, 3000);