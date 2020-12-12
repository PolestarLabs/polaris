import { CommandClient, Embed } from "eris";

declare global {
    export const DB: any; // wtf is this

    // pollux.js
    export const appRoot: string;
    export const PLX: CommandClient;
    export const paths: run;

    // gearbox
    export const nope: string;
    export const invisibar: string;
    export const Embed: Embed;
    export const RichEmbed: Embed;

    export {
      reload, weightedRand, randomize, wait, miliarize, shuffle, capitalize, objCount, resolveFile, file,
    } from "../core/utilities/Gearbox/global";
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
