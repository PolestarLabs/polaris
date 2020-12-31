import { AxiosResponse } from "axios";
import { EventEmitter } from "events";
import { Textable, TextableChannel, Message, BaseData } from "eris";

interface EA_awaitMessagesOptions {
  maxMatches: number;
  time?: number;
}

declare class MessageCollector<T extends Textable = TextableChannel> extends EventEmitter {
  filter: (m: Message<T>) => any;
  channel: T;
  options: EA_awaitMessagesOptions;
  ended: boolean;
  collected: Message<T>[];
  constructor(channel: T, filter: (m: Message<T>) => any, options?: EA_awaitMessagesOptions);
  verify(message: Message<T>): boolean;
  stop(reason: string): void;
  on(event: "message", cb: (message: Message<T>) => any): this;
  on(event: "end", cb: (collected: Message<T>[], reason: string) => any): this;
}

declare class Microserver {
  microtasks: {
    updateServerCache(body: BaseData | "all", url: string, res: any): Promise<any>;
    reloadServerCache(): Promise<void>;
    updateChannels(body: BaseData | "all", url: string, res: any): Promise<any>;
  } | null;
  constructor(crossAuth: string);
}

declare module "eris" {
  interface Textable {
    awaitMessages(filter: (m: Message) => any, options: EA_awaitMessagesOptions): Promise<Message[]>;
    createCode(code: string, language: string): Promise<Message>;
    sendCode(code: string, language: string): Promise<Message>;
    createEmbed(embed: EmbedOptions): Promise<Message>;
    sendEmbed(embed: EmbedOptions): Promise<Message>;
    send(content: MessageContent, file?: MessageFile | MessageFile[]): Promise<Message>;
  }
  interface GuildTextable {
    awaitMessages(filter: (m: Message<GuildTextableChannel>) => any, options: EA_awaitMessagesOptions): Promise<Message<GuildTextableChannel>[]>;
    createCode(code: string, language: string): Promise<Message<GuildTextableChannel>>;
    sendCode(code: string, language: string): Promise<Message<GuildTextableChannel>>;
    createEmbed(embed: EmbedOptions): Promise<Message<GuildTextableChannel>>;
    sendEmbed(embed: EmbedOptions): Promise<Message<GuildTextableChannel>>;
    send(content: MessageContent, file?: MessageFile | MessageFile[]): Promise<Message<GuildTextableChannel>>;
  }
  interface PrivateChannel {
    awaitMessages(filter: (m: Message<PrivateChannel>) => any, options: EA_awaitMessagesOptions): Promise<Message<PrivateChannel>[]>;
    createCode(code: string, language: string): Promise<Message<PrivateChannel>>;
    sendCode(code: string, language: string): Promise<Message<PrivateChannel>>;
    createEmbed(embed: EmbedOptions): Promise<Message<PrivateChannel>>;
    sendEmbed(embed: EmbedOptions): Promise<Message<PrivateChannel>>;
    send(content: MessageContent, file?: MessageFile | MessageFile[]): Promise<Message<PrivateChannel>>;
  }
  interface TextChannel {
    awaitMessages(filter: (m: Message<TextChannel>) => any, options: EA_awaitMessagesOptions): Promise<Message<TextChannel>[]>;
    createCode(code: string, language: string): Promise<Message<TextChannel>>;
    sendCode(code: string, language: string): Promise<Message<TextChannel>>;
    createEmbed(embed: EmbedOptions): Promise<Message<TextChannel>>;
    sendEmbed(embed: EmbedOptions): Promise<Message<TextChannel>>;
    send(content: MessageContent, file?: MessageFile | MessageFile[]): Promise<Message<TextChannel>>;
  }
  interface NewsChannel {
    awaitMessages(filter: (m: Message<NewsChannel>) => any, options: EA_awaitMessagesOptions): Promise<Message<NewsChannel>[]>;
    createCode(code: string, language: string): Promise<Message<NewsChannel>>;
    sendCode(code: string, language: string): Promise<Message<NewsChannel>>;
    createEmbed(embed: EmbedOptions): Promise<Message<NewsChannel>>;
    sendEmbed(embed: EmbedOptions): Promise<Message<NewsChannel>>;
    send(content: MessageContent, file?: MessageFile | MessageFile[]): Promise<Message<NewsChannel>>;
  }

  interface Client {
    createCode(channelID: string, code: string, language: string): Promise<Message>;
    createEmbed(channelID: string, embed: EmbedOptions): Promise<Message>;
  }

  class CodeBlock {
    content?: string; lang?: string;
    constructor(content?: string, lang?: string);
    content(content: string): this;
    language(lang: string): this;
    toString(): string;
  }

  class Embed implements EmbedOptions {
    fields: EmbedField[]; file?: unknown; // Eris file?
    constructor(data?: EmbedOptions);
    author(name: string, icon?: string, url?: string): this;
    color(color: number): this;
    description(desc: string): this;
    field(name: string, value: string, inline?: boolean): this;
    file(file: unknown): this;
    footer(text: string, icon?: string): this;
    image(url: string): this;
    setColor(color: string): this;
    timestamp(time?: Date): this;
    title(title: string): this;
    thumbnail(url: string): this;
    url(url: string): this;
  }

  interface GuildChannel {
    memberHasPermission(memberID: string, permission: string): boolean;
  }

  interface Member {
    bannable: boolean;
    createMessage(content: MessageContent, file?: MessageFile | MessageFile[]): Promise<Message<PrivateChannel>>;
    effectiveName: string;
    hasPermission(permission: string): boolean;
    hasRole(roleID: Role | string): boolean;
    highestRole: Role;
    color: number;
    kickable: boolean;
    punishable(member2: Member): boolean;
    roleObjects: Role[];
    sendMessage(content: MessageContent, file?: MessageFile | MessageFile[]): Promise<Message<PrivateChannel>>;
  }

  interface Message<T extends Textable = TextChannel> {
    args: string[];
    guild: T extends GuildTextableChannel ? Guild : never;
    lang: string[];
  }

  interface Role {
    addable: boolean;
    higherThan(role2: Role): boolean
  }

  interface User {
    createMessage(content: MessageContent, file?: MessageFile | MessageFile[]): Promise<Message<PrivateChannel>>;
    displayAvatarURL: string;
    dailing: boolean;
    tag: string;
    looting?: boolean;
  }

  interface Guild {
    findMembers(query: string): Member[];
    me: Member;
    member(user: User | Member | BaseData | string): Member;
  }

  interface CommandClient {
    resolveUser(user: User | Member | BaseData | string, options?: { enforceDB?: boolean }): Promise<User>;
    resolveMember(guild: Guild | BaseData | string, user: User | Member | BaseData | string, options?: { enforceDB?: boolean; softMatch?: boolean; }): Promise<Member>;
    getTarget(query: string, guild?: Guild | BaseData | string | null, strict?: boolean, member?: boolean): Promise<User>;
    getTargetLegacy(query: string | User | Member | BaseData, guild?: Guild | null, strict?: boolean, member?: boolean): Promise<User | null>;
    getChannelImg(message: Message, nopool?: boolean): Promise<string | boolean>;
    modPass(member: Member, extra?: string, sData?: boolean | object, channel?: Channel | null): boolean;
    gamechange(gamein?: [string, number] | false, status?: Status): void;
    getPreviousMessage(msg: Message, ID?: string): Promise<Message>;
    autoHelper(trigger: string, options?: { message?: Message; msg?: Message; cmd: string; opt?: string; [s: string]: any }): boolean;
    usage(cmd: string, m: Message, third?: string, sco?: { [s: string]: any }): void;
    engine: typeof import("eris");
    beta: boolean;
    maintenance: boolean;
    cluster: { id: number; name: string };
    execQueue: any[]; // what's this
    commandPool: {};
    registerCommands(rel?: boolean): void;
    registerOne(folder: string, _cmd: string): null;
    blacklistedUsers: string[];
    blacklistedServers: string[];
    microserver: Microserver;
    softKill(): void;
    restarting: boolean;
    hardKill(): void;
    setAvatar(url: string): void;
    bean(guild: string, user: string, delete_message_days?: number, reason?: string): Promise<AxiosResponse>;
    unbean(guild: string, user: string, delete_message_days?: number, reason?: string): Promise<AxiosResponse>;
    reply(msg: Message, content: MessageContent): Promise<AxiosResponse>;
    tempRoleTimers: Map<string, NodeJS.Timeout>;
    muteTimers: Map<string, NodeJS.Timeout>;
    reminderTimers: Map<string, NodeJS.Timeout>;
    timerBypass?: string[];
  }
}