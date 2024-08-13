import {BotMsgCtx, getNicknameOrFullName, log, verbInfinitiveToPastTense} from "./util";
import {vk} from "./index";

const commands: ICommand[] = [];

export function getCommandsCount() { return commands.length; }
export function getCommands(): readonly ICommand[] { return commands; }

export enum UserLevel {
    user,
    juniorModer,
    seniorModer,
    chatAdmin,
    botAdmin
}

export interface ICommand {
    trigger: RegExp
    name: string
    description: string
    minAllowedLevel: number
    shouldBotHaveAdmin: boolean
    additionalHelpStrings: string[]
    hideFromHelp: boolean
    showInHelpAfter: string | null
    handler(trigger: string, args: string[], ctx: BotMsgCtx): void
}

export function addCommand(command: ICommand) {
    commands.push(command);
}

export async function executeCommand(message: string, ctx: BotMsgCtx) {
    const acceptableCommands = commands.filter(c => message.match(c.trigger));

    if (ctx.db().devMode && !acceptableCommands.find(c => c.name.includes('devmode'))) {
        return;
    }

    if (acceptableCommands.length === 0) {
        await handleRolePlayVerb(message.split(' '), ctx);
        return;
    }
    if (acceptableCommands.length > 1) {
        await ctx.reply(`неоднозначное сообщение: найдено ${acceptableCommands.length} команд, ` +
            `которые можно вызвать этим сообщением: ${acceptableCommands.map(x => x.name).join(', ')}\nсвяжитесь с разработчиком.`);
        return;
    }
    const cmd = acceptableCommands[0]!;
    const trigger = message.match(cmd.trigger)?.[0]!;
    const restOfMessage = message.substring(trigger.length ?? 0);
    const args = restOfMessage.trim().split(' ').filter(x => x.length > 0);

    if (cmd.minAllowedLevel > ctx.user.level) {
        await ctx.reply('недостаточно прав для этой команды!');
        return;
    }

    log(`Executing command '${cmd.name}' with arguments ${JSON.stringify(args)}`);

    try {
        await cmd.handler(trigger.toLowerCase(), args, ctx);
    } catch (e) {
        if (typeof e === 'object') {
            await ctx.replyError(e?.toString() ?? 'ошибка');
        } else {
            await ctx.replyError(String(e));
        }
    }
}

async function handleRolePlayVerb(args: string[], ctx: BotMsgCtx): Promise<boolean> {
    if (ctx.groupChat.rolePlayVerbs.length === 0) return false;
    if (args.length === 0) return false;

    const verb = ctx.groupChat.rolePlayVerbs.find(v => v.toLowerCase() === args[0]);
    if (verb !== undefined) {
        args.shift();
        const rest = args.join(' ');
        if (rest.length === 0) {
            await ctx.replyError(`а кого/что ${verb}-то?`);
            return true;
        }

        const isFemale = (await vk.api.users.get({ user_ids: [ctx.groupChatUser.vkId], fields: ['sex'] }))[0].sex == 1;

        await ctx.reply(`${await getNicknameOrFullName(ctx.groupChatUser)} ${verbInfinitiveToPastTense(verb, isFemale)} ${rest}`)
        return true;
    }

    return false;
}
