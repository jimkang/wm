const http = require('follow-redirects').http;
const https = require('follow-redirects').https;
const concat = require('concat-stream');
const debug = require('debug')('wm:request');

function main(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('http:') ? http : https;

    debug('getting %s', url);
    client.get(url, res => {
      if (res.statusCode < 200 || res.statusCode >= 300) {
        reject(new Error(`Bad response ${res.statusCode}`));
        return;
      }

      res.pipe(
        concat(buf => {
          debug('resolved');
          resolve(buf.toString());
        })
      );
    });
  });
}

module.exports = main;