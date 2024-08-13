import {ICommand, getCommands, UserLevel} from "../ICommand";
import {BotMsgCtx} from "../util";


// noinspection JSUnusedGlobalSymbols
export default {
    trigger: /^(?:помощь|хелп|команды)/i,
    name: 'помощь/хелп/команды',
    description: 'выводит эту помощь',
    minAllowedLevel: UserLevel.user,
    shouldBotHaveAdmin: false,
    additionalHelpStrings: [],
    hideFromHelp: false,
    showInHelpAfter: null,
    async handler(trigger: string, args: string[], ctx: BotMsgCtx) {
        const commands = [...getCommands()];

        commands.sort((a, b) => {
            const cmp1 = a.minAllowedLevel - b.minAllowedLevel;
            if (cmp1 !== 0) return cmp1;

            // @ts-ignore
            const cmp2 = a.shouldBotHaveAdmin - b.shouldBotHaveAdmin;
            return cmp2;
        });

        const independentCommands = commands.filter(c => c.showInHelpAfter === null);
        let dependentCommands = commands.filter(c => c.showInHelpAfter !== null);

        const invalidDcs = dependentCommands.filter(dc =>
            !independentCommands.some(ic => dc.showInHelpAfter === ic.name)
            && !dependentCommands.some(ic => dc.showInHelpAfter === ic.name));
        if (invalidDcs.length > 0) {
            await ctx.replyError(`некоторые команды зависят от несуществующих команд!
${invalidDcs.map(x => `- "${x.name}" зависит от несуществующей "${x.showInHelpAfter}"`).join('\n')}`);
            return;
        }

        function addCommandRecursive(cmd: ICommand) {
            newCommands.push(cmd);

            const dependentCmd = [...dependentCommands, ...independentCommands].find(c => c.showInHelpAfter === cmd.name);
            if (dependentCmd !== undefined) {
                addCommandRecursive(dependentCmd);
                dependentCommands = dependentCommands.filter(x => x.name !== dependentCmd.name);
            }
        }

        const newCommands: ICommand[] = [];
        for (const cmd of independentCommands) {
            addCommandRecursive(cmd);
        }

        const helpMessage = `развлекательный-администый бот "матье балл":
чтобы обратиться к боту, можно использовать:
- сообщения, начинающиеся со слеша. пример: "/кто я"
- сообщения, начинающиеся с упоминания бота. пример: "@mathieu.ball кто я"
- сообщения, начинающиеся с имени бота. пример: "матье кто я". список имен в этом чате можно увидеть введя команду "имена"

легенда:
▪ -- такую команду могут исполнять все
🔑 -- такую команду бот может исполнить только если у него есть в беседе админка
👮 -- такую команду может исполнять только админ бота
👑🥇 -- такую команду может исполнять только админ беседы
👑🥈 -- такую команду может исполнять только ст.модератор беседы и выше
👑🥉 -- такую команду может исполнять только мл.модератор беседы и выше

существующие команды:
${
            newCommands
                .filter(x => x.minAllowedLevel <= ctx.getMaxUserLevel())
                .map(cmd => `${getLegend(cmd)} ${cmd.name}: ${cmd.description}`)
                .join('\n')
        }`;

        await ctx.reply(helpMessage);
    }
} as ICommand;

function getLegend(command: ICommand): string {
    const commandMinLevel = {
        [UserLevel.user]: '▪',
        [UserLevel.juniorModer]: '👑🥉',
        [UserLevel.seniorModer]: '👑🥈',
        [UserLevel.chatAdmin]: '👑🥇',
        [UserLevel.botAdmin]: '👮',
    }[command.minAllowedLevel];

    return commandMinLevel + (command.shouldBotHaveAdmin ? '🔑' : '');
}