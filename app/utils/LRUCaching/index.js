const LRU = require('lru-cache');

const options = {
    max: 50000000, // max length of a key
    length(n, key) { return n * 2 + key.length; },
    maxAge: 1000 * 60 * 60,
};

const cache = LRU(options);
const otherCache = LRU(50);

// TODO: Add additonal method for cache management

module.exports = cache;
