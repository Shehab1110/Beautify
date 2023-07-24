const { default: chalk } = require('chalk');
const mongoose = require('mongoose');

const { exec } = mongoose.Query.prototype;

const redis = require('redis');

const redisURL = 'redis://127.0.0.1:6379';

const client = redis.createClient();

client.connect(redisURL);

mongoose.Query.prototype.cache = function (opts = {}) {
  this.shouldCached = true;
  this.primaryKey = opts?.key ?? '';
  this.expiryTime = opts?.expiryTime ?? 30;
  return this;
};

mongoose.Query.prototype.exec = async function () {
  // Check if the query result should be cached
  if (this.shouldCached) {
    // If yes, check if the result is already cached
    const { primaryKey } = this;
    const key = JSON.stringify({
      ...this.getQuery(),
      collection: this.mongooseCollection.name,
    });
    const { expiryTime } = this;
    const result = await client
      .hGet(primaryKey, key)
      .catch((err) =>
        console.log(chalk.red(`Redis cache retrieval error: ${err}`))
      );
    // If not cached, execute the query and cache the result
    if (!result) {
      const doc = await exec.apply(this, arguments);
      await client
        .hSet(primaryKey, key, JSON.stringify(doc), 'EX', expiryTime)
        .catch((err) =>
          console.log(chalk.red(`Redis cache caching error: ${err}`))
        );
      return doc;
    }
    console.log('Serving from cache!');
    return Array.isArray(JSON.parse(result))
      ? JSON.parse(result).map((obj) => new this.model(obj))
      : new this.model(JSON.parse(result));
  }
  // If no, exexute the query normally
  return await exec.apply(this, arguments);
};

module.exports = {
  clearCache(primaryKey) {
    client.del(JSON.stringify(primaryKey));
  },
};
