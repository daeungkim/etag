/*!
 * etag
 * Copyright(c) 2014-2016 Douglas Christopher Wilson
 * MIT Licensed
 */

"use strict";

/**
 * Module exports.
 * @public
 */

module.exports = etag;

/**
 * Module dependencies.
 * @private
 */

var crypto = require("crypto");
var Stats = require("fs").Stats;

/**
 * Module variables.
 * @private
 */

var toString = Object.prototype.toString;

/**
 * Generate an entity tag.
 *
 * @param {Buffer|string} entity
 * @return {string}
 * @private
 */

function entitytag(entity) {
  if (entity.length === 0) {
    // fast-path empty
    return '"0-2jmj7l5rSw0yVb/vlWAYkK/YBwk"';
  }

  // compute hash of entity
  var hash = crypto
    .createHash("sha1")
    .update(entity, "utf8")
    .digest("base64")
    .substring(0, 27);

  /**
   * createHash : 매개변수로 전달한 알고리즘에 해당하는 Hash 클래스 반환
   *
   * update : 해싱할 데이터를 매개변수로 전달
   *
   * digest : 매개벼수로 전달한 인코딩형식으로 해싱된 값을 가져온다.
   */

  // compute length of entity
  var len =
    typeof entity === "string"
      ? Buffer.byteLength(entity, "utf8")
      : entity.length;

  /**
   * entity의 길이를 가져온다.
   */

  return '"' + len.toString(16) + "-" + hash + '"';
}

/**
 * Create a simple ETag.
 *
 * @param {string|Buffer|Stats} entity
 * @param {object} [options]
 * @param {boolean} [options.weak]
 * @return {String}
 * @public
 */

/**
 * entity : Stats or string or Buffer만 가능
 *
 * options.weak의 타입이 boolean인경우 해당값을 기준으로 strong weak을 결정한다.
 *
 * options개체가 없거나 options.weak의 데이터 타입이 boolean이 아닌경우 entity가 Stats개체이면 weak 아니면 strong이다.
 *
 */

function etag(entity, options) {
  if (entity == null) {
    throw new TypeError("argument entity is required");
  }

  // support fs.Stats object
  var isStats = isstats(entity);
  var weak =
    options && typeof options.weak === "boolean" ? options.weak : isStats;
  /**
   * options값이 존재하고 options.weak 프로퍼티의 타입이 boolean인경우 options.weak에 설정되어 있는 값을 weak값으로 설정한다.
   * 그 이외의 경우 entity 데이터 타입의 Stats개체 여부에 따라 결정된다.
   */

  // validate argument
  if (!isStats && typeof entity !== "string" && !Buffer.isBuffer(entity)) {
    throw new TypeError("argument entity must be string, Buffer, or fs.Stats");
  }
  /**
   * entity값이 Stats개체가 아닌경우 entity의 타입은 string 또는 Buffer가 되어야한다.
   *
   * Buffer : Node.js에서 제공하는 Binary의 데이터를 담을 수 있는 Object
   */

  // generate entity tag
  var tag = isStats ? stattag(entity) : entitytag(entity);

  return weak ? "W/" + tag : tag;
}

/**
 * Determine if object is a Stats object.
 *
 * @param {object} obj
 * @return {boolean}
 * @api private
 */

/**
 * isstats
 * 입력받은 인자의 타입이 Stats인지 확인하는 함수
 * 인자가 Stats이거나 Stats의 조건을 가지고 있는 경우 true를 리턴한다.
 */

/**
 * typeof와 instanceof의 차이점
 *
 * typeof : 피연산자의 데이터 타입을 반환하는 연산자
 *
 * instanceof : 개체가 특정 클래스의 인스턴스인지 여부를 나타내는 boolean값으로 반환하는 비교 연산자
 */

/**
 *
 * fs.statSync : 파일 경로에 대한 정보(Stats개체)를 리턴하는 함수
 *
 * Stats개체 예시
 *
 * Stats {
 *  dev: 16777220,
 *  mode: 33188,
 *  nlink: 1,
 *  uid: 502,
 *  gid: 20,
 *  rdev: 0,
 *  blksize: 4096,
 *  ino: 17169940,
 *  size: 255,
 *  blocks: 8,
 *  atimeMs: 1624407156504.2395,
 *  mtimeMs: 1624407155094.901,
 *  ctimeMs: 1624407155094.901,
 *  birthtimeMs: 1624320820424.4988,
 *  atime: 2021-06-23T00:12:36.504Z,
 *  mtime: 2021-06-23T00:12:35.095Z,
 *  ctime: 2021-06-23T00:12:35.095Z,
 *  birthtime: 2021-06-22T00:13:40.424Z
 *}
 */

function isstats(obj) {
  // genuine fs.Stats
  if (typeof Stats === "function" && obj instanceof Stats) {
    return true;
  }

  // quack quack
  return (
    obj &&
    typeof obj === "object" &&
    "ctime" in obj &&
    toString.call(obj.ctime) === "[object Date]" &&
    "mtime" in obj &&
    toString.call(obj.mtime) === "[object Date]" &&
    "ino" in obj &&
    typeof obj.ino === "number" &&
    "size" in obj &&
    typeof obj.size === "number"
  );
}

/**
 * Generate a tag for a stat.
 *
 * @param {object} stat
 * @return {string}
 * @private
 */

/**
 * entity가 Stats개체인경우 etag를 생성하는 함수
 */

function stattag(stat) {
  var mtime = stat.mtime.getTime().toString(16);
  var size = stat.size.toString(16);

  return '"' + size + "-" + mtime + '"';
}
