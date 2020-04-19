"use strict";

const axios = require('axios');
const parseString = require('xml2js').parseString;

exports.get = function (limit, pid, tags) {
    return new Promise((resolve, reject) => {
        var url = `https://safebooru.org/index.php?page=dapi&s=post&q=index&limit=${limit}&pid=${pid}&tags=${tags}`;
        axios.post(url).then(res => resolve(res), err => reject(err));
    });
};

exports.getLewd = function (limit, pid, tags) {
    return new Promise((resolve, reject) => {
        var url = `http://gelbooru.com/index.php?page=dapi&s=post&q=index&limit=${limit}&pid=${pid}&tags=${tags}`;
        axios.post(url).then(res => resolve(res), err => reject(err));
    }); 
};

exports.getRandom = function (tags) {
    return new Promise((resolve, reject) => {
        exports.get(1, 0, tags).then(function ({data}) {
            let cleanedString = data.replace("\ufeff", "");
            parseString(cleanedString, function (err, result) {
                if (err) return reject(err);
                let randomPid = Math.floor(Math.random() * result.posts.$.count);
                exports.get(1, randomPid, tags).then(function ({data}) {
                    let cleanedString = data.replace("\ufeff", "");
                    parseString(cleanedString, function (err, result) {
                        if (err) return reject(err);
                        try {
                            var output = result.posts.post[0].$;
                            resolve(output)
                        } catch (err) {
                            reject(err)
                        }
                    });
                });
            });
        })
    })
};

exports.getRandomLewd = function (tags) {
    return new Promise((resolve, reject) => {
        exports.getLewd(1, 0, tags).then(function ({data}) {
            let cleanedString = data.replace("\ufeff", "");
            parseString(cleanedString, function (err, result) {                
                if (err) return reject(err);
                let randomPid = Math.floor(Math.random() * result.posts.$.count / (result.posts.$.count>20001?20000:1));
                exports.getLewd(1, randomPid, tags).then(function ({data}) {
                    let cleanedString = data.replace("\ufeff", "");
                    parseString(cleanedString, function (err, result) {
                        if (err) return reject(err);
                        try {
                            var output = result.posts.post[0].$;
                            resolve(output);
                        } catch (err) {
                            reject(err);
                        }
                    });
                });
            });
        })
    })
};