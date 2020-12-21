import { Bucket, Client, CommandClient, Embed, EmbedOptions } from "eris";
import { i18n, TranslationFunction } from "i18next";
import Bluebird from "bluebird";

declare class PolluxEmoji extends String {
  constructor(identifier: string, fallback?: PolluxEmoji);
  reaction: string;
  no_space: string;
  name: string;
  id: string;
}

enum bgPrices {
  UR = 32520, SR = 15250, R = 8200, U = 3100, C = 1850,
}
enum medalPrices {
  UR = 2850, SR = 1875, R = 1223, U = 830, C = 500,
}
enum rarity {
  C = 1000, U = 400, R = 250, SR = 150, UR = 70, XR = 0,
}
enum gems {
  C = 50, U = 100, R = 160, SR = 240, UR = 320, XR = 500,
}
enum itemType {
  JDE = 400, RBN = 250, BPK = 225, MDL = 200, BKG = 180, ITM = 120, SPH = 5,
}
interface LootRates {
  rarity: rarity; gems: gems; itemType: itemType;
}

interface GlobalNumbers {
  DROPMAX: 1000;
  sapphireModifier: 0.000794912559618442;
  jadeModifier: 2250;
  tokenModifier: 0.5;
  bgPrices: bgPrices;
  medalPrices: medalPrices;
  LootRates: LootRates;
}

interface WHDOptions {
  pings?: boolean | string;
  once?: boolean;
  hook?: { id: string; webhook: string; };
  noRepeat?: boolean;
  id?: string;
}

class WebhookDigester {
  client: Client;
  executed: string[];
  constructor(client: Client);
  execute(embed: EmbedOptions, options?: WHDOptions): void;
  info(message: string, options: WHDOptions): void;
  warn(message: string, options: WHDOptions): void;
  error(message: string, options: WHDOptions): void;
  ok(message: string, options: WHDOptions): void;
}

class AchievementsManager extends EventEmitter {
  get(ach: string): Promise<object>;
  give(user: any, ach: string): Promise<object>;
  has(ach: string, user: any): Promise<boolean>;
  progress(ach: string, user: any): Promise<{ current: any; goal: any; percent: number; }>;
  check(userData: any, beau?: boolean, awardRightAway?: boolean): Promise<any>; // cba figuring this one out
  on(event: "award", cb: (achievID: string, userID: string) => any): this;
}

// TODO[epic=bsian] string colours

declare global {

    // pollux.js
    export interface Promise<T> extends Bluebird<T> {}
    export const clusterNames: string[];
    export const GNums: GlobalNumbers;
    export const appRoot: string;
    export const PLX: CommandClient;
    export const MARKET_TOKEN: string;
    export const hook: WebhookDigester;
    export function _emoji(E: string, F?: PolluxEmoji): PolluxEmoji;
    export const DB: any; // @polestar/database_schema
    export function translateEngineStart(): void;
    export const i18n: i18n;
    export const $t: TranslationFunction;
    export function rand$t(string: string, params?: {[s: string]: any}): string;

    // gearbox
    export const nope: string;
    export function reload(): void;
    export const invisibar: string;
    export const Embed: Embed;
    export const RichEmbed: Embed;
    export function weightedRand(wArr: number[]): number;
    export function randomize(min: number, max: number, seed?: number): number;
    export function wait(time: number): Promise<true>;
    export function miliarize(numstring: number | string, strict?: boolean | "soft", char?: string): string;
    export function shuffle<T>(array: T[]): T[];
    export function capitalize(string: string): string;
    export function objCount<T>(array: T[], what: T): number;
    export function resolveFile(resource: Buffer | string | ReadableStream): Buffer;
    export function file(file: string | number | Buffer | URL, name?: string): { finalFile: Buffer, name: string; };

    // archetypes
    export const Achievements: AchievementsManager;
    export const userLimits: Map<string, Bucket>;
    export const fakeFeed: null | { link: string; title: string; };

    // utils
    export const paths: run;

}

interface run {
    CDN: string
    GENERATORS: string
    API: string
    DASH: string
    WIKI: string
    ASSETS: string
    MISC: string
    REACTIONS: string
    CARDS:string
    MEDALS: string
    LISTS: string
    Build: string
    BUILD: string
    LEWD: string
    EVENT: string
    PROFILE: string
    SKINS: string
    FONTS: string
    AVIS: string
    LOCALE: string
    UTILS: string
}
