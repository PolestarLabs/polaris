import { CommandClient, Embed } from "eris";
import { miliarize, randomize, reload, wait, weightedRand, shuffle, capitalize, objCount, resolveFile, file } from "./core/utilities/Gearbox/global";
declare global {
    const DB: any; // wtf is this

    // pollux.js
    const appRoot: string;
    const PLX: CommandClient;
    const paths: run;

    // gearbox start
    const nope: string;
    const invisibar: string;
    const Embed: Embed;
    const RichEmbed: Embed;

    reload;
    weightedRand;
    randomize;
    wait;
    miliarize;
    shuffle;
    capitalize;
    objCount;
    resolveFile;
    file;
    // gearbox end
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