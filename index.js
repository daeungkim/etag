/*!
 * etag
 * Copyright(c) 2014-2015 Douglas Christopher Wilson
 * MIT Licensed
 */

'use strict'

/**
 * Module exports.
 */

module.exports = etag

/**
 * Module dependencies.
 */

var crc = require('crc').crc32
var crypto = require('crypto')
var Stats = require('fs').Stats

/**
 * Module variables.
 * @private
 */

var base64PadCharRegExp = /=+$/
var crc32threshold = 1000 // 1KB
var toString = Object.prototype.toString

/**
 * Create a simple ETag.
 *
 * @param {string|Buffer|Stats} entity
 * @param {object} [options]
 * @param {boolean} [options.weak]
 * @return {String}
 * @api public
 */

function etag(entity, options) {
  if (entity == null) {
    throw new TypeError('argument entity is required')
  }

  var isStats = isstats(entity)
  var weak = options && typeof options.weak === 'boolean'
    ? options.weak
    : isStats

  // support fs.Stats object
  if (isStats) {
    return stattag(entity, weak)
  }

  if (typeof entity !== 'string' && !Buffer.isBuffer(entity)) {
    throw new TypeError('argument entity must be string, Buffer, or fs.Stats')
  }

  var hash = weak
    ? weakhash(entity)
    : stronghash(entity)

  return weak
    ? 'W/"' + hash + '"'
    : '"' + hash + '"'
}

/**
 * Determine if object is a Stats object.
 *
 * @param {object} obj
 * @return {boolean}
 * @api private
 */

function isstats(obj) {
  // genuine fs.Stats
  if (typeof Stats === 'function' && obj instanceof Stats) {
    return true
  }

  // quack quack
  return obj && typeof obj === 'object'
    && 'ctime' in obj && toString.call(obj.ctime) === '[object Date]'
    && 'mtime' in obj && toString.call(obj.mtime) === '[object Date]'
    && 'ino' in obj && typeof obj.ino === 'number'
    && 'size' in obj && typeof obj.size === 'number'
}

/**
 * Generate a tag for a stat.
 *
 * @param {object} stat
 * @param {boolean} weak
 * @return {string}
 * @private
 */

function stattag(stat, weak) {
  var mtime = stat.mtime.getTime().toString(16)
  var size = stat.size.toString(16)
  var tag = '"' + size + '-' + mtime + '"'

  return weak
    ? 'W/' + tag
    : tag
}

/**
 * Generate a strong hash.
 *
 * @param {Buffer} entity
 * @return {String}
 * @api private
 */

function stronghash(entity) {
  if (entity.length === 0) {
    // fast-path empty
    return '1B2M2Y8AsgTpgAmY7PhCfg'
  }

  return crypto
    .createHash('md5')
    .update(entity, 'utf8')
    .digest('base64')
    .replace(base64PadCharRegExp, '')
}

/**
 * Generate a weak hash.
 *
 * @param {Buffer} entity
 * @return {String}
 * @api private
 */

function weakhash(entity) {
  if (entity.length === 0) {
    // fast-path empty
    return '0-0'
  }

  var len = typeof entity === 'string'
    ? Buffer.byteLength(entity, 'utf8')
    : entity.length

  if (len <= crc32threshold) {
    // crc32 plus length when it's fast
    // crc(str) only accepts utf-8 encoding
    return len.toString(16) + '-' + crc(entity).toString(16)
  }

  // use md5 for long strings
  return crypto
    .createHash('md5')
    .update(entity, 'utf8')
    .digest('base64')
    .replace(base64PadCharRegExp, '')
}
