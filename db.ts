import * as fs from 'fs';
import {log} from "./util";
import {ICommand, UserLevel} from "./ICommand";
import {createWriteStream} from "node:fs";


const DATABASE_PATH = 'db.json';

let isLoaded = false;
let db: IDb = {
    // @ts-ignore
    users: [],
    // @ts-ignore
    groupChats: [],
    devMode: false,
    migrations: [],
};

//region Data interfaces
export interface IDb {
    users: User[] & { getByVkId(vkId: number): User }
    groupChats: GroupChat[] & { getByPeerId(vkPeerId: number): GroupChat }
    devMode: boolean
    migrations: string[]
}

export interface IUser {
    id: number
    vkId: number
    level: UserLevel
    firstName: string
    lastName: string
    capitalizations: { lowerCase: number, properCase: number, mixedCase: number }
}
export const UserDefaults: IUser = {
    id: 0,
    vkId: 0,
    level: UserLevel.user,
    firstName: "",
    lastName: "",
    capitalizations: { lowerCase: 0, properCase: 0, mixedCase: 0 },
};
export class User implements IUser {
    id: number
    vkId!: number
    level: UserLevel
    firstName: string = UserDefaults.firstName
    lastName: string = UserDefaults.lastName
    capitalizations = UserDefaults.capitalizations

    constructor() {
        this.id = db.users.length;
        this.level = UserLevel.user;
    }
}

export interface IGroupChat {
    id: number;
    vkPeerId: number
    botNames: string[];
    users: GroupChatUser[];
    ofTheDay: { created: number, wordToVkUserId: Record<string, number> } | undefined;
    rolePlayVerbs: string[];
    phraseCounters: { phrase: string, timeOfDayToPost: [hour: number, minute: number], count: number, lastSentDate: number }[];
    marriages: IMarriage[];
    roles: IRole[];
    greeting?: string;
    greetingAttachment?: string;
}
export const GroupChatDefaults: IGroupChat = {
    id: 0,
    vkPeerId: 0,
    botNames: ['матье', 'vfnmt'],
    users: [],
    ofTheDay: undefined,
    rolePlayVerbs: ['укусить'],
    phraseCounters: [],
    marriages: [],
    roles: [
        {
            name: 'администратор',
            symbol: '👮‍',
            allowedCommands: ['ban', 'addnickname_to_other', 'removenickname_to_other'],
            forbiddenCommands: [],
            canBeKickedBy: [],
            inheritsFrom: 'модератор',
        },
        {
            name: 'модератор',
            symbol: '💂‍',
            allowedCommands: ['kick'],
            forbiddenCommands: [],
            canBeKickedBy: ['администратор'],
            inheritsFrom: 'участник',
        },
        {
            name: 'участник',
            symbol: undefined,
            allowedCommands: [
                'addbotname',
                'addnickname',
                'addphrasecounter',
                'addroleplayverb',
                'help',
                'keyboard',
                'listbotnames',
                'listnicknames',
                'listphrasecounters',
                'listroleplayverbs',
                'marriages',
                'marriages_mine',
                'marry',
                'marry_breakup',
                'profile',
                'removebotname',
                'removenickname',
                'removeroleplayverb',
                'roleplayverbstats',
                'text_babyTalk',
                'text_babyTalkAndFenceCase',
                'text_fenceCase',
                'version',
                'when',
                'who'
            ],
            forbiddenCommands: [],
            canBeKickedBy: ['администратор', 'модератор'],
            inheritsFrom: undefined,
        }
    ]
}
export class GroupChat implements IGroupChat {
    id: number
    vkPeerId!: number
    botNames: string[] = GroupChatDefaults.botNames;
    users: GroupChatUser[] = GroupChatDefaults.users;
    ofTheDay: { created: number, wordToVkUserId: Record<string, number> } | undefined = undefined
    rolePlayVerbs: string[] = GroupChatDefaults.rolePlayVerbs
    phraseCounters = GroupChatDefaults.phraseCounters
    marriages = GroupChatDefaults.marriages
    roles = GroupChatDefaults.roles
    greeting?: string = undefined
    greetingAttachment?: string = undefined

    constructor() {
        this.id = db.groupChats.length;
    }

    get vkChatId() { return 2e9 - this.vkPeerId; }
}

export interface IGroupChatUser {
    vkId: number
    groupChatId: number
    nickname: string | null;
    whoami: string | null;
    whoamiChanged: number | null;
    level: UserLevel;
    roles: RoleName[];
}
export const GroupChatUserDefaults: IGroupChatUser = {
    vkId: 0,
    groupChatId: 0,
    nickname: null,
    whoami: null,
    whoamiChanged: null,
    level: UserLevel.user,
    roles: ['участник'],
}
export class GroupChatUser implements IGroupChatUser {
    vkId!: number
    groupChatId!: number
    nickname: string | null = null;
    whoami: string | null = null;
    whoamiChanged: number | null = null;
    level: UserLevel = UserLevel.user;
    roles: RoleName[] = GroupChatUserDefaults.roles;
}

export interface IMarriage {
    id: number
    groupChatId: number
    member1VkId: number
    member2VkId: number
    startDate: number
}
export const MarriageDefaults: IMarriage = {
    id: 0,
    groupChatId: 0,
    member1VkId: 0,
    member2VkId: 0,
    startDate: 0,
}
export class Marriage implements IMarriage {
    id: number;
    groupChatId: number;
    member1VkId: number
    member2VkId: number
    startDate: number

    constructor(groupChat: IGroupChat, member1VkId: number, member2VkId: number, startDate?: number) {
        this.id = groupChat.marriages.length;
        this.groupChatId = groupChat.id;
        this.member1VkId = member1VkId;
        this.member2VkId = member2VkId;
        this.startDate = startDate ?? Date.now();
    }
}

export type CommandId = string;
export type RoleName = string;

export interface IRole {
    name: RoleName;
    symbol: string | undefined;
    allowedCommands: CommandId[];
    forbiddenCommands: CommandId[];
    canBeKickedBy: RoleName[];
    inheritsFrom: RoleName | undefined;
}
export const RoleDefaults: IRole = {
    name: "Роль",
    symbol: undefined,
    allowedCommands: [],
    forbiddenCommands: [],
    canBeKickedBy: [],
    inheritsFrom: undefined,
}
export class Role implements IRole {
    name: string = RoleDefaults.name;
    symbol: string | undefined = RoleDefaults.symbol;
    allowedCommands: CommandId[] = RoleDefaults.allowedCommands;
    forbiddenCommands: CommandId[] = RoleDefaults.forbiddenCommands;
    canBeKickedBy: RoleName[] = RoleDefaults.canBeKickedBy;
    inheritsFrom: RoleName | undefined = RoleDefaults.inheritsFrom;

    constructor(name: string) {
        this.name = name;
    }
}
//endregion

//region Access functions
export function load() {
    log('Loading database...');
    if (!fs.existsSync(DATABASE_PATH)) {
        log('Database didn\'t exist, creating default db...');
        fs.writeFileSync(DATABASE_PATH, JSON.stringify(db));
    }
    db = JSON.parse(fs.readFileSync(DATABASE_PATH).toString());
    log(`Database loaded: ${db.users.length} users, ${db.groupChats.length} group chats`);

    db.groupChats.getByPeerId = vkPeerId => getGroupChat(vkPeerId);
    db.users.getByVkId = vkId => getUserByVkId(vkId);

    migrate();

    isLoaded = true;
}

async function migrate() {
    log('Loading list of migrations...');
    const migrations = fs.readdirSync('./migrations');
    for (const migrationFilename of migrations) {
        if (!migrationFilename.endsWith('.js')) continue;

        const isMigrated = db.migrations?.includes(migrationFilename);

        log(`${migrationFilename}${isMigrated ? ' - migrated' : ' - not migrated'}`);

        const migrationModule: { runAlways: () => boolean, migrate: (db: IDb) => void } = await import('./migrations/' + migrationFilename);

        if (!isMigrated || migrationModule.runAlways()) {
            migrationModule.migrate(db);
            log(`  Ran migration ${migrationFilename}`);
        }
    }

    saveDb();
}

export function saveDb() {
    if (!isLoaded) {
        throw new Error("Database is not loaded yet!");
    }
    fs.writeFileSync(DATABASE_PATH, JSON.stringify(db));
}

export function getDb() {
    if (!isLoaded) {
        throw new Error("Database is not loaded yet!");
    }
    return db;
}

export function getUserById(id: number) {
    const maybeUser = tryGetUserById(id);
    if (maybeUser === undefined) {
        throw new Error(`User with id = ${id} is not found`);
    }
    return maybeUser;
}

export function tryGetUserById(id: number) {
    return db.users.find(u => u.id === id);
}

export function getUserByVkId(vkId: number) {
    const maybeUser = tryGetUserByVkId(vkId);
    if (maybeUser === undefined) {
        throw new Error(`User with VK id = ${vkId} is not found`);
    }
    return maybeUser;
}

export function tryGetUserByVkId(vkId: number) {
    return db.users.find(u => u.vkId === vkId);
}

export function getGroupChat(vkPeerId: number) {
    const maybeGroupChat = tryGetGroupChat(vkPeerId);
    if (maybeGroupChat === undefined) {
        throw new Error(`Group chat with VK Peer id = ${vkPeerId} is not found`);
    }
    return maybeGroupChat;
}

export function tryGetGroupChat(vkPeerId: number) {
    return db.groupChats.find(u => u.vkPeerId === vkPeerId);
}
//endregion