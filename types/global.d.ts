import { Bucket, Client, CommandClient, Embed, EmbedOptions, User } from "eris";
import { i18n, TranslationFunction } from "i18next";
import Bluebird from "bluebird";
import { ExecOptions } from "child_process";
import { EventEmitter } from "events";
import { NextFunction, Request, Response } from "express";

declare class PolluxEmoji extends String {
  constructor(identifier: string, fallback?: PolluxEmoji);
  reaction: string;
  no_space: string;
  name: string;
  id: string;
}

declare enum bgPrices {
  UR = 32520, SR = 15250, R = 8200, U = 3100, C = 1850,
}
declare enum medalPrices {
  UR = 2850, SR = 1875, R = 1223, U = 830, C = 500,
}
declare enum rarity {
  C = 1000, U = 400, R = 250, SR = 150, UR = 70, XR = 0,
}
declare enum gems {
  C = 50, U = 100, R = 160, SR = 240, UR = 320, XR = 500,
}
declare enum itemType {
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

declare class WebhookDigester {
  client: Client;
  executed: string[];
  constructor(client: Client);
  execute(embed: EmbedOptions, options?: WHDOptions): void;
  info(message: string, options: WHDOptions): void;
  warn(message: string, options: WHDOptions): void;
  error(message: string, options: WHDOptions): void;
  ok(message: string, options: WHDOptions): void;
}

declare class AchievementsManager extends EventEmitter {
  get(ach: string): Promise<object>;
  give(user: any, ach: string): Promise<object>;
  has(ach: string, user: any): Promise<boolean>;
  progress(ach: string, user: any): Promise<{ current: any; goal: any; percent: number; }>;
  check(userData: any, beau?: boolean, awardRightAway?: boolean): Promise<any>; // cba figuring this one out
  on(event: "award", cb: (achievID: string, userID: string) => any): this;
}

// TODO[epic=bsian] string colours

declare global {

  // In both
  export const HOST: string;
  export const appRoot: string;
  export interface Promise<T> extends Bluebird<T> {};
  export const MARKET_TOKEN: string;
  export const PLX: CommandClient;
  export const DB: any; // @polestar/database_schema
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
  export function exec(command: string, options: ExecOptions): Promise<string>;
  export const i18n: i18n;
  export const $t: TranslationFunction;
  export const paths: run;
  
  // In bot only
  export const clusterNames: string[];
  export const GNums: GlobalNumbers;
  export const hook: WebhookDigester;
  export const _emoji: ((E: string, F?: PolluxEmoji) => PolluxEmoji);
  export const translateEngineStart: (() => void);
  export const errorsHook: { id: string; token: string };
  export const Achievements: AchievementsManager;
  export const userLimits: Map<string, Bucket>;
  export const rand$t: ((string: string, params?: {[s: string]: any}) => string);
  export const fakeFeed: null | { link: string; title: string; };
  export const piggyback: any; // TODO what is this?
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
