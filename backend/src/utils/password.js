const crypto = require("crypto");
const { promisify } = require("util");

const pbkdf2 = promisify(crypto.pbkdf2);
const ITERATIONS = 12000;
const KEY_LENGTH = 64;
const DIGEST = "sha256";

async function hashPassword(password, salt = crypto.randomBytes(32).toString("hex")) {
    const hash = await pbkdf2(password, salt, ITERATIONS, KEY_LENGTH, DIGEST);
    return { hash: hash.toString("hex"), salt };
}

async function verifyPassword(password, storedHash, salt) {
    if (!storedHash || !salt) return false;
    const { hash } = await hashPassword(password, salt);
    const expected = Buffer.from(storedHash, "hex");
    const actual = Buffer.from(hash, "hex");
    return expected.length === actual.length && crypto.timingSafeEqual(expected, actual);
}

module.exports = { hashPassword, verifyPassword };