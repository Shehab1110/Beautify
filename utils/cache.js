const mongoose = require('mongoose');

const { exec } = mongoose.Query.prototype;

const redis = require('redis');

const redisURL = 'redis://127.0.0.1:6379';

const client = redis.createClient(redisURL);

mongoose.Query.prototype.cache = function () {
  this.shouldCached = true;
  return this;
};

mongoose.Query.prototype.exec = async function () {
  // Check if the query result should be cached
  if (this.shouldCached) {
    // If yes, check if the result is already cached
    const key = JSON.stringify({
      ...this.getQuery(),
      collection: this.mongooseCollection.name,
    });
    const result = await client.get(key);
    // If not cached, execute the query and cache the result
    if (!result) {
      const doc = await exec.apply(this, arguments);
      await client.set(key, JSON.stringify(doc));
      return doc;
    }
    console.log('Serving from cache!');
    return Array.isArray(result)
      ? result.map((obj) => this.model(JSON.parse(obj)))
      : this.model(result);
  }
  // If no, exexute the query normally
  return exec.apply(this, arguments);
};
