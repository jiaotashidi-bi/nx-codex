import { createRequire as __WEBPACK_EXTERNAL_createRequire } from "module";
/******/ // The require scope
/******/ var __nccwpck_require__ = {};
/******/ 
/************************************************************************/
/******/ /* webpack/runtime/compat get default export */
/******/ (() => {
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__nccwpck_require__.n = (module) => {
/******/ 		var getter = module && module.__esModule ?
/******/ 			() => (module['default']) :
/******/ 			() => (module);
/******/ 		__nccwpck_require__.d(getter, { a: getter });
/******/ 		return getter;
/******/ 	};
/******/ })();
/******/ 
/******/ /* webpack/runtime/define property getters */
/******/ (() => {
/******/ 	// define getter functions for harmony exports
/******/ 	__nccwpck_require__.d = (exports, definition) => {
/******/ 		for(var key in definition) {
/******/ 			if(__nccwpck_require__.o(definition, key) && !__nccwpck_require__.o(exports, key)) {
/******/ 				Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 			}
/******/ 		}
/******/ 	};
/******/ })();
/******/ 
/******/ /* webpack/runtime/hasOwnProperty shorthand */
/******/ (() => {
/******/ 	__nccwpck_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ })();
/******/ 
/******/ /* webpack/runtime/compat */
/******/ 
/******/ if (typeof __nccwpck_require__ !== 'undefined') __nccwpck_require__.ab = new URL('.', import.meta.url).pathname.slice(import.meta.url.match(/^file:\/\/\/\w:/) ? 1 : 0, -1) + "/";
/******/ 
/************************************************************************/
var __webpack_exports__ = {};

;// CONCATENATED MODULE: external "node:crypto"
const external_node_crypto_namespaceObject = __WEBPACK_EXTERNAL_createRequire(import.meta.url)("node:crypto");
;// CONCATENATED MODULE: external "node:fs"
const external_node_fs_namespaceObject = __WEBPACK_EXTERNAL_createRequire(import.meta.url)("node:fs");
;// CONCATENATED MODULE: external "node:fs/promises"
const promises_namespaceObject = __WEBPACK_EXTERNAL_createRequire(import.meta.url)("node:fs/promises");
;// CONCATENATED MODULE: external "node:net"
const external_node_net_namespaceObject = __WEBPACK_EXTERNAL_createRequire(import.meta.url)("node:net");
var external_node_net_default = /*#__PURE__*/__nccwpck_require__.n(external_node_net_namespaceObject);
;// CONCATENATED MODULE: external "node:os"
const external_node_os_namespaceObject = __WEBPACK_EXTERNAL_createRequire(import.meta.url)("node:os");
var external_node_os_default = /*#__PURE__*/__nccwpck_require__.n(external_node_os_namespaceObject);
;// CONCATENATED MODULE: external "node:path"
const external_node_path_namespaceObject = __WEBPACK_EXTERNAL_createRequire(import.meta.url)("node:path");
var external_node_path_default = /*#__PURE__*/__nccwpck_require__.n(external_node_path_namespaceObject);
;// CONCATENATED MODULE: ./node_modules/zod/v4/core/core.js
var _a;
/** A special constant with type `never` */
const NEVER = /*@__PURE__*/ Object.freeze({
    status: "aborted",
});
function $constructor(name, initializer, params) {
    function init(inst, def) {
        if (!inst._zod) {
            Object.defineProperty(inst, "_zod", {
                value: {
                    def,
                    constr: _,
                    traits: new Set(),
                },
                enumerable: false,
            });
        }
        if (inst._zod.traits.has(name)) {
            return;
        }
        inst._zod.traits.add(name);
        initializer(inst, def);
        // support prototype modifications
        const proto = _.prototype;
        const keys = Object.keys(proto);
        for (let i = 0; i < keys.length; i++) {
            const k = keys[i];
            if (!(k in inst)) {
                inst[k] = proto[k].bind(inst);
            }
        }
    }
    // doesn't work if Parent has a constructor with arguments
    const Parent = params?.Parent ?? Object;
    class Definition extends Parent {
    }
    Object.defineProperty(Definition, "name", { value: name });
    function _(def) {
        var _a;
        const inst = params?.Parent ? new Definition() : this;
        init(inst, def);
        (_a = inst._zod).deferred ?? (_a.deferred = []);
        for (const fn of inst._zod.deferred) {
            fn();
        }
        return inst;
    }
    Object.defineProperty(_, "init", { value: init });
    Object.defineProperty(_, Symbol.hasInstance, {
        value: (inst) => {
            if (params?.Parent && inst instanceof params.Parent)
                return true;
            return inst?._zod?.traits?.has(name);
        },
    });
    Object.defineProperty(_, "name", { value: name });
    return _;
}
//////////////////////////////   UTILITIES   ///////////////////////////////////////
const $brand = Symbol("zod_brand");
class $ZodAsyncError extends Error {
    constructor() {
        super(`Encountered Promise during synchronous parse. Use .parseAsync() instead.`);
    }
}
class $ZodEncodeError extends Error {
    constructor(name) {
        super(`Encountered unidirectional transform during encode: ${name}`);
        this.name = "ZodEncodeError";
    }
}
(_a = globalThis).__zod_globalConfig ?? (_a.__zod_globalConfig = {});
const globalConfig = globalThis.__zod_globalConfig;
function config(newConfig) {
    if (newConfig)
        Object.assign(globalConfig, newConfig);
    return globalConfig;
}

;// CONCATENATED MODULE: ./node_modules/zod/v4/core/regexes.js

/**
 * @deprecated CUID v1 is deprecated by its authors due to information leakage
 * (timestamps embedded in the id). Use {@link cuid2} instead.
 * See https://github.com/paralleldrive/cuid.
 */
const cuid = /^[cC][0-9a-z]{6,}$/;
const cuid2 = /^[0-9a-z]+$/;
const ulid = /^[0-9A-HJKMNP-TV-Za-hjkmnp-tv-z]{26}$/;
const xid = /^[0-9a-vA-V]{20}$/;
const ksuid = /^[A-Za-z0-9]{27}$/;
const nanoid = /^[a-zA-Z0-9_-]{21}$/;
/** ISO 8601-1 duration regex. Does not support the 8601-2 extensions like negative durations or fractional/negative components. */
const duration = /^P(?:(\d+W)|(?!.*W)(?=\d|T\d)(\d+Y)?(\d+M)?(\d+D)?(T(?=\d)(\d+H)?(\d+M)?(\d+([.,]\d+)?S)?)?)$/;
/** Implements ISO 8601-2 extensions like explicit +- prefixes, mixing weeks with other units, and fractional/negative components. */
const extendedDuration = /^[-+]?P(?!$)(?:(?:[-+]?\d+Y)|(?:[-+]?\d+[.,]\d+Y$))?(?:(?:[-+]?\d+M)|(?:[-+]?\d+[.,]\d+M$))?(?:(?:[-+]?\d+W)|(?:[-+]?\d+[.,]\d+W$))?(?:(?:[-+]?\d+D)|(?:[-+]?\d+[.,]\d+D$))?(?:T(?=[\d+-])(?:(?:[-+]?\d+H)|(?:[-+]?\d+[.,]\d+H$))?(?:(?:[-+]?\d+M)|(?:[-+]?\d+[.,]\d+M$))?(?:[-+]?\d+(?:[.,]\d+)?S)?)??$/;
/** A regex for any UUID-like identifier: 8-4-4-4-12 hex pattern */
const guid = /^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})$/;
/** Returns a regex for validating an RFC 9562/4122 UUID.
 *
 * @param version Optionally specify a version 1-8. If no version is specified, all versions are supported. */
const uuid = (version) => {
    if (!version)
        return /^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$/;
    return new RegExp(`^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-${version}[0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12})$`);
};
const uuid4 = /*@__PURE__*/ (/* unused pure expression or super */ null && (uuid(4)));
const uuid6 = /*@__PURE__*/ (/* unused pure expression or super */ null && (uuid(6)));
const uuid7 = /*@__PURE__*/ (/* unused pure expression or super */ null && (uuid(7)));
/** Practical email validation */
const email = /^(?!\.)(?!.*\.\.)([A-Za-z0-9_'+\-\.]*)[A-Za-z0-9_+-]@([A-Za-z0-9][A-Za-z0-9\-]*\.)+[A-Za-z]{2,}$/;
/** Equivalent to the HTML5 input[type=email] validation implemented by browsers. Source: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/email */
const html5Email = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
/** The classic emailregex.com regex for RFC 5322-compliant emails */
const rfc5322Email = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
/** A loose regex that allows Unicode characters, enforces length limits, and that's about it. */
const unicodeEmail = /^[^\s@"]{1,64}@[^\s@]{1,255}$/u;
const idnEmail = (/* unused pure expression or super */ null && (unicodeEmail));
const browserEmail = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
// from https://thekevinscott.com/emojis-in-javascript/#writing-a-regular-expression
const _emoji = `^(\\p{Extended_Pictographic}|\\p{Emoji_Component})+$`;
function emoji() {
    return new RegExp(_emoji, "u");
}
const ipv4 = /^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])$/;
const ipv6 = /^(([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:))$/;
const mac = (delimiter) => {
    const escapedDelim = util.escapeRegex(delimiter ?? ":");
    return new RegExp(`^(?:[0-9A-F]{2}${escapedDelim}){5}[0-9A-F]{2}$|^(?:[0-9a-f]{2}${escapedDelim}){5}[0-9a-f]{2}$`);
};
const cidrv4 = /^((25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\/([0-9]|[1-2][0-9]|3[0-2])$/;
const cidrv6 = /^(([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|::|([0-9a-fA-F]{1,4})?::([0-9a-fA-F]{1,4}:?){0,6})\/(12[0-8]|1[01][0-9]|[1-9]?[0-9])$/;
// https://stackoverflow.com/questions/7860392/determine-if-string-is-in-base64-using-javascript
const base64 = /^$|^(?:[0-9a-zA-Z+/]{4})*(?:(?:[0-9a-zA-Z+/]{2}==)|(?:[0-9a-zA-Z+/]{3}=))?$/;
const base64url = /^[A-Za-z0-9_-]*$/;
// based on https://stackoverflow.com/questions/106179/regular-expression-to-match-dns-hostname-or-ip-address
// export const hostname: RegExp = /^([a-zA-Z0-9-]+\.)*[a-zA-Z0-9-]+$/;
const hostname = /^(?=.{1,253}\.?$)[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[-0-9a-zA-Z]{0,61}[0-9a-zA-Z])?)*\.?$/;
const domain = /^([a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/;
const httpProtocol = /^https?$/;
// https://blog.stevenlevithan.com/archives/validate-phone-number#r4-3 (regex sans spaces)
// E.164: leading digit must be 1-9; total digits (excluding '+') between 7-15
const e164 = /^\+[1-9]\d{6,14}$/;
// const dateSource = `((\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-((0[13578]|1[02])-(0[1-9]|[12]\\d|3[01])|(0[469]|11)-(0[1-9]|[12]\\d|30)|(02)-(0[1-9]|1\\d|2[0-8])))`;
const dateSource = `(?:(?:\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\\d|30)|(?:02)-(?:0[1-9]|1\\d|2[0-8])))`;
const date = /*@__PURE__*/ new RegExp(`^${dateSource}$`);
function timeSource(args) {
    const hhmm = `(?:[01]\\d|2[0-3]):[0-5]\\d`;
    const regex = typeof args.precision === "number"
        ? args.precision === -1
            ? `${hhmm}`
            : args.precision === 0
                ? `${hhmm}:[0-5]\\d`
                : `${hhmm}:[0-5]\\d\\.\\d{${args.precision}}`
        : `${hhmm}(?::[0-5]\\d(?:\\.\\d+)?)?`;
    return regex;
}
function time(args) {
    return new RegExp(`^${timeSource(args)}$`);
}
// Adapted from https://stackoverflow.com/a/3143231
function datetime(args) {
    const time = timeSource({ precision: args.precision });
    const opts = ["Z"];
    if (args.local)
        opts.push("");
    // if (args.offset) opts.push(`([+-]\\d{2}:\\d{2})`);
    if (args.offset)
        opts.push(`([+-](?:[01]\\d|2[0-3]):[0-5]\\d)`);
    const timeRegex = `${time}(?:${opts.join("|")})`;
    return new RegExp(`^${dateSource}T(?:${timeRegex})$`);
}
const string = (params) => {
    const regex = params ? `[\\s\\S]{${params?.minimum ?? 0},${params?.maximum ?? ""}}` : `[\\s\\S]*`;
    return new RegExp(`^${regex}$`);
};
const bigint = /^-?\d+n?$/;
const integer = /^-?\d+$/;
const number = /^-?\d+(?:\.\d+)?$/;
const regexes_boolean = /^(?:true|false)$/i;
const _null = /^null$/i;

const _undefined = /^undefined$/i;

// regex for string with no uppercase letters
const lowercase = /^[^A-Z]*$/;
// regex for string with no lowercase letters
const uppercase = /^[^a-z]*$/;
// regex for hexadecimal strings (any length)
const hex = /^[0-9a-fA-F]*$/;
// Hash regexes for different algorithms and encodings
// Helper function to create base64 regex with exact length and padding
function fixedBase64(bodyLength, padding) {
    return new RegExp(`^[A-Za-z0-9+/]{${bodyLength}}${padding}$`);
}
// Helper function to create base64url regex with exact length (no padding)
function fixedBase64url(length) {
    return new RegExp(`^[A-Za-z0-9_-]{${length}}$`);
}
// MD5 (16 bytes): base64 = 24 chars total (22 + "==")
const md5_hex = /^[0-9a-fA-F]{32}$/;
const md5_base64 = /*@__PURE__*/ (/* unused pure expression or super */ null && (fixedBase64(22, "==")));
const md5_base64url = /*@__PURE__*/ (/* unused pure expression or super */ null && (fixedBase64url(22)));
// SHA1 (20 bytes): base64 = 28 chars total (27 + "=")
const sha1_hex = /^[0-9a-fA-F]{40}$/;
const sha1_base64 = /*@__PURE__*/ (/* unused pure expression or super */ null && (fixedBase64(27, "=")));
const sha1_base64url = /*@__PURE__*/ (/* unused pure expression or super */ null && (fixedBase64url(27)));
// SHA256 (32 bytes): base64 = 44 chars total (43 + "=")
const sha256_hex = /^[0-9a-fA-F]{64}$/;
const sha256_base64 = /*@__PURE__*/ (/* unused pure expression or super */ null && (fixedBase64(43, "=")));
const sha256_base64url = /*@__PURE__*/ (/* unused pure expression or super */ null && (fixedBase64url(43)));
// SHA384 (48 bytes): base64 = 64 chars total (no padding)
const sha384_hex = /^[0-9a-fA-F]{96}$/;
const sha384_base64 = /*@__PURE__*/ (/* unused pure expression or super */ null && (fixedBase64(64, "")));
const sha384_base64url = /*@__PURE__*/ (/* unused pure expression or super */ null && (fixedBase64url(64)));
// SHA512 (64 bytes): base64 = 88 chars total (86 + "==")
const sha512_hex = /^[0-9a-fA-F]{128}$/;
const sha512_base64 = /*@__PURE__*/ (/* unused pure expression or super */ null && (fixedBase64(86, "==")));
const sha512_base64url = /*@__PURE__*/ (/* unused pure expression or super */ null && (fixedBase64url(86)));

;// CONCATENATED MODULE: ./node_modules/zod/v4/core/util.js

// functions
function assertEqual(val) {
    return val;
}
function assertNotEqual(val) {
    return val;
}
function assertIs(_arg) { }
function assertNever(_x) {
    throw new Error("Unexpected value in exhaustive check");
}
function assert(_) { }
function getEnumValues(entries) {
    const numericValues = Object.values(entries).filter((v) => typeof v === "number");
    const values = Object.entries(entries)
        .filter(([k, _]) => numericValues.indexOf(+k) === -1)
        .map(([_, v]) => v);
    return values;
}
function joinValues(array, separator = "|") {
    return array.map((val) => stringifyPrimitive(val)).join(separator);
}
function jsonStringifyReplacer(_, value) {
    if (typeof value === "bigint")
        return value.toString();
    return value;
}
function cached(getter) {
    const set = false;
    return {
        get value() {
            if (!set) {
                const value = getter();
                Object.defineProperty(this, "value", { value });
                return value;
            }
            throw new Error("cached value already set");
        },
    };
}
function nullish(input) {
    return input === null || input === undefined;
}
function cleanRegex(source) {
    const start = source.startsWith("^") ? 1 : 0;
    const end = source.endsWith("$") ? source.length - 1 : source.length;
    return source.slice(start, end);
}
function floatSafeRemainder(val, step) {
    const ratio = val / step;
    const roundedRatio = Math.round(ratio);
    // Use a relative epsilon scaled to the magnitude of the result
    const tolerance = Number.EPSILON * Math.max(Math.abs(ratio), 1);
    if (Math.abs(ratio - roundedRatio) < tolerance)
        return 0;
    return ratio - roundedRatio;
}
const EVALUATING = /* @__PURE__*/ Symbol("evaluating");
function defineLazy(object, key, getter) {
    let value = undefined;
    Object.defineProperty(object, key, {
        get() {
            if (value === EVALUATING) {
                // Circular reference detected, return undefined to break the cycle
                return undefined;
            }
            if (value === undefined) {
                value = EVALUATING;
                value = getter();
            }
            return value;
        },
        set(v) {
            Object.defineProperty(object, key, {
                value: v,
                // configurable: true,
            });
            // object[key] = v;
        },
        configurable: true,
    });
}
function objectClone(obj) {
    return Object.create(Object.getPrototypeOf(obj), Object.getOwnPropertyDescriptors(obj));
}
function assignProp(target, prop, value) {
    Object.defineProperty(target, prop, {
        value,
        writable: true,
        enumerable: true,
        configurable: true,
    });
}
function mergeDefs(...defs) {
    const mergedDescriptors = {};
    for (const def of defs) {
        const descriptors = Object.getOwnPropertyDescriptors(def);
        Object.assign(mergedDescriptors, descriptors);
    }
    return Object.defineProperties({}, mergedDescriptors);
}
function cloneDef(schema) {
    return mergeDefs(schema._zod.def);
}
function getElementAtPath(obj, path) {
    if (!path)
        return obj;
    return path.reduce((acc, key) => acc?.[key], obj);
}
function promiseAllObject(promisesObj) {
    const keys = Object.keys(promisesObj);
    const promises = keys.map((key) => promisesObj[key]);
    return Promise.all(promises).then((results) => {
        const resolvedObj = {};
        for (let i = 0; i < keys.length; i++) {
            resolvedObj[keys[i]] = results[i];
        }
        return resolvedObj;
    });
}
function randomString(length = 10) {
    const chars = "abcdefghijklmnopqrstuvwxyz";
    let str = "";
    for (let i = 0; i < length; i++) {
        str += chars[Math.floor(Math.random() * chars.length)];
    }
    return str;
}
function esc(str) {
    return JSON.stringify(str);
}
function slugify(input) {
    return input
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, "")
        .replace(/[\s_-]+/g, "-")
        .replace(/^-+|-+$/g, "");
}
const captureStackTrace = ("captureStackTrace" in Error ? Error.captureStackTrace : (..._args) => { });
function util_isObject(data) {
    return typeof data === "object" && data !== null && !Array.isArray(data);
}
const util_allowsEval = /* @__PURE__*/ cached(() => {
    // Skip the probe under `jitless`: strict CSPs report the caught `new Function`
    // as a `securitypolicyviolation` even though the throw is swallowed.
    if (globalConfig.jitless) {
        return false;
    }
    // @ts-ignore
    if (typeof navigator !== "undefined" && navigator?.userAgent?.includes("Cloudflare")) {
        return false;
    }
    try {
        const F = Function;
        new F("");
        return true;
    }
    catch (_) {
        return false;
    }
});
function isPlainObject(o) {
    if (util_isObject(o) === false)
        return false;
    // modified constructor
    const ctor = o.constructor;
    if (ctor === undefined)
        return true;
    if (typeof ctor !== "function")
        return true;
    // modified prototype
    const prot = ctor.prototype;
    if (util_isObject(prot) === false)
        return false;
    // ctor doesn't have static `isPrototypeOf`
    if (Object.prototype.hasOwnProperty.call(prot, "isPrototypeOf") === false) {
        return false;
    }
    return true;
}
function shallowClone(o) {
    if (isPlainObject(o))
        return { ...o };
    if (Array.isArray(o))
        return [...o];
    if (o instanceof Map)
        return new Map(o);
    if (o instanceof Set)
        return new Set(o);
    return o;
}
function numKeys(data) {
    let keyCount = 0;
    for (const key in data) {
        if (Object.prototype.hasOwnProperty.call(data, key)) {
            keyCount++;
        }
    }
    return keyCount;
}
const getParsedType = (data) => {
    const t = typeof data;
    switch (t) {
        case "undefined":
            return "undefined";
        case "string":
            return "string";
        case "number":
            return Number.isNaN(data) ? "nan" : "number";
        case "boolean":
            return "boolean";
        case "function":
            return "function";
        case "bigint":
            return "bigint";
        case "symbol":
            return "symbol";
        case "object":
            if (Array.isArray(data)) {
                return "array";
            }
            if (data === null) {
                return "null";
            }
            if (data.then && typeof data.then === "function" && data.catch && typeof data.catch === "function") {
                return "promise";
            }
            if (typeof Map !== "undefined" && data instanceof Map) {
                return "map";
            }
            if (typeof Set !== "undefined" && data instanceof Set) {
                return "set";
            }
            if (typeof Date !== "undefined" && data instanceof Date) {
                return "date";
            }
            // @ts-ignore
            if (typeof File !== "undefined" && data instanceof File) {
                return "file";
            }
            return "object";
        default:
            throw new Error(`Unknown data type: ${t}`);
    }
};
const propertyKeyTypes = /* @__PURE__*/ new Set(["string", "number", "symbol"]);
const primitiveTypes = /* @__PURE__*/ new Set([
    "string",
    "number",
    "bigint",
    "boolean",
    "symbol",
    "undefined",
]);
function escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
// zod-specific utils
function clone(inst, def, params) {
    const cl = new inst._zod.constr(def ?? inst._zod.def);
    if (!def || params?.parent)
        cl._zod.parent = inst;
    return cl;
}
function normalizeParams(_params) {
    const params = _params;
    if (!params)
        return {};
    if (typeof params === "string")
        return { error: () => params };
    if (params?.message !== undefined) {
        if (params?.error !== undefined)
            throw new Error("Cannot specify both `message` and `error` params");
        params.error = params.message;
    }
    delete params.message;
    if (typeof params.error === "string")
        return { ...params, error: () => params.error };
    return params;
}
function createTransparentProxy(getter) {
    let target;
    return new Proxy({}, {
        get(_, prop, receiver) {
            target ?? (target = getter());
            return Reflect.get(target, prop, receiver);
        },
        set(_, prop, value, receiver) {
            target ?? (target = getter());
            return Reflect.set(target, prop, value, receiver);
        },
        has(_, prop) {
            target ?? (target = getter());
            return Reflect.has(target, prop);
        },
        deleteProperty(_, prop) {
            target ?? (target = getter());
            return Reflect.deleteProperty(target, prop);
        },
        ownKeys(_) {
            target ?? (target = getter());
            return Reflect.ownKeys(target);
        },
        getOwnPropertyDescriptor(_, prop) {
            target ?? (target = getter());
            return Reflect.getOwnPropertyDescriptor(target, prop);
        },
        defineProperty(_, prop, descriptor) {
            target ?? (target = getter());
            return Reflect.defineProperty(target, prop, descriptor);
        },
    });
}
function stringifyPrimitive(value) {
    if (typeof value === "bigint")
        return value.toString() + "n";
    if (typeof value === "string")
        return `"${value}"`;
    return `${value}`;
}
function optionalKeys(shape) {
    return Object.keys(shape).filter((k) => {
        return shape[k]._zod.optin === "optional" && shape[k]._zod.optout === "optional";
    });
}
const NUMBER_FORMAT_RANGES = {
    safeint: [Number.MIN_SAFE_INTEGER, Number.MAX_SAFE_INTEGER],
    int32: [-2147483648, 2147483647],
    uint32: [0, 4294967295],
    float32: [-3.4028234663852886e38, 3.4028234663852886e38],
    float64: [-Number.MAX_VALUE, Number.MAX_VALUE],
};
const BIGINT_FORMAT_RANGES = {
    int64: [/* @__PURE__*/ BigInt("-9223372036854775808"), /* @__PURE__*/ BigInt("9223372036854775807")],
    uint64: [/* @__PURE__*/ BigInt(0), /* @__PURE__*/ BigInt("18446744073709551615")],
};
function pick(schema, mask) {
    const currDef = schema._zod.def;
    const checks = currDef.checks;
    const hasChecks = checks && checks.length > 0;
    if (hasChecks) {
        throw new Error(".pick() cannot be used on object schemas containing refinements");
    }
    const def = mergeDefs(schema._zod.def, {
        get shape() {
            const newShape = {};
            for (const key in mask) {
                if (!(key in currDef.shape)) {
                    throw new Error(`Unrecognized key: "${key}"`);
                }
                if (!mask[key])
                    continue;
                newShape[key] = currDef.shape[key];
            }
            assignProp(this, "shape", newShape); // self-caching
            return newShape;
        },
        checks: [],
    });
    return clone(schema, def);
}
function omit(schema, mask) {
    const currDef = schema._zod.def;
    const checks = currDef.checks;
    const hasChecks = checks && checks.length > 0;
    if (hasChecks) {
        throw new Error(".omit() cannot be used on object schemas containing refinements");
    }
    const def = mergeDefs(schema._zod.def, {
        get shape() {
            const newShape = { ...schema._zod.def.shape };
            for (const key in mask) {
                if (!(key in currDef.shape)) {
                    throw new Error(`Unrecognized key: "${key}"`);
                }
                if (!mask[key])
                    continue;
                delete newShape[key];
            }
            assignProp(this, "shape", newShape); // self-caching
            return newShape;
        },
        checks: [],
    });
    return clone(schema, def);
}
function extend(schema, shape) {
    if (!isPlainObject(shape)) {
        throw new Error("Invalid input to extend: expected a plain object");
    }
    const checks = schema._zod.def.checks;
    const hasChecks = checks && checks.length > 0;
    if (hasChecks) {
        // Only throw if new shape overlaps with existing shape
        // Use getOwnPropertyDescriptor to check key existence without accessing values
        const existingShape = schema._zod.def.shape;
        for (const key in shape) {
            if (Object.getOwnPropertyDescriptor(existingShape, key) !== undefined) {
                throw new Error("Cannot overwrite keys on object schemas containing refinements. Use `.safeExtend()` instead.");
            }
        }
    }
    const def = mergeDefs(schema._zod.def, {
        get shape() {
            const _shape = { ...schema._zod.def.shape, ...shape };
            assignProp(this, "shape", _shape); // self-caching
            return _shape;
        },
    });
    return clone(schema, def);
}
function safeExtend(schema, shape) {
    if (!isPlainObject(shape)) {
        throw new Error("Invalid input to safeExtend: expected a plain object");
    }
    const def = mergeDefs(schema._zod.def, {
        get shape() {
            const _shape = { ...schema._zod.def.shape, ...shape };
            assignProp(this, "shape", _shape); // self-caching
            return _shape;
        },
    });
    return clone(schema, def);
}
function merge(a, b) {
    if (a._zod.def.checks?.length) {
        throw new Error(".merge() cannot be used on object schemas containing refinements. Use .safeExtend() instead.");
    }
    const def = mergeDefs(a._zod.def, {
        get shape() {
            const _shape = { ...a._zod.def.shape, ...b._zod.def.shape };
            assignProp(this, "shape", _shape); // self-caching
            return _shape;
        },
        get catchall() {
            return b._zod.def.catchall;
        },
        checks: b._zod.def.checks ?? [],
    });
    return clone(a, def);
}
function partial(Class, schema, mask) {
    const currDef = schema._zod.def;
    const checks = currDef.checks;
    const hasChecks = checks && checks.length > 0;
    if (hasChecks) {
        throw new Error(".partial() cannot be used on object schemas containing refinements");
    }
    const def = mergeDefs(schema._zod.def, {
        get shape() {
            const oldShape = schema._zod.def.shape;
            const shape = { ...oldShape };
            if (mask) {
                for (const key in mask) {
                    if (!(key in oldShape)) {
                        throw new Error(`Unrecognized key: "${key}"`);
                    }
                    if (!mask[key])
                        continue;
                    // if (oldShape[key]!._zod.optin === "optional") continue;
                    shape[key] = Class
                        ? new Class({
                            type: "optional",
                            innerType: oldShape[key],
                        })
                        : oldShape[key];
                }
            }
            else {
                for (const key in oldShape) {
                    // if (oldShape[key]!._zod.optin === "optional") continue;
                    shape[key] = Class
                        ? new Class({
                            type: "optional",
                            innerType: oldShape[key],
                        })
                        : oldShape[key];
                }
            }
            assignProp(this, "shape", shape); // self-caching
            return shape;
        },
        checks: [],
    });
    return clone(schema, def);
}
function required(Class, schema, mask) {
    const def = mergeDefs(schema._zod.def, {
        get shape() {
            const oldShape = schema._zod.def.shape;
            const shape = { ...oldShape };
            if (mask) {
                for (const key in mask) {
                    if (!(key in shape)) {
                        throw new Error(`Unrecognized key: "${key}"`);
                    }
                    if (!mask[key])
                        continue;
                    // overwrite with non-optional
                    shape[key] = new Class({
                        type: "nonoptional",
                        innerType: oldShape[key],
                    });
                }
            }
            else {
                for (const key in oldShape) {
                    // overwrite with non-optional
                    shape[key] = new Class({
                        type: "nonoptional",
                        innerType: oldShape[key],
                    });
                }
            }
            assignProp(this, "shape", shape); // self-caching
            return shape;
        },
    });
    return clone(schema, def);
}
// invalid_type | too_big | too_small | invalid_format | not_multiple_of | unrecognized_keys | invalid_union | invalid_key | invalid_element | invalid_value | custom
function aborted(x, startIndex = 0) {
    if (x.aborted === true)
        return true;
    for (let i = startIndex; i < x.issues.length; i++) {
        if (x.issues[i]?.continue !== true) {
            return true;
        }
    }
    return false;
}
// Checks for explicit abort (continue === false), as opposed to implicit abort (continue === undefined).
// Used to respect `abort: true` in .refine() even for checks that have a `when` function.
function explicitlyAborted(x, startIndex = 0) {
    if (x.aborted === true)
        return true;
    for (let i = startIndex; i < x.issues.length; i++) {
        if (x.issues[i]?.continue === false) {
            return true;
        }
    }
    return false;
}
function prefixIssues(path, issues) {
    return issues.map((iss) => {
        var _a;
        (_a = iss).path ?? (_a.path = []);
        iss.path.unshift(path);
        return iss;
    });
}
function unwrapMessage(message) {
    return typeof message === "string" ? message : message?.message;
}
function finalizeIssue(iss, ctx, config) {
    const message = iss.message
        ? iss.message
        : (unwrapMessage(iss.inst?._zod.def?.error?.(iss)) ??
            unwrapMessage(ctx?.error?.(iss)) ??
            unwrapMessage(config.customError?.(iss)) ??
            unwrapMessage(config.localeError?.(iss)) ??
            "Invalid input");
    const { inst: _inst, continue: _continue, input: _input, ...rest } = iss;
    rest.path ?? (rest.path = []);
    rest.message = message;
    if (ctx?.reportInput) {
        rest.input = _input;
    }
    return rest;
}
function getSizableOrigin(input) {
    if (input instanceof Set)
        return "set";
    if (input instanceof Map)
        return "map";
    // @ts-ignore
    if (input instanceof File)
        return "file";
    return "unknown";
}
function getLengthableOrigin(input) {
    if (Array.isArray(input))
        return "array";
    if (typeof input === "string")
        return "string";
    return "unknown";
}
function parsedType(data) {
    const t = typeof data;
    switch (t) {
        case "number": {
            return Number.isNaN(data) ? "nan" : "number";
        }
        case "object": {
            if (data === null) {
                return "null";
            }
            if (Array.isArray(data)) {
                return "array";
            }
            const obj = data;
            if (obj && Object.getPrototypeOf(obj) !== Object.prototype && "constructor" in obj && obj.constructor) {
                return obj.constructor.name;
            }
        }
    }
    return t;
}
function util_issue(...args) {
    const [iss, input, inst] = args;
    if (typeof iss === "string") {
        return {
            message: iss,
            code: "custom",
            input,
            inst,
        };
    }
    return { ...iss };
}
function cleanEnum(obj) {
    return Object.entries(obj)
        .filter(([k, _]) => {
        // return true if NaN, meaning it's not a number, thus a string key
        return Number.isNaN(Number.parseInt(k, 10));
    })
        .map((el) => el[1]);
}
// Codec utility functions
function base64ToUint8Array(base64) {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
}
function uint8ArrayToBase64(bytes) {
    let binaryString = "";
    for (let i = 0; i < bytes.length; i++) {
        binaryString += String.fromCharCode(bytes[i]);
    }
    return btoa(binaryString);
}
function base64urlToUint8Array(base64url) {
    const base64 = base64url.replace(/-/g, "+").replace(/_/g, "/");
    const padding = "=".repeat((4 - (base64.length % 4)) % 4);
    return base64ToUint8Array(base64 + padding);
}
function uint8ArrayToBase64url(bytes) {
    return uint8ArrayToBase64(bytes).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}
function hexToUint8Array(hex) {
    const cleanHex = hex.replace(/^0x/, "");
    if (cleanHex.length % 2 !== 0) {
        throw new Error("Invalid hex string length");
    }
    const bytes = new Uint8Array(cleanHex.length / 2);
    for (let i = 0; i < cleanHex.length; i += 2) {
        bytes[i / 2] = Number.parseInt(cleanHex.slice(i, i + 2), 16);
    }
    return bytes;
}
function uint8ArrayToHex(bytes) {
    return Array.from(bytes)
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
}
// instanceof
class Class {
    constructor(..._args) { }
}

;// CONCATENATED MODULE: ./node_modules/zod/v4/core/checks.js
// import { $ZodType } from "./schemas.js";



const $ZodCheck = /*@__PURE__*/ $constructor("$ZodCheck", (inst, def) => {
    var _a;
    inst._zod ?? (inst._zod = {});
    inst._zod.def = def;
    (_a = inst._zod).onattach ?? (_a.onattach = []);
});
const numericOriginMap = {
    number: "number",
    bigint: "bigint",
    object: "date",
};
const $ZodCheckLessThan = /*@__PURE__*/ $constructor("$ZodCheckLessThan", (inst, def) => {
    $ZodCheck.init(inst, def);
    const origin = numericOriginMap[typeof def.value];
    inst._zod.onattach.push((inst) => {
        const bag = inst._zod.bag;
        const curr = (def.inclusive ? bag.maximum : bag.exclusiveMaximum) ?? Number.POSITIVE_INFINITY;
        if (def.value < curr) {
            if (def.inclusive)
                bag.maximum = def.value;
            else
                bag.exclusiveMaximum = def.value;
        }
    });
    inst._zod.check = (payload) => {
        if (def.inclusive ? payload.value <= def.value : payload.value < def.value) {
            return;
        }
        payload.issues.push({
            origin,
            code: "too_big",
            maximum: typeof def.value === "object" ? def.value.getTime() : def.value,
            input: payload.value,
            inclusive: def.inclusive,
            inst,
            continue: !def.abort,
        });
    };
});
const $ZodCheckGreaterThan = /*@__PURE__*/ $constructor("$ZodCheckGreaterThan", (inst, def) => {
    $ZodCheck.init(inst, def);
    const origin = numericOriginMap[typeof def.value];
    inst._zod.onattach.push((inst) => {
        const bag = inst._zod.bag;
        const curr = (def.inclusive ? bag.minimum : bag.exclusiveMinimum) ?? Number.NEGATIVE_INFINITY;
        if (def.value > curr) {
            if (def.inclusive)
                bag.minimum = def.value;
            else
                bag.exclusiveMinimum = def.value;
        }
    });
    inst._zod.check = (payload) => {
        if (def.inclusive ? payload.value >= def.value : payload.value > def.value) {
            return;
        }
        payload.issues.push({
            origin,
            code: "too_small",
            minimum: typeof def.value === "object" ? def.value.getTime() : def.value,
            input: payload.value,
            inclusive: def.inclusive,
            inst,
            continue: !def.abort,
        });
    };
});
const $ZodCheckMultipleOf = 
/*@__PURE__*/ $constructor("$ZodCheckMultipleOf", (inst, def) => {
    $ZodCheck.init(inst, def);
    inst._zod.onattach.push((inst) => {
        var _a;
        (_a = inst._zod.bag).multipleOf ?? (_a.multipleOf = def.value);
    });
    inst._zod.check = (payload) => {
        if (typeof payload.value !== typeof def.value)
            throw new Error("Cannot mix number and bigint in multiple_of check.");
        const isMultiple = typeof payload.value === "bigint"
            ? payload.value % def.value === BigInt(0)
            : floatSafeRemainder(payload.value, def.value) === 0;
        if (isMultiple)
            return;
        payload.issues.push({
            origin: typeof payload.value,
            code: "not_multiple_of",
            divisor: def.value,
            input: payload.value,
            inst,
            continue: !def.abort,
        });
    };
});
const $ZodCheckNumberFormat = /*@__PURE__*/ $constructor("$ZodCheckNumberFormat", (inst, def) => {
    $ZodCheck.init(inst, def); // no format checks
    def.format = def.format || "float64";
    const isInt = def.format?.includes("int");
    const origin = isInt ? "int" : "number";
    const [minimum, maximum] = NUMBER_FORMAT_RANGES[def.format];
    inst._zod.onattach.push((inst) => {
        const bag = inst._zod.bag;
        bag.format = def.format;
        bag.minimum = minimum;
        bag.maximum = maximum;
        if (isInt)
            bag.pattern = integer;
    });
    inst._zod.check = (payload) => {
        const input = payload.value;
        if (isInt) {
            if (!Number.isInteger(input)) {
                // invalid_format issue
                // payload.issues.push({
                //   expected: def.format,
                //   format: def.format,
                //   code: "invalid_format",
                //   input,
                //   inst,
                // });
                // invalid_type issue
                payload.issues.push({
                    expected: origin,
                    format: def.format,
                    code: "invalid_type",
                    continue: false,
                    input,
                    inst,
                });
                return;
                // not_multiple_of issue
                // payload.issues.push({
                //   code: "not_multiple_of",
                //   origin: "number",
                //   input,
                //   inst,
                //   divisor: 1,
                // });
            }
            if (!Number.isSafeInteger(input)) {
                if (input > 0) {
                    // too_big
                    payload.issues.push({
                        input,
                        code: "too_big",
                        maximum: Number.MAX_SAFE_INTEGER,
                        note: "Integers must be within the safe integer range.",
                        inst,
                        origin,
                        inclusive: true,
                        continue: !def.abort,
                    });
                }
                else {
                    // too_small
                    payload.issues.push({
                        input,
                        code: "too_small",
                        minimum: Number.MIN_SAFE_INTEGER,
                        note: "Integers must be within the safe integer range.",
                        inst,
                        origin,
                        inclusive: true,
                        continue: !def.abort,
                    });
                }
                return;
            }
        }
        if (input < minimum) {
            payload.issues.push({
                origin: "number",
                input,
                code: "too_small",
                minimum,
                inclusive: true,
                inst,
                continue: !def.abort,
            });
        }
        if (input > maximum) {
            payload.issues.push({
                origin: "number",
                input,
                code: "too_big",
                maximum,
                inclusive: true,
                inst,
                continue: !def.abort,
            });
        }
    };
});
const $ZodCheckBigIntFormat = /*@__PURE__*/ (/* unused pure expression or super */ null && (core.$constructor("$ZodCheckBigIntFormat", (inst, def) => {
    $ZodCheck.init(inst, def); // no format checks
    const [minimum, maximum] = util.BIGINT_FORMAT_RANGES[def.format];
    inst._zod.onattach.push((inst) => {
        const bag = inst._zod.bag;
        bag.format = def.format;
        bag.minimum = minimum;
        bag.maximum = maximum;
    });
    inst._zod.check = (payload) => {
        const input = payload.value;
        if (input < minimum) {
            payload.issues.push({
                origin: "bigint",
                input,
                code: "too_small",
                minimum: minimum,
                inclusive: true,
                inst,
                continue: !def.abort,
            });
        }
        if (input > maximum) {
            payload.issues.push({
                origin: "bigint",
                input,
                code: "too_big",
                maximum,
                inclusive: true,
                inst,
                continue: !def.abort,
            });
        }
    };
})));
const $ZodCheckMaxSize = /*@__PURE__*/ (/* unused pure expression or super */ null && (core.$constructor("$ZodCheckMaxSize", (inst, def) => {
    var _a;
    $ZodCheck.init(inst, def);
    (_a = inst._zod.def).when ?? (_a.when = (payload) => {
        const val = payload.value;
        return !util.nullish(val) && val.size !== undefined;
    });
    inst._zod.onattach.push((inst) => {
        const curr = (inst._zod.bag.maximum ?? Number.POSITIVE_INFINITY);
        if (def.maximum < curr)
            inst._zod.bag.maximum = def.maximum;
    });
    inst._zod.check = (payload) => {
        const input = payload.value;
        const size = input.size;
        if (size <= def.maximum)
            return;
        payload.issues.push({
            origin: util.getSizableOrigin(input),
            code: "too_big",
            maximum: def.maximum,
            inclusive: true,
            input,
            inst,
            continue: !def.abort,
        });
    };
})));
const $ZodCheckMinSize = /*@__PURE__*/ (/* unused pure expression or super */ null && (core.$constructor("$ZodCheckMinSize", (inst, def) => {
    var _a;
    $ZodCheck.init(inst, def);
    (_a = inst._zod.def).when ?? (_a.when = (payload) => {
        const val = payload.value;
        return !util.nullish(val) && val.size !== undefined;
    });
    inst._zod.onattach.push((inst) => {
        const curr = (inst._zod.bag.minimum ?? Number.NEGATIVE_INFINITY);
        if (def.minimum > curr)
            inst._zod.bag.minimum = def.minimum;
    });
    inst._zod.check = (payload) => {
        const input = payload.value;
        const size = input.size;
        if (size >= def.minimum)
            return;
        payload.issues.push({
            origin: util.getSizableOrigin(input),
            code: "too_small",
            minimum: def.minimum,
            inclusive: true,
            input,
            inst,
            continue: !def.abort,
        });
    };
})));
const $ZodCheckSizeEquals = /*@__PURE__*/ (/* unused pure expression or super */ null && (core.$constructor("$ZodCheckSizeEquals", (inst, def) => {
    var _a;
    $ZodCheck.init(inst, def);
    (_a = inst._zod.def).when ?? (_a.when = (payload) => {
        const val = payload.value;
        return !util.nullish(val) && val.size !== undefined;
    });
    inst._zod.onattach.push((inst) => {
        const bag = inst._zod.bag;
        bag.minimum = def.size;
        bag.maximum = def.size;
        bag.size = def.size;
    });
    inst._zod.check = (payload) => {
        const input = payload.value;
        const size = input.size;
        if (size === def.size)
            return;
        const tooBig = size > def.size;
        payload.issues.push({
            origin: util.getSizableOrigin(input),
            ...(tooBig ? { code: "too_big", maximum: def.size } : { code: "too_small", minimum: def.size }),
            inclusive: true,
            exact: true,
            input: payload.value,
            inst,
            continue: !def.abort,
        });
    };
})));
const $ZodCheckMaxLength = /*@__PURE__*/ $constructor("$ZodCheckMaxLength", (inst, def) => {
    var _a;
    $ZodCheck.init(inst, def);
    (_a = inst._zod.def).when ?? (_a.when = (payload) => {
        const val = payload.value;
        return !nullish(val) && val.length !== undefined;
    });
    inst._zod.onattach.push((inst) => {
        const curr = (inst._zod.bag.maximum ?? Number.POSITIVE_INFINITY);
        if (def.maximum < curr)
            inst._zod.bag.maximum = def.maximum;
    });
    inst._zod.check = (payload) => {
        const input = payload.value;
        const length = input.length;
        if (length <= def.maximum)
            return;
        const origin = getLengthableOrigin(input);
        payload.issues.push({
            origin,
            code: "too_big",
            maximum: def.maximum,
            inclusive: true,
            input,
            inst,
            continue: !def.abort,
        });
    };
});
const $ZodCheckMinLength = /*@__PURE__*/ $constructor("$ZodCheckMinLength", (inst, def) => {
    var _a;
    $ZodCheck.init(inst, def);
    (_a = inst._zod.def).when ?? (_a.when = (payload) => {
        const val = payload.value;
        return !nullish(val) && val.length !== undefined;
    });
    inst._zod.onattach.push((inst) => {
        const curr = (inst._zod.bag.minimum ?? Number.NEGATIVE_INFINITY);
        if (def.minimum > curr)
            inst._zod.bag.minimum = def.minimum;
    });
    inst._zod.check = (payload) => {
        const input = payload.value;
        const length = input.length;
        if (length >= def.minimum)
            return;
        const origin = getLengthableOrigin(input);
        payload.issues.push({
            origin,
            code: "too_small",
            minimum: def.minimum,
            inclusive: true,
            input,
            inst,
            continue: !def.abort,
        });
    };
});
const $ZodCheckLengthEquals = /*@__PURE__*/ $constructor("$ZodCheckLengthEquals", (inst, def) => {
    var _a;
    $ZodCheck.init(inst, def);
    (_a = inst._zod.def).when ?? (_a.when = (payload) => {
        const val = payload.value;
        return !nullish(val) && val.length !== undefined;
    });
    inst._zod.onattach.push((inst) => {
        const bag = inst._zod.bag;
        bag.minimum = def.length;
        bag.maximum = def.length;
        bag.length = def.length;
    });
    inst._zod.check = (payload) => {
        const input = payload.value;
        const length = input.length;
        if (length === def.length)
            return;
        const origin = getLengthableOrigin(input);
        const tooBig = length > def.length;
        payload.issues.push({
            origin,
            ...(tooBig ? { code: "too_big", maximum: def.length } : { code: "too_small", minimum: def.length }),
            inclusive: true,
            exact: true,
            input: payload.value,
            inst,
            continue: !def.abort,
        });
    };
});
const $ZodCheckStringFormat = /*@__PURE__*/ $constructor("$ZodCheckStringFormat", (inst, def) => {
    var _a, _b;
    $ZodCheck.init(inst, def);
    inst._zod.onattach.push((inst) => {
        const bag = inst._zod.bag;
        bag.format = def.format;
        if (def.pattern) {
            bag.patterns ?? (bag.patterns = new Set());
            bag.patterns.add(def.pattern);
        }
    });
    if (def.pattern)
        (_a = inst._zod).check ?? (_a.check = (payload) => {
            def.pattern.lastIndex = 0;
            if (def.pattern.test(payload.value))
                return;
            payload.issues.push({
                origin: "string",
                code: "invalid_format",
                format: def.format,
                input: payload.value,
                ...(def.pattern ? { pattern: def.pattern.toString() } : {}),
                inst,
                continue: !def.abort,
            });
        });
    else
        (_b = inst._zod).check ?? (_b.check = () => { });
});
const $ZodCheckRegex = /*@__PURE__*/ $constructor("$ZodCheckRegex", (inst, def) => {
    $ZodCheckStringFormat.init(inst, def);
    inst._zod.check = (payload) => {
        def.pattern.lastIndex = 0;
        if (def.pattern.test(payload.value))
            return;
        payload.issues.push({
            origin: "string",
            code: "invalid_format",
            format: "regex",
            input: payload.value,
            pattern: def.pattern.toString(),
            inst,
            continue: !def.abort,
        });
    };
});
const $ZodCheckLowerCase = /*@__PURE__*/ $constructor("$ZodCheckLowerCase", (inst, def) => {
    def.pattern ?? (def.pattern = lowercase);
    $ZodCheckStringFormat.init(inst, def);
});
const $ZodCheckUpperCase = /*@__PURE__*/ $constructor("$ZodCheckUpperCase", (inst, def) => {
    def.pattern ?? (def.pattern = uppercase);
    $ZodCheckStringFormat.init(inst, def);
});
const $ZodCheckIncludes = /*@__PURE__*/ $constructor("$ZodCheckIncludes", (inst, def) => {
    $ZodCheck.init(inst, def);
    const escapedRegex = escapeRegex(def.includes);
    const pattern = new RegExp(typeof def.position === "number" ? `^.{${def.position}}${escapedRegex}` : escapedRegex);
    def.pattern = pattern;
    inst._zod.onattach.push((inst) => {
        const bag = inst._zod.bag;
        bag.patterns ?? (bag.patterns = new Set());
        bag.patterns.add(pattern);
    });
    inst._zod.check = (payload) => {
        if (payload.value.includes(def.includes, def.position))
            return;
        payload.issues.push({
            origin: "string",
            code: "invalid_format",
            format: "includes",
            includes: def.includes,
            input: payload.value,
            inst,
            continue: !def.abort,
        });
    };
});
const $ZodCheckStartsWith = /*@__PURE__*/ $constructor("$ZodCheckStartsWith", (inst, def) => {
    $ZodCheck.init(inst, def);
    const pattern = new RegExp(`^${escapeRegex(def.prefix)}.*`);
    def.pattern ?? (def.pattern = pattern);
    inst._zod.onattach.push((inst) => {
        const bag = inst._zod.bag;
        bag.patterns ?? (bag.patterns = new Set());
        bag.patterns.add(pattern);
    });
    inst._zod.check = (payload) => {
        if (payload.value.startsWith(def.prefix))
            return;
        payload.issues.push({
            origin: "string",
            code: "invalid_format",
            format: "starts_with",
            prefix: def.prefix,
            input: payload.value,
            inst,
            continue: !def.abort,
        });
    };
});
const $ZodCheckEndsWith = /*@__PURE__*/ $constructor("$ZodCheckEndsWith", (inst, def) => {
    $ZodCheck.init(inst, def);
    const pattern = new RegExp(`.*${escapeRegex(def.suffix)}$`);
    def.pattern ?? (def.pattern = pattern);
    inst._zod.onattach.push((inst) => {
        const bag = inst._zod.bag;
        bag.patterns ?? (bag.patterns = new Set());
        bag.patterns.add(pattern);
    });
    inst._zod.check = (payload) => {
        if (payload.value.endsWith(def.suffix))
            return;
        payload.issues.push({
            origin: "string",
            code: "invalid_format",
            format: "ends_with",
            suffix: def.suffix,
            input: payload.value,
            inst,
            continue: !def.abort,
        });
    };
});
///////////////////////////////////
/////    $ZodCheckProperty    /////
///////////////////////////////////
function handleCheckPropertyResult(result, payload, property) {
    if (result.issues.length) {
        payload.issues.push(...util.prefixIssues(property, result.issues));
    }
}
const $ZodCheckProperty = /*@__PURE__*/ (/* unused pure expression or super */ null && (core.$constructor("$ZodCheckProperty", (inst, def) => {
    $ZodCheck.init(inst, def);
    inst._zod.check = (payload) => {
        const result = def.schema._zod.run({
            value: payload.value[def.property],
            issues: [],
        }, {});
        if (result instanceof Promise) {
            return result.then((result) => handleCheckPropertyResult(result, payload, def.property));
        }
        handleCheckPropertyResult(result, payload, def.property);
        return;
    };
})));
const $ZodCheckMimeType = /*@__PURE__*/ (/* unused pure expression or super */ null && (core.$constructor("$ZodCheckMimeType", (inst, def) => {
    $ZodCheck.init(inst, def);
    const mimeSet = new Set(def.mime);
    inst._zod.onattach.push((inst) => {
        inst._zod.bag.mime = def.mime;
    });
    inst._zod.check = (payload) => {
        if (mimeSet.has(payload.value.type))
            return;
        payload.issues.push({
            code: "invalid_value",
            values: def.mime,
            input: payload.value.type,
            inst,
            continue: !def.abort,
        });
    };
})));
const $ZodCheckOverwrite = /*@__PURE__*/ $constructor("$ZodCheckOverwrite", (inst, def) => {
    $ZodCheck.init(inst, def);
    inst._zod.check = (payload) => {
        payload.value = def.tx(payload.value);
    };
});

;// CONCATENATED MODULE: ./node_modules/zod/v4/core/doc.js
class Doc {
    constructor(args = []) {
        this.content = [];
        this.indent = 0;
        if (this)
            this.args = args;
    }
    indented(fn) {
        this.indent += 1;
        fn(this);
        this.indent -= 1;
    }
    write(arg) {
        if (typeof arg === "function") {
            arg(this, { execution: "sync" });
            arg(this, { execution: "async" });
            return;
        }
        const content = arg;
        const lines = content.split("\n").filter((x) => x);
        const minIndent = Math.min(...lines.map((x) => x.length - x.trimStart().length));
        const dedented = lines.map((x) => x.slice(minIndent)).map((x) => " ".repeat(this.indent * 2) + x);
        for (const line of dedented) {
            this.content.push(line);
        }
    }
    compile() {
        const F = Function;
        const args = this?.args;
        const content = this?.content ?? [``];
        const lines = [...content.map((x) => `  ${x}`)];
        // console.log(lines.join("\n"));
        return new F(...args, lines.join("\n"));
    }
}

;// CONCATENATED MODULE: ./node_modules/zod/v4/core/errors.js


const initializer = (inst, def) => {
    inst.name = "$ZodError";
    Object.defineProperty(inst, "_zod", {
        value: inst._zod,
        enumerable: false,
    });
    Object.defineProperty(inst, "issues", {
        value: def,
        enumerable: false,
    });
    inst.message = JSON.stringify(def, jsonStringifyReplacer, 2);
    Object.defineProperty(inst, "toString", {
        value: () => inst.message,
        enumerable: false,
    });
};
const $ZodError = $constructor("$ZodError", initializer);
const $ZodRealError = $constructor("$ZodError", initializer, { Parent: Error });
function flattenError(error, mapper = (issue) => issue.message) {
    const fieldErrors = {};
    const formErrors = [];
    for (const sub of error.issues) {
        if (sub.path.length > 0) {
            fieldErrors[sub.path[0]] = fieldErrors[sub.path[0]] || [];
            fieldErrors[sub.path[0]].push(mapper(sub));
        }
        else {
            formErrors.push(mapper(sub));
        }
    }
    return { formErrors, fieldErrors };
}
function formatError(error, mapper = (issue) => issue.message) {
    const fieldErrors = { _errors: [] };
    const processError = (error, path = []) => {
        for (const issue of error.issues) {
            if (issue.code === "invalid_union" && issue.errors.length) {
                issue.errors.map((issues) => processError({ issues }, [...path, ...issue.path]));
            }
            else if (issue.code === "invalid_key") {
                processError({ issues: issue.issues }, [...path, ...issue.path]);
            }
            else if (issue.code === "invalid_element") {
                processError({ issues: issue.issues }, [...path, ...issue.path]);
            }
            else {
                const fullpath = [...path, ...issue.path];
                if (fullpath.length === 0) {
                    fieldErrors._errors.push(mapper(issue));
                }
                else {
                    let curr = fieldErrors;
                    let i = 0;
                    while (i < fullpath.length) {
                        const el = fullpath[i];
                        const terminal = i === fullpath.length - 1;
                        if (!terminal) {
                            curr[el] = curr[el] || { _errors: [] };
                        }
                        else {
                            curr[el] = curr[el] || { _errors: [] };
                            curr[el]._errors.push(mapper(issue));
                        }
                        curr = curr[el];
                        i++;
                    }
                }
            }
        }
    };
    processError(error);
    return fieldErrors;
}
function treeifyError(error, mapper = (issue) => issue.message) {
    const result = { errors: [] };
    const processError = (error, path = []) => {
        var _a, _b;
        for (const issue of error.issues) {
            if (issue.code === "invalid_union" && issue.errors.length) {
                // regular union error
                issue.errors.map((issues) => processError({ issues }, [...path, ...issue.path]));
            }
            else if (issue.code === "invalid_key") {
                processError({ issues: issue.issues }, [...path, ...issue.path]);
            }
            else if (issue.code === "invalid_element") {
                processError({ issues: issue.issues }, [...path, ...issue.path]);
            }
            else {
                const fullpath = [...path, ...issue.path];
                if (fullpath.length === 0) {
                    result.errors.push(mapper(issue));
                    continue;
                }
                let curr = result;
                let i = 0;
                while (i < fullpath.length) {
                    const el = fullpath[i];
                    const terminal = i === fullpath.length - 1;
                    if (typeof el === "string") {
                        curr.properties ?? (curr.properties = {});
                        (_a = curr.properties)[el] ?? (_a[el] = { errors: [] });
                        curr = curr.properties[el];
                    }
                    else {
                        curr.items ?? (curr.items = []);
                        (_b = curr.items)[el] ?? (_b[el] = { errors: [] });
                        curr = curr.items[el];
                    }
                    if (terminal) {
                        curr.errors.push(mapper(issue));
                    }
                    i++;
                }
            }
        }
    };
    processError(error);
    return result;
}
/** Format a ZodError as a human-readable string in the following form.
 *
 * From
 *
 * ```ts
 * ZodError {
 *   issues: [
 *     {
 *       expected: 'string',
 *       code: 'invalid_type',
 *       path: [ 'username' ],
 *       message: 'Invalid input: expected string'
 *     },
 *     {
 *       expected: 'number',
 *       code: 'invalid_type',
 *       path: [ 'favoriteNumbers', 1 ],
 *       message: 'Invalid input: expected number'
 *     }
 *   ];
 * }
 * ```
 *
 * to
 *
 * ```
 * username
 *   ✖ Expected number, received string at "username
 * favoriteNumbers[0]
 *   ✖ Invalid input: expected number
 * ```
 */
function toDotPath(_path) {
    const segs = [];
    const path = _path.map((seg) => (typeof seg === "object" ? seg.key : seg));
    for (const seg of path) {
        if (typeof seg === "number")
            segs.push(`[${seg}]`);
        else if (typeof seg === "symbol")
            segs.push(`[${JSON.stringify(String(seg))}]`);
        else if (/[^\w$]/.test(seg))
            segs.push(`[${JSON.stringify(seg)}]`);
        else {
            if (segs.length)
                segs.push(".");
            segs.push(seg);
        }
    }
    return segs.join("");
}
function prettifyError(error) {
    const lines = [];
    // sort by path length
    const issues = [...error.issues].sort((a, b) => (a.path ?? []).length - (b.path ?? []).length);
    // Process each issue
    for (const issue of issues) {
        lines.push(`✖ ${issue.message}`);
        if (issue.path?.length)
            lines.push(`  → at ${toDotPath(issue.path)}`);
    }
    // Convert Map to formatted string
    return lines.join("\n");
}

;// CONCATENATED MODULE: ./node_modules/zod/v4/core/parse.js



const _parse = (_Err) => (schema, value, _ctx, _params) => {
    const ctx = _ctx ? { ..._ctx, async: false } : { async: false };
    const result = schema._zod.run({ value, issues: [] }, ctx);
    if (result instanceof Promise) {
        throw new $ZodAsyncError();
    }
    if (result.issues.length) {
        const e = new (_params?.Err ?? _Err)(result.issues.map((iss) => finalizeIssue(iss, ctx, config())));
        captureStackTrace(e, _params?.callee);
        throw e;
    }
    return result.value;
};
const parse_parse = /* @__PURE__*/ _parse($ZodRealError);
const _parseAsync = (_Err) => async (schema, value, _ctx, params) => {
    const ctx = _ctx ? { ..._ctx, async: true } : { async: true };
    let result = schema._zod.run({ value, issues: [] }, ctx);
    if (result instanceof Promise)
        result = await result;
    if (result.issues.length) {
        const e = new (params?.Err ?? _Err)(result.issues.map((iss) => finalizeIssue(iss, ctx, config())));
        captureStackTrace(e, params?.callee);
        throw e;
    }
    return result.value;
};
const parse_parseAsync = /* @__PURE__*/ _parseAsync($ZodRealError);
const _safeParse = (_Err) => (schema, value, _ctx) => {
    const ctx = _ctx ? { ..._ctx, async: false } : { async: false };
    const result = schema._zod.run({ value, issues: [] }, ctx);
    if (result instanceof Promise) {
        throw new $ZodAsyncError();
    }
    return result.issues.length
        ? {
            success: false,
            error: new (_Err ?? $ZodError)(result.issues.map((iss) => finalizeIssue(iss, ctx, config()))),
        }
        : { success: true, data: result.value };
};
const safeParse = /* @__PURE__*/ _safeParse($ZodRealError);
const _safeParseAsync = (_Err) => async (schema, value, _ctx) => {
    const ctx = _ctx ? { ..._ctx, async: true } : { async: true };
    let result = schema._zod.run({ value, issues: [] }, ctx);
    if (result instanceof Promise)
        result = await result;
    return result.issues.length
        ? {
            success: false,
            error: new _Err(result.issues.map((iss) => finalizeIssue(iss, ctx, config()))),
        }
        : { success: true, data: result.value };
};
const safeParseAsync = /* @__PURE__*/ _safeParseAsync($ZodRealError);
const _encode = (_Err) => (schema, value, _ctx) => {
    const ctx = _ctx ? { ..._ctx, direction: "backward" } : { direction: "backward" };
    return _parse(_Err)(schema, value, ctx);
};
const encode = /* @__PURE__*/ _encode($ZodRealError);
const _decode = (_Err) => (schema, value, _ctx) => {
    return _parse(_Err)(schema, value, _ctx);
};
const decode = /* @__PURE__*/ _decode($ZodRealError);
const _encodeAsync = (_Err) => async (schema, value, _ctx) => {
    const ctx = _ctx ? { ..._ctx, direction: "backward" } : { direction: "backward" };
    return _parseAsync(_Err)(schema, value, ctx);
};
const encodeAsync = /* @__PURE__*/ _encodeAsync($ZodRealError);
const _decodeAsync = (_Err) => async (schema, value, _ctx) => {
    return _parseAsync(_Err)(schema, value, _ctx);
};
const decodeAsync = /* @__PURE__*/ _decodeAsync($ZodRealError);
const _safeEncode = (_Err) => (schema, value, _ctx) => {
    const ctx = _ctx ? { ..._ctx, direction: "backward" } : { direction: "backward" };
    return _safeParse(_Err)(schema, value, ctx);
};
const safeEncode = /* @__PURE__*/ _safeEncode($ZodRealError);
const _safeDecode = (_Err) => (schema, value, _ctx) => {
    return _safeParse(_Err)(schema, value, _ctx);
};
const safeDecode = /* @__PURE__*/ _safeDecode($ZodRealError);
const _safeEncodeAsync = (_Err) => async (schema, value, _ctx) => {
    const ctx = _ctx ? { ..._ctx, direction: "backward" } : { direction: "backward" };
    return _safeParseAsync(_Err)(schema, value, ctx);
};
const safeEncodeAsync = /* @__PURE__*/ _safeEncodeAsync($ZodRealError);
const _safeDecodeAsync = (_Err) => async (schema, value, _ctx) => {
    return _safeParseAsync(_Err)(schema, value, _ctx);
};
const safeDecodeAsync = /* @__PURE__*/ _safeDecodeAsync($ZodRealError);

;// CONCATENATED MODULE: ./node_modules/zod/v4/core/versions.js
const version = {
    major: 4,
    minor: 4,
    patch: 3,
};

;// CONCATENATED MODULE: ./node_modules/zod/v4/core/schemas.js







const $ZodType = /*@__PURE__*/ $constructor("$ZodType", (inst, def) => {
    var _a;
    inst ?? (inst = {});
    inst._zod.def = def; // set _def property
    inst._zod.bag = inst._zod.bag || {}; // initialize _bag object
    inst._zod.version = version;
    const checks = [...(inst._zod.def.checks ?? [])];
    // if inst is itself a checks.$ZodCheck, run it as a check
    if (inst._zod.traits.has("$ZodCheck")) {
        checks.unshift(inst);
    }
    for (const ch of checks) {
        for (const fn of ch._zod.onattach) {
            fn(inst);
        }
    }
    if (checks.length === 0) {
        // deferred initializer
        // inst._zod.parse is not yet defined
        (_a = inst._zod).deferred ?? (_a.deferred = []);
        inst._zod.deferred?.push(() => {
            inst._zod.run = inst._zod.parse;
        });
    }
    else {
        const runChecks = (payload, checks, ctx) => {
            let isAborted = aborted(payload);
            let asyncResult;
            for (const ch of checks) {
                if (ch._zod.def.when) {
                    if (explicitlyAborted(payload))
                        continue;
                    const shouldRun = ch._zod.def.when(payload);
                    if (!shouldRun)
                        continue;
                }
                else if (isAborted) {
                    continue;
                }
                const currLen = payload.issues.length;
                const _ = ch._zod.check(payload);
                if (_ instanceof Promise && ctx?.async === false) {
                    throw new $ZodAsyncError();
                }
                if (asyncResult || _ instanceof Promise) {
                    asyncResult = (asyncResult ?? Promise.resolve()).then(async () => {
                        await _;
                        const nextLen = payload.issues.length;
                        if (nextLen === currLen)
                            return;
                        if (!isAborted)
                            isAborted = aborted(payload, currLen);
                    });
                }
                else {
                    const nextLen = payload.issues.length;
                    if (nextLen === currLen)
                        continue;
                    if (!isAborted)
                        isAborted = aborted(payload, currLen);
                }
            }
            if (asyncResult) {
                return asyncResult.then(() => {
                    return payload;
                });
            }
            return payload;
        };
        const handleCanaryResult = (canary, payload, ctx) => {
            // abort if the canary is aborted
            if (aborted(canary)) {
                canary.aborted = true;
                return canary;
            }
            // run checks first, then
            const checkResult = runChecks(payload, checks, ctx);
            if (checkResult instanceof Promise) {
                if (ctx.async === false)
                    throw new $ZodAsyncError();
                return checkResult.then((checkResult) => inst._zod.parse(checkResult, ctx));
            }
            return inst._zod.parse(checkResult, ctx);
        };
        inst._zod.run = (payload, ctx) => {
            if (ctx.skipChecks) {
                return inst._zod.parse(payload, ctx);
            }
            if (ctx.direction === "backward") {
                // run canary
                // initial pass (no checks)
                const canary = inst._zod.parse({ value: payload.value, issues: [] }, { ...ctx, skipChecks: true });
                if (canary instanceof Promise) {
                    return canary.then((canary) => {
                        return handleCanaryResult(canary, payload, ctx);
                    });
                }
                return handleCanaryResult(canary, payload, ctx);
            }
            // forward
            const result = inst._zod.parse(payload, ctx);
            if (result instanceof Promise) {
                if (ctx.async === false)
                    throw new $ZodAsyncError();
                return result.then((result) => runChecks(result, checks, ctx));
            }
            return runChecks(result, checks, ctx);
        };
    }
    // Lazy initialize ~standard to avoid creating objects for every schema
    defineLazy(inst, "~standard", () => ({
        validate: (value) => {
            try {
                const r = safeParse(inst, value);
                return r.success ? { value: r.data } : { issues: r.error?.issues };
            }
            catch (_) {
                return safeParseAsync(inst, value).then((r) => (r.success ? { value: r.data } : { issues: r.error?.issues }));
            }
        },
        vendor: "zod",
        version: 1,
    }));
});

const $ZodString = /*@__PURE__*/ $constructor("$ZodString", (inst, def) => {
    $ZodType.init(inst, def);
    inst._zod.pattern = [...(inst?._zod.bag?.patterns ?? [])].pop() ?? string(inst._zod.bag);
    inst._zod.parse = (payload, _) => {
        if (def.coerce)
            try {
                payload.value = String(payload.value);
            }
            catch (_) { }
        if (typeof payload.value === "string")
            return payload;
        payload.issues.push({
            expected: "string",
            code: "invalid_type",
            input: payload.value,
            inst,
        });
        return payload;
    };
});
const $ZodStringFormat = /*@__PURE__*/ $constructor("$ZodStringFormat", (inst, def) => {
    // check initialization must come first
    $ZodCheckStringFormat.init(inst, def);
    $ZodString.init(inst, def);
});
const $ZodGUID = /*@__PURE__*/ $constructor("$ZodGUID", (inst, def) => {
    def.pattern ?? (def.pattern = guid);
    $ZodStringFormat.init(inst, def);
});
const $ZodUUID = /*@__PURE__*/ $constructor("$ZodUUID", (inst, def) => {
    if (def.version) {
        const versionMap = {
            v1: 1,
            v2: 2,
            v3: 3,
            v4: 4,
            v5: 5,
            v6: 6,
            v7: 7,
            v8: 8,
        };
        const v = versionMap[def.version];
        if (v === undefined)
            throw new Error(`Invalid UUID version: "${def.version}"`);
        def.pattern ?? (def.pattern = uuid(v));
    }
    else
        def.pattern ?? (def.pattern = uuid());
    $ZodStringFormat.init(inst, def);
});
const $ZodEmail = /*@__PURE__*/ $constructor("$ZodEmail", (inst, def) => {
    def.pattern ?? (def.pattern = email);
    $ZodStringFormat.init(inst, def);
});
const $ZodURL = /*@__PURE__*/ $constructor("$ZodURL", (inst, def) => {
    $ZodStringFormat.init(inst, def);
    inst._zod.check = (payload) => {
        try {
            // Trim whitespace from input
            const trimmed = payload.value.trim();
            // When normalize is off, require :// for http/https URLs
            // This prevents strings like "http:example.com" or "https:/path" from being silently accepted
            if (!def.normalize && def.protocol?.source === httpProtocol.source) {
                if (!/^https?:\/\//i.test(trimmed)) {
                    payload.issues.push({
                        code: "invalid_format",
                        format: "url",
                        note: "Invalid URL format",
                        input: payload.value,
                        inst,
                        continue: !def.abort,
                    });
                    return;
                }
            }
            // @ts-ignore
            const url = new URL(trimmed);
            if (def.hostname) {
                def.hostname.lastIndex = 0;
                if (!def.hostname.test(url.hostname)) {
                    payload.issues.push({
                        code: "invalid_format",
                        format: "url",
                        note: "Invalid hostname",
                        pattern: def.hostname.source,
                        input: payload.value,
                        inst,
                        continue: !def.abort,
                    });
                }
            }
            if (def.protocol) {
                def.protocol.lastIndex = 0;
                if (!def.protocol.test(url.protocol.endsWith(":") ? url.protocol.slice(0, -1) : url.protocol)) {
                    payload.issues.push({
                        code: "invalid_format",
                        format: "url",
                        note: "Invalid protocol",
                        pattern: def.protocol.source,
                        input: payload.value,
                        inst,
                        continue: !def.abort,
                    });
                }
            }
            // Set the output value based on normalize flag
            if (def.normalize) {
                // Use normalized URL
                payload.value = url.href;
            }
            else {
                // Preserve the original input (trimmed)
                payload.value = trimmed;
            }
            return;
        }
        catch (_) {
            payload.issues.push({
                code: "invalid_format",
                format: "url",
                input: payload.value,
                inst,
                continue: !def.abort,
            });
        }
    };
});
const $ZodEmoji = /*@__PURE__*/ $constructor("$ZodEmoji", (inst, def) => {
    def.pattern ?? (def.pattern = emoji());
    $ZodStringFormat.init(inst, def);
});
const $ZodNanoID = /*@__PURE__*/ $constructor("$ZodNanoID", (inst, def) => {
    def.pattern ?? (def.pattern = nanoid);
    $ZodStringFormat.init(inst, def);
});
/**
 * @deprecated CUID v1 is deprecated by its authors due to information leakage
 * (timestamps embedded in the id). Use {@link $ZodCUID2} instead.
 * See https://github.com/paralleldrive/cuid.
 */
const $ZodCUID = /*@__PURE__*/ $constructor("$ZodCUID", (inst, def) => {
    def.pattern ?? (def.pattern = cuid);
    $ZodStringFormat.init(inst, def);
});
const $ZodCUID2 = /*@__PURE__*/ $constructor("$ZodCUID2", (inst, def) => {
    def.pattern ?? (def.pattern = cuid2);
    $ZodStringFormat.init(inst, def);
});
const $ZodULID = /*@__PURE__*/ $constructor("$ZodULID", (inst, def) => {
    def.pattern ?? (def.pattern = ulid);
    $ZodStringFormat.init(inst, def);
});
const $ZodXID = /*@__PURE__*/ $constructor("$ZodXID", (inst, def) => {
    def.pattern ?? (def.pattern = xid);
    $ZodStringFormat.init(inst, def);
});
const $ZodKSUID = /*@__PURE__*/ $constructor("$ZodKSUID", (inst, def) => {
    def.pattern ?? (def.pattern = ksuid);
    $ZodStringFormat.init(inst, def);
});
const $ZodISODateTime = /*@__PURE__*/ $constructor("$ZodISODateTime", (inst, def) => {
    def.pattern ?? (def.pattern = datetime(def));
    $ZodStringFormat.init(inst, def);
});
const $ZodISODate = /*@__PURE__*/ $constructor("$ZodISODate", (inst, def) => {
    def.pattern ?? (def.pattern = date);
    $ZodStringFormat.init(inst, def);
});
const $ZodISOTime = /*@__PURE__*/ $constructor("$ZodISOTime", (inst, def) => {
    def.pattern ?? (def.pattern = time(def));
    $ZodStringFormat.init(inst, def);
});
const $ZodISODuration = /*@__PURE__*/ $constructor("$ZodISODuration", (inst, def) => {
    def.pattern ?? (def.pattern = duration);
    $ZodStringFormat.init(inst, def);
});
const $ZodIPv4 = /*@__PURE__*/ $constructor("$ZodIPv4", (inst, def) => {
    def.pattern ?? (def.pattern = ipv4);
    $ZodStringFormat.init(inst, def);
    inst._zod.bag.format = `ipv4`;
});
const $ZodIPv6 = /*@__PURE__*/ $constructor("$ZodIPv6", (inst, def) => {
    def.pattern ?? (def.pattern = ipv6);
    $ZodStringFormat.init(inst, def);
    inst._zod.bag.format = `ipv6`;
    inst._zod.check = (payload) => {
        try {
            // @ts-ignore
            new URL(`http://[${payload.value}]`);
            // return;
        }
        catch {
            payload.issues.push({
                code: "invalid_format",
                format: "ipv6",
                input: payload.value,
                inst,
                continue: !def.abort,
            });
        }
    };
});
const $ZodMAC = /*@__PURE__*/ (/* unused pure expression or super */ null && (core.$constructor("$ZodMAC", (inst, def) => {
    def.pattern ?? (def.pattern = regexes.mac(def.delimiter));
    $ZodStringFormat.init(inst, def);
    inst._zod.bag.format = `mac`;
})));
const $ZodCIDRv4 = /*@__PURE__*/ $constructor("$ZodCIDRv4", (inst, def) => {
    def.pattern ?? (def.pattern = cidrv4);
    $ZodStringFormat.init(inst, def);
});
const $ZodCIDRv6 = /*@__PURE__*/ $constructor("$ZodCIDRv6", (inst, def) => {
    def.pattern ?? (def.pattern = cidrv6); // not used for validation
    $ZodStringFormat.init(inst, def);
    inst._zod.check = (payload) => {
        const parts = payload.value.split("/");
        try {
            if (parts.length !== 2)
                throw new Error();
            const [address, prefix] = parts;
            if (!prefix)
                throw new Error();
            const prefixNum = Number(prefix);
            if (`${prefixNum}` !== prefix)
                throw new Error();
            if (prefixNum < 0 || prefixNum > 128)
                throw new Error();
            // @ts-ignore
            new URL(`http://[${address}]`);
        }
        catch {
            payload.issues.push({
                code: "invalid_format",
                format: "cidrv6",
                input: payload.value,
                inst,
                continue: !def.abort,
            });
        }
    };
});
//////////////////////////////   ZodBase64   //////////////////////////////
function isValidBase64(data) {
    if (data === "")
        return true;
    // atob ignores whitespace, so reject it up front.
    if (/\s/.test(data))
        return false;
    if (data.length % 4 !== 0)
        return false;
    try {
        // @ts-ignore
        atob(data);
        return true;
    }
    catch {
        return false;
    }
}
const $ZodBase64 = /*@__PURE__*/ $constructor("$ZodBase64", (inst, def) => {
    def.pattern ?? (def.pattern = base64);
    $ZodStringFormat.init(inst, def);
    inst._zod.bag.contentEncoding = "base64";
    inst._zod.check = (payload) => {
        if (isValidBase64(payload.value))
            return;
        payload.issues.push({
            code: "invalid_format",
            format: "base64",
            input: payload.value,
            inst,
            continue: !def.abort,
        });
    };
});
//////////////////////////////   ZodBase64   //////////////////////////////
function isValidBase64URL(data) {
    if (!base64url.test(data))
        return false;
    const base64 = data.replace(/[-_]/g, (c) => (c === "-" ? "+" : "/"));
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
    return isValidBase64(padded);
}
const $ZodBase64URL = /*@__PURE__*/ $constructor("$ZodBase64URL", (inst, def) => {
    def.pattern ?? (def.pattern = base64url);
    $ZodStringFormat.init(inst, def);
    inst._zod.bag.contentEncoding = "base64url";
    inst._zod.check = (payload) => {
        if (isValidBase64URL(payload.value))
            return;
        payload.issues.push({
            code: "invalid_format",
            format: "base64url",
            input: payload.value,
            inst,
            continue: !def.abort,
        });
    };
});
const $ZodE164 = /*@__PURE__*/ $constructor("$ZodE164", (inst, def) => {
    def.pattern ?? (def.pattern = e164);
    $ZodStringFormat.init(inst, def);
});
//////////////////////////////   ZodJWT   //////////////////////////////
function isValidJWT(token, algorithm = null) {
    try {
        const tokensParts = token.split(".");
        if (tokensParts.length !== 3)
            return false;
        const [header] = tokensParts;
        if (!header)
            return false;
        // @ts-ignore
        const parsedHeader = JSON.parse(atob(header));
        if ("typ" in parsedHeader && parsedHeader?.typ !== "JWT")
            return false;
        if (!parsedHeader.alg)
            return false;
        if (algorithm && (!("alg" in parsedHeader) || parsedHeader.alg !== algorithm))
            return false;
        return true;
    }
    catch {
        return false;
    }
}
const $ZodJWT = /*@__PURE__*/ $constructor("$ZodJWT", (inst, def) => {
    $ZodStringFormat.init(inst, def);
    inst._zod.check = (payload) => {
        if (isValidJWT(payload.value, def.alg))
            return;
        payload.issues.push({
            code: "invalid_format",
            format: "jwt",
            input: payload.value,
            inst,
            continue: !def.abort,
        });
    };
});
const $ZodCustomStringFormat = /*@__PURE__*/ (/* unused pure expression or super */ null && (core.$constructor("$ZodCustomStringFormat", (inst, def) => {
    $ZodStringFormat.init(inst, def);
    inst._zod.check = (payload) => {
        if (def.fn(payload.value))
            return;
        payload.issues.push({
            code: "invalid_format",
            format: def.format,
            input: payload.value,
            inst,
            continue: !def.abort,
        });
    };
})));
const $ZodNumber = /*@__PURE__*/ $constructor("$ZodNumber", (inst, def) => {
    $ZodType.init(inst, def);
    inst._zod.pattern = inst._zod.bag.pattern ?? number;
    inst._zod.parse = (payload, _ctx) => {
        if (def.coerce)
            try {
                payload.value = Number(payload.value);
            }
            catch (_) { }
        const input = payload.value;
        if (typeof input === "number" && !Number.isNaN(input) && Number.isFinite(input)) {
            return payload;
        }
        const received = typeof input === "number"
            ? Number.isNaN(input)
                ? "NaN"
                : !Number.isFinite(input)
                    ? "Infinity"
                    : undefined
            : undefined;
        payload.issues.push({
            expected: "number",
            code: "invalid_type",
            input,
            inst,
            ...(received ? { received } : {}),
        });
        return payload;
    };
});
const $ZodNumberFormat = /*@__PURE__*/ $constructor("$ZodNumberFormat", (inst, def) => {
    $ZodCheckNumberFormat.init(inst, def);
    $ZodNumber.init(inst, def); // no format checks
});
const $ZodBoolean = /*@__PURE__*/ $constructor("$ZodBoolean", (inst, def) => {
    $ZodType.init(inst, def);
    inst._zod.pattern = regexes_boolean;
    inst._zod.parse = (payload, _ctx) => {
        if (def.coerce)
            try {
                payload.value = Boolean(payload.value);
            }
            catch (_) { }
        const input = payload.value;
        if (typeof input === "boolean")
            return payload;
        payload.issues.push({
            expected: "boolean",
            code: "invalid_type",
            input,
            inst,
        });
        return payload;
    };
});
const $ZodBigInt = /*@__PURE__*/ (/* unused pure expression or super */ null && (core.$constructor("$ZodBigInt", (inst, def) => {
    $ZodType.init(inst, def);
    inst._zod.pattern = regexes.bigint;
    inst._zod.parse = (payload, _ctx) => {
        if (def.coerce)
            try {
                payload.value = BigInt(payload.value);
            }
            catch (_) { }
        if (typeof payload.value === "bigint")
            return payload;
        payload.issues.push({
            expected: "bigint",
            code: "invalid_type",
            input: payload.value,
            inst,
        });
        return payload;
    };
})));
const $ZodBigIntFormat = /*@__PURE__*/ (/* unused pure expression or super */ null && (core.$constructor("$ZodBigIntFormat", (inst, def) => {
    checks.$ZodCheckBigIntFormat.init(inst, def);
    $ZodBigInt.init(inst, def); // no format checks
})));
const $ZodSymbol = /*@__PURE__*/ (/* unused pure expression or super */ null && (core.$constructor("$ZodSymbol", (inst, def) => {
    $ZodType.init(inst, def);
    inst._zod.parse = (payload, _ctx) => {
        const input = payload.value;
        if (typeof input === "symbol")
            return payload;
        payload.issues.push({
            expected: "symbol",
            code: "invalid_type",
            input,
            inst,
        });
        return payload;
    };
})));
const $ZodUndefined = /*@__PURE__*/ (/* unused pure expression or super */ null && (core.$constructor("$ZodUndefined", (inst, def) => {
    $ZodType.init(inst, def);
    inst._zod.pattern = regexes.undefined;
    inst._zod.values = new Set([undefined]);
    inst._zod.parse = (payload, _ctx) => {
        const input = payload.value;
        if (typeof input === "undefined")
            return payload;
        payload.issues.push({
            expected: "undefined",
            code: "invalid_type",
            input,
            inst,
        });
        return payload;
    };
})));
const $ZodNull = /*@__PURE__*/ (/* unused pure expression or super */ null && (core.$constructor("$ZodNull", (inst, def) => {
    $ZodType.init(inst, def);
    inst._zod.pattern = regexes.null;
    inst._zod.values = new Set([null]);
    inst._zod.parse = (payload, _ctx) => {
        const input = payload.value;
        if (input === null)
            return payload;
        payload.issues.push({
            expected: "null",
            code: "invalid_type",
            input,
            inst,
        });
        return payload;
    };
})));
const $ZodAny = /*@__PURE__*/ (/* unused pure expression or super */ null && (core.$constructor("$ZodAny", (inst, def) => {
    $ZodType.init(inst, def);
    inst._zod.parse = (payload) => payload;
})));
const $ZodUnknown = /*@__PURE__*/ $constructor("$ZodUnknown", (inst, def) => {
    $ZodType.init(inst, def);
    inst._zod.parse = (payload) => payload;
});
const $ZodNever = /*@__PURE__*/ $constructor("$ZodNever", (inst, def) => {
    $ZodType.init(inst, def);
    inst._zod.parse = (payload, _ctx) => {
        payload.issues.push({
            expected: "never",
            code: "invalid_type",
            input: payload.value,
            inst,
        });
        return payload;
    };
});
const $ZodVoid = /*@__PURE__*/ (/* unused pure expression or super */ null && (core.$constructor("$ZodVoid", (inst, def) => {
    $ZodType.init(inst, def);
    inst._zod.parse = (payload, _ctx) => {
        const input = payload.value;
        if (typeof input === "undefined")
            return payload;
        payload.issues.push({
            expected: "void",
            code: "invalid_type",
            input,
            inst,
        });
        return payload;
    };
})));
const $ZodDate = /*@__PURE__*/ (/* unused pure expression or super */ null && (core.$constructor("$ZodDate", (inst, def) => {
    $ZodType.init(inst, def);
    inst._zod.parse = (payload, _ctx) => {
        if (def.coerce) {
            try {
                payload.value = new Date(payload.value);
            }
            catch (_err) { }
        }
        const input = payload.value;
        const isDate = input instanceof Date;
        const isValidDate = isDate && !Number.isNaN(input.getTime());
        if (isValidDate)
            return payload;
        payload.issues.push({
            expected: "date",
            code: "invalid_type",
            input,
            ...(isDate ? { received: "Invalid Date" } : {}),
            inst,
        });
        return payload;
    };
})));
function handleArrayResult(result, final, index) {
    if (result.issues.length) {
        final.issues.push(...prefixIssues(index, result.issues));
    }
    final.value[index] = result.value;
}
const $ZodArray = /*@__PURE__*/ $constructor("$ZodArray", (inst, def) => {
    $ZodType.init(inst, def);
    inst._zod.parse = (payload, ctx) => {
        const input = payload.value;
        if (!Array.isArray(input)) {
            payload.issues.push({
                expected: "array",
                code: "invalid_type",
                input,
                inst,
            });
            return payload;
        }
        payload.value = Array(input.length);
        const proms = [];
        for (let i = 0; i < input.length; i++) {
            const item = input[i];
            const result = def.element._zod.run({
                value: item,
                issues: [],
            }, ctx);
            if (result instanceof Promise) {
                proms.push(result.then((result) => handleArrayResult(result, payload, i)));
            }
            else {
                handleArrayResult(result, payload, i);
            }
        }
        if (proms.length) {
            return Promise.all(proms).then(() => payload);
        }
        return payload; //handleArrayResultsAsync(parseResults, final);
    };
});
function handlePropertyResult(result, final, key, input, isOptionalIn, isOptionalOut) {
    const isPresent = key in input;
    if (result.issues.length) {
        // For optional-in/out schemas, ignore errors on absent keys.
        if (isOptionalIn && isOptionalOut && !isPresent) {
            return;
        }
        final.issues.push(...prefixIssues(key, result.issues));
    }
    if (!isPresent && !isOptionalIn) {
        if (!result.issues.length) {
            final.issues.push({
                code: "invalid_type",
                expected: "nonoptional",
                input: undefined,
                path: [key],
            });
        }
        return;
    }
    if (result.value === undefined) {
        if (isPresent) {
            final.value[key] = undefined;
        }
    }
    else {
        final.value[key] = result.value;
    }
}
function normalizeDef(def) {
    const keys = Object.keys(def.shape);
    for (const k of keys) {
        if (!def.shape?.[k]?._zod?.traits?.has("$ZodType")) {
            throw new Error(`Invalid element at key "${k}": expected a Zod schema`);
        }
    }
    const okeys = optionalKeys(def.shape);
    return {
        ...def,
        keys,
        keySet: new Set(keys),
        numKeys: keys.length,
        optionalKeys: new Set(okeys),
    };
}
function handleCatchall(proms, input, payload, ctx, def, inst) {
    const unrecognized = [];
    const keySet = def.keySet;
    const _catchall = def.catchall._zod;
    const t = _catchall.def.type;
    const isOptionalIn = _catchall.optin === "optional";
    const isOptionalOut = _catchall.optout === "optional";
    for (const key in input) {
        // skip __proto__ so it can't replace the result prototype via the
        // assignment setter on the plain {} we build into
        if (key === "__proto__")
            continue;
        if (keySet.has(key))
            continue;
        if (t === "never") {
            unrecognized.push(key);
            continue;
        }
        const r = _catchall.run({ value: input[key], issues: [] }, ctx);
        if (r instanceof Promise) {
            proms.push(r.then((r) => handlePropertyResult(r, payload, key, input, isOptionalIn, isOptionalOut)));
        }
        else {
            handlePropertyResult(r, payload, key, input, isOptionalIn, isOptionalOut);
        }
    }
    if (unrecognized.length) {
        payload.issues.push({
            code: "unrecognized_keys",
            keys: unrecognized,
            input,
            inst,
        });
    }
    if (!proms.length)
        return payload;
    return Promise.all(proms).then(() => {
        return payload;
    });
}
const $ZodObject = /*@__PURE__*/ $constructor("$ZodObject", (inst, def) => {
    // requires cast because technically $ZodObject doesn't extend
    $ZodType.init(inst, def);
    // const sh = def.shape;
    const desc = Object.getOwnPropertyDescriptor(def, "shape");
    if (!desc?.get) {
        const sh = def.shape;
        Object.defineProperty(def, "shape", {
            get: () => {
                const newSh = { ...sh };
                Object.defineProperty(def, "shape", {
                    value: newSh,
                });
                return newSh;
            },
        });
    }
    const _normalized = cached(() => normalizeDef(def));
    defineLazy(inst._zod, "propValues", () => {
        const shape = def.shape;
        const propValues = {};
        for (const key in shape) {
            const field = shape[key]._zod;
            if (field.values) {
                propValues[key] ?? (propValues[key] = new Set());
                for (const v of field.values)
                    propValues[key].add(v);
            }
        }
        return propValues;
    });
    const isObject = util_isObject;
    const catchall = def.catchall;
    let value;
    inst._zod.parse = (payload, ctx) => {
        value ?? (value = _normalized.value);
        const input = payload.value;
        if (!isObject(input)) {
            payload.issues.push({
                expected: "object",
                code: "invalid_type",
                input,
                inst,
            });
            return payload;
        }
        payload.value = {};
        const proms = [];
        const shape = value.shape;
        for (const key of value.keys) {
            const el = shape[key];
            const isOptionalIn = el._zod.optin === "optional";
            const isOptionalOut = el._zod.optout === "optional";
            const r = el._zod.run({ value: input[key], issues: [] }, ctx);
            if (r instanceof Promise) {
                proms.push(r.then((r) => handlePropertyResult(r, payload, key, input, isOptionalIn, isOptionalOut)));
            }
            else {
                handlePropertyResult(r, payload, key, input, isOptionalIn, isOptionalOut);
            }
        }
        if (!catchall) {
            return proms.length ? Promise.all(proms).then(() => payload) : payload;
        }
        return handleCatchall(proms, input, payload, ctx, _normalized.value, inst);
    };
});
const $ZodObjectJIT = /*@__PURE__*/ $constructor("$ZodObjectJIT", (inst, def) => {
    // requires cast because technically $ZodObject doesn't extend
    $ZodObject.init(inst, def);
    const superParse = inst._zod.parse;
    const _normalized = cached(() => normalizeDef(def));
    const generateFastpass = (shape) => {
        const doc = new Doc(["shape", "payload", "ctx"]);
        const normalized = _normalized.value;
        const parseStr = (key) => {
            const k = esc(key);
            return `shape[${k}]._zod.run({ value: input[${k}], issues: [] }, ctx)`;
        };
        doc.write(`const input = payload.value;`);
        const ids = Object.create(null);
        let counter = 0;
        for (const key of normalized.keys) {
            ids[key] = `key_${counter++}`;
        }
        // A: preserve key order {
        doc.write(`const newResult = {};`);
        for (const key of normalized.keys) {
            const id = ids[key];
            const k = esc(key);
            const schema = shape[key];
            const isOptionalIn = schema?._zod?.optin === "optional";
            const isOptionalOut = schema?._zod?.optout === "optional";
            doc.write(`const ${id} = ${parseStr(key)};`);
            if (isOptionalIn && isOptionalOut) {
                // For optional-in/out schemas, ignore errors on absent keys
                doc.write(`
        if (${id}.issues.length) {
          if (${k} in input) {
            payload.issues = payload.issues.concat(${id}.issues.map(iss => ({
              ...iss,
              path: iss.path ? [${k}, ...iss.path] : [${k}]
            })));
          }
        }
        
        if (${id}.value === undefined) {
          if (${k} in input) {
            newResult[${k}] = undefined;
          }
        } else {
          newResult[${k}] = ${id}.value;
        }
        
      `);
            }
            else if (!isOptionalIn) {
                doc.write(`
        const ${id}_present = ${k} in input;
        if (${id}.issues.length) {
          payload.issues = payload.issues.concat(${id}.issues.map(iss => ({
            ...iss,
            path: iss.path ? [${k}, ...iss.path] : [${k}]
          })));
        }
        if (!${id}_present && !${id}.issues.length) {
          payload.issues.push({
            code: "invalid_type",
            expected: "nonoptional",
            input: undefined,
            path: [${k}]
          });
        }

        if (${id}_present) {
          if (${id}.value === undefined) {
            newResult[${k}] = undefined;
          } else {
            newResult[${k}] = ${id}.value;
          }
        }

      `);
            }
            else {
                doc.write(`
        if (${id}.issues.length) {
          payload.issues = payload.issues.concat(${id}.issues.map(iss => ({
            ...iss,
            path: iss.path ? [${k}, ...iss.path] : [${k}]
          })));
        }
        
        if (${id}.value === undefined) {
          if (${k} in input) {
            newResult[${k}] = undefined;
          }
        } else {
          newResult[${k}] = ${id}.value;
        }
        
      `);
            }
        }
        doc.write(`payload.value = newResult;`);
        doc.write(`return payload;`);
        const fn = doc.compile();
        return (payload, ctx) => fn(shape, payload, ctx);
    };
    let fastpass;
    const isObject = util_isObject;
    const jit = !globalConfig.jitless;
    const allowsEval = util_allowsEval;
    const fastEnabled = jit && allowsEval.value; // && !def.catchall;
    const catchall = def.catchall;
    let value;
    inst._zod.parse = (payload, ctx) => {
        value ?? (value = _normalized.value);
        const input = payload.value;
        if (!isObject(input)) {
            payload.issues.push({
                expected: "object",
                code: "invalid_type",
                input,
                inst,
            });
            return payload;
        }
        if (jit && fastEnabled && ctx?.async === false && ctx.jitless !== true) {
            // always synchronous
            if (!fastpass)
                fastpass = generateFastpass(def.shape);
            payload = fastpass(payload, ctx);
            if (!catchall)
                return payload;
            return handleCatchall([], input, payload, ctx, value, inst);
        }
        return superParse(payload, ctx);
    };
});
function handleUnionResults(results, final, inst, ctx) {
    for (const result of results) {
        if (result.issues.length === 0) {
            final.value = result.value;
            return final;
        }
    }
    const nonaborted = results.filter((r) => !aborted(r));
    if (nonaborted.length === 1) {
        final.value = nonaborted[0].value;
        return nonaborted[0];
    }
    final.issues.push({
        code: "invalid_union",
        input: final.value,
        inst,
        errors: results.map((result) => result.issues.map((iss) => finalizeIssue(iss, ctx, config()))),
    });
    return final;
}
const $ZodUnion = /*@__PURE__*/ $constructor("$ZodUnion", (inst, def) => {
    $ZodType.init(inst, def);
    defineLazy(inst._zod, "optin", () => def.options.some((o) => o._zod.optin === "optional") ? "optional" : undefined);
    defineLazy(inst._zod, "optout", () => def.options.some((o) => o._zod.optout === "optional") ? "optional" : undefined);
    defineLazy(inst._zod, "values", () => {
        if (def.options.every((o) => o._zod.values)) {
            return new Set(def.options.flatMap((option) => Array.from(option._zod.values)));
        }
        return undefined;
    });
    defineLazy(inst._zod, "pattern", () => {
        if (def.options.every((o) => o._zod.pattern)) {
            const patterns = def.options.map((o) => o._zod.pattern);
            return new RegExp(`^(${patterns.map((p) => cleanRegex(p.source)).join("|")})$`);
        }
        return undefined;
    });
    const first = def.options.length === 1 ? def.options[0]._zod.run : null;
    inst._zod.parse = (payload, ctx) => {
        if (first) {
            return first(payload, ctx);
        }
        let async = false;
        const results = [];
        for (const option of def.options) {
            const result = option._zod.run({
                value: payload.value,
                issues: [],
            }, ctx);
            if (result instanceof Promise) {
                results.push(result);
                async = true;
            }
            else {
                if (result.issues.length === 0)
                    return result;
                results.push(result);
            }
        }
        if (!async)
            return handleUnionResults(results, payload, inst, ctx);
        return Promise.all(results).then((results) => {
            return handleUnionResults(results, payload, inst, ctx);
        });
    };
});
function handleExclusiveUnionResults(results, final, inst, ctx) {
    const successes = results.filter((r) => r.issues.length === 0);
    if (successes.length === 1) {
        final.value = successes[0].value;
        return final;
    }
    if (successes.length === 0) {
        // No matches - same as regular union
        final.issues.push({
            code: "invalid_union",
            input: final.value,
            inst,
            errors: results.map((result) => result.issues.map((iss) => util.finalizeIssue(iss, ctx, core.config()))),
        });
    }
    else {
        // Multiple matches - exclusive union failure
        final.issues.push({
            code: "invalid_union",
            input: final.value,
            inst,
            errors: [],
            inclusive: false,
        });
    }
    return final;
}
const $ZodXor = /*@__PURE__*/ (/* unused pure expression or super */ null && (core.$constructor("$ZodXor", (inst, def) => {
    $ZodUnion.init(inst, def);
    def.inclusive = false;
    const first = def.options.length === 1 ? def.options[0]._zod.run : null;
    inst._zod.parse = (payload, ctx) => {
        if (first) {
            return first(payload, ctx);
        }
        let async = false;
        const results = [];
        for (const option of def.options) {
            const result = option._zod.run({
                value: payload.value,
                issues: [],
            }, ctx);
            if (result instanceof Promise) {
                results.push(result);
                async = true;
            }
            else {
                results.push(result);
            }
        }
        if (!async)
            return handleExclusiveUnionResults(results, payload, inst, ctx);
        return Promise.all(results).then((results) => {
            return handleExclusiveUnionResults(results, payload, inst, ctx);
        });
    };
})));
const $ZodDiscriminatedUnion = 
/*@__PURE__*/
(/* unused pure expression or super */ null && (core.$constructor("$ZodDiscriminatedUnion", (inst, def) => {
    def.inclusive = false;
    $ZodUnion.init(inst, def);
    const _super = inst._zod.parse;
    util.defineLazy(inst._zod, "propValues", () => {
        const propValues = {};
        for (const option of def.options) {
            const pv = option._zod.propValues;
            if (!pv || Object.keys(pv).length === 0)
                throw new Error(`Invalid discriminated union option at index "${def.options.indexOf(option)}"`);
            for (const [k, v] of Object.entries(pv)) {
                if (!propValues[k])
                    propValues[k] = new Set();
                for (const val of v) {
                    propValues[k].add(val);
                }
            }
        }
        return propValues;
    });
    const disc = util.cached(() => {
        const opts = def.options;
        const map = new Map();
        for (const o of opts) {
            const values = o._zod.propValues?.[def.discriminator];
            if (!values || values.size === 0)
                throw new Error(`Invalid discriminated union option at index "${def.options.indexOf(o)}"`);
            for (const v of values) {
                if (map.has(v)) {
                    throw new Error(`Duplicate discriminator value "${String(v)}"`);
                }
                map.set(v, o);
            }
        }
        return map;
    });
    inst._zod.parse = (payload, ctx) => {
        const input = payload.value;
        if (!util.isObject(input)) {
            payload.issues.push({
                code: "invalid_type",
                expected: "object",
                input,
                inst,
            });
            return payload;
        }
        const opt = disc.value.get(input?.[def.discriminator]);
        if (opt) {
            return opt._zod.run(payload, ctx);
        }
        // Fall back to union matching when the fast discriminator path fails:
        // - explicitly enabled via unionFallback, or
        // - during backward direction (encode), since codec-based discriminators
        //   have different values in forward vs backward directions
        if (def.unionFallback || ctx.direction === "backward") {
            return _super(payload, ctx);
        }
        // no matching discriminator
        payload.issues.push({
            code: "invalid_union",
            errors: [],
            note: "No matching discriminator",
            discriminator: def.discriminator,
            options: Array.from(disc.value.keys()),
            input,
            path: [def.discriminator],
            inst,
        });
        return payload;
    };
})));
const $ZodIntersection = /*@__PURE__*/ $constructor("$ZodIntersection", (inst, def) => {
    $ZodType.init(inst, def);
    inst._zod.parse = (payload, ctx) => {
        const input = payload.value;
        const left = def.left._zod.run({ value: input, issues: [] }, ctx);
        const right = def.right._zod.run({ value: input, issues: [] }, ctx);
        const async = left instanceof Promise || right instanceof Promise;
        if (async) {
            return Promise.all([left, right]).then(([left, right]) => {
                return handleIntersectionResults(payload, left, right);
            });
        }
        return handleIntersectionResults(payload, left, right);
    };
});
function mergeValues(a, b) {
    // const aType = parse.t(a);
    // const bType = parse.t(b);
    if (a === b) {
        return { valid: true, data: a };
    }
    if (a instanceof Date && b instanceof Date && +a === +b) {
        return { valid: true, data: a };
    }
    if (isPlainObject(a) && isPlainObject(b)) {
        const bKeys = Object.keys(b);
        const sharedKeys = Object.keys(a).filter((key) => bKeys.indexOf(key) !== -1);
        const newObj = { ...a, ...b };
        for (const key of sharedKeys) {
            const sharedValue = mergeValues(a[key], b[key]);
            if (!sharedValue.valid) {
                return {
                    valid: false,
                    mergeErrorPath: [key, ...sharedValue.mergeErrorPath],
                };
            }
            newObj[key] = sharedValue.data;
        }
        return { valid: true, data: newObj };
    }
    if (Array.isArray(a) && Array.isArray(b)) {
        if (a.length !== b.length) {
            return { valid: false, mergeErrorPath: [] };
        }
        const newArray = [];
        for (let index = 0; index < a.length; index++) {
            const itemA = a[index];
            const itemB = b[index];
            const sharedValue = mergeValues(itemA, itemB);
            if (!sharedValue.valid) {
                return {
                    valid: false,
                    mergeErrorPath: [index, ...sharedValue.mergeErrorPath],
                };
            }
            newArray.push(sharedValue.data);
        }
        return { valid: true, data: newArray };
    }
    return { valid: false, mergeErrorPath: [] };
}
function handleIntersectionResults(result, left, right) {
    // Track which side(s) report each key as unrecognized
    const unrecKeys = new Map();
    let unrecIssue;
    for (const iss of left.issues) {
        if (iss.code === "unrecognized_keys") {
            unrecIssue ?? (unrecIssue = iss);
            for (const k of iss.keys) {
                if (!unrecKeys.has(k))
                    unrecKeys.set(k, {});
                unrecKeys.get(k).l = true;
            }
        }
        else {
            result.issues.push(iss);
        }
    }
    for (const iss of right.issues) {
        if (iss.code === "unrecognized_keys") {
            for (const k of iss.keys) {
                if (!unrecKeys.has(k))
                    unrecKeys.set(k, {});
                unrecKeys.get(k).r = true;
            }
        }
        else {
            result.issues.push(iss);
        }
    }
    // Report only keys unrecognized by BOTH sides
    const bothKeys = [...unrecKeys].filter(([, f]) => f.l && f.r).map(([k]) => k);
    if (bothKeys.length && unrecIssue) {
        result.issues.push({ ...unrecIssue, keys: bothKeys });
    }
    if (aborted(result))
        return result;
    const merged = mergeValues(left.value, right.value);
    if (!merged.valid) {
        throw new Error(`Unmergable intersection. Error path: ` + `${JSON.stringify(merged.mergeErrorPath)}`);
    }
    result.value = merged.data;
    return result;
}
const $ZodTuple = /*@__PURE__*/ (/* unused pure expression or super */ null && (core.$constructor("$ZodTuple", (inst, def) => {
    $ZodType.init(inst, def);
    const items = def.items;
    inst._zod.parse = (payload, ctx) => {
        const input = payload.value;
        if (!Array.isArray(input)) {
            payload.issues.push({
                input,
                inst,
                expected: "tuple",
                code: "invalid_type",
            });
            return payload;
        }
        payload.value = [];
        const proms = [];
        const optinStart = getTupleOptStart(items, "optin");
        const optoutStart = getTupleOptStart(items, "optout");
        if (!def.rest) {
            if (input.length < optinStart) {
                payload.issues.push({
                    code: "too_small",
                    minimum: optinStart,
                    inclusive: true,
                    input,
                    inst,
                    origin: "array",
                });
                return payload;
            }
            if (input.length > items.length) {
                payload.issues.push({
                    code: "too_big",
                    maximum: items.length,
                    inclusive: true,
                    input,
                    inst,
                    origin: "array",
                });
            }
        }
        // Run every item in parallel, collecting results into an indexed
        // array. The post-processing in `handleTupleResults` walks them in
        // order so it can decide whether an absent optional-output error can
        // truncate the tail or must be reported to preserve required output.
        const itemResults = new Array(items.length);
        for (let i = 0; i < items.length; i++) {
            const r = items[i]._zod.run({ value: input[i], issues: [] }, ctx);
            if (r instanceof Promise) {
                proms.push(r.then((rr) => {
                    itemResults[i] = rr;
                }));
            }
            else {
                itemResults[i] = r;
            }
        }
        if (def.rest) {
            let i = items.length - 1;
            const rest = input.slice(items.length);
            for (const el of rest) {
                i++;
                const result = def.rest._zod.run({ value: el, issues: [] }, ctx);
                if (result instanceof Promise) {
                    proms.push(result.then((r) => handleTupleResult(r, payload, i)));
                }
                else {
                    handleTupleResult(result, payload, i);
                }
            }
        }
        if (proms.length) {
            return Promise.all(proms).then(() => handleTupleResults(itemResults, payload, items, input, optoutStart));
        }
        return handleTupleResults(itemResults, payload, items, input, optoutStart);
    };
})));
function getTupleOptStart(items, key) {
    for (let i = items.length - 1; i >= 0; i--) {
        if (items[i]._zod[key] !== "optional")
            return i + 1;
    }
    return 0;
}
function handleTupleResult(result, final, index) {
    if (result.issues.length) {
        final.issues.push(...util.prefixIssues(index, result.issues));
    }
    final.value[index] = result.value;
}
function handleTupleResults(itemResults, final, items, input, optoutStart) {
    // Walk results in order. Mirror $ZodObject's swallow-on-absent-optional
    // rule, but only after `optoutStart`: the first index where the output
    // tuple tail can be absent.
    for (let i = 0; i < items.length; i++) {
        const r = itemResults[i];
        const isPresent = i < input.length;
        if (r.issues.length) {
            if (!isPresent && i >= optoutStart) {
                final.value.length = i;
                break;
            }
            final.issues.push(...util.prefixIssues(i, r.issues));
        }
        final.value[i] = r.value;
    }
    // Drop trailing slots that produced `undefined` for absent input
    // (the array analog of an absent optional key on an object). The
    // `i >= input.length` floor is critical: an explicit `undefined`
    // *inside* the input must be preserved even when the schema is
    // optional-out (e.g. `z.string().or(z.undefined())` accepting an
    // explicit undefined value).
    for (let i = final.value.length - 1; i >= input.length; i--) {
        if (items[i]._zod.optout === "optional" && final.value[i] === undefined) {
            final.value.length = i;
        }
        else {
            break;
        }
    }
    return final;
}
const $ZodRecord = /*@__PURE__*/ (/* unused pure expression or super */ null && (core.$constructor("$ZodRecord", (inst, def) => {
    $ZodType.init(inst, def);
    inst._zod.parse = (payload, ctx) => {
        const input = payload.value;
        if (!util.isPlainObject(input)) {
            payload.issues.push({
                expected: "record",
                code: "invalid_type",
                input,
                inst,
            });
            return payload;
        }
        const proms = [];
        const values = def.keyType._zod.values;
        if (values) {
            payload.value = {};
            const recordKeys = new Set();
            for (const key of values) {
                if (typeof key === "string" || typeof key === "number" || typeof key === "symbol") {
                    recordKeys.add(typeof key === "number" ? key.toString() : key);
                    const keyResult = def.keyType._zod.run({ value: key, issues: [] }, ctx);
                    if (keyResult instanceof Promise) {
                        throw new Error("Async schemas not supported in object keys currently");
                    }
                    if (keyResult.issues.length) {
                        payload.issues.push({
                            code: "invalid_key",
                            origin: "record",
                            issues: keyResult.issues.map((iss) => util.finalizeIssue(iss, ctx, core.config())),
                            input: key,
                            path: [key],
                            inst,
                        });
                        continue;
                    }
                    const outKey = keyResult.value;
                    const result = def.valueType._zod.run({ value: input[key], issues: [] }, ctx);
                    if (result instanceof Promise) {
                        proms.push(result.then((result) => {
                            if (result.issues.length) {
                                payload.issues.push(...util.prefixIssues(key, result.issues));
                            }
                            payload.value[outKey] = result.value;
                        }));
                    }
                    else {
                        if (result.issues.length) {
                            payload.issues.push(...util.prefixIssues(key, result.issues));
                        }
                        payload.value[outKey] = result.value;
                    }
                }
            }
            let unrecognized;
            for (const key in input) {
                if (!recordKeys.has(key)) {
                    unrecognized = unrecognized ?? [];
                    unrecognized.push(key);
                }
            }
            if (unrecognized && unrecognized.length > 0) {
                payload.issues.push({
                    code: "unrecognized_keys",
                    input,
                    inst,
                    keys: unrecognized,
                });
            }
        }
        else {
            payload.value = {};
            // Reflect.ownKeys for Symbol-key support; filter non-enumerable to match z.object()
            for (const key of Reflect.ownKeys(input)) {
                if (key === "__proto__")
                    continue;
                if (!Object.prototype.propertyIsEnumerable.call(input, key))
                    continue;
                let keyResult = def.keyType._zod.run({ value: key, issues: [] }, ctx);
                if (keyResult instanceof Promise) {
                    throw new Error("Async schemas not supported in object keys currently");
                }
                // Numeric string fallback: if key is a numeric string and failed, retry with Number(key)
                // This handles z.number(), z.literal([1, 2, 3]), and unions containing numeric literals
                const checkNumericKey = typeof key === "string" && regexes.number.test(key) && keyResult.issues.length;
                if (checkNumericKey) {
                    const retryResult = def.keyType._zod.run({ value: Number(key), issues: [] }, ctx);
                    if (retryResult instanceof Promise) {
                        throw new Error("Async schemas not supported in object keys currently");
                    }
                    if (retryResult.issues.length === 0) {
                        keyResult = retryResult;
                    }
                }
                if (keyResult.issues.length) {
                    if (def.mode === "loose") {
                        // Pass through unchanged
                        payload.value[key] = input[key];
                    }
                    else {
                        // Default "strict" behavior: error on invalid key
                        payload.issues.push({
                            code: "invalid_key",
                            origin: "record",
                            issues: keyResult.issues.map((iss) => util.finalizeIssue(iss, ctx, core.config())),
                            input: key,
                            path: [key],
                            inst,
                        });
                    }
                    continue;
                }
                const result = def.valueType._zod.run({ value: input[key], issues: [] }, ctx);
                if (result instanceof Promise) {
                    proms.push(result.then((result) => {
                        if (result.issues.length) {
                            payload.issues.push(...util.prefixIssues(key, result.issues));
                        }
                        payload.value[keyResult.value] = result.value;
                    }));
                }
                else {
                    if (result.issues.length) {
                        payload.issues.push(...util.prefixIssues(key, result.issues));
                    }
                    payload.value[keyResult.value] = result.value;
                }
            }
        }
        if (proms.length) {
            return Promise.all(proms).then(() => payload);
        }
        return payload;
    };
})));
const $ZodMap = /*@__PURE__*/ (/* unused pure expression or super */ null && (core.$constructor("$ZodMap", (inst, def) => {
    $ZodType.init(inst, def);
    inst._zod.parse = (payload, ctx) => {
        const input = payload.value;
        if (!(input instanceof Map)) {
            payload.issues.push({
                expected: "map",
                code: "invalid_type",
                input,
                inst,
            });
            return payload;
        }
        const proms = [];
        payload.value = new Map();
        for (const [key, value] of input) {
            const keyResult = def.keyType._zod.run({ value: key, issues: [] }, ctx);
            const valueResult = def.valueType._zod.run({ value: value, issues: [] }, ctx);
            if (keyResult instanceof Promise || valueResult instanceof Promise) {
                proms.push(Promise.all([keyResult, valueResult]).then(([keyResult, valueResult]) => {
                    handleMapResult(keyResult, valueResult, payload, key, input, inst, ctx);
                }));
            }
            else {
                handleMapResult(keyResult, valueResult, payload, key, input, inst, ctx);
            }
        }
        if (proms.length)
            return Promise.all(proms).then(() => payload);
        return payload;
    };
})));
function handleMapResult(keyResult, valueResult, final, key, input, inst, ctx) {
    if (keyResult.issues.length) {
        if (util.propertyKeyTypes.has(typeof key)) {
            final.issues.push(...util.prefixIssues(key, keyResult.issues));
        }
        else {
            final.issues.push({
                code: "invalid_key",
                origin: "map",
                input,
                inst,
                issues: keyResult.issues.map((iss) => util.finalizeIssue(iss, ctx, core.config())),
            });
        }
    }
    if (valueResult.issues.length) {
        if (util.propertyKeyTypes.has(typeof key)) {
            final.issues.push(...util.prefixIssues(key, valueResult.issues));
        }
        else {
            final.issues.push({
                origin: "map",
                code: "invalid_element",
                input,
                inst,
                key: key,
                issues: valueResult.issues.map((iss) => util.finalizeIssue(iss, ctx, core.config())),
            });
        }
    }
    final.value.set(keyResult.value, valueResult.value);
}
const $ZodSet = /*@__PURE__*/ (/* unused pure expression or super */ null && (core.$constructor("$ZodSet", (inst, def) => {
    $ZodType.init(inst, def);
    inst._zod.parse = (payload, ctx) => {
        const input = payload.value;
        if (!(input instanceof Set)) {
            payload.issues.push({
                input,
                inst,
                expected: "set",
                code: "invalid_type",
            });
            return payload;
        }
        const proms = [];
        payload.value = new Set();
        for (const item of input) {
            const result = def.valueType._zod.run({ value: item, issues: [] }, ctx);
            if (result instanceof Promise) {
                proms.push(result.then((result) => handleSetResult(result, payload)));
            }
            else
                handleSetResult(result, payload);
        }
        if (proms.length)
            return Promise.all(proms).then(() => payload);
        return payload;
    };
})));
function handleSetResult(result, final) {
    if (result.issues.length) {
        final.issues.push(...result.issues);
    }
    final.value.add(result.value);
}
const $ZodEnum = /*@__PURE__*/ $constructor("$ZodEnum", (inst, def) => {
    $ZodType.init(inst, def);
    const values = getEnumValues(def.entries);
    const valuesSet = new Set(values);
    inst._zod.values = valuesSet;
    inst._zod.pattern = new RegExp(`^(${values
        .filter((k) => propertyKeyTypes.has(typeof k))
        .map((o) => (typeof o === "string" ? escapeRegex(o) : o.toString()))
        .join("|")})$`);
    inst._zod.parse = (payload, _ctx) => {
        const input = payload.value;
        if (valuesSet.has(input)) {
            return payload;
        }
        payload.issues.push({
            code: "invalid_value",
            values,
            input,
            inst,
        });
        return payload;
    };
});
const $ZodLiteral = /*@__PURE__*/ $constructor("$ZodLiteral", (inst, def) => {
    $ZodType.init(inst, def);
    if (def.values.length === 0) {
        throw new Error("Cannot create literal schema with no valid values");
    }
    const values = new Set(def.values);
    inst._zod.values = values;
    inst._zod.pattern = new RegExp(`^(${def.values
        .map((o) => (typeof o === "string" ? escapeRegex(o) : o ? escapeRegex(o.toString()) : String(o)))
        .join("|")})$`);
    inst._zod.parse = (payload, _ctx) => {
        const input = payload.value;
        if (values.has(input)) {
            return payload;
        }
        payload.issues.push({
            code: "invalid_value",
            values: def.values,
            input,
            inst,
        });
        return payload;
    };
});
const $ZodFile = /*@__PURE__*/ (/* unused pure expression or super */ null && (core.$constructor("$ZodFile", (inst, def) => {
    $ZodType.init(inst, def);
    inst._zod.parse = (payload, _ctx) => {
        const input = payload.value;
        // @ts-ignore
        if (input instanceof File)
            return payload;
        payload.issues.push({
            expected: "file",
            code: "invalid_type",
            input,
            inst,
        });
        return payload;
    };
})));
const $ZodTransform = /*@__PURE__*/ $constructor("$ZodTransform", (inst, def) => {
    $ZodType.init(inst, def);
    inst._zod.optin = "optional";
    inst._zod.parse = (payload, ctx) => {
        if (ctx.direction === "backward") {
            throw new $ZodEncodeError(inst.constructor.name);
        }
        const _out = def.transform(payload.value, payload);
        if (ctx.async) {
            const output = _out instanceof Promise ? _out : Promise.resolve(_out);
            return output.then((output) => {
                payload.value = output;
                payload.fallback = true;
                return payload;
            });
        }
        if (_out instanceof Promise) {
            throw new $ZodAsyncError();
        }
        payload.value = _out;
        payload.fallback = true;
        return payload;
    };
});
function handleOptionalResult(result, input) {
    if (input === undefined && (result.issues.length || result.fallback)) {
        return { issues: [], value: undefined };
    }
    return result;
}
const $ZodOptional = /*@__PURE__*/ $constructor("$ZodOptional", (inst, def) => {
    $ZodType.init(inst, def);
    inst._zod.optin = "optional";
    inst._zod.optout = "optional";
    defineLazy(inst._zod, "values", () => {
        return def.innerType._zod.values ? new Set([...def.innerType._zod.values, undefined]) : undefined;
    });
    defineLazy(inst._zod, "pattern", () => {
        const pattern = def.innerType._zod.pattern;
        return pattern ? new RegExp(`^(${cleanRegex(pattern.source)})?$`) : undefined;
    });
    inst._zod.parse = (payload, ctx) => {
        if (def.innerType._zod.optin === "optional") {
            const input = payload.value;
            const result = def.innerType._zod.run(payload, ctx);
            if (result instanceof Promise)
                return result.then((r) => handleOptionalResult(r, input));
            return handleOptionalResult(result, input);
        }
        if (payload.value === undefined) {
            return payload;
        }
        return def.innerType._zod.run(payload, ctx);
    };
});
const $ZodExactOptional = /*@__PURE__*/ $constructor("$ZodExactOptional", (inst, def) => {
    // Call parent init - inherits optin/optout = "optional"
    $ZodOptional.init(inst, def);
    // Override values/pattern to NOT add undefined
    defineLazy(inst._zod, "values", () => def.innerType._zod.values);
    defineLazy(inst._zod, "pattern", () => def.innerType._zod.pattern);
    // Override parse to just delegate (no undefined handling)
    inst._zod.parse = (payload, ctx) => {
        return def.innerType._zod.run(payload, ctx);
    };
});
const $ZodNullable = /*@__PURE__*/ $constructor("$ZodNullable", (inst, def) => {
    $ZodType.init(inst, def);
    defineLazy(inst._zod, "optin", () => def.innerType._zod.optin);
    defineLazy(inst._zod, "optout", () => def.innerType._zod.optout);
    defineLazy(inst._zod, "pattern", () => {
        const pattern = def.innerType._zod.pattern;
        return pattern ? new RegExp(`^(${cleanRegex(pattern.source)}|null)$`) : undefined;
    });
    defineLazy(inst._zod, "values", () => {
        return def.innerType._zod.values ? new Set([...def.innerType._zod.values, null]) : undefined;
    });
    inst._zod.parse = (payload, ctx) => {
        // Forward direction (decode): allow null to pass through
        if (payload.value === null)
            return payload;
        return def.innerType._zod.run(payload, ctx);
    };
});
const $ZodDefault = /*@__PURE__*/ $constructor("$ZodDefault", (inst, def) => {
    $ZodType.init(inst, def);
    // inst._zod.qin = "true";
    inst._zod.optin = "optional";
    defineLazy(inst._zod, "values", () => def.innerType._zod.values);
    inst._zod.parse = (payload, ctx) => {
        if (ctx.direction === "backward") {
            return def.innerType._zod.run(payload, ctx);
        }
        // Forward direction (decode): apply defaults for undefined input
        if (payload.value === undefined) {
            payload.value = def.defaultValue;
            /**
             * $ZodDefault returns the default value immediately in forward direction.
             * It doesn't pass the default value into the validator ("prefault"). There's no reason to pass the default value through validation. The validity of the default is enforced by TypeScript statically. Otherwise, it's the responsibility of the user to ensure the default is valid. In the case of pipes with divergent in/out types, you can specify the default on the `in` schema of your ZodPipe to set a "prefault" for the pipe.   */
            return payload;
        }
        // Forward direction: continue with default handling
        const result = def.innerType._zod.run(payload, ctx);
        if (result instanceof Promise) {
            return result.then((result) => handleDefaultResult(result, def));
        }
        return handleDefaultResult(result, def);
    };
});
function handleDefaultResult(payload, def) {
    if (payload.value === undefined) {
        payload.value = def.defaultValue;
    }
    return payload;
}
const $ZodPrefault = /*@__PURE__*/ $constructor("$ZodPrefault", (inst, def) => {
    $ZodType.init(inst, def);
    inst._zod.optin = "optional";
    defineLazy(inst._zod, "values", () => def.innerType._zod.values);
    inst._zod.parse = (payload, ctx) => {
        if (ctx.direction === "backward") {
            return def.innerType._zod.run(payload, ctx);
        }
        // Forward direction (decode): apply prefault for undefined input
        if (payload.value === undefined) {
            payload.value = def.defaultValue;
        }
        return def.innerType._zod.run(payload, ctx);
    };
});
const $ZodNonOptional = /*@__PURE__*/ $constructor("$ZodNonOptional", (inst, def) => {
    $ZodType.init(inst, def);
    defineLazy(inst._zod, "values", () => {
        const v = def.innerType._zod.values;
        return v ? new Set([...v].filter((x) => x !== undefined)) : undefined;
    });
    inst._zod.parse = (payload, ctx) => {
        const result = def.innerType._zod.run(payload, ctx);
        if (result instanceof Promise) {
            return result.then((result) => handleNonOptionalResult(result, inst));
        }
        return handleNonOptionalResult(result, inst);
    };
});
function handleNonOptionalResult(payload, inst) {
    if (!payload.issues.length && payload.value === undefined) {
        payload.issues.push({
            code: "invalid_type",
            expected: "nonoptional",
            input: payload.value,
            inst,
        });
    }
    return payload;
}
const $ZodSuccess = /*@__PURE__*/ (/* unused pure expression or super */ null && (core.$constructor("$ZodSuccess", (inst, def) => {
    $ZodType.init(inst, def);
    inst._zod.parse = (payload, ctx) => {
        if (ctx.direction === "backward") {
            throw new core.$ZodEncodeError("ZodSuccess");
        }
        const result = def.innerType._zod.run(payload, ctx);
        if (result instanceof Promise) {
            return result.then((result) => {
                payload.value = result.issues.length === 0;
                return payload;
            });
        }
        payload.value = result.issues.length === 0;
        return payload;
    };
})));
const $ZodCatch = /*@__PURE__*/ $constructor("$ZodCatch", (inst, def) => {
    $ZodType.init(inst, def);
    inst._zod.optin = "optional";
    defineLazy(inst._zod, "optout", () => def.innerType._zod.optout);
    defineLazy(inst._zod, "values", () => def.innerType._zod.values);
    inst._zod.parse = (payload, ctx) => {
        if (ctx.direction === "backward") {
            return def.innerType._zod.run(payload, ctx);
        }
        // Forward direction (decode): apply catch logic
        const result = def.innerType._zod.run(payload, ctx);
        if (result instanceof Promise) {
            return result.then((result) => {
                payload.value = result.value;
                if (result.issues.length) {
                    payload.value = def.catchValue({
                        ...payload,
                        error: {
                            issues: result.issues.map((iss) => finalizeIssue(iss, ctx, config())),
                        },
                        input: payload.value,
                    });
                    payload.issues = [];
                    payload.fallback = true;
                }
                return payload;
            });
        }
        payload.value = result.value;
        if (result.issues.length) {
            payload.value = def.catchValue({
                ...payload,
                error: {
                    issues: result.issues.map((iss) => finalizeIssue(iss, ctx, config())),
                },
                input: payload.value,
            });
            payload.issues = [];
            payload.fallback = true;
        }
        return payload;
    };
});
const $ZodNaN = /*@__PURE__*/ (/* unused pure expression or super */ null && (core.$constructor("$ZodNaN", (inst, def) => {
    $ZodType.init(inst, def);
    inst._zod.parse = (payload, _ctx) => {
        if (typeof payload.value !== "number" || !Number.isNaN(payload.value)) {
            payload.issues.push({
                input: payload.value,
                inst,
                expected: "nan",
                code: "invalid_type",
            });
            return payload;
        }
        return payload;
    };
})));
const $ZodPipe = /*@__PURE__*/ $constructor("$ZodPipe", (inst, def) => {
    $ZodType.init(inst, def);
    defineLazy(inst._zod, "values", () => def.in._zod.values);
    defineLazy(inst._zod, "optin", () => def.in._zod.optin);
    defineLazy(inst._zod, "optout", () => def.out._zod.optout);
    defineLazy(inst._zod, "propValues", () => def.in._zod.propValues);
    inst._zod.parse = (payload, ctx) => {
        if (ctx.direction === "backward") {
            const right = def.out._zod.run(payload, ctx);
            if (right instanceof Promise) {
                return right.then((right) => handlePipeResult(right, def.in, ctx));
            }
            return handlePipeResult(right, def.in, ctx);
        }
        const left = def.in._zod.run(payload, ctx);
        if (left instanceof Promise) {
            return left.then((left) => handlePipeResult(left, def.out, ctx));
        }
        return handlePipeResult(left, def.out, ctx);
    };
});
function handlePipeResult(left, next, ctx) {
    if (left.issues.length) {
        // prevent further checks
        left.aborted = true;
        return left;
    }
    return next._zod.run({ value: left.value, issues: left.issues, fallback: left.fallback }, ctx);
}
const $ZodCodec = /*@__PURE__*/ (/* unused pure expression or super */ null && (core.$constructor("$ZodCodec", (inst, def) => {
    $ZodType.init(inst, def);
    util.defineLazy(inst._zod, "values", () => def.in._zod.values);
    util.defineLazy(inst._zod, "optin", () => def.in._zod.optin);
    util.defineLazy(inst._zod, "optout", () => def.out._zod.optout);
    util.defineLazy(inst._zod, "propValues", () => def.in._zod.propValues);
    inst._zod.parse = (payload, ctx) => {
        const direction = ctx.direction || "forward";
        if (direction === "forward") {
            const left = def.in._zod.run(payload, ctx);
            if (left instanceof Promise) {
                return left.then((left) => handleCodecAResult(left, def, ctx));
            }
            return handleCodecAResult(left, def, ctx);
        }
        else {
            const right = def.out._zod.run(payload, ctx);
            if (right instanceof Promise) {
                return right.then((right) => handleCodecAResult(right, def, ctx));
            }
            return handleCodecAResult(right, def, ctx);
        }
    };
})));
function handleCodecAResult(result, def, ctx) {
    if (result.issues.length) {
        // prevent further checks
        result.aborted = true;
        return result;
    }
    const direction = ctx.direction || "forward";
    if (direction === "forward") {
        const transformed = def.transform(result.value, result);
        if (transformed instanceof Promise) {
            return transformed.then((value) => handleCodecTxResult(result, value, def.out, ctx));
        }
        return handleCodecTxResult(result, transformed, def.out, ctx);
    }
    else {
        const transformed = def.reverseTransform(result.value, result);
        if (transformed instanceof Promise) {
            return transformed.then((value) => handleCodecTxResult(result, value, def.in, ctx));
        }
        return handleCodecTxResult(result, transformed, def.in, ctx);
    }
}
function handleCodecTxResult(left, value, nextSchema, ctx) {
    // Check if transform added any issues
    if (left.issues.length) {
        left.aborted = true;
        return left;
    }
    return nextSchema._zod.run({ value, issues: left.issues }, ctx);
}
const $ZodPreprocess = /*@__PURE__*/ (/* unused pure expression or super */ null && (core.$constructor("$ZodPreprocess", (inst, def) => {
    $ZodPipe.init(inst, def);
})));
const $ZodReadonly = /*@__PURE__*/ $constructor("$ZodReadonly", (inst, def) => {
    $ZodType.init(inst, def);
    defineLazy(inst._zod, "propValues", () => def.innerType._zod.propValues);
    defineLazy(inst._zod, "values", () => def.innerType._zod.values);
    defineLazy(inst._zod, "optin", () => def.innerType?._zod?.optin);
    defineLazy(inst._zod, "optout", () => def.innerType?._zod?.optout);
    inst._zod.parse = (payload, ctx) => {
        if (ctx.direction === "backward") {
            return def.innerType._zod.run(payload, ctx);
        }
        const result = def.innerType._zod.run(payload, ctx);
        if (result instanceof Promise) {
            return result.then(handleReadonlyResult);
        }
        return handleReadonlyResult(result);
    };
});
function handleReadonlyResult(payload) {
    payload.value = Object.freeze(payload.value);
    return payload;
}
const $ZodTemplateLiteral = /*@__PURE__*/ (/* unused pure expression or super */ null && (core.$constructor("$ZodTemplateLiteral", (inst, def) => {
    $ZodType.init(inst, def);
    const regexParts = [];
    for (const part of def.parts) {
        if (typeof part === "object" && part !== null) {
            // is Zod schema
            if (!part._zod.pattern) {
                // if (!source)
                throw new Error(`Invalid template literal part, no pattern found: ${[...part._zod.traits].shift()}`);
            }
            const source = part._zod.pattern instanceof RegExp ? part._zod.pattern.source : part._zod.pattern;
            if (!source)
                throw new Error(`Invalid template literal part: ${part._zod.traits}`);
            const start = source.startsWith("^") ? 1 : 0;
            const end = source.endsWith("$") ? source.length - 1 : source.length;
            regexParts.push(source.slice(start, end));
        }
        else if (part === null || util.primitiveTypes.has(typeof part)) {
            regexParts.push(util.escapeRegex(`${part}`));
        }
        else {
            throw new Error(`Invalid template literal part: ${part}`);
        }
    }
    inst._zod.pattern = new RegExp(`^${regexParts.join("")}$`);
    inst._zod.parse = (payload, _ctx) => {
        if (typeof payload.value !== "string") {
            payload.issues.push({
                input: payload.value,
                inst,
                expected: "string",
                code: "invalid_type",
            });
            return payload;
        }
        inst._zod.pattern.lastIndex = 0;
        if (!inst._zod.pattern.test(payload.value)) {
            payload.issues.push({
                input: payload.value,
                inst,
                code: "invalid_format",
                format: def.format ?? "template_literal",
                pattern: inst._zod.pattern.source,
            });
            return payload;
        }
        return payload;
    };
})));
const $ZodFunction = /*@__PURE__*/ (/* unused pure expression or super */ null && (core.$constructor("$ZodFunction", (inst, def) => {
    $ZodType.init(inst, def);
    inst._def = def;
    inst._zod.def = def;
    inst.implement = (func) => {
        if (typeof func !== "function") {
            throw new Error("implement() must be called with a function");
        }
        return function (...args) {
            const parsedArgs = inst._def.input ? parse(inst._def.input, args) : args;
            const result = Reflect.apply(func, this, parsedArgs);
            if (inst._def.output) {
                return parse(inst._def.output, result);
            }
            return result;
        };
    };
    inst.implementAsync = (func) => {
        if (typeof func !== "function") {
            throw new Error("implementAsync() must be called with a function");
        }
        return async function (...args) {
            const parsedArgs = inst._def.input ? await parseAsync(inst._def.input, args) : args;
            const result = await Reflect.apply(func, this, parsedArgs);
            if (inst._def.output) {
                return await parseAsync(inst._def.output, result);
            }
            return result;
        };
    };
    inst._zod.parse = (payload, _ctx) => {
        if (typeof payload.value !== "function") {
            payload.issues.push({
                code: "invalid_type",
                expected: "function",
                input: payload.value,
                inst,
            });
            return payload;
        }
        // Check if output is a promise type to determine if we should use async implementation
        const hasPromiseOutput = inst._def.output && inst._def.output._zod.def.type === "promise";
        if (hasPromiseOutput) {
            payload.value = inst.implementAsync(payload.value);
        }
        else {
            payload.value = inst.implement(payload.value);
        }
        return payload;
    };
    inst.input = (...args) => {
        const F = inst.constructor;
        if (Array.isArray(args[0])) {
            return new F({
                type: "function",
                input: new $ZodTuple({
                    type: "tuple",
                    items: args[0],
                    rest: args[1],
                }),
                output: inst._def.output,
            });
        }
        return new F({
            type: "function",
            input: args[0],
            output: inst._def.output,
        });
    };
    inst.output = (output) => {
        const F = inst.constructor;
        return new F({
            type: "function",
            input: inst._def.input,
            output,
        });
    };
    return inst;
})));
const $ZodPromise = /*@__PURE__*/ (/* unused pure expression or super */ null && (core.$constructor("$ZodPromise", (inst, def) => {
    $ZodType.init(inst, def);
    inst._zod.parse = (payload, ctx) => {
        return Promise.resolve(payload.value).then((inner) => def.innerType._zod.run({ value: inner, issues: [] }, ctx));
    };
})));
const $ZodLazy = /*@__PURE__*/ (/* unused pure expression or super */ null && (core.$constructor("$ZodLazy", (inst, def) => {
    $ZodType.init(inst, def);
    // Cache the resolved inner type on the shared `def` so all clones of this
    // lazy (e.g. via `.describe()`/`.meta()`) share the same inner instance,
    // preserving identity for cycle detection on recursive schemas.
    util.defineLazy(inst._zod, "innerType", () => {
        const d = def;
        if (!d._cachedInner)
            d._cachedInner = def.getter();
        return d._cachedInner;
    });
    util.defineLazy(inst._zod, "pattern", () => inst._zod.innerType?._zod?.pattern);
    util.defineLazy(inst._zod, "propValues", () => inst._zod.innerType?._zod?.propValues);
    util.defineLazy(inst._zod, "optin", () => inst._zod.innerType?._zod?.optin ?? undefined);
    util.defineLazy(inst._zod, "optout", () => inst._zod.innerType?._zod?.optout ?? undefined);
    inst._zod.parse = (payload, ctx) => {
        const inner = inst._zod.innerType;
        return inner._zod.run(payload, ctx);
    };
})));
const $ZodCustom = /*@__PURE__*/ $constructor("$ZodCustom", (inst, def) => {
    $ZodCheck.init(inst, def);
    $ZodType.init(inst, def);
    inst._zod.parse = (payload, _) => {
        return payload;
    };
    inst._zod.check = (payload) => {
        const input = payload.value;
        const r = def.fn(input);
        if (r instanceof Promise) {
            return r.then((r) => handleRefineResult(r, payload, input, inst));
        }
        handleRefineResult(r, payload, input, inst);
        return;
    };
});
function handleRefineResult(result, payload, input, inst) {
    if (!result) {
        const _iss = {
            code: "custom",
            input,
            inst, // incorporates params.error into issue reporting
            path: [...(inst._zod.def.path ?? [])], // incorporates params.error into issue reporting
            continue: !inst._zod.def.abort,
            // params: inst._zod.def.params,
        };
        if (inst._zod.def.params)
            _iss.params = inst._zod.def.params;
        payload.issues.push(util_issue(_iss));
    }
}

;// CONCATENATED MODULE: ./node_modules/zod/v4/core/registries.js
var registries_a;
const $output = Symbol("ZodOutput");
const $input = Symbol("ZodInput");
class $ZodRegistry {
    constructor() {
        this._map = new WeakMap();
        this._idmap = new Map();
    }
    add(schema, ..._meta) {
        const meta = _meta[0];
        this._map.set(schema, meta);
        if (meta && typeof meta === "object" && "id" in meta) {
            this._idmap.set(meta.id, schema);
        }
        return this;
    }
    clear() {
        this._map = new WeakMap();
        this._idmap = new Map();
        return this;
    }
    remove(schema) {
        const meta = this._map.get(schema);
        if (meta && typeof meta === "object" && "id" in meta) {
            this._idmap.delete(meta.id);
        }
        this._map.delete(schema);
        return this;
    }
    get(schema) {
        // return this._map.get(schema) as any;
        // inherit metadata
        const p = schema._zod.parent;
        if (p) {
            const pm = { ...(this.get(p) ?? {}) };
            delete pm.id; // do not inherit id
            const f = { ...pm, ...this._map.get(schema) };
            return Object.keys(f).length ? f : undefined;
        }
        return this._map.get(schema);
    }
    has(schema) {
        return this._map.has(schema);
    }
}
// registries
function registry() {
    return new $ZodRegistry();
}
(registries_a = globalThis).__zod_globalRegistry ?? (registries_a.__zod_globalRegistry = registry());
const globalRegistry = globalThis.__zod_globalRegistry;

;// CONCATENATED MODULE: ./node_modules/zod/v4/core/api.js




// @__NO_SIDE_EFFECTS__
function _string(Class, params) {
    return new Class({
        type: "string",
        ...normalizeParams(params),
    });
}
// @__NO_SIDE_EFFECTS__
function _coercedString(Class, params) {
    return new Class({
        type: "string",
        coerce: true,
        ...util.normalizeParams(params),
    });
}
// @__NO_SIDE_EFFECTS__
function _email(Class, params) {
    return new Class({
        type: "string",
        format: "email",
        check: "string_format",
        abort: false,
        ...normalizeParams(params),
    });
}
// @__NO_SIDE_EFFECTS__
function _guid(Class, params) {
    return new Class({
        type: "string",
        format: "guid",
        check: "string_format",
        abort: false,
        ...normalizeParams(params),
    });
}
// @__NO_SIDE_EFFECTS__
function _uuid(Class, params) {
    return new Class({
        type: "string",
        format: "uuid",
        check: "string_format",
        abort: false,
        ...normalizeParams(params),
    });
}
// @__NO_SIDE_EFFECTS__
function _uuidv4(Class, params) {
    return new Class({
        type: "string",
        format: "uuid",
        check: "string_format",
        abort: false,
        version: "v4",
        ...normalizeParams(params),
    });
}
// @__NO_SIDE_EFFECTS__
function _uuidv6(Class, params) {
    return new Class({
        type: "string",
        format: "uuid",
        check: "string_format",
        abort: false,
        version: "v6",
        ...normalizeParams(params),
    });
}
// @__NO_SIDE_EFFECTS__
function _uuidv7(Class, params) {
    return new Class({
        type: "string",
        format: "uuid",
        check: "string_format",
        abort: false,
        version: "v7",
        ...normalizeParams(params),
    });
}
// @__NO_SIDE_EFFECTS__
function _url(Class, params) {
    return new Class({
        type: "string",
        format: "url",
        check: "string_format",
        abort: false,
        ...normalizeParams(params),
    });
}
// @__NO_SIDE_EFFECTS__
function api_emoji(Class, params) {
    return new Class({
        type: "string",
        format: "emoji",
        check: "string_format",
        abort: false,
        ...normalizeParams(params),
    });
}
// @__NO_SIDE_EFFECTS__
function _nanoid(Class, params) {
    return new Class({
        type: "string",
        format: "nanoid",
        check: "string_format",
        abort: false,
        ...normalizeParams(params),
    });
}
/**
 * @deprecated CUID v1 is deprecated by its authors due to information leakage
 * (timestamps embedded in the id). Use {@link _cuid2} instead.
 * See https://github.com/paralleldrive/cuid.
 */
// @__NO_SIDE_EFFECTS__
function _cuid(Class, params) {
    return new Class({
        type: "string",
        format: "cuid",
        check: "string_format",
        abort: false,
        ...normalizeParams(params),
    });
}
// @__NO_SIDE_EFFECTS__
function _cuid2(Class, params) {
    return new Class({
        type: "string",
        format: "cuid2",
        check: "string_format",
        abort: false,
        ...normalizeParams(params),
    });
}
// @__NO_SIDE_EFFECTS__
function _ulid(Class, params) {
    return new Class({
        type: "string",
        format: "ulid",
        check: "string_format",
        abort: false,
        ...normalizeParams(params),
    });
}
// @__NO_SIDE_EFFECTS__
function _xid(Class, params) {
    return new Class({
        type: "string",
        format: "xid",
        check: "string_format",
        abort: false,
        ...normalizeParams(params),
    });
}
// @__NO_SIDE_EFFECTS__
function _ksuid(Class, params) {
    return new Class({
        type: "string",
        format: "ksuid",
        check: "string_format",
        abort: false,
        ...normalizeParams(params),
    });
}
// @__NO_SIDE_EFFECTS__
function _ipv4(Class, params) {
    return new Class({
        type: "string",
        format: "ipv4",
        check: "string_format",
        abort: false,
        ...normalizeParams(params),
    });
}
// @__NO_SIDE_EFFECTS__
function _ipv6(Class, params) {
    return new Class({
        type: "string",
        format: "ipv6",
        check: "string_format",
        abort: false,
        ...normalizeParams(params),
    });
}
// @__NO_SIDE_EFFECTS__
function _mac(Class, params) {
    return new Class({
        type: "string",
        format: "mac",
        check: "string_format",
        abort: false,
        ...util.normalizeParams(params),
    });
}
// @__NO_SIDE_EFFECTS__
function _cidrv4(Class, params) {
    return new Class({
        type: "string",
        format: "cidrv4",
        check: "string_format",
        abort: false,
        ...normalizeParams(params),
    });
}
// @__NO_SIDE_EFFECTS__
function _cidrv6(Class, params) {
    return new Class({
        type: "string",
        format: "cidrv6",
        check: "string_format",
        abort: false,
        ...normalizeParams(params),
    });
}
// @__NO_SIDE_EFFECTS__
function _base64(Class, params) {
    return new Class({
        type: "string",
        format: "base64",
        check: "string_format",
        abort: false,
        ...normalizeParams(params),
    });
}
// @__NO_SIDE_EFFECTS__
function _base64url(Class, params) {
    return new Class({
        type: "string",
        format: "base64url",
        check: "string_format",
        abort: false,
        ...normalizeParams(params),
    });
}
// @__NO_SIDE_EFFECTS__
function _e164(Class, params) {
    return new Class({
        type: "string",
        format: "e164",
        check: "string_format",
        abort: false,
        ...normalizeParams(params),
    });
}
// @__NO_SIDE_EFFECTS__
function _jwt(Class, params) {
    return new Class({
        type: "string",
        format: "jwt",
        check: "string_format",
        abort: false,
        ...normalizeParams(params),
    });
}
const TimePrecision = {
    Any: null,
    Minute: -1,
    Second: 0,
    Millisecond: 3,
    Microsecond: 6,
};
// @__NO_SIDE_EFFECTS__
function _isoDateTime(Class, params) {
    return new Class({
        type: "string",
        format: "datetime",
        check: "string_format",
        offset: false,
        local: false,
        precision: null,
        ...normalizeParams(params),
    });
}
// @__NO_SIDE_EFFECTS__
function _isoDate(Class, params) {
    return new Class({
        type: "string",
        format: "date",
        check: "string_format",
        ...normalizeParams(params),
    });
}
// @__NO_SIDE_EFFECTS__
function _isoTime(Class, params) {
    return new Class({
        type: "string",
        format: "time",
        check: "string_format",
        precision: null,
        ...normalizeParams(params),
    });
}
// @__NO_SIDE_EFFECTS__
function _isoDuration(Class, params) {
    return new Class({
        type: "string",
        format: "duration",
        check: "string_format",
        ...normalizeParams(params),
    });
}
// @__NO_SIDE_EFFECTS__
function _number(Class, params) {
    return new Class({
        type: "number",
        checks: [],
        ...normalizeParams(params),
    });
}
// @__NO_SIDE_EFFECTS__
function _coercedNumber(Class, params) {
    return new Class({
        type: "number",
        coerce: true,
        checks: [],
        ...util.normalizeParams(params),
    });
}
// @__NO_SIDE_EFFECTS__
function _int(Class, params) {
    return new Class({
        type: "number",
        check: "number_format",
        abort: false,
        format: "safeint",
        ...normalizeParams(params),
    });
}
// @__NO_SIDE_EFFECTS__
function _float32(Class, params) {
    return new Class({
        type: "number",
        check: "number_format",
        abort: false,
        format: "float32",
        ...util.normalizeParams(params),
    });
}
// @__NO_SIDE_EFFECTS__
function _float64(Class, params) {
    return new Class({
        type: "number",
        check: "number_format",
        abort: false,
        format: "float64",
        ...util.normalizeParams(params),
    });
}
// @__NO_SIDE_EFFECTS__
function _int32(Class, params) {
    return new Class({
        type: "number",
        check: "number_format",
        abort: false,
        format: "int32",
        ...util.normalizeParams(params),
    });
}
// @__NO_SIDE_EFFECTS__
function _uint32(Class, params) {
    return new Class({
        type: "number",
        check: "number_format",
        abort: false,
        format: "uint32",
        ...util.normalizeParams(params),
    });
}
// @__NO_SIDE_EFFECTS__
function _boolean(Class, params) {
    return new Class({
        type: "boolean",
        ...normalizeParams(params),
    });
}
// @__NO_SIDE_EFFECTS__
function _coercedBoolean(Class, params) {
    return new Class({
        type: "boolean",
        coerce: true,
        ...util.normalizeParams(params),
    });
}
// @__NO_SIDE_EFFECTS__
function _bigint(Class, params) {
    return new Class({
        type: "bigint",
        ...util.normalizeParams(params),
    });
}
// @__NO_SIDE_EFFECTS__
function _coercedBigint(Class, params) {
    return new Class({
        type: "bigint",
        coerce: true,
        ...util.normalizeParams(params),
    });
}
// @__NO_SIDE_EFFECTS__
function _int64(Class, params) {
    return new Class({
        type: "bigint",
        check: "bigint_format",
        abort: false,
        format: "int64",
        ...util.normalizeParams(params),
    });
}
// @__NO_SIDE_EFFECTS__
function _uint64(Class, params) {
    return new Class({
        type: "bigint",
        check: "bigint_format",
        abort: false,
        format: "uint64",
        ...util.normalizeParams(params),
    });
}
// @__NO_SIDE_EFFECTS__
function _symbol(Class, params) {
    return new Class({
        type: "symbol",
        ...util.normalizeParams(params),
    });
}
// @__NO_SIDE_EFFECTS__
function api_undefined(Class, params) {
    return new Class({
        type: "undefined",
        ...util.normalizeParams(params),
    });
}
// @__NO_SIDE_EFFECTS__
function api_null(Class, params) {
    return new Class({
        type: "null",
        ...util.normalizeParams(params),
    });
}
// @__NO_SIDE_EFFECTS__
function _any(Class) {
    return new Class({
        type: "any",
    });
}
// @__NO_SIDE_EFFECTS__
function _unknown(Class) {
    return new Class({
        type: "unknown",
    });
}
// @__NO_SIDE_EFFECTS__
function _never(Class, params) {
    return new Class({
        type: "never",
        ...normalizeParams(params),
    });
}
// @__NO_SIDE_EFFECTS__
function _void(Class, params) {
    return new Class({
        type: "void",
        ...util.normalizeParams(params),
    });
}
// @__NO_SIDE_EFFECTS__
function _date(Class, params) {
    return new Class({
        type: "date",
        ...util.normalizeParams(params),
    });
}
// @__NO_SIDE_EFFECTS__
function _coercedDate(Class, params) {
    return new Class({
        type: "date",
        coerce: true,
        ...util.normalizeParams(params),
    });
}
// @__NO_SIDE_EFFECTS__
function _nan(Class, params) {
    return new Class({
        type: "nan",
        ...util.normalizeParams(params),
    });
}
// @__NO_SIDE_EFFECTS__
function _lt(value, params) {
    return new $ZodCheckLessThan({
        check: "less_than",
        ...normalizeParams(params),
        value,
        inclusive: false,
    });
}
// @__NO_SIDE_EFFECTS__
function _lte(value, params) {
    return new $ZodCheckLessThan({
        check: "less_than",
        ...normalizeParams(params),
        value,
        inclusive: true,
    });
}

// @__NO_SIDE_EFFECTS__
function _gt(value, params) {
    return new $ZodCheckGreaterThan({
        check: "greater_than",
        ...normalizeParams(params),
        value,
        inclusive: false,
    });
}
// @__NO_SIDE_EFFECTS__
function _gte(value, params) {
    return new $ZodCheckGreaterThan({
        check: "greater_than",
        ...normalizeParams(params),
        value,
        inclusive: true,
    });
}

// @__NO_SIDE_EFFECTS__
function _positive(params) {
    return _gt(0, params);
}
// negative
// @__NO_SIDE_EFFECTS__
function _negative(params) {
    return _lt(0, params);
}
// nonpositive
// @__NO_SIDE_EFFECTS__
function _nonpositive(params) {
    return _lte(0, params);
}
// nonnegative
// @__NO_SIDE_EFFECTS__
function _nonnegative(params) {
    return _gte(0, params);
}
// @__NO_SIDE_EFFECTS__
function _multipleOf(value, params) {
    return new $ZodCheckMultipleOf({
        check: "multiple_of",
        ...normalizeParams(params),
        value,
    });
}
// @__NO_SIDE_EFFECTS__
function _maxSize(maximum, params) {
    return new checks.$ZodCheckMaxSize({
        check: "max_size",
        ...util.normalizeParams(params),
        maximum,
    });
}
// @__NO_SIDE_EFFECTS__
function _minSize(minimum, params) {
    return new checks.$ZodCheckMinSize({
        check: "min_size",
        ...util.normalizeParams(params),
        minimum,
    });
}
// @__NO_SIDE_EFFECTS__
function _size(size, params) {
    return new checks.$ZodCheckSizeEquals({
        check: "size_equals",
        ...util.normalizeParams(params),
        size,
    });
}
// @__NO_SIDE_EFFECTS__
function _maxLength(maximum, params) {
    const ch = new $ZodCheckMaxLength({
        check: "max_length",
        ...normalizeParams(params),
        maximum,
    });
    return ch;
}
// @__NO_SIDE_EFFECTS__
function _minLength(minimum, params) {
    return new $ZodCheckMinLength({
        check: "min_length",
        ...normalizeParams(params),
        minimum,
    });
}
// @__NO_SIDE_EFFECTS__
function _length(length, params) {
    return new $ZodCheckLengthEquals({
        check: "length_equals",
        ...normalizeParams(params),
        length,
    });
}
// @__NO_SIDE_EFFECTS__
function _regex(pattern, params) {
    return new $ZodCheckRegex({
        check: "string_format",
        format: "regex",
        ...normalizeParams(params),
        pattern,
    });
}
// @__NO_SIDE_EFFECTS__
function _lowercase(params) {
    return new $ZodCheckLowerCase({
        check: "string_format",
        format: "lowercase",
        ...normalizeParams(params),
    });
}
// @__NO_SIDE_EFFECTS__
function _uppercase(params) {
    return new $ZodCheckUpperCase({
        check: "string_format",
        format: "uppercase",
        ...normalizeParams(params),
    });
}
// @__NO_SIDE_EFFECTS__
function _includes(includes, params) {
    return new $ZodCheckIncludes({
        check: "string_format",
        format: "includes",
        ...normalizeParams(params),
        includes,
    });
}
// @__NO_SIDE_EFFECTS__
function _startsWith(prefix, params) {
    return new $ZodCheckStartsWith({
        check: "string_format",
        format: "starts_with",
        ...normalizeParams(params),
        prefix,
    });
}
// @__NO_SIDE_EFFECTS__
function _endsWith(suffix, params) {
    return new $ZodCheckEndsWith({
        check: "string_format",
        format: "ends_with",
        ...normalizeParams(params),
        suffix,
    });
}
// @__NO_SIDE_EFFECTS__
function _property(property, schema, params) {
    return new checks.$ZodCheckProperty({
        check: "property",
        property,
        schema,
        ...util.normalizeParams(params),
    });
}
// @__NO_SIDE_EFFECTS__
function _mime(types, params) {
    return new checks.$ZodCheckMimeType({
        check: "mime_type",
        mime: types,
        ...util.normalizeParams(params),
    });
}
// @__NO_SIDE_EFFECTS__
function _overwrite(tx) {
    return new $ZodCheckOverwrite({
        check: "overwrite",
        tx,
    });
}
// normalize
// @__NO_SIDE_EFFECTS__
function _normalize(form) {
    return _overwrite((input) => input.normalize(form));
}
// trim
// @__NO_SIDE_EFFECTS__
function _trim() {
    return _overwrite((input) => input.trim());
}
// toLowerCase
// @__NO_SIDE_EFFECTS__
function _toLowerCase() {
    return _overwrite((input) => input.toLowerCase());
}
// toUpperCase
// @__NO_SIDE_EFFECTS__
function _toUpperCase() {
    return _overwrite((input) => input.toUpperCase());
}
// slugify
// @__NO_SIDE_EFFECTS__
function _slugify() {
    return _overwrite((input) => slugify(input));
}
// @__NO_SIDE_EFFECTS__
function _array(Class, element, params) {
    return new Class({
        type: "array",
        element,
        // get element() {
        //   return element;
        // },
        ...normalizeParams(params),
    });
}
// @__NO_SIDE_EFFECTS__
function _union(Class, options, params) {
    return new Class({
        type: "union",
        options,
        ...util.normalizeParams(params),
    });
}
function _xor(Class, options, params) {
    return new Class({
        type: "union",
        options,
        inclusive: false,
        ...util.normalizeParams(params),
    });
}
// @__NO_SIDE_EFFECTS__
function _discriminatedUnion(Class, discriminator, options, params) {
    return new Class({
        type: "union",
        options,
        discriminator,
        ...util.normalizeParams(params),
    });
}
// @__NO_SIDE_EFFECTS__
function _intersection(Class, left, right) {
    return new Class({
        type: "intersection",
        left,
        right,
    });
}
// export function _tuple(
//   Class: util.SchemaClass<schemas.$ZodTuple>,
//   items: [],
//   params?: string | $ZodTupleParams
// ): schemas.$ZodTuple<[], null>;
// @__NO_SIDE_EFFECTS__
function _tuple(Class, items, _paramsOrRest, _params) {
    const hasRest = _paramsOrRest instanceof schemas.$ZodType;
    const params = hasRest ? _params : _paramsOrRest;
    const rest = hasRest ? _paramsOrRest : null;
    return new Class({
        type: "tuple",
        items,
        rest,
        ...util.normalizeParams(params),
    });
}
// @__NO_SIDE_EFFECTS__
function _record(Class, keyType, valueType, params) {
    return new Class({
        type: "record",
        keyType,
        valueType,
        ...util.normalizeParams(params),
    });
}
// @__NO_SIDE_EFFECTS__
function _map(Class, keyType, valueType, params) {
    return new Class({
        type: "map",
        keyType,
        valueType,
        ...util.normalizeParams(params),
    });
}
// @__NO_SIDE_EFFECTS__
function _set(Class, valueType, params) {
    return new Class({
        type: "set",
        valueType,
        ...util.normalizeParams(params),
    });
}
// @__NO_SIDE_EFFECTS__
function _enum(Class, values, params) {
    const entries = Array.isArray(values) ? Object.fromEntries(values.map((v) => [v, v])) : values;
    // if (Array.isArray(values)) {
    //   for (const value of values) {
    //     entries[value] = value;
    //   }
    // } else {
    //   Object.assign(entries, values);
    // }
    // const entries: util.EnumLike = {};
    // for (const val of values) {
    //   entries[val] = val;
    // }
    return new Class({
        type: "enum",
        entries,
        ...util.normalizeParams(params),
    });
}
// @__NO_SIDE_EFFECTS__
/** @deprecated This API has been merged into `z.enum()`. Use `z.enum()` instead.
 *
 * ```ts
 * enum Colors { red, green, blue }
 * z.enum(Colors);
 * ```
 */
function _nativeEnum(Class, entries, params) {
    return new Class({
        type: "enum",
        entries,
        ...util.normalizeParams(params),
    });
}
// @__NO_SIDE_EFFECTS__
function _literal(Class, value, params) {
    return new Class({
        type: "literal",
        values: Array.isArray(value) ? value : [value],
        ...util.normalizeParams(params),
    });
}
// @__NO_SIDE_EFFECTS__
function _file(Class, params) {
    return new Class({
        type: "file",
        ...util.normalizeParams(params),
    });
}
// @__NO_SIDE_EFFECTS__
function _transform(Class, fn) {
    return new Class({
        type: "transform",
        transform: fn,
    });
}
// @__NO_SIDE_EFFECTS__
function _optional(Class, innerType) {
    return new Class({
        type: "optional",
        innerType,
    });
}
// @__NO_SIDE_EFFECTS__
function _nullable(Class, innerType) {
    return new Class({
        type: "nullable",
        innerType,
    });
}
// @__NO_SIDE_EFFECTS__
function _default(Class, innerType, defaultValue) {
    return new Class({
        type: "default",
        innerType,
        get defaultValue() {
            return typeof defaultValue === "function" ? defaultValue() : util.shallowClone(defaultValue);
        },
    });
}
// @__NO_SIDE_EFFECTS__
function _nonoptional(Class, innerType, params) {
    return new Class({
        type: "nonoptional",
        innerType,
        ...util.normalizeParams(params),
    });
}
// @__NO_SIDE_EFFECTS__
function _success(Class, innerType) {
    return new Class({
        type: "success",
        innerType,
    });
}
// @__NO_SIDE_EFFECTS__
function _catch(Class, innerType, catchValue) {
    return new Class({
        type: "catch",
        innerType,
        catchValue: (typeof catchValue === "function" ? catchValue : () => catchValue),
    });
}
// @__NO_SIDE_EFFECTS__
function _pipe(Class, in_, out) {
    return new Class({
        type: "pipe",
        in: in_,
        out,
    });
}
// @__NO_SIDE_EFFECTS__
function _readonly(Class, innerType) {
    return new Class({
        type: "readonly",
        innerType,
    });
}
// @__NO_SIDE_EFFECTS__
function _templateLiteral(Class, parts, params) {
    return new Class({
        type: "template_literal",
        parts,
        ...util.normalizeParams(params),
    });
}
// @__NO_SIDE_EFFECTS__
function _lazy(Class, getter) {
    return new Class({
        type: "lazy",
        getter,
    });
}
// @__NO_SIDE_EFFECTS__
function _promise(Class, innerType) {
    return new Class({
        type: "promise",
        innerType,
    });
}
// @__NO_SIDE_EFFECTS__
function _custom(Class, fn, _params) {
    const norm = util.normalizeParams(_params);
    norm.abort ?? (norm.abort = true); // default to abort:false
    const schema = new Class({
        type: "custom",
        check: "custom",
        fn: fn,
        ...norm,
    });
    return schema;
}
// same as _custom but defaults to abort:false
// @__NO_SIDE_EFFECTS__
function _refine(Class, fn, _params) {
    const schema = new Class({
        type: "custom",
        check: "custom",
        fn: fn,
        ...normalizeParams(_params),
    });
    return schema;
}
// @__NO_SIDE_EFFECTS__
function _superRefine(fn, params) {
    const ch = _check((payload) => {
        payload.addIssue = (issue) => {
            if (typeof issue === "string") {
                payload.issues.push(util_issue(issue, payload.value, ch._zod.def));
            }
            else {
                // for Zod 3 backwards compatibility
                const _issue = issue;
                if (_issue.fatal)
                    _issue.continue = false;
                _issue.code ?? (_issue.code = "custom");
                _issue.input ?? (_issue.input = payload.value);
                _issue.inst ?? (_issue.inst = ch);
                _issue.continue ?? (_issue.continue = !ch._zod.def.abort); // abort is always undefined, so this is always true...
                payload.issues.push(util_issue(_issue));
            }
        };
        return fn(payload.value, payload);
    }, params);
    return ch;
}
// @__NO_SIDE_EFFECTS__
function _check(fn, params) {
    const ch = new $ZodCheck({
        check: "custom",
        ...normalizeParams(params),
    });
    ch._zod.check = fn;
    return ch;
}
// @__NO_SIDE_EFFECTS__
function describe(description) {
    const ch = new $ZodCheck({ check: "describe" });
    ch._zod.onattach = [
        (inst) => {
            const existing = globalRegistry.get(inst) ?? {};
            globalRegistry.add(inst, { ...existing, description });
        },
    ];
    ch._zod.check = () => { }; // no-op check
    return ch;
}
// @__NO_SIDE_EFFECTS__
function meta(metadata) {
    const ch = new $ZodCheck({ check: "meta" });
    ch._zod.onattach = [
        (inst) => {
            const existing = globalRegistry.get(inst) ?? {};
            globalRegistry.add(inst, { ...existing, ...metadata });
        },
    ];
    ch._zod.check = () => { }; // no-op check
    return ch;
}
// @__NO_SIDE_EFFECTS__
function _stringbool(Classes, _params) {
    const params = util.normalizeParams(_params);
    let truthyArray = params.truthy ?? ["true", "1", "yes", "on", "y", "enabled"];
    let falsyArray = params.falsy ?? ["false", "0", "no", "off", "n", "disabled"];
    if (params.case !== "sensitive") {
        truthyArray = truthyArray.map((v) => (typeof v === "string" ? v.toLowerCase() : v));
        falsyArray = falsyArray.map((v) => (typeof v === "string" ? v.toLowerCase() : v));
    }
    const truthySet = new Set(truthyArray);
    const falsySet = new Set(falsyArray);
    const _Codec = Classes.Codec ?? schemas.$ZodCodec;
    const _Boolean = Classes.Boolean ?? schemas.$ZodBoolean;
    const _String = Classes.String ?? schemas.$ZodString;
    const stringSchema = new _String({ type: "string", error: params.error });
    const booleanSchema = new _Boolean({ type: "boolean", error: params.error });
    const codec = new _Codec({
        type: "pipe",
        in: stringSchema,
        out: booleanSchema,
        transform: ((input, payload) => {
            let data = input;
            if (params.case !== "sensitive")
                data = data.toLowerCase();
            if (truthySet.has(data)) {
                return true;
            }
            else if (falsySet.has(data)) {
                return false;
            }
            else {
                payload.issues.push({
                    code: "invalid_value",
                    expected: "stringbool",
                    values: [...truthySet, ...falsySet],
                    input: payload.value,
                    inst: codec,
                    continue: false,
                });
                return {};
            }
        }),
        reverseTransform: ((input, _payload) => {
            if (input === true) {
                return truthyArray[0] || "true";
            }
            else {
                return falsyArray[0] || "false";
            }
        }),
        error: params.error,
    });
    return codec;
}
// @__NO_SIDE_EFFECTS__
function _stringFormat(Class, format, fnOrRegex, _params = {}) {
    const params = util.normalizeParams(_params);
    const def = {
        ...util.normalizeParams(_params),
        check: "string_format",
        type: "string",
        format,
        fn: typeof fnOrRegex === "function" ? fnOrRegex : (val) => fnOrRegex.test(val),
        ...params,
    };
    if (fnOrRegex instanceof RegExp) {
        def.pattern = fnOrRegex;
    }
    const inst = new Class(def);
    return inst;
}

;// CONCATENATED MODULE: ./node_modules/zod/v4/core/to-json-schema.js

// function initializeContext<T extends schemas.$ZodType>(inputs: JSONSchemaGeneratorParams<T>): ToJSONSchemaContext<T> {
//   return {
//     processor: inputs.processor,
//     metadataRegistry: inputs.metadata ?? globalRegistry,
//     target: inputs.target ?? "draft-2020-12",
//     unrepresentable: inputs.unrepresentable ?? "throw",
//   };
// }
function to_json_schema_initializeContext(params) {
    // Normalize target: convert old non-hyphenated versions to hyphenated versions
    let target = params?.target ?? "draft-2020-12";
    if (target === "draft-4")
        target = "draft-04";
    if (target === "draft-7")
        target = "draft-07";
    return {
        processors: params.processors ?? {},
        metadataRegistry: params?.metadata ?? globalRegistry,
        target,
        unrepresentable: params?.unrepresentable ?? "throw",
        override: params?.override ?? (() => { }),
        io: params?.io ?? "output",
        counter: 0,
        seen: new Map(),
        cycles: params?.cycles ?? "ref",
        reused: params?.reused ?? "inline",
        external: params?.external ?? undefined,
    };
}
function to_json_schema_process(schema, ctx, _params = { path: [], schemaPath: [] }) {
    var _a;
    const def = schema._zod.def;
    // check for schema in seens
    const seen = ctx.seen.get(schema);
    if (seen) {
        seen.count++;
        // check if cycle
        const isCycle = _params.schemaPath.includes(schema);
        if (isCycle) {
            seen.cycle = _params.path;
        }
        return seen.schema;
    }
    // initialize
    const result = { schema: {}, count: 1, cycle: undefined, path: _params.path };
    ctx.seen.set(schema, result);
    // custom method overrides default behavior
    const overrideSchema = schema._zod.toJSONSchema?.();
    if (overrideSchema) {
        result.schema = overrideSchema;
    }
    else {
        const params = {
            ..._params,
            schemaPath: [..._params.schemaPath, schema],
            path: _params.path,
        };
        if (schema._zod.processJSONSchema) {
            schema._zod.processJSONSchema(ctx, result.schema, params);
        }
        else {
            const _json = result.schema;
            const processor = ctx.processors[def.type];
            if (!processor) {
                throw new Error(`[toJSONSchema]: Non-representable type encountered: ${def.type}`);
            }
            processor(schema, ctx, _json, params);
        }
        const parent = schema._zod.parent;
        if (parent) {
            // Also set ref if processor didn't (for inheritance)
            if (!result.ref)
                result.ref = parent;
            to_json_schema_process(parent, ctx, params);
            ctx.seen.get(parent).isParent = true;
        }
    }
    // metadata
    const meta = ctx.metadataRegistry.get(schema);
    if (meta)
        Object.assign(result.schema, meta);
    if (ctx.io === "input" && isTransforming(schema)) {
        // examples/defaults only apply to output type of pipe
        delete result.schema.examples;
        delete result.schema.default;
    }
    // set prefault as default
    if (ctx.io === "input" && "_prefault" in result.schema)
        (_a = result.schema).default ?? (_a.default = result.schema._prefault);
    delete result.schema._prefault;
    // pulling fresh from ctx.seen in case it was overwritten
    const _result = ctx.seen.get(schema);
    return _result.schema;
}
function to_json_schema_extractDefs(ctx, schema
// params: EmitParams
) {
    // iterate over seen map;
    const root = ctx.seen.get(schema);
    if (!root)
        throw new Error("Unprocessed schema. This is a bug in Zod.");
    // Track ids to detect duplicates across different schemas
    const idToSchema = new Map();
    for (const entry of ctx.seen.entries()) {
        const id = ctx.metadataRegistry.get(entry[0])?.id;
        if (id) {
            const existing = idToSchema.get(id);
            if (existing && existing !== entry[0]) {
                throw new Error(`Duplicate schema id "${id}" detected during JSON Schema conversion. Two different schemas cannot share the same id when converted together.`);
            }
            idToSchema.set(id, entry[0]);
        }
    }
    // returns a ref to the schema
    // defId will be empty if the ref points to an external schema (or #)
    const makeURI = (entry) => {
        // comparing the seen objects because sometimes
        // multiple schemas map to the same seen object.
        // e.g. lazy
        // external is configured
        const defsSegment = ctx.target === "draft-2020-12" ? "$defs" : "definitions";
        if (ctx.external) {
            const externalId = ctx.external.registry.get(entry[0])?.id; // ?? "__shared";// `__schema${ctx.counter++}`;
            // check if schema is in the external registry
            const uriGenerator = ctx.external.uri ?? ((id) => id);
            if (externalId) {
                return { ref: uriGenerator(externalId) };
            }
            // otherwise, add to __shared
            const id = entry[1].defId ?? entry[1].schema.id ?? `schema${ctx.counter++}`;
            entry[1].defId = id; // set defId so it will be reused if needed
            return { defId: id, ref: `${uriGenerator("__shared")}#/${defsSegment}/${id}` };
        }
        if (entry[1] === root) {
            return { ref: "#" };
        }
        // self-contained schema
        const uriPrefix = `#`;
        const defUriPrefix = `${uriPrefix}/${defsSegment}/`;
        const defId = entry[1].schema.id ?? `__schema${ctx.counter++}`;
        return { defId, ref: defUriPrefix + defId };
    };
    // stored cached version in `def` property
    // remove all properties, set $ref
    const extractToDef = (entry) => {
        // if the schema is already a reference, do not extract it
        if (entry[1].schema.$ref) {
            return;
        }
        const seen = entry[1];
        const { ref, defId } = makeURI(entry);
        seen.def = { ...seen.schema };
        // defId won't be set if the schema is a reference to an external schema
        // or if the schema is the root schema
        if (defId)
            seen.defId = defId;
        // wipe away all properties except $ref
        const schema = seen.schema;
        for (const key in schema) {
            delete schema[key];
        }
        schema.$ref = ref;
    };
    // throw on cycles
    // break cycles
    if (ctx.cycles === "throw") {
        for (const entry of ctx.seen.entries()) {
            const seen = entry[1];
            if (seen.cycle) {
                throw new Error("Cycle detected: " +
                    `#/${seen.cycle?.join("/")}/<root>` +
                    '\n\nSet the `cycles` parameter to `"ref"` to resolve cyclical schemas with defs.');
            }
        }
    }
    // extract schemas into $defs
    for (const entry of ctx.seen.entries()) {
        const seen = entry[1];
        // convert root schema to # $ref
        if (schema === entry[0]) {
            extractToDef(entry); // this has special handling for the root schema
            continue;
        }
        // extract schemas that are in the external registry
        if (ctx.external) {
            const ext = ctx.external.registry.get(entry[0])?.id;
            if (schema !== entry[0] && ext) {
                extractToDef(entry);
                continue;
            }
        }
        // extract schemas with `id` meta
        const id = ctx.metadataRegistry.get(entry[0])?.id;
        if (id) {
            extractToDef(entry);
            continue;
        }
        // break cycles
        if (seen.cycle) {
            // any
            extractToDef(entry);
            continue;
        }
        // extract reused schemas
        if (seen.count > 1) {
            if (ctx.reused === "ref") {
                extractToDef(entry);
                // biome-ignore lint:
                continue;
            }
        }
    }
}
function to_json_schema_finalize(ctx, schema) {
    const root = ctx.seen.get(schema);
    if (!root)
        throw new Error("Unprocessed schema. This is a bug in Zod.");
    // flatten refs - inherit properties from parent schemas
    const flattenRef = (zodSchema) => {
        const seen = ctx.seen.get(zodSchema);
        // already processed
        if (seen.ref === null)
            return;
        const schema = seen.def ?? seen.schema;
        const _cached = { ...schema };
        const ref = seen.ref;
        seen.ref = null; // prevent infinite recursion
        if (ref) {
            flattenRef(ref);
            const refSeen = ctx.seen.get(ref);
            const refSchema = refSeen.schema;
            // merge referenced schema into current
            if (refSchema.$ref && (ctx.target === "draft-07" || ctx.target === "draft-04" || ctx.target === "openapi-3.0")) {
                // older drafts can't combine $ref with other properties
                schema.allOf = schema.allOf ?? [];
                schema.allOf.push(refSchema);
            }
            else {
                Object.assign(schema, refSchema);
            }
            // restore child's own properties (child wins)
            Object.assign(schema, _cached);
            const isParentRef = zodSchema._zod.parent === ref;
            // For parent chain, child is a refinement - remove parent-only properties
            if (isParentRef) {
                for (const key in schema) {
                    if (key === "$ref" || key === "allOf")
                        continue;
                    if (!(key in _cached)) {
                        delete schema[key];
                    }
                }
            }
            // When ref was extracted to $defs, remove properties that match the definition
            if (refSchema.$ref && refSeen.def) {
                for (const key in schema) {
                    if (key === "$ref" || key === "allOf")
                        continue;
                    if (key in refSeen.def && JSON.stringify(schema[key]) === JSON.stringify(refSeen.def[key])) {
                        delete schema[key];
                    }
                }
            }
        }
        // If parent was extracted (has $ref), propagate $ref to this schema
        // This handles cases like: readonly().meta({id}).describe()
        // where processor sets ref to innerType but parent should be referenced
        const parent = zodSchema._zod.parent;
        if (parent && parent !== ref) {
            // Ensure parent is processed first so its def has inherited properties
            flattenRef(parent);
            const parentSeen = ctx.seen.get(parent);
            if (parentSeen?.schema.$ref) {
                schema.$ref = parentSeen.schema.$ref;
                // De-duplicate with parent's definition
                if (parentSeen.def) {
                    for (const key in schema) {
                        if (key === "$ref" || key === "allOf")
                            continue;
                        if (key in parentSeen.def && JSON.stringify(schema[key]) === JSON.stringify(parentSeen.def[key])) {
                            delete schema[key];
                        }
                    }
                }
            }
        }
        // execute overrides
        ctx.override({
            zodSchema: zodSchema,
            jsonSchema: schema,
            path: seen.path ?? [],
        });
    };
    for (const entry of [...ctx.seen.entries()].reverse()) {
        flattenRef(entry[0]);
    }
    const result = {};
    if (ctx.target === "draft-2020-12") {
        result.$schema = "https://json-schema.org/draft/2020-12/schema";
    }
    else if (ctx.target === "draft-07") {
        result.$schema = "http://json-schema.org/draft-07/schema#";
    }
    else if (ctx.target === "draft-04") {
        result.$schema = "http://json-schema.org/draft-04/schema#";
    }
    else if (ctx.target === "openapi-3.0") {
        // OpenAPI 3.0 schema objects should not include a $schema property
    }
    else {
        // Arbitrary string values are allowed but won't have a $schema property set
    }
    if (ctx.external?.uri) {
        const id = ctx.external.registry.get(schema)?.id;
        if (!id)
            throw new Error("Schema is missing an `id` property");
        result.$id = ctx.external.uri(id);
    }
    Object.assign(result, root.def ?? root.schema);
    // The `id` in `.meta()` is a Zod-specific registration tag used to extract
    // schemas into $defs — it is not user-facing JSON Schema metadata. Strip it
    // from the output body where it would otherwise leak. The id is preserved
    // implicitly via the $defs key (and via $ref paths).
    const rootMetaId = ctx.metadataRegistry.get(schema)?.id;
    if (rootMetaId !== undefined && result.id === rootMetaId)
        delete result.id;
    // build defs object
    const defs = ctx.external?.defs ?? {};
    for (const entry of ctx.seen.entries()) {
        const seen = entry[1];
        if (seen.def && seen.defId) {
            if (seen.def.id === seen.defId)
                delete seen.def.id;
            defs[seen.defId] = seen.def;
        }
    }
    // set definitions in result
    if (ctx.external) {
    }
    else {
        if (Object.keys(defs).length > 0) {
            if (ctx.target === "draft-2020-12") {
                result.$defs = defs;
            }
            else {
                result.definitions = defs;
            }
        }
    }
    try {
        // this "finalizes" this schema and ensures all cycles are removed
        // each call to finalize() is functionally independent
        // though the seen map is shared
        const finalized = JSON.parse(JSON.stringify(result));
        Object.defineProperty(finalized, "~standard", {
            value: {
                ...schema["~standard"],
                jsonSchema: {
                    input: createStandardJSONSchemaMethod(schema, "input", ctx.processors),
                    output: createStandardJSONSchemaMethod(schema, "output", ctx.processors),
                },
            },
            enumerable: false,
            writable: false,
        });
        return finalized;
    }
    catch (_err) {
        throw new Error("Error converting schema to JSON.");
    }
}
function isTransforming(_schema, _ctx) {
    const ctx = _ctx ?? { seen: new Set() };
    if (ctx.seen.has(_schema))
        return false;
    ctx.seen.add(_schema);
    const def = _schema._zod.def;
    if (def.type === "transform")
        return true;
    if (def.type === "array")
        return isTransforming(def.element, ctx);
    if (def.type === "set")
        return isTransforming(def.valueType, ctx);
    if (def.type === "lazy")
        return isTransforming(def.getter(), ctx);
    if (def.type === "promise" ||
        def.type === "optional" ||
        def.type === "nonoptional" ||
        def.type === "nullable" ||
        def.type === "readonly" ||
        def.type === "default" ||
        def.type === "prefault") {
        return isTransforming(def.innerType, ctx);
    }
    if (def.type === "intersection") {
        return isTransforming(def.left, ctx) || isTransforming(def.right, ctx);
    }
    if (def.type === "record" || def.type === "map") {
        return isTransforming(def.keyType, ctx) || isTransforming(def.valueType, ctx);
    }
    if (def.type === "pipe") {
        if (_schema._zod.traits.has("$ZodCodec"))
            return true;
        return isTransforming(def.in, ctx) || isTransforming(def.out, ctx);
    }
    if (def.type === "object") {
        for (const key in def.shape) {
            if (isTransforming(def.shape[key], ctx))
                return true;
        }
        return false;
    }
    if (def.type === "union") {
        for (const option of def.options) {
            if (isTransforming(option, ctx))
                return true;
        }
        return false;
    }
    if (def.type === "tuple") {
        for (const item of def.items) {
            if (isTransforming(item, ctx))
                return true;
        }
        if (def.rest && isTransforming(def.rest, ctx))
            return true;
        return false;
    }
    return false;
}
/**
 * Creates a toJSONSchema method for a schema instance.
 * This encapsulates the logic of initializing context, processing, extracting defs, and finalizing.
 */
const createToJSONSchemaMethod = (schema, processors = {}) => (params) => {
    const ctx = to_json_schema_initializeContext({ ...params, processors });
    to_json_schema_process(schema, ctx);
    to_json_schema_extractDefs(ctx, schema);
    return to_json_schema_finalize(ctx, schema);
};
const createStandardJSONSchemaMethod = (schema, io, processors = {}) => (params) => {
    const { libraryOptions, target } = params ?? {};
    const ctx = to_json_schema_initializeContext({ ...(libraryOptions ?? {}), target, io, processors });
    to_json_schema_process(schema, ctx);
    to_json_schema_extractDefs(ctx, schema);
    return to_json_schema_finalize(ctx, schema);
};

;// CONCATENATED MODULE: ./node_modules/zod/v4/core/json-schema-processors.js


const formatMap = {
    guid: "uuid",
    url: "uri",
    datetime: "date-time",
    json_string: "json-string",
    regex: "", // do not set
};
// ==================== SIMPLE TYPE PROCESSORS ====================
const stringProcessor = (schema, ctx, _json, _params) => {
    const json = _json;
    json.type = "string";
    const { minimum, maximum, format, patterns, contentEncoding } = schema._zod
        .bag;
    if (typeof minimum === "number")
        json.minLength = minimum;
    if (typeof maximum === "number")
        json.maxLength = maximum;
    // custom pattern overrides format
    if (format) {
        json.format = formatMap[format] ?? format;
        if (json.format === "")
            delete json.format; // empty format is not valid
        // JSON Schema format: "time" requires a full time with offset or Z
        // z.iso.time() does not include timezone information, so format: "time" should never be used
        if (format === "time") {
            delete json.format;
        }
    }
    if (contentEncoding)
        json.contentEncoding = contentEncoding;
    if (patterns && patterns.size > 0) {
        const regexes = [...patterns];
        if (regexes.length === 1)
            json.pattern = regexes[0].source;
        else if (regexes.length > 1) {
            json.allOf = [
                ...regexes.map((regex) => ({
                    ...(ctx.target === "draft-07" || ctx.target === "draft-04" || ctx.target === "openapi-3.0"
                        ? { type: "string" }
                        : {}),
                    pattern: regex.source,
                })),
            ];
        }
    }
};
const numberProcessor = (schema, ctx, _json, _params) => {
    const json = _json;
    const { minimum, maximum, format, multipleOf, exclusiveMaximum, exclusiveMinimum } = schema._zod.bag;
    if (typeof format === "string" && format.includes("int"))
        json.type = "integer";
    else
        json.type = "number";
    // when both minimum and exclusiveMinimum exist, pick the more restrictive one
    const exMin = typeof exclusiveMinimum === "number" && exclusiveMinimum >= (minimum ?? Number.NEGATIVE_INFINITY);
    const exMax = typeof exclusiveMaximum === "number" && exclusiveMaximum <= (maximum ?? Number.POSITIVE_INFINITY);
    const legacy = ctx.target === "draft-04" || ctx.target === "openapi-3.0";
    if (exMin) {
        if (legacy) {
            json.minimum = exclusiveMinimum;
            json.exclusiveMinimum = true;
        }
        else {
            json.exclusiveMinimum = exclusiveMinimum;
        }
    }
    else if (typeof minimum === "number") {
        json.minimum = minimum;
    }
    if (exMax) {
        if (legacy) {
            json.maximum = exclusiveMaximum;
            json.exclusiveMaximum = true;
        }
        else {
            json.exclusiveMaximum = exclusiveMaximum;
        }
    }
    else if (typeof maximum === "number") {
        json.maximum = maximum;
    }
    if (typeof multipleOf === "number")
        json.multipleOf = multipleOf;
};
const booleanProcessor = (_schema, _ctx, json, _params) => {
    json.type = "boolean";
};
const bigintProcessor = (_schema, ctx, _json, _params) => {
    if (ctx.unrepresentable === "throw") {
        throw new Error("BigInt cannot be represented in JSON Schema");
    }
};
const symbolProcessor = (_schema, ctx, _json, _params) => {
    if (ctx.unrepresentable === "throw") {
        throw new Error("Symbols cannot be represented in JSON Schema");
    }
};
const nullProcessor = (_schema, ctx, json, _params) => {
    if (ctx.target === "openapi-3.0") {
        json.type = "string";
        json.nullable = true;
        json.enum = [null];
    }
    else {
        json.type = "null";
    }
};
const undefinedProcessor = (_schema, ctx, _json, _params) => {
    if (ctx.unrepresentable === "throw") {
        throw new Error("Undefined cannot be represented in JSON Schema");
    }
};
const voidProcessor = (_schema, ctx, _json, _params) => {
    if (ctx.unrepresentable === "throw") {
        throw new Error("Void cannot be represented in JSON Schema");
    }
};
const neverProcessor = (_schema, _ctx, json, _params) => {
    json.not = {};
};
const anyProcessor = (_schema, _ctx, _json, _params) => {
    // empty schema accepts anything
};
const unknownProcessor = (_schema, _ctx, _json, _params) => {
    // empty schema accepts anything
};
const dateProcessor = (_schema, ctx, _json, _params) => {
    if (ctx.unrepresentable === "throw") {
        throw new Error("Date cannot be represented in JSON Schema");
    }
};
const enumProcessor = (schema, _ctx, json, _params) => {
    const def = schema._zod.def;
    const values = getEnumValues(def.entries);
    // Number enums can have both string and number values
    if (values.every((v) => typeof v === "number"))
        json.type = "number";
    if (values.every((v) => typeof v === "string"))
        json.type = "string";
    json.enum = values;
};
const literalProcessor = (schema, ctx, json, _params) => {
    const def = schema._zod.def;
    const vals = [];
    for (const val of def.values) {
        if (val === undefined) {
            if (ctx.unrepresentable === "throw") {
                throw new Error("Literal `undefined` cannot be represented in JSON Schema");
            }
            else {
                // do not add to vals
            }
        }
        else if (typeof val === "bigint") {
            if (ctx.unrepresentable === "throw") {
                throw new Error("BigInt literals cannot be represented in JSON Schema");
            }
            else {
                vals.push(Number(val));
            }
        }
        else {
            vals.push(val);
        }
    }
    if (vals.length === 0) {
        // do nothing (an undefined literal was stripped)
    }
    else if (vals.length === 1) {
        const val = vals[0];
        json.type = val === null ? "null" : typeof val;
        if (ctx.target === "draft-04" || ctx.target === "openapi-3.0") {
            json.enum = [val];
        }
        else {
            json.const = val;
        }
    }
    else {
        if (vals.every((v) => typeof v === "number"))
            json.type = "number";
        if (vals.every((v) => typeof v === "string"))
            json.type = "string";
        if (vals.every((v) => typeof v === "boolean"))
            json.type = "boolean";
        if (vals.every((v) => v === null))
            json.type = "null";
        json.enum = vals;
    }
};
const nanProcessor = (_schema, ctx, _json, _params) => {
    if (ctx.unrepresentable === "throw") {
        throw new Error("NaN cannot be represented in JSON Schema");
    }
};
const templateLiteralProcessor = (schema, _ctx, json, _params) => {
    const _json = json;
    const pattern = schema._zod.pattern;
    if (!pattern)
        throw new Error("Pattern not found in template literal");
    _json.type = "string";
    _json.pattern = pattern.source;
};
const fileProcessor = (schema, _ctx, json, _params) => {
    const _json = json;
    const file = {
        type: "string",
        format: "binary",
        contentEncoding: "binary",
    };
    const { minimum, maximum, mime } = schema._zod.bag;
    if (minimum !== undefined)
        file.minLength = minimum;
    if (maximum !== undefined)
        file.maxLength = maximum;
    if (mime) {
        if (mime.length === 1) {
            file.contentMediaType = mime[0];
            Object.assign(_json, file);
        }
        else {
            Object.assign(_json, file); // shared props at root
            _json.anyOf = mime.map((m) => ({ contentMediaType: m })); // only contentMediaType differs
        }
    }
    else {
        Object.assign(_json, file);
    }
};
const successProcessor = (_schema, _ctx, json, _params) => {
    json.type = "boolean";
};
const customProcessor = (_schema, ctx, _json, _params) => {
    if (ctx.unrepresentable === "throw") {
        throw new Error("Custom types cannot be represented in JSON Schema");
    }
};
const functionProcessor = (_schema, ctx, _json, _params) => {
    if (ctx.unrepresentable === "throw") {
        throw new Error("Function types cannot be represented in JSON Schema");
    }
};
const transformProcessor = (_schema, ctx, _json, _params) => {
    if (ctx.unrepresentable === "throw") {
        throw new Error("Transforms cannot be represented in JSON Schema");
    }
};
const mapProcessor = (_schema, ctx, _json, _params) => {
    if (ctx.unrepresentable === "throw") {
        throw new Error("Map cannot be represented in JSON Schema");
    }
};
const setProcessor = (_schema, ctx, _json, _params) => {
    if (ctx.unrepresentable === "throw") {
        throw new Error("Set cannot be represented in JSON Schema");
    }
};
// ==================== COMPOSITE TYPE PROCESSORS ====================
const arrayProcessor = (schema, ctx, _json, params) => {
    const json = _json;
    const def = schema._zod.def;
    const { minimum, maximum } = schema._zod.bag;
    if (typeof minimum === "number")
        json.minItems = minimum;
    if (typeof maximum === "number")
        json.maxItems = maximum;
    json.type = "array";
    json.items = to_json_schema_process(def.element, ctx, {
        ...params,
        path: [...params.path, "items"],
    });
};
const objectProcessor = (schema, ctx, _json, params) => {
    const json = _json;
    const def = schema._zod.def;
    json.type = "object";
    json.properties = {};
    const shape = def.shape;
    for (const key in shape) {
        json.properties[key] = to_json_schema_process(shape[key], ctx, {
            ...params,
            path: [...params.path, "properties", key],
        });
    }
    // required keys
    const allKeys = new Set(Object.keys(shape));
    const requiredKeys = new Set([...allKeys].filter((key) => {
        const v = def.shape[key]._zod;
        if (ctx.io === "input") {
            return v.optin === undefined;
        }
        else {
            return v.optout === undefined;
        }
    }));
    if (requiredKeys.size > 0) {
        json.required = Array.from(requiredKeys);
    }
    // catchall
    if (def.catchall?._zod.def.type === "never") {
        // strict
        json.additionalProperties = false;
    }
    else if (!def.catchall) {
        // regular
        if (ctx.io === "output")
            json.additionalProperties = false;
    }
    else if (def.catchall) {
        json.additionalProperties = to_json_schema_process(def.catchall, ctx, {
            ...params,
            path: [...params.path, "additionalProperties"],
        });
    }
};
const unionProcessor = (schema, ctx, json, params) => {
    const def = schema._zod.def;
    // Exclusive unions (inclusive === false) use oneOf (exactly one match) instead of anyOf (one or more matches)
    // This includes both z.xor() and discriminated unions
    const isExclusive = def.inclusive === false;
    const options = def.options.map((x, i) => to_json_schema_process(x, ctx, {
        ...params,
        path: [...params.path, isExclusive ? "oneOf" : "anyOf", i],
    }));
    if (isExclusive) {
        json.oneOf = options;
    }
    else {
        json.anyOf = options;
    }
};
const intersectionProcessor = (schema, ctx, json, params) => {
    const def = schema._zod.def;
    const a = to_json_schema_process(def.left, ctx, {
        ...params,
        path: [...params.path, "allOf", 0],
    });
    const b = to_json_schema_process(def.right, ctx, {
        ...params,
        path: [...params.path, "allOf", 1],
    });
    const isSimpleIntersection = (val) => "allOf" in val && Object.keys(val).length === 1;
    const allOf = [
        ...(isSimpleIntersection(a) ? a.allOf : [a]),
        ...(isSimpleIntersection(b) ? b.allOf : [b]),
    ];
    json.allOf = allOf;
};
const tupleProcessor = (schema, ctx, _json, params) => {
    const json = _json;
    const def = schema._zod.def;
    json.type = "array";
    const prefixPath = ctx.target === "draft-2020-12" ? "prefixItems" : "items";
    const restPath = ctx.target === "draft-2020-12" ? "items" : ctx.target === "openapi-3.0" ? "items" : "additionalItems";
    const prefixItems = def.items.map((x, i) => to_json_schema_process(x, ctx, {
        ...params,
        path: [...params.path, prefixPath, i],
    }));
    const rest = def.rest
        ? to_json_schema_process(def.rest, ctx, {
            ...params,
            path: [...params.path, restPath, ...(ctx.target === "openapi-3.0" ? [def.items.length] : [])],
        })
        : null;
    if (ctx.target === "draft-2020-12") {
        json.prefixItems = prefixItems;
        if (rest) {
            json.items = rest;
        }
    }
    else if (ctx.target === "openapi-3.0") {
        json.items = {
            anyOf: prefixItems,
        };
        if (rest) {
            json.items.anyOf.push(rest);
        }
        json.minItems = prefixItems.length;
        if (!rest) {
            json.maxItems = prefixItems.length;
        }
    }
    else {
        json.items = prefixItems;
        if (rest) {
            json.additionalItems = rest;
        }
    }
    // length
    const { minimum, maximum } = schema._zod.bag;
    if (typeof minimum === "number")
        json.minItems = minimum;
    if (typeof maximum === "number")
        json.maxItems = maximum;
};
const recordProcessor = (schema, ctx, _json, params) => {
    const json = _json;
    const def = schema._zod.def;
    json.type = "object";
    // For looseRecord with regex patterns, use patternProperties
    // This correctly represents "only validate keys matching the pattern" semantics
    // and composes well with allOf (intersections)
    const keyType = def.keyType;
    const keyBag = keyType._zod.bag;
    const patterns = keyBag?.patterns;
    if (def.mode === "loose" && patterns && patterns.size > 0) {
        // Use patternProperties for looseRecord with regex patterns
        const valueSchema = to_json_schema_process(def.valueType, ctx, {
            ...params,
            path: [...params.path, "patternProperties", "*"],
        });
        json.patternProperties = {};
        for (const pattern of patterns) {
            json.patternProperties[pattern.source] = valueSchema;
        }
    }
    else {
        // Default behavior: use propertyNames + additionalProperties
        if (ctx.target === "draft-07" || ctx.target === "draft-2020-12") {
            json.propertyNames = to_json_schema_process(def.keyType, ctx, {
                ...params,
                path: [...params.path, "propertyNames"],
            });
        }
        json.additionalProperties = to_json_schema_process(def.valueType, ctx, {
            ...params,
            path: [...params.path, "additionalProperties"],
        });
    }
    // Add required for keys with discrete values (enum, literal, etc.)
    const keyValues = keyType._zod.values;
    if (keyValues) {
        const validKeyValues = [...keyValues].filter((v) => typeof v === "string" || typeof v === "number");
        if (validKeyValues.length > 0) {
            json.required = validKeyValues;
        }
    }
};
const nullableProcessor = (schema, ctx, json, params) => {
    const def = schema._zod.def;
    const inner = to_json_schema_process(def.innerType, ctx, params);
    const seen = ctx.seen.get(schema);
    if (ctx.target === "openapi-3.0") {
        seen.ref = def.innerType;
        json.nullable = true;
    }
    else {
        json.anyOf = [inner, { type: "null" }];
    }
};
const nonoptionalProcessor = (schema, ctx, _json, params) => {
    const def = schema._zod.def;
    to_json_schema_process(def.innerType, ctx, params);
    const seen = ctx.seen.get(schema);
    seen.ref = def.innerType;
};
const defaultProcessor = (schema, ctx, json, params) => {
    const def = schema._zod.def;
    to_json_schema_process(def.innerType, ctx, params);
    const seen = ctx.seen.get(schema);
    seen.ref = def.innerType;
    json.default = JSON.parse(JSON.stringify(def.defaultValue));
};
const prefaultProcessor = (schema, ctx, json, params) => {
    const def = schema._zod.def;
    to_json_schema_process(def.innerType, ctx, params);
    const seen = ctx.seen.get(schema);
    seen.ref = def.innerType;
    if (ctx.io === "input")
        json._prefault = JSON.parse(JSON.stringify(def.defaultValue));
};
const catchProcessor = (schema, ctx, json, params) => {
    const def = schema._zod.def;
    to_json_schema_process(def.innerType, ctx, params);
    const seen = ctx.seen.get(schema);
    seen.ref = def.innerType;
    let catchValue;
    try {
        catchValue = def.catchValue(undefined);
    }
    catch {
        throw new Error("Dynamic catch values are not supported in JSON Schema");
    }
    json.default = catchValue;
};
const pipeProcessor = (schema, ctx, _json, params) => {
    const def = schema._zod.def;
    const inIsTransform = def.in._zod.traits.has("$ZodTransform");
    const innerType = ctx.io === "input" ? (inIsTransform ? def.out : def.in) : def.out;
    to_json_schema_process(innerType, ctx, params);
    const seen = ctx.seen.get(schema);
    seen.ref = innerType;
};
const readonlyProcessor = (schema, ctx, json, params) => {
    const def = schema._zod.def;
    to_json_schema_process(def.innerType, ctx, params);
    const seen = ctx.seen.get(schema);
    seen.ref = def.innerType;
    json.readOnly = true;
};
const promiseProcessor = (schema, ctx, _json, params) => {
    const def = schema._zod.def;
    to_json_schema_process(def.innerType, ctx, params);
    const seen = ctx.seen.get(schema);
    seen.ref = def.innerType;
};
const optionalProcessor = (schema, ctx, _json, params) => {
    const def = schema._zod.def;
    to_json_schema_process(def.innerType, ctx, params);
    const seen = ctx.seen.get(schema);
    seen.ref = def.innerType;
};
const lazyProcessor = (schema, ctx, _json, params) => {
    const innerType = schema._zod.innerType;
    to_json_schema_process(innerType, ctx, params);
    const seen = ctx.seen.get(schema);
    seen.ref = innerType;
};
// ==================== ALL PROCESSORS ====================
const allProcessors = {
    string: stringProcessor,
    number: numberProcessor,
    boolean: booleanProcessor,
    bigint: bigintProcessor,
    symbol: symbolProcessor,
    null: nullProcessor,
    undefined: undefinedProcessor,
    void: voidProcessor,
    never: neverProcessor,
    any: anyProcessor,
    unknown: unknownProcessor,
    date: dateProcessor,
    enum: enumProcessor,
    literal: literalProcessor,
    nan: nanProcessor,
    template_literal: templateLiteralProcessor,
    file: fileProcessor,
    success: successProcessor,
    custom: customProcessor,
    function: functionProcessor,
    transform: transformProcessor,
    map: mapProcessor,
    set: setProcessor,
    array: arrayProcessor,
    object: objectProcessor,
    union: unionProcessor,
    intersection: intersectionProcessor,
    tuple: tupleProcessor,
    record: recordProcessor,
    nullable: nullableProcessor,
    nonoptional: nonoptionalProcessor,
    default: defaultProcessor,
    prefault: prefaultProcessor,
    catch: catchProcessor,
    pipe: pipeProcessor,
    readonly: readonlyProcessor,
    promise: promiseProcessor,
    optional: optionalProcessor,
    lazy: lazyProcessor,
};
function toJSONSchema(input, params) {
    if ("_idmap" in input) {
        // Registry case
        const registry = input;
        const ctx = initializeContext({ ...params, processors: allProcessors });
        const defs = {};
        // First pass: process all schemas to build the seen map
        for (const entry of registry._idmap.entries()) {
            const [_, schema] = entry;
            process(schema, ctx);
        }
        const schemas = {};
        const external = {
            registry,
            uri: params?.uri,
            defs,
        };
        // Update the context with external configuration
        ctx.external = external;
        // Second pass: emit each schema
        for (const entry of registry._idmap.entries()) {
            const [key, schema] = entry;
            extractDefs(ctx, schema);
            schemas[key] = finalize(ctx, schema);
        }
        if (Object.keys(defs).length > 0) {
            const defsSegment = ctx.target === "draft-2020-12" ? "$defs" : "definitions";
            schemas.__shared = {
                [defsSegment]: defs,
            };
        }
        return { schemas };
    }
    // Single schema case
    const ctx = initializeContext({ ...params, processors: allProcessors });
    process(input, ctx);
    extractDefs(ctx, input);
    return finalize(ctx, input);
}

;// CONCATENATED MODULE: ./node_modules/zod/v4/classic/iso.js


const ZodISODateTime = /*@__PURE__*/ $constructor("ZodISODateTime", (inst, def) => {
    $ZodISODateTime.init(inst, def);
    ZodStringFormat.init(inst, def);
});
function iso_datetime(params) {
    return _isoDateTime(ZodISODateTime, params);
}
const ZodISODate = /*@__PURE__*/ $constructor("ZodISODate", (inst, def) => {
    $ZodISODate.init(inst, def);
    ZodStringFormat.init(inst, def);
});
function iso_date(params) {
    return _isoDate(ZodISODate, params);
}
const ZodISOTime = /*@__PURE__*/ $constructor("ZodISOTime", (inst, def) => {
    $ZodISOTime.init(inst, def);
    ZodStringFormat.init(inst, def);
});
function iso_time(params) {
    return _isoTime(ZodISOTime, params);
}
const ZodISODuration = /*@__PURE__*/ $constructor("ZodISODuration", (inst, def) => {
    $ZodISODuration.init(inst, def);
    ZodStringFormat.init(inst, def);
});
function iso_duration(params) {
    return _isoDuration(ZodISODuration, params);
}

;// CONCATENATED MODULE: ./node_modules/zod/v4/classic/errors.js



const errors_initializer = (inst, issues) => {
    $ZodError.init(inst, issues);
    inst.name = "ZodError";
    Object.defineProperties(inst, {
        format: {
            value: (mapper) => formatError(inst, mapper),
            // enumerable: false,
        },
        flatten: {
            value: (mapper) => flattenError(inst, mapper),
            // enumerable: false,
        },
        addIssue: {
            value: (issue) => {
                inst.issues.push(issue);
                inst.message = JSON.stringify(inst.issues, jsonStringifyReplacer, 2);
            },
            // enumerable: false,
        },
        addIssues: {
            value: (issues) => {
                inst.issues.push(...issues);
                inst.message = JSON.stringify(inst.issues, jsonStringifyReplacer, 2);
            },
            // enumerable: false,
        },
        isEmpty: {
            get() {
                return inst.issues.length === 0;
            },
            // enumerable: false,
        },
    });
    // Object.defineProperty(inst, "isEmpty", {
    //   get() {
    //     return inst.issues.length === 0;
    //   },
    // });
};
const ZodError = /*@__PURE__*/ (/* unused pure expression or super */ null && (core.$constructor("ZodError", errors_initializer)));
const ZodRealError = /*@__PURE__*/ $constructor("ZodError", errors_initializer, {
    Parent: Error,
});
// /** @deprecated Use `z.core.$ZodErrorMapCtx` instead. */
// export type ErrorMapCtx = core.$ZodErrorMapCtx;

;// CONCATENATED MODULE: ./node_modules/zod/v4/classic/parse.js


const classic_parse_parse = /* @__PURE__ */ _parse(ZodRealError);
const classic_parse_parseAsync = /* @__PURE__ */ _parseAsync(ZodRealError);
const parse_safeParse = /* @__PURE__ */ _safeParse(ZodRealError);
const parse_safeParseAsync = /* @__PURE__ */ _safeParseAsync(ZodRealError);
// Codec functions
const parse_encode = /* @__PURE__ */ _encode(ZodRealError);
const parse_decode = /* @__PURE__ */ _decode(ZodRealError);
const parse_encodeAsync = /* @__PURE__ */ _encodeAsync(ZodRealError);
const parse_decodeAsync = /* @__PURE__ */ _decodeAsync(ZodRealError);
const parse_safeEncode = /* @__PURE__ */ _safeEncode(ZodRealError);
const parse_safeDecode = /* @__PURE__ */ _safeDecode(ZodRealError);
const parse_safeEncodeAsync = /* @__PURE__ */ _safeEncodeAsync(ZodRealError);
const parse_safeDecodeAsync = /* @__PURE__ */ _safeDecodeAsync(ZodRealError);

;// CONCATENATED MODULE: ./node_modules/zod/v4/classic/schemas.js







// Lazy-bind builder methods.
//
// Builder methods (`.optional`, `.array`, `.refine`, ...) live as
// non-enumerable getters on each concrete schema constructor's
// prototype. On first access from an instance the getter allocates
// `fn.bind(this)` and caches it as an own property on that instance,
// so detached usage (`const m = schema.optional; m()`) still works
// and the per-instance allocation only happens for methods actually
// touched.
//
// One install per (prototype, group), memoized by `_installedGroups`.
const _installedGroups = /* @__PURE__ */ new WeakMap();
function _installLazyMethods(inst, group, methods) {
    const proto = Object.getPrototypeOf(inst);
    let installed = _installedGroups.get(proto);
    if (!installed) {
        installed = new Set();
        _installedGroups.set(proto, installed);
    }
    if (installed.has(group))
        return;
    installed.add(group);
    for (const key in methods) {
        const fn = methods[key];
        Object.defineProperty(proto, key, {
            configurable: true,
            enumerable: false,
            get() {
                const bound = fn.bind(this);
                Object.defineProperty(this, key, {
                    configurable: true,
                    writable: true,
                    enumerable: true,
                    value: bound,
                });
                return bound;
            },
            set(v) {
                Object.defineProperty(this, key, {
                    configurable: true,
                    writable: true,
                    enumerable: true,
                    value: v,
                });
            },
        });
    }
}
const ZodType = /*@__PURE__*/ $constructor("ZodType", (inst, def) => {
    $ZodType.init(inst, def);
    Object.assign(inst["~standard"], {
        jsonSchema: {
            input: createStandardJSONSchemaMethod(inst, "input"),
            output: createStandardJSONSchemaMethod(inst, "output"),
        },
    });
    inst.toJSONSchema = createToJSONSchemaMethod(inst, {});
    inst.def = def;
    inst.type = def.type;
    Object.defineProperty(inst, "_def", { value: def });
    // Parse-family is intentionally kept as per-instance closures: these are
    // the hot path AND the most-detached methods (`arr.map(schema.parse)`,
    // `const { parse } = schema`, etc.). Eager closures here mean callers pay
    // ~12 closure allocations per schema but get monomorphic call sites and
    // detached usage that "just works".
    inst.parse = (data, params) => classic_parse_parse(inst, data, params, { callee: inst.parse });
    inst.safeParse = (data, params) => parse_safeParse(inst, data, params);
    inst.parseAsync = async (data, params) => classic_parse_parseAsync(inst, data, params, { callee: inst.parseAsync });
    inst.safeParseAsync = async (data, params) => parse_safeParseAsync(inst, data, params);
    inst.spa = inst.safeParseAsync;
    inst.encode = (data, params) => parse_encode(inst, data, params);
    inst.decode = (data, params) => parse_decode(inst, data, params);
    inst.encodeAsync = async (data, params) => parse_encodeAsync(inst, data, params);
    inst.decodeAsync = async (data, params) => parse_decodeAsync(inst, data, params);
    inst.safeEncode = (data, params) => parse_safeEncode(inst, data, params);
    inst.safeDecode = (data, params) => parse_safeDecode(inst, data, params);
    inst.safeEncodeAsync = async (data, params) => parse_safeEncodeAsync(inst, data, params);
    inst.safeDecodeAsync = async (data, params) => parse_safeDecodeAsync(inst, data, params);
    // All builder methods are placed on the internal prototype as lazy-bind
    // getters. On first access per-instance, a bound thunk is allocated and
    // cached as an own property; subsequent accesses skip the getter. This
    // means: no per-instance allocation for unused methods, full
    // detachability preserved (`const m = schema.optional; m()` works), and
    // shared underlying function references across all instances.
    _installLazyMethods(inst, "ZodType", {
        check(...chks) {
            const def = this.def;
            return this.clone(mergeDefs(def, {
                checks: [
                    ...(def.checks ?? []),
                    ...chks.map((ch) => typeof ch === "function" ? { _zod: { check: ch, def: { check: "custom" }, onattach: [] } } : ch),
                ],
            }), { parent: true });
        },
        with(...chks) {
            return this.check(...chks);
        },
        clone(def, params) {
            return clone(this, def, params);
        },
        brand() {
            return this;
        },
        register(reg, meta) {
            reg.add(this, meta);
            return this;
        },
        refine(check, params) {
            return this.check(refine(check, params));
        },
        superRefine(refinement, params) {
            return this.check(superRefine(refinement, params));
        },
        overwrite(fn) {
            return this.check(_overwrite(fn));
        },
        optional() {
            return optional(this);
        },
        exactOptional() {
            return exactOptional(this);
        },
        nullable() {
            return nullable(this);
        },
        nullish() {
            return optional(nullable(this));
        },
        nonoptional(params) {
            return nonoptional(this, params);
        },
        array() {
            return array(this);
        },
        or(arg) {
            return union([this, arg]);
        },
        and(arg) {
            return intersection(this, arg);
        },
        transform(tx) {
            return pipe(this, transform(tx));
        },
        default(d) {
            return schemas_default(this, d);
        },
        prefault(d) {
            return prefault(this, d);
        },
        catch(params) {
            return schemas_catch(this, params);
        },
        pipe(target) {
            return pipe(this, target);
        },
        readonly() {
            return readonly(this);
        },
        describe(description) {
            const cl = this.clone();
            globalRegistry.add(cl, { description });
            return cl;
        },
        meta(...args) {
            // overloaded: meta() returns the registered metadata, meta(data)
            // returns a clone with `data` registered. The mapped type picks
            // up the second overload, so we accept variadic any-args and
            // return `any` to satisfy both at runtime.
            if (args.length === 0)
                return globalRegistry.get(this);
            const cl = this.clone();
            globalRegistry.add(cl, args[0]);
            return cl;
        },
        isOptional() {
            return this.safeParse(undefined).success;
        },
        isNullable() {
            return this.safeParse(null).success;
        },
        apply(fn) {
            return fn(this);
        },
    });
    Object.defineProperty(inst, "description", {
        get() {
            return globalRegistry.get(inst)?.description;
        },
        configurable: true,
    });
    return inst;
});
/** @internal */
const _ZodString = /*@__PURE__*/ $constructor("_ZodString", (inst, def) => {
    $ZodString.init(inst, def);
    ZodType.init(inst, def);
    inst._zod.processJSONSchema = (ctx, json, params) => stringProcessor(inst, ctx, json, params);
    const bag = inst._zod.bag;
    inst.format = bag.format ?? null;
    inst.minLength = bag.minimum ?? null;
    inst.maxLength = bag.maximum ?? null;
    _installLazyMethods(inst, "_ZodString", {
        regex(...args) {
            return this.check(_regex(...args));
        },
        includes(...args) {
            return this.check(_includes(...args));
        },
        startsWith(...args) {
            return this.check(_startsWith(...args));
        },
        endsWith(...args) {
            return this.check(_endsWith(...args));
        },
        min(...args) {
            return this.check(_minLength(...args));
        },
        max(...args) {
            return this.check(_maxLength(...args));
        },
        length(...args) {
            return this.check(_length(...args));
        },
        nonempty(...args) {
            return this.check(_minLength(1, ...args));
        },
        lowercase(params) {
            return this.check(_lowercase(params));
        },
        uppercase(params) {
            return this.check(_uppercase(params));
        },
        trim() {
            return this.check(_trim());
        },
        normalize(...args) {
            return this.check(_normalize(...args));
        },
        toLowerCase() {
            return this.check(_toLowerCase());
        },
        toUpperCase() {
            return this.check(_toUpperCase());
        },
        slugify() {
            return this.check(_slugify());
        },
    });
});
const ZodString = /*@__PURE__*/ $constructor("ZodString", (inst, def) => {
    $ZodString.init(inst, def);
    _ZodString.init(inst, def);
    inst.email = (params) => inst.check(_email(ZodEmail, params));
    inst.url = (params) => inst.check(_url(ZodURL, params));
    inst.jwt = (params) => inst.check(_jwt(ZodJWT, params));
    inst.emoji = (params) => inst.check(api_emoji(ZodEmoji, params));
    inst.guid = (params) => inst.check(_guid(ZodGUID, params));
    inst.uuid = (params) => inst.check(_uuid(ZodUUID, params));
    inst.uuidv4 = (params) => inst.check(_uuidv4(ZodUUID, params));
    inst.uuidv6 = (params) => inst.check(_uuidv6(ZodUUID, params));
    inst.uuidv7 = (params) => inst.check(_uuidv7(ZodUUID, params));
    inst.nanoid = (params) => inst.check(_nanoid(ZodNanoID, params));
    inst.guid = (params) => inst.check(_guid(ZodGUID, params));
    inst.cuid = (params) => inst.check(_cuid(ZodCUID, params));
    inst.cuid2 = (params) => inst.check(_cuid2(ZodCUID2, params));
    inst.ulid = (params) => inst.check(_ulid(ZodULID, params));
    inst.base64 = (params) => inst.check(_base64(ZodBase64, params));
    inst.base64url = (params) => inst.check(_base64url(ZodBase64URL, params));
    inst.xid = (params) => inst.check(_xid(ZodXID, params));
    inst.ksuid = (params) => inst.check(_ksuid(ZodKSUID, params));
    inst.ipv4 = (params) => inst.check(_ipv4(ZodIPv4, params));
    inst.ipv6 = (params) => inst.check(_ipv6(ZodIPv6, params));
    inst.cidrv4 = (params) => inst.check(_cidrv4(ZodCIDRv4, params));
    inst.cidrv6 = (params) => inst.check(_cidrv6(ZodCIDRv6, params));
    inst.e164 = (params) => inst.check(_e164(ZodE164, params));
    // iso
    inst.datetime = (params) => inst.check(iso_datetime(params));
    inst.date = (params) => inst.check(iso_date(params));
    inst.time = (params) => inst.check(iso_time(params));
    inst.duration = (params) => inst.check(iso_duration(params));
});
function schemas_string(params) {
    return _string(ZodString, params);
}
const ZodStringFormat = /*@__PURE__*/ $constructor("ZodStringFormat", (inst, def) => {
    $ZodStringFormat.init(inst, def);
    _ZodString.init(inst, def);
});
const ZodEmail = /*@__PURE__*/ $constructor("ZodEmail", (inst, def) => {
    // ZodStringFormat.init(inst, def);
    $ZodEmail.init(inst, def);
    ZodStringFormat.init(inst, def);
});
function schemas_email(params) {
    return core._email(ZodEmail, params);
}
const ZodGUID = /*@__PURE__*/ $constructor("ZodGUID", (inst, def) => {
    // ZodStringFormat.init(inst, def);
    $ZodGUID.init(inst, def);
    ZodStringFormat.init(inst, def);
});
function schemas_guid(params) {
    return core._guid(ZodGUID, params);
}
const ZodUUID = /*@__PURE__*/ $constructor("ZodUUID", (inst, def) => {
    // ZodStringFormat.init(inst, def);
    $ZodUUID.init(inst, def);
    ZodStringFormat.init(inst, def);
});
function schemas_uuid(params) {
    return core._uuid(ZodUUID, params);
}
function uuidv4(params) {
    return core._uuidv4(ZodUUID, params);
}
// ZodUUIDv6
function uuidv6(params) {
    return core._uuidv6(ZodUUID, params);
}
// ZodUUIDv7
function uuidv7(params) {
    return core._uuidv7(ZodUUID, params);
}
const ZodURL = /*@__PURE__*/ $constructor("ZodURL", (inst, def) => {
    // ZodStringFormat.init(inst, def);
    $ZodURL.init(inst, def);
    ZodStringFormat.init(inst, def);
});
function url(params) {
    return core._url(ZodURL, params);
}
function httpUrl(params) {
    return core._url(ZodURL, {
        protocol: core.regexes.httpProtocol,
        hostname: core.regexes.domain,
        ...util.normalizeParams(params),
    });
}
const ZodEmoji = /*@__PURE__*/ $constructor("ZodEmoji", (inst, def) => {
    // ZodStringFormat.init(inst, def);
    $ZodEmoji.init(inst, def);
    ZodStringFormat.init(inst, def);
});
function schemas_emoji(params) {
    return core._emoji(ZodEmoji, params);
}
const ZodNanoID = /*@__PURE__*/ $constructor("ZodNanoID", (inst, def) => {
    // ZodStringFormat.init(inst, def);
    $ZodNanoID.init(inst, def);
    ZodStringFormat.init(inst, def);
});
function schemas_nanoid(params) {
    return core._nanoid(ZodNanoID, params);
}
/**
 * @deprecated CUID v1 is deprecated by its authors due to information leakage
 * (timestamps embedded in the id). Use {@link ZodCUID2} instead.
 * See https://github.com/paralleldrive/cuid.
 */
const ZodCUID = /*@__PURE__*/ $constructor("ZodCUID", (inst, def) => {
    // ZodStringFormat.init(inst, def);
    $ZodCUID.init(inst, def);
    ZodStringFormat.init(inst, def);
});
/**
 * Validates a CUID v1 string.
 *
 * @deprecated CUID v1 is deprecated by its authors due to information leakage
 * (timestamps embedded in the id). Use {@link cuid2 | `z.cuid2()`} instead.
 * See https://github.com/paralleldrive/cuid.
 */
function schemas_cuid(params) {
    return core._cuid(ZodCUID, params);
}
const ZodCUID2 = /*@__PURE__*/ $constructor("ZodCUID2", (inst, def) => {
    // ZodStringFormat.init(inst, def);
    $ZodCUID2.init(inst, def);
    ZodStringFormat.init(inst, def);
});
function schemas_cuid2(params) {
    return core._cuid2(ZodCUID2, params);
}
const ZodULID = /*@__PURE__*/ $constructor("ZodULID", (inst, def) => {
    // ZodStringFormat.init(inst, def);
    $ZodULID.init(inst, def);
    ZodStringFormat.init(inst, def);
});
function schemas_ulid(params) {
    return core._ulid(ZodULID, params);
}
const ZodXID = /*@__PURE__*/ $constructor("ZodXID", (inst, def) => {
    // ZodStringFormat.init(inst, def);
    $ZodXID.init(inst, def);
    ZodStringFormat.init(inst, def);
});
function schemas_xid(params) {
    return core._xid(ZodXID, params);
}
const ZodKSUID = /*@__PURE__*/ $constructor("ZodKSUID", (inst, def) => {
    // ZodStringFormat.init(inst, def);
    $ZodKSUID.init(inst, def);
    ZodStringFormat.init(inst, def);
});
function schemas_ksuid(params) {
    return core._ksuid(ZodKSUID, params);
}
const ZodIPv4 = /*@__PURE__*/ $constructor("ZodIPv4", (inst, def) => {
    // ZodStringFormat.init(inst, def);
    $ZodIPv4.init(inst, def);
    ZodStringFormat.init(inst, def);
});
function schemas_ipv4(params) {
    return core._ipv4(ZodIPv4, params);
}
const ZodMAC = /*@__PURE__*/ (/* unused pure expression or super */ null && (core.$constructor("ZodMAC", (inst, def) => {
    // ZodStringFormat.init(inst, def);
    core.$ZodMAC.init(inst, def);
    ZodStringFormat.init(inst, def);
})));
function schemas_mac(params) {
    return core._mac(ZodMAC, params);
}
const ZodIPv6 = /*@__PURE__*/ $constructor("ZodIPv6", (inst, def) => {
    // ZodStringFormat.init(inst, def);
    $ZodIPv6.init(inst, def);
    ZodStringFormat.init(inst, def);
});
function schemas_ipv6(params) {
    return core._ipv6(ZodIPv6, params);
}
const ZodCIDRv4 = /*@__PURE__*/ $constructor("ZodCIDRv4", (inst, def) => {
    $ZodCIDRv4.init(inst, def);
    ZodStringFormat.init(inst, def);
});
function schemas_cidrv4(params) {
    return core._cidrv4(ZodCIDRv4, params);
}
const ZodCIDRv6 = /*@__PURE__*/ $constructor("ZodCIDRv6", (inst, def) => {
    $ZodCIDRv6.init(inst, def);
    ZodStringFormat.init(inst, def);
});
function schemas_cidrv6(params) {
    return core._cidrv6(ZodCIDRv6, params);
}
const ZodBase64 = /*@__PURE__*/ $constructor("ZodBase64", (inst, def) => {
    // ZodStringFormat.init(inst, def);
    $ZodBase64.init(inst, def);
    ZodStringFormat.init(inst, def);
});
function schemas_base64(params) {
    return core._base64(ZodBase64, params);
}
const ZodBase64URL = /*@__PURE__*/ $constructor("ZodBase64URL", (inst, def) => {
    // ZodStringFormat.init(inst, def);
    $ZodBase64URL.init(inst, def);
    ZodStringFormat.init(inst, def);
});
function schemas_base64url(params) {
    return core._base64url(ZodBase64URL, params);
}
const ZodE164 = /*@__PURE__*/ $constructor("ZodE164", (inst, def) => {
    // ZodStringFormat.init(inst, def);
    $ZodE164.init(inst, def);
    ZodStringFormat.init(inst, def);
});
function schemas_e164(params) {
    return core._e164(ZodE164, params);
}
const ZodJWT = /*@__PURE__*/ $constructor("ZodJWT", (inst, def) => {
    // ZodStringFormat.init(inst, def);
    $ZodJWT.init(inst, def);
    ZodStringFormat.init(inst, def);
});
function jwt(params) {
    return core._jwt(ZodJWT, params);
}
const ZodCustomStringFormat = /*@__PURE__*/ (/* unused pure expression or super */ null && (core.$constructor("ZodCustomStringFormat", (inst, def) => {
    // ZodStringFormat.init(inst, def);
    core.$ZodCustomStringFormat.init(inst, def);
    ZodStringFormat.init(inst, def);
})));
function stringFormat(format, fnOrRegex, _params = {}) {
    return core._stringFormat(ZodCustomStringFormat, format, fnOrRegex, _params);
}
function schemas_hostname(_params) {
    return core._stringFormat(ZodCustomStringFormat, "hostname", core.regexes.hostname, _params);
}
function schemas_hex(_params) {
    return core._stringFormat(ZodCustomStringFormat, "hex", core.regexes.hex, _params);
}
function hash(alg, params) {
    const enc = params?.enc ?? "hex";
    const format = `${alg}_${enc}`;
    const regex = core.regexes[format];
    if (!regex)
        throw new Error(`Unrecognized hash format: ${format}`);
    return core._stringFormat(ZodCustomStringFormat, format, regex, params);
}
const ZodNumber = /*@__PURE__*/ $constructor("ZodNumber", (inst, def) => {
    $ZodNumber.init(inst, def);
    ZodType.init(inst, def);
    inst._zod.processJSONSchema = (ctx, json, params) => numberProcessor(inst, ctx, json, params);
    _installLazyMethods(inst, "ZodNumber", {
        gt(value, params) {
            return this.check(_gt(value, params));
        },
        gte(value, params) {
            return this.check(_gte(value, params));
        },
        min(value, params) {
            return this.check(_gte(value, params));
        },
        lt(value, params) {
            return this.check(_lt(value, params));
        },
        lte(value, params) {
            return this.check(_lte(value, params));
        },
        max(value, params) {
            return this.check(_lte(value, params));
        },
        int(params) {
            return this.check(schemas_int(params));
        },
        safe(params) {
            return this.check(schemas_int(params));
        },
        positive(params) {
            return this.check(_gt(0, params));
        },
        nonnegative(params) {
            return this.check(_gte(0, params));
        },
        negative(params) {
            return this.check(_lt(0, params));
        },
        nonpositive(params) {
            return this.check(_lte(0, params));
        },
        multipleOf(value, params) {
            return this.check(_multipleOf(value, params));
        },
        step(value, params) {
            return this.check(_multipleOf(value, params));
        },
        finite() {
            return this;
        },
    });
    const bag = inst._zod.bag;
    inst.minValue =
        Math.max(bag.minimum ?? Number.NEGATIVE_INFINITY, bag.exclusiveMinimum ?? Number.NEGATIVE_INFINITY) ?? null;
    inst.maxValue =
        Math.min(bag.maximum ?? Number.POSITIVE_INFINITY, bag.exclusiveMaximum ?? Number.POSITIVE_INFINITY) ?? null;
    inst.isInt = (bag.format ?? "").includes("int") || Number.isSafeInteger(bag.multipleOf ?? 0.5);
    inst.isFinite = true;
    inst.format = bag.format ?? null;
});
function schemas_number(params) {
    return _number(ZodNumber, params);
}
const ZodNumberFormat = /*@__PURE__*/ $constructor("ZodNumberFormat", (inst, def) => {
    $ZodNumberFormat.init(inst, def);
    ZodNumber.init(inst, def);
});
function schemas_int(params) {
    return _int(ZodNumberFormat, params);
}
function float32(params) {
    return core._float32(ZodNumberFormat, params);
}
function float64(params) {
    return core._float64(ZodNumberFormat, params);
}
function int32(params) {
    return core._int32(ZodNumberFormat, params);
}
function uint32(params) {
    return core._uint32(ZodNumberFormat, params);
}
const ZodBoolean = /*@__PURE__*/ $constructor("ZodBoolean", (inst, def) => {
    $ZodBoolean.init(inst, def);
    ZodType.init(inst, def);
    inst._zod.processJSONSchema = (ctx, json, params) => booleanProcessor(inst, ctx, json, params);
});
function schemas_boolean(params) {
    return _boolean(ZodBoolean, params);
}
const ZodBigInt = /*@__PURE__*/ (/* unused pure expression or super */ null && (core.$constructor("ZodBigInt", (inst, def) => {
    core.$ZodBigInt.init(inst, def);
    ZodType.init(inst, def);
    inst._zod.processJSONSchema = (ctx, json, params) => processors.bigintProcessor(inst, ctx, json, params);
    inst.gte = (value, params) => inst.check(checks.gte(value, params));
    inst.min = (value, params) => inst.check(checks.gte(value, params));
    inst.gt = (value, params) => inst.check(checks.gt(value, params));
    inst.gte = (value, params) => inst.check(checks.gte(value, params));
    inst.min = (value, params) => inst.check(checks.gte(value, params));
    inst.lt = (value, params) => inst.check(checks.lt(value, params));
    inst.lte = (value, params) => inst.check(checks.lte(value, params));
    inst.max = (value, params) => inst.check(checks.lte(value, params));
    inst.positive = (params) => inst.check(checks.gt(BigInt(0), params));
    inst.negative = (params) => inst.check(checks.lt(BigInt(0), params));
    inst.nonpositive = (params) => inst.check(checks.lte(BigInt(0), params));
    inst.nonnegative = (params) => inst.check(checks.gte(BigInt(0), params));
    inst.multipleOf = (value, params) => inst.check(checks.multipleOf(value, params));
    const bag = inst._zod.bag;
    inst.minValue = bag.minimum ?? null;
    inst.maxValue = bag.maximum ?? null;
    inst.format = bag.format ?? null;
})));
function schemas_bigint(params) {
    return core._bigint(ZodBigInt, params);
}
const ZodBigIntFormat = /*@__PURE__*/ (/* unused pure expression or super */ null && (core.$constructor("ZodBigIntFormat", (inst, def) => {
    core.$ZodBigIntFormat.init(inst, def);
    ZodBigInt.init(inst, def);
})));
// int64
function int64(params) {
    return core._int64(ZodBigIntFormat, params);
}
// uint64
function uint64(params) {
    return core._uint64(ZodBigIntFormat, params);
}
const ZodSymbol = /*@__PURE__*/ (/* unused pure expression or super */ null && (core.$constructor("ZodSymbol", (inst, def) => {
    core.$ZodSymbol.init(inst, def);
    ZodType.init(inst, def);
    inst._zod.processJSONSchema = (ctx, json, params) => processors.symbolProcessor(inst, ctx, json, params);
})));
function symbol(params) {
    return core._symbol(ZodSymbol, params);
}
const ZodUndefined = /*@__PURE__*/ (/* unused pure expression or super */ null && (core.$constructor("ZodUndefined", (inst, def) => {
    core.$ZodUndefined.init(inst, def);
    ZodType.init(inst, def);
    inst._zod.processJSONSchema = (ctx, json, params) => processors.undefinedProcessor(inst, ctx, json, params);
})));
function schemas_undefined(params) {
    return core._undefined(ZodUndefined, params);
}

const ZodNull = /*@__PURE__*/ (/* unused pure expression or super */ null && (core.$constructor("ZodNull", (inst, def) => {
    core.$ZodNull.init(inst, def);
    ZodType.init(inst, def);
    inst._zod.processJSONSchema = (ctx, json, params) => processors.nullProcessor(inst, ctx, json, params);
})));
function schemas_null(params) {
    return core._null(ZodNull, params);
}

const ZodAny = /*@__PURE__*/ (/* unused pure expression or super */ null && (core.$constructor("ZodAny", (inst, def) => {
    core.$ZodAny.init(inst, def);
    ZodType.init(inst, def);
    inst._zod.processJSONSchema = (ctx, json, params) => processors.anyProcessor(inst, ctx, json, params);
})));
function any() {
    return core._any(ZodAny);
}
const ZodUnknown = /*@__PURE__*/ $constructor("ZodUnknown", (inst, def) => {
    $ZodUnknown.init(inst, def);
    ZodType.init(inst, def);
    inst._zod.processJSONSchema = (ctx, json, params) => unknownProcessor(inst, ctx, json, params);
});
function unknown() {
    return _unknown(ZodUnknown);
}
const ZodNever = /*@__PURE__*/ $constructor("ZodNever", (inst, def) => {
    $ZodNever.init(inst, def);
    ZodType.init(inst, def);
    inst._zod.processJSONSchema = (ctx, json, params) => neverProcessor(inst, ctx, json, params);
});
function never(params) {
    return _never(ZodNever, params);
}
const ZodVoid = /*@__PURE__*/ (/* unused pure expression or super */ null && (core.$constructor("ZodVoid", (inst, def) => {
    core.$ZodVoid.init(inst, def);
    ZodType.init(inst, def);
    inst._zod.processJSONSchema = (ctx, json, params) => processors.voidProcessor(inst, ctx, json, params);
})));
function schemas_void(params) {
    return core._void(ZodVoid, params);
}

const ZodDate = /*@__PURE__*/ (/* unused pure expression or super */ null && (core.$constructor("ZodDate", (inst, def) => {
    core.$ZodDate.init(inst, def);
    ZodType.init(inst, def);
    inst._zod.processJSONSchema = (ctx, json, params) => processors.dateProcessor(inst, ctx, json, params);
    inst.min = (value, params) => inst.check(checks.gte(value, params));
    inst.max = (value, params) => inst.check(checks.lte(value, params));
    const c = inst._zod.bag;
    inst.minDate = c.minimum ? new Date(c.minimum) : null;
    inst.maxDate = c.maximum ? new Date(c.maximum) : null;
})));
function schemas_date(params) {
    return core._date(ZodDate, params);
}
const ZodArray = /*@__PURE__*/ $constructor("ZodArray", (inst, def) => {
    $ZodArray.init(inst, def);
    ZodType.init(inst, def);
    inst._zod.processJSONSchema = (ctx, json, params) => arrayProcessor(inst, ctx, json, params);
    inst.element = def.element;
    _installLazyMethods(inst, "ZodArray", {
        min(n, params) {
            return this.check(_minLength(n, params));
        },
        nonempty(params) {
            return this.check(_minLength(1, params));
        },
        max(n, params) {
            return this.check(_maxLength(n, params));
        },
        length(n, params) {
            return this.check(_length(n, params));
        },
        unwrap() {
            return this.element;
        },
    });
});
function array(element, params) {
    return _array(ZodArray, element, params);
}
// .keyof
function keyof(schema) {
    const shape = schema._zod.def.shape;
    return schemas_enum(Object.keys(shape));
}
const ZodObject = /*@__PURE__*/ $constructor("ZodObject", (inst, def) => {
    $ZodObjectJIT.init(inst, def);
    ZodType.init(inst, def);
    inst._zod.processJSONSchema = (ctx, json, params) => objectProcessor(inst, ctx, json, params);
    defineLazy(inst, "shape", () => {
        return def.shape;
    });
    _installLazyMethods(inst, "ZodObject", {
        keyof() {
            return schemas_enum(Object.keys(this._zod.def.shape));
        },
        catchall(catchall) {
            return this.clone({ ...this._zod.def, catchall: catchall });
        },
        passthrough() {
            return this.clone({ ...this._zod.def, catchall: unknown() });
        },
        loose() {
            return this.clone({ ...this._zod.def, catchall: unknown() });
        },
        strict() {
            return this.clone({ ...this._zod.def, catchall: never() });
        },
        strip() {
            return this.clone({ ...this._zod.def, catchall: undefined });
        },
        extend(incoming) {
            return extend(this, incoming);
        },
        safeExtend(incoming) {
            return safeExtend(this, incoming);
        },
        merge(other) {
            return merge(this, other);
        },
        pick(mask) {
            return pick(this, mask);
        },
        omit(mask) {
            return omit(this, mask);
        },
        partial(...args) {
            return partial(ZodOptional, this, args[0]);
        },
        required(...args) {
            return required(ZodNonOptional, this, args[0]);
        },
    });
});
function object(shape, params) {
    const def = {
        type: "object",
        shape: shape ?? {},
        ...normalizeParams(params),
    };
    return new ZodObject(def);
}
// strictObject
function strictObject(shape, params) {
    return new ZodObject({
        type: "object",
        shape,
        catchall: never(),
        ...util.normalizeParams(params),
    });
}
// looseObject
function looseObject(shape, params) {
    return new ZodObject({
        type: "object",
        shape,
        catchall: unknown(),
        ...util.normalizeParams(params),
    });
}
const ZodUnion = /*@__PURE__*/ $constructor("ZodUnion", (inst, def) => {
    $ZodUnion.init(inst, def);
    ZodType.init(inst, def);
    inst._zod.processJSONSchema = (ctx, json, params) => unionProcessor(inst, ctx, json, params);
    inst.options = def.options;
});
function union(options, params) {
    return new ZodUnion({
        type: "union",
        options: options,
        ...normalizeParams(params),
    });
}
const ZodXor = /*@__PURE__*/ (/* unused pure expression or super */ null && (core.$constructor("ZodXor", (inst, def) => {
    ZodUnion.init(inst, def);
    core.$ZodXor.init(inst, def);
    inst._zod.processJSONSchema = (ctx, json, params) => processors.unionProcessor(inst, ctx, json, params);
    inst.options = def.options;
})));
/** Creates an exclusive union (XOR) where exactly one option must match.
 * Unlike regular unions that succeed when any option matches, xor fails if
 * zero or more than one option matches the input. */
function xor(options, params) {
    return new ZodXor({
        type: "union",
        options: options,
        inclusive: false,
        ...util.normalizeParams(params),
    });
}
const ZodDiscriminatedUnion = /*@__PURE__*/ (/* unused pure expression or super */ null && (core.$constructor("ZodDiscriminatedUnion", (inst, def) => {
    ZodUnion.init(inst, def);
    core.$ZodDiscriminatedUnion.init(inst, def);
})));
function discriminatedUnion(discriminator, options, params) {
    // const [options, params] = args;
    return new ZodDiscriminatedUnion({
        type: "union",
        options,
        discriminator,
        ...util.normalizeParams(params),
    });
}
const ZodIntersection = /*@__PURE__*/ $constructor("ZodIntersection", (inst, def) => {
    $ZodIntersection.init(inst, def);
    ZodType.init(inst, def);
    inst._zod.processJSONSchema = (ctx, json, params) => intersectionProcessor(inst, ctx, json, params);
});
function intersection(left, right) {
    return new ZodIntersection({
        type: "intersection",
        left: left,
        right: right,
    });
}
const ZodTuple = /*@__PURE__*/ (/* unused pure expression or super */ null && (core.$constructor("ZodTuple", (inst, def) => {
    core.$ZodTuple.init(inst, def);
    ZodType.init(inst, def);
    inst._zod.processJSONSchema = (ctx, json, params) => processors.tupleProcessor(inst, ctx, json, params);
    inst.rest = (rest) => inst.clone({
        ...inst._zod.def,
        rest: rest,
    });
})));
function tuple(items, _paramsOrRest, _params) {
    const hasRest = _paramsOrRest instanceof core.$ZodType;
    const params = hasRest ? _params : _paramsOrRest;
    const rest = hasRest ? _paramsOrRest : null;
    return new ZodTuple({
        type: "tuple",
        items: items,
        rest,
        ...util.normalizeParams(params),
    });
}
const ZodRecord = /*@__PURE__*/ (/* unused pure expression or super */ null && (core.$constructor("ZodRecord", (inst, def) => {
    core.$ZodRecord.init(inst, def);
    ZodType.init(inst, def);
    inst._zod.processJSONSchema = (ctx, json, params) => processors.recordProcessor(inst, ctx, json, params);
    inst.keyType = def.keyType;
    inst.valueType = def.valueType;
})));
function record(keyType, valueType, params) {
    // v3-compat: z.record(valueType, params?) — defaults keyType to z.string()
    if (!valueType || !valueType._zod) {
        return new ZodRecord({
            type: "record",
            keyType: schemas_string(),
            valueType: keyType,
            ...util.normalizeParams(valueType),
        });
    }
    return new ZodRecord({
        type: "record",
        keyType,
        valueType: valueType,
        ...util.normalizeParams(params),
    });
}
// type alksjf = core.output<core.$ZodRecordKey>;
function partialRecord(keyType, valueType, params) {
    const k = core.clone(keyType);
    k._zod.values = undefined;
    return new ZodRecord({
        type: "record",
        keyType: k,
        valueType: valueType,
        ...util.normalizeParams(params),
    });
}
function looseRecord(keyType, valueType, params) {
    return new ZodRecord({
        type: "record",
        keyType,
        valueType: valueType,
        mode: "loose",
        ...util.normalizeParams(params),
    });
}
const ZodMap = /*@__PURE__*/ (/* unused pure expression or super */ null && (core.$constructor("ZodMap", (inst, def) => {
    core.$ZodMap.init(inst, def);
    ZodType.init(inst, def);
    inst._zod.processJSONSchema = (ctx, json, params) => processors.mapProcessor(inst, ctx, json, params);
    inst.keyType = def.keyType;
    inst.valueType = def.valueType;
    inst.min = (...args) => inst.check(core._minSize(...args));
    inst.nonempty = (params) => inst.check(core._minSize(1, params));
    inst.max = (...args) => inst.check(core._maxSize(...args));
    inst.size = (...args) => inst.check(core._size(...args));
})));
function map(keyType, valueType, params) {
    return new ZodMap({
        type: "map",
        keyType: keyType,
        valueType: valueType,
        ...util.normalizeParams(params),
    });
}
const ZodSet = /*@__PURE__*/ (/* unused pure expression or super */ null && (core.$constructor("ZodSet", (inst, def) => {
    core.$ZodSet.init(inst, def);
    ZodType.init(inst, def);
    inst._zod.processJSONSchema = (ctx, json, params) => processors.setProcessor(inst, ctx, json, params);
    inst.min = (...args) => inst.check(core._minSize(...args));
    inst.nonempty = (params) => inst.check(core._minSize(1, params));
    inst.max = (...args) => inst.check(core._maxSize(...args));
    inst.size = (...args) => inst.check(core._size(...args));
})));
function set(valueType, params) {
    return new ZodSet({
        type: "set",
        valueType: valueType,
        ...util.normalizeParams(params),
    });
}
const ZodEnum = /*@__PURE__*/ $constructor("ZodEnum", (inst, def) => {
    $ZodEnum.init(inst, def);
    ZodType.init(inst, def);
    inst._zod.processJSONSchema = (ctx, json, params) => enumProcessor(inst, ctx, json, params);
    inst.enum = def.entries;
    inst.options = Object.values(def.entries);
    const keys = new Set(Object.keys(def.entries));
    inst.extract = (values, params) => {
        const newEntries = {};
        for (const value of values) {
            if (keys.has(value)) {
                newEntries[value] = def.entries[value];
            }
            else
                throw new Error(`Key ${value} not found in enum`);
        }
        return new ZodEnum({
            ...def,
            checks: [],
            ...normalizeParams(params),
            entries: newEntries,
        });
    };
    inst.exclude = (values, params) => {
        const newEntries = { ...def.entries };
        for (const value of values) {
            if (keys.has(value)) {
                delete newEntries[value];
            }
            else
                throw new Error(`Key ${value} not found in enum`);
        }
        return new ZodEnum({
            ...def,
            checks: [],
            ...normalizeParams(params),
            entries: newEntries,
        });
    };
});
function schemas_enum(values, params) {
    const entries = Array.isArray(values) ? Object.fromEntries(values.map((v) => [v, v])) : values;
    return new ZodEnum({
        type: "enum",
        entries,
        ...normalizeParams(params),
    });
}

/** @deprecated This API has been merged into `z.enum()`. Use `z.enum()` instead.
 *
 * ```ts
 * enum Colors { red, green, blue }
 * z.enum(Colors);
 * ```
 */
function nativeEnum(entries, params) {
    return new ZodEnum({
        type: "enum",
        entries,
        ...util.normalizeParams(params),
    });
}
const ZodLiteral = /*@__PURE__*/ $constructor("ZodLiteral", (inst, def) => {
    $ZodLiteral.init(inst, def);
    ZodType.init(inst, def);
    inst._zod.processJSONSchema = (ctx, json, params) => literalProcessor(inst, ctx, json, params);
    inst.values = new Set(def.values);
    Object.defineProperty(inst, "value", {
        get() {
            if (def.values.length > 1) {
                throw new Error("This schema contains multiple valid literal values. Use `.values` instead.");
            }
            return def.values[0];
        },
    });
});
function literal(value, params) {
    return new ZodLiteral({
        type: "literal",
        values: Array.isArray(value) ? value : [value],
        ...normalizeParams(params),
    });
}
const ZodFile = /*@__PURE__*/ (/* unused pure expression or super */ null && (core.$constructor("ZodFile", (inst, def) => {
    core.$ZodFile.init(inst, def);
    ZodType.init(inst, def);
    inst._zod.processJSONSchema = (ctx, json, params) => processors.fileProcessor(inst, ctx, json, params);
    inst.min = (size, params) => inst.check(core._minSize(size, params));
    inst.max = (size, params) => inst.check(core._maxSize(size, params));
    inst.mime = (types, params) => inst.check(core._mime(Array.isArray(types) ? types : [types], params));
})));
function file(params) {
    return core._file(ZodFile, params);
}
const ZodTransform = /*@__PURE__*/ $constructor("ZodTransform", (inst, def) => {
    $ZodTransform.init(inst, def);
    ZodType.init(inst, def);
    inst._zod.processJSONSchema = (ctx, json, params) => transformProcessor(inst, ctx, json, params);
    inst._zod.parse = (payload, _ctx) => {
        if (_ctx.direction === "backward") {
            throw new $ZodEncodeError(inst.constructor.name);
        }
        payload.addIssue = (issue) => {
            if (typeof issue === "string") {
                payload.issues.push(util_issue(issue, payload.value, def));
            }
            else {
                // for Zod 3 backwards compatibility
                const _issue = issue;
                if (_issue.fatal)
                    _issue.continue = false;
                _issue.code ?? (_issue.code = "custom");
                _issue.input ?? (_issue.input = payload.value);
                _issue.inst ?? (_issue.inst = inst);
                // _issue.continue ??= true;
                payload.issues.push(util_issue(_issue));
            }
        };
        const output = def.transform(payload.value, payload);
        if (output instanceof Promise) {
            return output.then((output) => {
                payload.value = output;
                payload.fallback = true;
                return payload;
            });
        }
        payload.value = output;
        payload.fallback = true;
        return payload;
    };
});
function transform(fn) {
    return new ZodTransform({
        type: "transform",
        transform: fn,
    });
}
const ZodOptional = /*@__PURE__*/ $constructor("ZodOptional", (inst, def) => {
    $ZodOptional.init(inst, def);
    ZodType.init(inst, def);
    inst._zod.processJSONSchema = (ctx, json, params) => optionalProcessor(inst, ctx, json, params);
    inst.unwrap = () => inst._zod.def.innerType;
});
function optional(innerType) {
    return new ZodOptional({
        type: "optional",
        innerType: innerType,
    });
}
const ZodExactOptional = /*@__PURE__*/ $constructor("ZodExactOptional", (inst, def) => {
    $ZodExactOptional.init(inst, def);
    ZodType.init(inst, def);
    inst._zod.processJSONSchema = (ctx, json, params) => optionalProcessor(inst, ctx, json, params);
    inst.unwrap = () => inst._zod.def.innerType;
});
function exactOptional(innerType) {
    return new ZodExactOptional({
        type: "optional",
        innerType: innerType,
    });
}
const ZodNullable = /*@__PURE__*/ $constructor("ZodNullable", (inst, def) => {
    $ZodNullable.init(inst, def);
    ZodType.init(inst, def);
    inst._zod.processJSONSchema = (ctx, json, params) => nullableProcessor(inst, ctx, json, params);
    inst.unwrap = () => inst._zod.def.innerType;
});
function nullable(innerType) {
    return new ZodNullable({
        type: "nullable",
        innerType: innerType,
    });
}
// nullish
function schemas_nullish(innerType) {
    return optional(nullable(innerType));
}
const ZodDefault = /*@__PURE__*/ $constructor("ZodDefault", (inst, def) => {
    $ZodDefault.init(inst, def);
    ZodType.init(inst, def);
    inst._zod.processJSONSchema = (ctx, json, params) => defaultProcessor(inst, ctx, json, params);
    inst.unwrap = () => inst._zod.def.innerType;
    inst.removeDefault = inst.unwrap;
});
function schemas_default(innerType, defaultValue) {
    return new ZodDefault({
        type: "default",
        innerType: innerType,
        get defaultValue() {
            return typeof defaultValue === "function" ? defaultValue() : shallowClone(defaultValue);
        },
    });
}
const ZodPrefault = /*@__PURE__*/ $constructor("ZodPrefault", (inst, def) => {
    $ZodPrefault.init(inst, def);
    ZodType.init(inst, def);
    inst._zod.processJSONSchema = (ctx, json, params) => prefaultProcessor(inst, ctx, json, params);
    inst.unwrap = () => inst._zod.def.innerType;
});
function prefault(innerType, defaultValue) {
    return new ZodPrefault({
        type: "prefault",
        innerType: innerType,
        get defaultValue() {
            return typeof defaultValue === "function" ? defaultValue() : shallowClone(defaultValue);
        },
    });
}
const ZodNonOptional = /*@__PURE__*/ $constructor("ZodNonOptional", (inst, def) => {
    $ZodNonOptional.init(inst, def);
    ZodType.init(inst, def);
    inst._zod.processJSONSchema = (ctx, json, params) => nonoptionalProcessor(inst, ctx, json, params);
    inst.unwrap = () => inst._zod.def.innerType;
});
function nonoptional(innerType, params) {
    return new ZodNonOptional({
        type: "nonoptional",
        innerType: innerType,
        ...normalizeParams(params),
    });
}
const ZodSuccess = /*@__PURE__*/ (/* unused pure expression or super */ null && (core.$constructor("ZodSuccess", (inst, def) => {
    core.$ZodSuccess.init(inst, def);
    ZodType.init(inst, def);
    inst._zod.processJSONSchema = (ctx, json, params) => processors.successProcessor(inst, ctx, json, params);
    inst.unwrap = () => inst._zod.def.innerType;
})));
function success(innerType) {
    return new ZodSuccess({
        type: "success",
        innerType: innerType,
    });
}
const ZodCatch = /*@__PURE__*/ $constructor("ZodCatch", (inst, def) => {
    $ZodCatch.init(inst, def);
    ZodType.init(inst, def);
    inst._zod.processJSONSchema = (ctx, json, params) => catchProcessor(inst, ctx, json, params);
    inst.unwrap = () => inst._zod.def.innerType;
    inst.removeCatch = inst.unwrap;
});
function schemas_catch(innerType, catchValue) {
    return new ZodCatch({
        type: "catch",
        innerType: innerType,
        catchValue: (typeof catchValue === "function" ? catchValue : () => catchValue),
    });
}

const ZodNaN = /*@__PURE__*/ (/* unused pure expression or super */ null && (core.$constructor("ZodNaN", (inst, def) => {
    core.$ZodNaN.init(inst, def);
    ZodType.init(inst, def);
    inst._zod.processJSONSchema = (ctx, json, params) => processors.nanProcessor(inst, ctx, json, params);
})));
function nan(params) {
    return core._nan(ZodNaN, params);
}
const ZodPipe = /*@__PURE__*/ $constructor("ZodPipe", (inst, def) => {
    $ZodPipe.init(inst, def);
    ZodType.init(inst, def);
    inst._zod.processJSONSchema = (ctx, json, params) => pipeProcessor(inst, ctx, json, params);
    inst.in = def.in;
    inst.out = def.out;
});
function pipe(in_, out) {
    return new ZodPipe({
        type: "pipe",
        in: in_,
        out: out,
        // ...util.normalizeParams(params),
    });
}
const ZodCodec = /*@__PURE__*/ (/* unused pure expression or super */ null && (core.$constructor("ZodCodec", (inst, def) => {
    ZodPipe.init(inst, def);
    core.$ZodCodec.init(inst, def);
})));
function codec(in_, out, params) {
    return new ZodCodec({
        type: "pipe",
        in: in_,
        out: out,
        transform: params.decode,
        reverseTransform: params.encode,
    });
}
function invertCodec(codec) {
    const def = codec._zod.def;
    return new ZodCodec({
        type: "pipe",
        in: def.out,
        out: def.in,
        transform: def.reverseTransform,
        reverseTransform: def.transform,
    });
}
const ZodPreprocess = /*@__PURE__*/ (/* unused pure expression or super */ null && (core.$constructor("ZodPreprocess", (inst, def) => {
    ZodPipe.init(inst, def);
    core.$ZodPreprocess.init(inst, def);
})));
const ZodReadonly = /*@__PURE__*/ $constructor("ZodReadonly", (inst, def) => {
    $ZodReadonly.init(inst, def);
    ZodType.init(inst, def);
    inst._zod.processJSONSchema = (ctx, json, params) => readonlyProcessor(inst, ctx, json, params);
    inst.unwrap = () => inst._zod.def.innerType;
});
function readonly(innerType) {
    return new ZodReadonly({
        type: "readonly",
        innerType: innerType,
    });
}
const ZodTemplateLiteral = /*@__PURE__*/ (/* unused pure expression or super */ null && (core.$constructor("ZodTemplateLiteral", (inst, def) => {
    core.$ZodTemplateLiteral.init(inst, def);
    ZodType.init(inst, def);
    inst._zod.processJSONSchema = (ctx, json, params) => processors.templateLiteralProcessor(inst, ctx, json, params);
})));
function templateLiteral(parts, params) {
    return new ZodTemplateLiteral({
        type: "template_literal",
        parts,
        ...util.normalizeParams(params),
    });
}
const ZodLazy = /*@__PURE__*/ (/* unused pure expression or super */ null && (core.$constructor("ZodLazy", (inst, def) => {
    core.$ZodLazy.init(inst, def);
    ZodType.init(inst, def);
    inst._zod.processJSONSchema = (ctx, json, params) => processors.lazyProcessor(inst, ctx, json, params);
    inst.unwrap = () => inst._zod.def.getter();
})));
function lazy(getter) {
    return new ZodLazy({
        type: "lazy",
        getter: getter,
    });
}
const ZodPromise = /*@__PURE__*/ (/* unused pure expression or super */ null && (core.$constructor("ZodPromise", (inst, def) => {
    core.$ZodPromise.init(inst, def);
    ZodType.init(inst, def);
    inst._zod.processJSONSchema = (ctx, json, params) => processors.promiseProcessor(inst, ctx, json, params);
    inst.unwrap = () => inst._zod.def.innerType;
})));
function promise(innerType) {
    return new ZodPromise({
        type: "promise",
        innerType: innerType,
    });
}
const ZodFunction = /*@__PURE__*/ (/* unused pure expression or super */ null && (core.$constructor("ZodFunction", (inst, def) => {
    core.$ZodFunction.init(inst, def);
    ZodType.init(inst, def);
    inst._zod.processJSONSchema = (ctx, json, params) => processors.functionProcessor(inst, ctx, json, params);
})));
function _function(params) {
    return new ZodFunction({
        type: "function",
        input: Array.isArray(params?.input) ? tuple(params?.input) : (params?.input ?? array(unknown())),
        output: params?.output ?? unknown(),
    });
}

const ZodCustom = /*@__PURE__*/ $constructor("ZodCustom", (inst, def) => {
    $ZodCustom.init(inst, def);
    ZodType.init(inst, def);
    inst._zod.processJSONSchema = (ctx, json, params) => customProcessor(inst, ctx, json, params);
});
// custom checks
function check(fn) {
    const ch = new core.$ZodCheck({
        check: "custom",
        // ...util.normalizeParams(params),
    });
    ch._zod.check = fn;
    return ch;
}
function custom(fn, _params) {
    return core._custom(ZodCustom, fn ?? (() => true), _params);
}
function refine(fn, _params = {}) {
    return _refine(ZodCustom, fn, _params);
}
// superRefine
function superRefine(fn, params) {
    return _superRefine(fn, params);
}
// Re-export describe and meta from core
const schemas_describe = describe;
const schemas_meta = meta;
function _instanceof(cls, params = {}) {
    const inst = new ZodCustom({
        type: "custom",
        check: "custom",
        fn: (data) => data instanceof cls,
        abort: true,
        ...util.normalizeParams(params),
    });
    inst._zod.bag.Class = cls;
    // Override check to emit invalid_type instead of custom
    inst._zod.check = (payload) => {
        if (!(payload.value instanceof cls)) {
            payload.issues.push({
                code: "invalid_type",
                expected: cls.name,
                input: payload.value,
                inst,
                path: [...(inst._zod.def.path ?? [])],
            });
        }
    };
    return inst;
}

// stringbool
const stringbool = (...args) => core._stringbool({
    Codec: ZodCodec,
    Boolean: ZodBoolean,
    String: ZodString,
}, ...args);
function json(params) {
    const jsonSchema = lazy(() => {
        return union([schemas_string(params), schemas_number(), schemas_boolean(), schemas_null(), array(jsonSchema), record(schemas_string(), jsonSchema)]);
    });
    return jsonSchema;
}
// preprocess
function preprocess(fn, schema) {
    return new ZodPreprocess({
        type: "pipe",
        in: transform(fn),
        out: schema,
    });
}

;// CONCATENATED MODULE: ./src/protocol.ts


const PROTOCOL_VERSION = "1.0";
const MAX_REQUEST_BYTES = 64 * 1024;
const MAX_RESPONSE_BYTES = (/* unused pure expression or super */ null && (256 * 1024));
const BridgeOperationSchema = schemas_enum([
    "health",
    "get_capabilities",
    "get_session_state",
    "get_assembly_capability",
    "get_drafting_capability",
    "get_cae_capability",
    "get_cam_capability",
    "get_assembly_structure",
    "get_drafting_structure",
    "create_test_drawing",
    "preflight_modeling",
    "get_feature_tree",
    "capture_screenshot",
    "new_part",
    "open_part",
    "save_as",
    "close_part",
    "create_block",
    "create_rectangle_sketch",
    "extrude_sketch",
    "revolve_sketch",
    "create_simple_through_hole",
    "boolean_bodies",
    "fillet_vertical_edges",
    "measure_work_part",
    "export_step",
    "undo_transaction",
]);
const BridgeArgumentsSchema = object({
    length: schemas_number().positive().max(1_000_000).optional(),
    width: schemas_number().positive().max(1_000_000).optional(),
    height: schemas_number().positive().max(1_000_000).optional(),
    originX: schemas_number().finite().min(-1_000_000).max(1_000_000).optional(),
    originY: schemas_number().finite().min(-1_000_000).max(1_000_000).optional(),
    originZ: schemas_number().finite().min(-1_000_000).max(1_000_000).optional(),
    profileWidth: schemas_number().positive().max(1_000_000).optional(),
    profileHeight: schemas_number().positive().max(1_000_000).optional(),
    centerX: schemas_number().finite().min(-1_000_000).max(1_000_000).optional(),
    centerY: schemas_number().finite().min(-1_000_000).max(1_000_000).optional(),
    planeZ: schemas_number().finite().min(-1_000_000).max(1_000_000).optional(),
    sketchFeatureJournalIdentifier: schemas_string()
        .trim()
        .min(1)
        .max(1024)
        .optional(),
    distance: schemas_number().positive().max(1_000_000).optional(),
    axisDirection: schemas_enum(["WCS_X", "WCS_Y"]).optional(),
    axisOriginX: schemas_number().finite().min(-1_000_000).max(1_000_000).optional(),
    axisOriginY: schemas_number().finite().min(-1_000_000).max(1_000_000).optional(),
    axisOriginZ: schemas_number().finite().min(-1_000_000).max(1_000_000).optional(),
    holeCenterX: schemas_number().finite().min(-1_000_000).max(1_000_000).optional(),
    holeCenterY: schemas_number().finite().min(-1_000_000).max(1_000_000).optional(),
    holeDiameter: schemas_number().positive().max(1_000_000).optional(),
    booleanOperation: schemas_enum(["UNITE", "SUBTRACT", "INTERSECT"]).optional(),
    targetFeatureJournalIdentifier: schemas_string()
        .trim()
        .min(1)
        .max(1024)
        .optional(),
    toolFeatureJournalIdentifier: schemas_string()
        .trim()
        .min(1)
        .max(1024)
        .optional(),
    bodyFeatureJournalIdentifier: schemas_string()
        .trim()
        .min(1)
        .max(1024)
        .optional(),
    filletRadius: schemas_number().positive().max(1_000_000).optional(),
    name: schemas_string().trim().min(1).max(128).optional(),
    transactionId: schemas_string().trim().min(1).max(128).optional(),
    filePath: schemas_string().trim().min(1).max(240).optional(),
    partUnits: schemas_enum(["Millimeters", "Inches"]).optional(),
    stepFormat: schemas_enum(["AP203", "AP214", "AP242"]).optional(),
    plannedOperation: schemas_enum([
        "create_block",
        "create_rectangle_sketch",
        "extrude_sketch",
        "revolve_sketch",
        "create_simple_through_hole",
        "boolean_bodies",
        "fillet_vertical_edges",
    ])
        .optional(),
    maxDepth: schemas_number().int().min(0).max(32).optional(),
    maxComponents: schemas_number().int().min(1).max(128).optional(),
    maxSheets: schemas_number().int().min(1).max(64).optional(),
    maxViews: schemas_number().int().min(1).max(128).optional(),
})
    .strict();
const BridgeRequestSchema = object({
    protocolVersion: literal(PROTOCOL_VERSION),
    requestId: schemas_string().uuid(),
    operation: BridgeOperationSchema,
    token: schemas_string().min(32).max(256),
    deadlineUtc: schemas_string().datetime({ offset: true }),
    arguments: BridgeArgumentsSchema,
})
    .strict();
const FeatureTreeNodeSchema = object({
    index: schemas_number().int().nonnegative(),
    journalIdentifier: schemas_string().min(1).max(1024),
    name: schemas_string().max(1024),
    featureType: schemas_string().max(256),
    timestamp: schemas_number().int(),
    suppressed: schemas_boolean(),
    parentJournalIdentifiers: array(schemas_string().max(1024)).max(16),
    parentsTruncated: schemas_boolean().optional(),
})
    .strict();
const AssemblyComponentNodeSchema = object({
    index: schemas_number().int().nonnegative(),
    parentIndex: schemas_number().int().nonnegative().nullable().optional(),
    depth: schemas_number().int().nonnegative().max(32),
    instanceName: schemas_string().max(256),
    displayName: schemas_string().max(256),
    prototypePartIdentifier: schemas_string().max(256),
    suppressed: schemas_boolean(),
    loadState: schemas_enum(["loaded", "unloaded", "unknown"]),
    representationMode: schemas_enum([
        "Exact",
        "Lightweight",
        "None",
        "Partial",
        "Unknown",
    ]),
    childCount: schemas_number().int().nonnegative(),
    childrenTruncated: schemas_boolean().optional(),
})
    .strict();
const DraftingSheetNodeSchema = object({
    index: schemas_number().int().nonnegative().max(63),
    journalIdentifier: schemas_string().max(1024),
    name: schemas_string().max(256),
    length: schemas_number().finite().nonnegative(),
    height: schemas_number().finite().nonnegative(),
    units: schemas_enum(["Millimeters", "Inches"]),
    projectionAngle: schemas_enum(["FirstAngle", "ThirdAngle"]),
    scaleNumerator: schemas_number().finite().nonnegative(),
    scaleDenominator: schemas_number().finite().nonnegative(),
    isOutOfDate: schemas_boolean(),
    viewCount: schemas_number().int().nonnegative(),
    viewsTruncated: schemas_boolean().optional(),
})
    .strict();
const DraftingViewNodeSchema = object({
    index: schemas_number().int().nonnegative().max(127),
    sheetIndex: schemas_number().int().nonnegative().max(63),
    journalIdentifier: schemas_string().max(1024),
    name: schemas_string().max(256),
    scale: schemas_number().finite().nonnegative(),
    originX: schemas_number().finite(),
    originY: schemas_number().finite(),
    originZ: schemas_number().finite(),
    isOutOfDate: schemas_boolean(),
    isBroken: schemas_boolean(),
    isDecoration: schemas_boolean(),
    isSlave: schemas_boolean(),
})
    .strict();
const BridgeResultSchema = object({
    connected: schemas_boolean().optional(),
    status: schemas_string().max(128).optional(),
    bridgeVersion: schemas_string().max(64).optional(),
    protocolVersion: schemas_string().max(16).optional(),
    nxVersion: schemas_string().max(128).optional(),
    nxOpenAssemblyVersion: schemas_string().max(64).optional(),
    adapterId: schemas_string().max(128).optional(),
    adapterContractId: schemas_string().max(128).optional(),
    compatibilityStatus: schemas_enum(["verified", "unsupported"]).optional(),
    processId: schemas_number().int().positive().optional(),
    capabilities: array(schemas_string().max(128)).max(128).optional(),
    allowedRoots: array(schemas_string().max(240)).max(8).optional(),
    dispatcher: schemas_string().max(128).optional(),
    application: schemas_string().max(256).optional(),
    applicationName: schemas_string().max(256).optional(),
    available: schemas_boolean().optional(),
    licensed: schemas_boolean().optional(),
    unsupportedReason: schemas_string().max(4096).optional(),
    workPart: schemas_string().max(2048).optional(),
    displayPart: schemas_string().max(2048).optional(),
    units: schemas_string().max(64).optional(),
    modified: schemas_boolean().optional(),
    featureCount: schemas_number().int().nonnegative().optional(),
    bodyCount: schemas_number().int().nonnegative().optional(),
    solidBodyCount: schemas_number().int().nonnegative().optional(),
    transactionId: schemas_string().max(128).optional(),
    featureJournalIdentifier: schemas_string().max(1024).optional(),
    featureName: schemas_string().max(1024).optional(),
    curveCount: schemas_number().int().nonnegative().max(1_000_000).optional(),
    measuredBodyCount: schemas_number().int().positive().max(1_000_000).optional(),
    measurementUnits: schemas_enum(["Millimeters", "Inches"]).optional(),
    boundingBoxMinX: schemas_number().finite().optional(),
    boundingBoxMinY: schemas_number().finite().optional(),
    boundingBoxMinZ: schemas_number().finite().optional(),
    boundingBoxMaxX: schemas_number().finite().optional(),
    boundingBoxMaxY: schemas_number().finite().optional(),
    boundingBoxMaxZ: schemas_number().finite().optional(),
    boundingBoxSizeX: schemas_number().finite().nonnegative().optional(),
    boundingBoxSizeY: schemas_number().finite().nonnegative().optional(),
    boundingBoxSizeZ: schemas_number().finite().nonnegative().optional(),
    surfaceArea: schemas_number().finite().nonnegative().optional(),
    volume: schemas_number().finite().nonnegative().optional(),
    centroidX: schemas_number().finite().optional(),
    centroidY: schemas_number().finite().optional(),
    centroidZ: schemas_number().finite().optional(),
    filePath: schemas_string().max(240).optional(),
    opened: schemas_boolean().optional(),
    saved: schemas_boolean().optional(),
    closed: schemas_boolean().optional(),
    loadWarnings: array(schemas_string().max(1024)).max(32).optional(),
    message: schemas_string().max(4096).optional(),
    exported: schemas_boolean().optional(),
    stepFormat: schemas_enum(["AP203", "AP214", "AP242"]).optional(),
    preflightPassed: schemas_boolean().optional(),
    preflightId: schemas_string().max(128).optional(),
    preflightUtc: schemas_string().datetime({ offset: true }).optional(),
    plannedOperation: schemas_string().max(128).optional(),
    featureTreeFingerprint: schemas_string().regex(/^[A-Fa-f0-9]{64}$/).optional(),
    featureTreeTotalCount: schemas_number().int().nonnegative().optional(),
    featureTreeReturnedCount: schemas_number().int().nonnegative().max(128).optional(),
    featureTreeTruncated: schemas_boolean().optional(),
    features: array(FeatureTreeNodeSchema).max(128).optional(),
    assemblyReadAvailable: schemas_boolean().optional(),
    isAssembly: schemas_boolean().optional(),
    rootComponent: AssemblyComponentNodeSchema.nullable().optional(),
    components: array(AssemblyComponentNodeSchema).max(128).optional(),
    componentCount: schemas_number().int().nonnegative().optional(),
    returnedComponentCount: schemas_number()
        .int()
        .nonnegative()
        .max(128)
        .optional(),
    componentCountComplete: schemas_boolean().optional(),
    assemblyStructureTruncated: schemas_boolean().optional(),
    depthTruncated: schemas_boolean().optional(),
    componentLimitTruncated: schemas_boolean().optional(),
    maxDepth: schemas_number().int().min(0).max(32).optional(),
    maxComponents: schemas_number().int().min(1).max(128).optional(),
    assemblyStructureFingerprint: schemas_string()
        .regex(/^[A-Fa-f0-9]{64}$/)
        .optional(),
    draftingReadAvailable: schemas_boolean().optional(),
    hasDrawingSheets: schemas_boolean().optional(),
    sheets: array(DraftingSheetNodeSchema).max(64).optional(),
    views: array(DraftingViewNodeSchema).max(128).optional(),
    sheetCount: schemas_number().int().nonnegative().optional(),
    returnedSheetCount: schemas_number().int().nonnegative().max(64).optional(),
    sheetCountComplete: schemas_boolean().optional(),
    viewCount: schemas_number().int().nonnegative().optional(),
    returnedViewCount: schemas_number().int().nonnegative().max(128).optional(),
    viewCountComplete: schemas_boolean().optional(),
    draftingStructureTruncated: schemas_boolean().optional(),
    sheetLimitTruncated: schemas_boolean().optional(),
    viewLimitTruncated: schemas_boolean().optional(),
    maxSheets: schemas_number().int().min(1).max(64).optional(),
    maxViews: schemas_number().int().min(1).max(128).optional(),
    draftingStructureFingerprint: schemas_string()
        .regex(/^[A-Fa-f0-9]{64}$/)
        .optional(),
    captured: schemas_boolean().optional(),
    screenshotBytes: schemas_number().int().positive().optional(),
    screenshotSha256: schemas_string().regex(/^[A-Fa-f0-9]{64}$/).optional(),
})
    .strict();
const CaeCapabilityResultSchema = object({
    available: schemas_boolean(),
    licensed: schemas_boolean(),
    applicationName: schemas_string().max(256),
    adapterId: schemas_string().max(128),
    compatibilityStatus: schemas_enum(["verified", "unsupported"]),
    unsupportedReason: schemas_string().max(4096),
})
    .strict()
    .superRefine((value, context) => {
    if (value.available && value.unsupportedReason !== "") {
        context.addIssue({
            code: "custom",
            message: "Available CAE capability must have an empty unsupportedReason.",
            path: ["unsupportedReason"],
        });
    }
    if (!value.available && value.unsupportedReason === "") {
        context.addIssue({
            code: "custom",
            message: "Unavailable CAE capability must explain why it is unsupported.",
            path: ["unsupportedReason"],
        });
    }
    if (value.compatibilityStatus === "unsupported" &&
        !value.adapterId.startsWith("unsupported:")) {
        context.addIssue({
            code: "custom",
            message: "Unsupported compatibility must use an unsupported adapter ID.",
            path: ["adapterId"],
        });
    }
});
const BridgeErrorPayloadSchema = object({
    code: schemas_string().min(1).max(128),
    message: schemas_string().min(1).max(4096),
    retryable: schemas_boolean(),
})
    .strict();
const BridgeResponseSchema = object({
    protocolVersion: literal(PROTOCOL_VERSION),
    requestId: schemas_string().uuid(),
    ok: schemas_boolean(),
    result: BridgeResultSchema.nullable(),
    error: BridgeErrorPayloadSchema.nullable(),
    durationMs: schemas_number().int().nonnegative(),
})
    .strict()
    .superRefine((value, context) => {
    if (value.ok && value.result === null) {
        context.addIssue({
            code: "custom",
            message: "Successful responses require a result.",
            path: ["result"],
        });
    }
    if (!value.ok && value.error === null) {
        context.addIssue({
            code: "custom",
            message: "Failed responses require an error.",
            path: ["error"],
        });
    }
});
const BridgeSessionSchema = object({
    protocolVersion: literal(PROTOCOL_VERSION),
    pipeName: schemas_string()
        .regex(/^nx-codex-[A-Za-z0-9-]+$/)
        .max(128),
    token: schemas_string().min(32).max(256),
    processId: schemas_number().int().positive(),
    createdUtc: schemas_string().datetime({ offset: true }),
    expiresUtc: schemas_string().datetime({ offset: true }),
})
    .strict();
function createBridgeRequest(session, operation, args, timeoutMs) {
    const safeTimeout = Math.min(Math.max(timeoutMs, 1_000), 120_000);
    return BridgeRequestSchema.parse({
        protocolVersion: PROTOCOL_VERSION,
        requestId: randomUUID(),
        operation,
        token: session.token,
        deadlineUtc: new Date(Date.now() + safeTimeout).toISOString(),
        arguments: args,
    });
}

;// CONCATENATED MODULE: ./src/errors.ts
class BridgeUnavailableError extends Error {
    constructor(message) {
        super(message);
        this.name = "BridgeUnavailableError";
    }
}
class BridgeProtocolError extends Error {
    constructor(message) {
        super(message);
        this.name = "BridgeProtocolError";
    }
}
class BridgeOperationError extends Error {
    code;
    retryable;
    constructor(code, message, retryable) {
        super(message);
        this.name = "BridgeOperationError";
        this.code = code;
        this.retryable = retryable;
    }
}
class PathPolicyError extends Error {
    code;
    constructor(code, message) {
        super(message);
        this.name = "PathPolicyError";
        this.code = code;
    }
}
function publicErrorMessage(error) {
    if (error instanceof BridgeOperationError) {
        return `${error.code}: ${error.message}`;
    }
    if (error instanceof BridgeUnavailableError ||
        error instanceof BridgeProtocolError) {
        return error.message;
    }
    if (error instanceof PathPolicyError) {
        return `${error.code}: ${error.message}`;
    }
    return "The NX bridge returned an unexpected internal error.";
}

;// CONCATENATED MODULE: ./src/path-policy.ts





const MAX_POLICY_BYTES = 16 * 1024;
const MAX_PATH_LENGTH = 240;
const RESERVED_DEVICE_NAME = /^(?:con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\..*)?$/i;
const PolicySchema = object({
    version: literal(1),
    allowedRoots: array(schemas_string().min(3).max(MAX_PATH_LENGTH))
        .min(1)
        .max(8),
})
    .strict();
function policyFilePath() {
    const configured = process.env.NX_CODEX_POLICY_FILE;
    if (configured) {
        return external_node_path_default().win32.normalize(configured);
    }
    const localAppData = process.env.LOCALAPPDATA ??
        external_node_path_default().win32.join(external_node_os_default().homedir(), "AppData", "Local");
    return external_node_path_default().win32.join(localAppData, "NXCodex", "policy.json");
}
function rejectUnsafeWindowsSyntax(value, label) {
    if (value.length === 0 || value.length > MAX_PATH_LENGTH) {
        throw new PathPolicyError("PATH_NOT_ALLOWED", `${label} must be between 1 and ${MAX_PATH_LENGTH} characters.`);
    }
    if (value.startsWith("\\\\") ||
        value.startsWith("//") ||
        /^\\\\[.?]\\/.test(value) ||
        /^\\\?\?\\/.test(value)) {
        throw new PathPolicyError("PATH_NOT_ALLOWED", `${label} must be a local drive path; UNC and device paths are forbidden.`);
    }
    if (!/^[A-Za-z]:[\\/]/.test(value) || !external_node_path_default().win32.isAbsolute(value)) {
        throw new PathPolicyError("PATH_NOT_ALLOWED", `${label} must be an absolute local Windows path.`);
    }
    if (value.slice(2).includes(":")) {
        throw new PathPolicyError("PATH_NOT_ALLOWED", `${label} must not contain an alternate data stream.`);
    }
    const segments = value.slice(3).split(/[\\/]/);
    for (const segment of segments) {
        if (segment === "" || segment === "." || segment === "..") {
            throw new PathPolicyError("PATH_NOT_ALLOWED", `${label} contains an empty or relative path segment.`);
        }
        if (/[. ]$/.test(segment) || RESERVED_DEVICE_NAME.test(segment)) {
            throw new PathPolicyError("PATH_NOT_ALLOWED", `${label} contains a forbidden Windows path segment.`);
        }
    }
    return external_node_path_default().win32.normalize(value);
}
async function assertNoReparsePoints(absolutePath, includeLeaf) {
    const parsed = external_node_path_default().win32.parse(absolutePath);
    const relativeSegments = absolutePath
        .slice(parsed.root.length)
        .split("\\")
        .filter(Boolean);
    const count = includeLeaf
        ? relativeSegments.length
        : Math.max(0, relativeSegments.length - 1);
    let current = parsed.root;
    for (let index = 0; index < count; index += 1) {
        current = external_node_path_default().win32.join(current, relativeSegments[index]);
        let info;
        try {
            info = await (0,promises_namespaceObject.lstat)(current);
        }
        catch {
            throw new PathPolicyError("PATH_NOT_ALLOWED", `Path component does not exist: ${current}`);
        }
        if (info.isSymbolicLink()) {
            throw new PathPolicyError("PATH_NOT_ALLOWED", "Symbolic links and directory junctions are forbidden by the file policy.");
        }
    }
}
function isWithinRoot(candidate, root) {
    const normalizedCandidate = candidate.toLocaleLowerCase("en-US");
    const normalizedRoot = root.toLocaleLowerCase("en-US");
    return (normalizedCandidate === normalizedRoot ||
        normalizedCandidate.startsWith(`${normalizedRoot}\\`));
}
async function loadAllowedRoots() {
    const file = policyFilePath();
    let text;
    try {
        const bytes = await (0,promises_namespaceObject.readFile)(file);
        if (bytes.byteLength > MAX_POLICY_BYTES) {
            throw new PathPolicyError("POLICY_INVALID", "NX Codex file policy exceeds 16 KiB.");
        }
        text = bytes.toString("utf8");
    }
    catch (error) {
        if (error instanceof PathPolicyError) {
            throw error;
        }
        throw new PathPolicyError("POLICY_UNAVAILABLE", `NX Codex file policy is unavailable at ${file}. Run configure-file-policy.ps1 first.`);
    }
    let raw;
    try {
        raw = JSON.parse(text);
    }
    catch {
        throw new PathPolicyError("POLICY_INVALID", "NX Codex file policy is not valid JSON.");
    }
    const policy = PolicySchema.safeParse(raw);
    if (!policy.success) {
        throw new PathPolicyError("POLICY_INVALID", `NX Codex file policy is invalid: ${policy.error.issues[0]?.message ?? "unknown validation error"}`);
    }
    const roots = [];
    for (const configuredRoot of policy.data.allowedRoots) {
        const root = rejectUnsafeWindowsSyntax(configuredRoot, "Allowed root");
        await assertNoReparsePoints(root, true);
        try {
            await (0,promises_namespaceObject.realpath)(root);
        }
        catch {
            throw new PathPolicyError("POLICY_INVALID", `Allowed root does not exist or cannot be resolved: ${root}`);
        }
        roots.push(root.replace(/[\\]+$/, ""));
    }
    return [...new Set(roots.map((root) => root.toLocaleLowerCase("en-US")))].map((lowerRoot) => roots.find((root) => root.toLocaleLowerCase("en-US") === lowerRoot));
}
async function validatePartPath(suppliedPath, intent, configuredRoots) {
    const candidate = rejectUnsafeWindowsSyntax(suppliedPath, "filePath");
    if (external_node_path_default().win32.extname(candidate).toLocaleLowerCase("en-US") !== ".prt") {
        throw new PathPolicyError("PATH_NOT_ALLOWED", "Only Siemens NX .prt files are allowed.");
    }
    const roots = configuredRoots ?? (await loadAllowedRoots());
    await assertNoReparsePoints(candidate, false);
    let exists = false;
    try {
        const info = await (0,promises_namespaceObject.lstat)(candidate);
        exists = true;
        if (info.isSymbolicLink() || !info.isFile()) {
            throw new PathPolicyError("PATH_NOT_ALLOWED", "filePath must refer to a regular, non-reparse file.");
        }
    }
    catch (error) {
        if (error instanceof PathPolicyError) {
            throw error;
        }
    }
    if (intent === "open" && !exists) {
        throw new PathPolicyError("FILE_NOT_FOUND", "The requested NX part does not exist.");
    }
    if (intent === "create" && exists) {
        throw new PathPolicyError("TARGET_EXISTS", "The destination already exists; NX Codex never overwrites a part.");
    }
    const parent = external_node_path_default().win32.dirname(candidate);
    let canonicalParent;
    try {
        canonicalParent = external_node_path_default().win32.normalize(await (0,promises_namespaceObject.realpath)(parent));
    }
    catch {
        throw new PathPolicyError("PATH_NOT_ALLOWED", "The destination directory does not exist or cannot be resolved.");
    }
    const canonicalCandidate = external_node_path_default().win32.join(canonicalParent, external_node_path_default().win32.basename(candidate));
    const canonicalRoots = await Promise.all(roots.map(async (root) => external_node_path_default().win32.normalize(await (0,promises_namespaceObject.realpath)(root))));
    if (!canonicalRoots.some((root) => isWithinRoot(canonicalCandidate, root))) {
        throw new PathPolicyError("PATH_NOT_ALLOWED", "Canonical filePath escapes every configured allowed root.");
    }
    return canonicalCandidate;
}
/**
 * Validate a STEP export destination using the same no-traversal, no-reparse,
 * allowed-root policy as native NX part files.  STEP is an output-only path:
 * existing destinations are never accepted.
 */
async function validateStepPath(suppliedPath, intent = "create", configuredRoots) {
    const candidate = rejectUnsafeWindowsSyntax(suppliedPath, "filePath");
    const extension = external_node_path_default().win32.extname(candidate).toLocaleLowerCase("en-US");
    if (extension !== ".stp" && extension !== ".step") {
        throw new PathPolicyError("PATH_NOT_ALLOWED", "Only STEP .stp or .step export files are allowed.");
    }
    const roots = configuredRoots ?? (await loadAllowedRoots());
    await assertNoReparsePoints(candidate, false);
    let exists = false;
    try {
        const info = await (0,promises_namespaceObject.lstat)(candidate);
        exists = true;
        if (info.isSymbolicLink() || !info.isFile()) {
            throw new PathPolicyError("PATH_NOT_ALLOWED", "filePath must refer to a regular, non-reparse file.");
        }
    }
    catch (error) {
        if (error instanceof PathPolicyError) {
            throw error;
        }
    }
    if (intent === "create" && exists) {
        throw new PathPolicyError("TARGET_EXISTS", "The STEP destination already exists; NX Codex never overwrites exports.");
    }
    const parent = external_node_path_default().win32.dirname(candidate);
    let canonicalParent;
    try {
        canonicalParent = external_node_path_default().win32.normalize(await (0,promises_namespaceObject.realpath)(parent));
    }
    catch {
        throw new PathPolicyError("PATH_NOT_ALLOWED", "The destination directory does not exist or cannot be resolved.");
    }
    const canonicalCandidate = external_node_path_default().win32.join(canonicalParent, external_node_path_default().win32.basename(candidate));
    const canonicalRoots = await Promise.all(roots.map(async (root) => external_node_path_default().win32.normalize(await (0,promises_namespaceObject.realpath)(root))));
    if (!canonicalRoots.some((root) => isWithinRoot(canonicalCandidate, root))) {
        throw new PathPolicyError("PATH_NOT_ALLOWED", "Canonical filePath escapes every configured allowed root.");
    }
    return canonicalCandidate;
}
/** Validate a no-overwrite PNG evidence destination below an allowed root. */
async function validatePngPath(suppliedPath, intent = "create", configuredRoots) {
    const candidate = rejectUnsafeWindowsSyntax(suppliedPath, "filePath");
    if (external_node_path_default().win32.extname(candidate).toLocaleLowerCase("en-US") !== ".png") {
        throw new PathPolicyError("PATH_NOT_ALLOWED", "Only PNG .png screenshot files are allowed.");
    }
    const roots = configuredRoots ?? (await loadAllowedRoots());
    await assertNoReparsePoints(candidate, false);
    let exists = false;
    try {
        const info = await (0,promises_namespaceObject.lstat)(candidate);
        exists = true;
        if (info.isSymbolicLink() || !info.isFile()) {
            throw new PathPolicyError("PATH_NOT_ALLOWED", "filePath must refer to a regular, non-reparse file.");
        }
    }
    catch (error) {
        if (error instanceof PathPolicyError)
            throw error;
    }
    if (intent === "create" && exists) {
        throw new PathPolicyError("TARGET_EXISTS", "The screenshot destination already exists; NX Codex never overwrites evidence files.");
    }
    const parent = external_node_path_default().win32.dirname(candidate);
    let canonicalParent;
    try {
        canonicalParent = external_node_path_default().win32.normalize(await (0,promises_namespaceObject.realpath)(parent));
    }
    catch {
        throw new PathPolicyError("PATH_NOT_ALLOWED", "The destination directory does not exist or cannot be resolved.");
    }
    const canonicalCandidate = external_node_path_default().win32.join(canonicalParent, external_node_path_default().win32.basename(candidate));
    const canonicalRoots = await Promise.all(roots.map(async (root) => external_node_path_default().win32.normalize(await (0,promises_namespaceObject.realpath)(root))));
    if (!canonicalRoots.some((root) => isWithinRoot(canonicalCandidate, root))) {
        throw new PathPolicyError("PATH_NOT_ALLOWED", "Canonical filePath escapes every configured allowed root.");
    }
    return canonicalCandidate;
}

;// CONCATENATED MODULE: ./src/version-adapter.ts
const READ_ONLY_CAPABILITIES = [
    "health",
    "get_capabilities",
    "get_session_state",
    "get_assembly_capability",
    "get_drafting_capability",
    "get_cae_capability",
    "get_cam_capability",
];
const NX12_0_2_9_CAPABILITIES = [
    ...READ_ONLY_CAPABILITIES,
    "get_assembly_structure",
    "get_drafting_structure",
    "create_test_drawing",
    "preflight_modeling",
    "get_feature_tree",
    "capture_screenshot",
    "new_part",
    "open_part",
    "save_as",
    "close_part",
    "create_block",
    "create_rectangle_sketch",
    "extrude_sketch",
    "revolve_sketch",
    "create_simple_through_hole",
    "boolean_bodies",
    "fillet_vertical_edges",
    "measure_work_part",
    "export_step",
    "undo_transaction",
];
function selectVersionProfile(nxOpenAssemblyVersion) {
    if (nxOpenAssemblyVersion === "12.0.2.9") {
        return {
            adapterId: "nx12.0.2.9",
            adapterContractId: "nx12.0.2.9-required-api-v1",
            compatibilityStatus: "verified",
            nxOpenAssemblyVersion,
            capabilities: NX12_0_2_9_CAPABILITIES,
        };
    }
    return {
        adapterId: `unsupported:${nxOpenAssemblyVersion}`,
        adapterContractId: "none",
        compatibilityStatus: "unsupported",
        nxOpenAssemblyVersion,
        capabilities: READ_ONLY_CAPABILITIES,
    };
}

;// CONCATENATED MODULE: ./src/fault-injection.ts

class DeterministicFaultInjector {
    rules;
    cursor = 0;
    eventsValue = [];
    constructor(rules) {
        this.rules = rules;
        const ids = new Set();
        for (const rule of rules) {
            if (typeof rule.id !== "string" ||
                rule.id.trim().length === 0 ||
                ids.has(rule.id)) {
                throw new Error("Fault injection rule IDs must be non-empty and unique.");
            }
            ids.add(rule.id);
            if (!new Set(["before_execution", "after_execution"]).has(rule.phase)) {
                throw new Error("Fault injection phase is not supported.");
            }
            if (!new Set(["modal_dialog", "disconnect", "crash", "timeout"]).has(rule.kind)) {
                throw new Error("Fault injection kind is not supported.");
            }
            if (rule.operation !== undefined &&
                !BridgeOperationSchema.safeParse(rule.operation).success) {
                throw new Error("Fault injection operation is not a bridge operation.");
            }
            if (rule.delayMs !== undefined &&
                (!Number.isSafeInteger(rule.delayMs) || rule.delayMs < 0)) {
                throw new Error("Fault injection delayMs must be a non-negative integer.");
            }
        }
    }
    take(phase, operation, requestId) {
        const rule = this.rules[this.cursor];
        if (rule === undefined ||
            rule.phase !== phase ||
            (rule.operation !== undefined && rule.operation !== operation)) {
            return undefined;
        }
        this.cursor += 1;
        this.eventsValue.push({
            id: rule.id,
            kind: rule.kind,
            phase,
            operation,
            requestId,
        });
        return rule;
    }
    get events() {
        return this.eventsValue;
    }
    get remainingRuleIds() {
        return this.rules.slice(this.cursor).map((rule) => rule.id);
    }
}

;// CONCATENATED MODULE: ./src/mock-bridge.ts











async function removeTransientFile(filePath) {
    for (let attempt = 0; attempt < 6; attempt += 1) {
        try {
            await (0,promises_namespaceObject.rm)(filePath, { force: true });
            return;
        }
        catch (error) {
            const code = error.code ?? "";
            if (!["EBUSY", "EPERM"].includes(code) || attempt === 5)
                throw error;
            await new Promise((resolve) => {
                setTimeout(resolve, 25 * (attempt + 1));
            });
        }
    }
}
function boundedAssemblyText(value) {
    return value.length <= 256 ? value : value.slice(0, 256);
}
function boundedAssemblyStructure(root, maxDepth, maxComponents) {
    const rootChildren = root.children ?? [];
    let depthTruncated = maxDepth === 0 && rootChildren.length > 0;
    let componentLimitTruncated = false;
    const rootComponent = {
        index: 0,
        parentIndex: null,
        depth: 0,
        instanceName: boundedAssemblyText(root.instanceName),
        displayName: boundedAssemblyText(root.displayName),
        prototypePartIdentifier: boundedAssemblyText(root.prototypePartIdentifier),
        suppressed: root.suppressed,
        loadState: root.loadState,
        representationMode: root.representationMode,
        childCount: rootChildren.length,
        ...(depthTruncated ? { childrenTruncated: true } : {}),
    };
    const components = [];
    const pending = [];
    const enqueue = (children, parentIndex, depth) => {
        let truncated = false;
        for (const child of children) {
            if (components.length + pending.length >= maxComponents) {
                componentLimitTruncated = true;
                truncated = true;
                break;
            }
            pending.push({ component: child, parentIndex, depth });
        }
        return truncated;
    };
    if (maxDepth > 0 && enqueue(rootChildren, 0, 1)) {
        rootComponent.childrenTruncated = true;
    }
    while (pending.length > 0 && components.length < maxComponents) {
        const item = pending.shift();
        if (item === undefined)
            break;
        const children = item.component.children ?? [];
        const node = {
            index: components.length + 1,
            parentIndex: item.parentIndex,
            depth: item.depth,
            instanceName: boundedAssemblyText(item.component.instanceName),
            displayName: boundedAssemblyText(item.component.displayName),
            prototypePartIdentifier: boundedAssemblyText(item.component.prototypePartIdentifier),
            suppressed: item.component.suppressed,
            loadState: item.component.loadState,
            representationMode: item.component.representationMode,
            childCount: children.length,
        };
        components.push(node);
        if (item.depth >= maxDepth && children.length > 0) {
            depthTruncated = true;
            node.childrenTruncated = true;
        }
        else if (children.length > 0 && enqueue(children, node.index, item.depth + 1)) {
            node.childrenTruncated = true;
        }
    }
    if (pending.length > 0)
        componentLimitTruncated = true;
    const componentCountComplete = !depthTruncated && !componentLimitTruncated;
    const fingerprint = (0,external_node_crypto_namespaceObject.createHash)("sha256")
        .update(JSON.stringify({
        rootComponent,
        components,
        depthTruncated,
        componentLimitTruncated,
    }), "utf8")
        .digest("hex");
    return {
        rootComponent,
        components,
        componentCountComplete,
        depthTruncated,
        componentLimitTruncated,
        fingerprint,
    };
}
function boundedDraftingStructure(configuredSheets, maxSheets, maxViews) {
    const returnedConfiguredSheets = configuredSheets.slice(0, maxSheets);
    const sheetLimitTruncated = returnedConfiguredSheets.length < configuredSheets.length;
    let viewLimitTruncated = false;
    let viewCount = 0;
    const sheets = [];
    const views = [];
    for (const [sheetIndex, configuredSheet] of returnedConfiguredSheets.entries()) {
        const configuredViews = configuredSheet.views ?? [];
        viewCount += configuredViews.length;
        const remainingViews = Math.max(0, maxViews - views.length);
        const returnedConfiguredViews = configuredViews.slice(0, remainingViews);
        const viewsTruncated = returnedConfiguredViews.length < configuredViews.length;
        if (viewsTruncated)
            viewLimitTruncated = true;
        sheets.push({
            index: sheetIndex,
            journalIdentifier: configuredSheet.journalIdentifier.slice(0, 1024),
            name: configuredSheet.name.slice(0, 256),
            length: configuredSheet.length,
            height: configuredSheet.height,
            units: configuredSheet.units,
            projectionAngle: configuredSheet.projectionAngle,
            scaleNumerator: configuredSheet.scaleNumerator,
            scaleDenominator: configuredSheet.scaleDenominator,
            isOutOfDate: configuredSheet.isOutOfDate,
            viewCount: configuredViews.length,
            ...(viewsTruncated ? { viewsTruncated: true } : {}),
        });
        for (const configuredView of returnedConfiguredViews) {
            views.push({
                index: views.length,
                sheetIndex,
                journalIdentifier: configuredView.journalIdentifier.slice(0, 1024),
                name: configuredView.name.slice(0, 256),
                scale: configuredView.scale,
                originX: configuredView.originX,
                originY: configuredView.originY,
                originZ: configuredView.originZ,
                isOutOfDate: configuredView.isOutOfDate,
                isBroken: configuredView.isBroken,
                isDecoration: configuredView.isDecoration,
                isSlave: configuredView.isSlave,
            });
        }
    }
    const fingerprint = (0,external_node_crypto_namespaceObject.createHash)("sha256")
        .update(JSON.stringify({
        sheetCount: configuredSheets.length,
        viewCount,
        viewCountComplete: !sheetLimitTruncated,
        sheets,
        views,
        sheetLimitTruncated,
        viewLimitTruncated,
    }), "utf8")
        .digest("hex");
    return {
        sheets,
        views,
        sheetCount: configuredSheets.length,
        viewCount,
        viewCountComplete: !sheetLimitTruncated,
        sheetLimitTruncated,
        viewLimitTruncated,
        fingerprint,
    };
}
function mock_bridge_success(request, result, started) {
    return {
        protocolVersion: PROTOCOL_VERSION,
        requestId: request.requestId,
        ok: true,
        result,
        error: null,
        durationMs: Date.now() - started,
    };
}
function failure(requestId, code, message, started, retryable = false) {
    return {
        protocolVersion: PROTOCOL_VERSION,
        requestId,
        ok: false,
        result: null,
        error: { code, message, retryable },
        durationMs: Date.now() - started,
    };
}
function boxesHavePositiveOverlap(first, second) {
    const tolerance = 1e-6;
    return (Math.min(first.maxX, second.maxX) - Math.max(first.minX, second.minX) >
        tolerance &&
        Math.min(first.maxY, second.maxY) - Math.max(first.minY, second.minY) >
            tolerance &&
        Math.min(first.maxZ, second.maxZ) - Math.max(first.minZ, second.minZ) >
            tolerance);
}
function booleanAxisAlignedSolids(target, tool, operation) {
    const xs = [...new Set([target.minX, target.maxX, tool.minX, tool.maxX])].sort((a, b) => a - b);
    const ys = [...new Set([target.minY, target.maxY, tool.minY, tool.maxY])].sort((a, b) => a - b);
    const zs = [...new Set([target.minZ, target.maxZ, tool.minZ, tool.maxZ])].sort((a, b) => a - b);
    const occupied = new Set();
    const key = (x, y, z) => `${x}:${y}:${z}`;
    let volume = 0;
    let firstMomentX = 0;
    let firstMomentY = 0;
    let firstMomentZ = 0;
    let minX = Number.POSITIVE_INFINITY;
    let minY = Number.POSITIVE_INFINITY;
    let minZ = Number.POSITIVE_INFINITY;
    let maxX = Number.NEGATIVE_INFINITY;
    let maxY = Number.NEGATIVE_INFINITY;
    let maxZ = Number.NEGATIVE_INFINITY;
    for (let i = 0; i < xs.length - 1; i += 1) {
        for (let j = 0; j < ys.length - 1; j += 1) {
            for (let k = 0; k < zs.length - 1; k += 1) {
                const x0 = xs[i];
                const x1 = xs[i + 1];
                const y0 = ys[j];
                const y1 = ys[j + 1];
                const z0 = zs[k];
                const z1 = zs[k + 1];
                if (x0 === undefined ||
                    x1 === undefined ||
                    y0 === undefined ||
                    y1 === undefined ||
                    z0 === undefined ||
                    z1 === undefined) {
                    throw new Error("Strict fake Boolean partition was incomplete.");
                }
                const centerX = (x0 + x1) / 2;
                const centerY = (y0 + y1) / 2;
                const centerZ = (z0 + z1) / 2;
                const inTarget = centerX > target.minX &&
                    centerX < target.maxX &&
                    centerY > target.minY &&
                    centerY < target.maxY &&
                    centerZ > target.minZ &&
                    centerZ < target.maxZ;
                const inTool = centerX > tool.minX &&
                    centerX < tool.maxX &&
                    centerY > tool.minY &&
                    centerY < tool.maxY &&
                    centerZ > tool.minZ &&
                    centerZ < tool.maxZ;
                const included = operation === "UNITE"
                    ? inTarget || inTool
                    : operation === "SUBTRACT"
                        ? inTarget && !inTool
                        : inTarget && inTool;
                if (!included)
                    continue;
                occupied.add(key(i, j, k));
                const cellVolume = (x1 - x0) * (y1 - y0) * (z1 - z0);
                volume += cellVolume;
                firstMomentX += centerX * cellVolume;
                firstMomentY += centerY * cellVolume;
                firstMomentZ += centerZ * cellVolume;
                minX = Math.min(minX, x0);
                minY = Math.min(minY, y0);
                minZ = Math.min(minZ, z0);
                maxX = Math.max(maxX, x1);
                maxY = Math.max(maxY, y1);
                maxZ = Math.max(maxZ, z1);
            }
        }
    }
    if (occupied.size === 0 || volume <= 0)
        return null;
    let surfaceArea = 0;
    for (const cellKey of occupied) {
        const indices = cellKey.split(":").map(Number);
        const i = indices[0];
        const j = indices[1];
        const k = indices[2];
        if (i === undefined || j === undefined || k === undefined) {
            throw new Error("Strict fake Boolean cell key was invalid.");
        }
        const x0 = xs[i];
        const x1 = xs[i + 1];
        const y0 = ys[j];
        const y1 = ys[j + 1];
        const z0 = zs[k];
        const z1 = zs[k + 1];
        if (x0 === undefined ||
            x1 === undefined ||
            y0 === undefined ||
            y1 === undefined ||
            z0 === undefined ||
            z1 === undefined) {
            throw new Error("Strict fake Boolean surface partition was incomplete.");
        }
        const areaX = (y1 - y0) * (z1 - z0);
        const areaY = (x1 - x0) * (z1 - z0);
        const areaZ = (x1 - x0) * (y1 - y0);
        if (!occupied.has(key(i - 1, j, k)))
            surfaceArea += areaX;
        if (!occupied.has(key(i + 1, j, k)))
            surfaceArea += areaX;
        if (!occupied.has(key(i, j - 1, k)))
            surfaceArea += areaY;
        if (!occupied.has(key(i, j + 1, k)))
            surfaceArea += areaY;
        if (!occupied.has(key(i, j, k - 1)))
            surfaceArea += areaZ;
        if (!occupied.has(key(i, j, k + 1)))
            surfaceArea += areaZ;
    }
    const boundingVolume = (maxX - minX) * (maxY - minY) * (maxZ - minZ);
    return {
        minX,
        minY,
        minZ,
        maxX,
        maxY,
        maxZ,
        surfaceArea,
        volume,
        centroidX: firstMomentX / volume,
        centroidY: firstMomentY / volume,
        centroidZ: firstMomentZ / volume,
        axisAlignedBox: Math.abs(volume - boundingVolume) <= 1e-9,
    };
}
class MockBridge {
    options;
    token = (0,external_node_crypto_namespaceObject.randomBytes)(32).toString("base64url");
    pipeName = `nx-codex-${process.pid}-${(0,external_node_crypto_namespaceObject.randomBytes)(6).toString("hex")}`;
    features = [];
    pendingTransactions = [];
    requestIds = new Set();
    draftingSheets;
    currentPart = "mock-part.prt";
    modified = false;
    testDrawingTransactionId = null;
    server = null;
    discoveryServer = null;
    sessionFile;
    faultInjector;
    constructor(options = {}) {
        this.options = options;
        this.currentPart = options.currentPart ?? "mock-part.prt";
        this.draftingSheets = (options.draftingSheets ?? []).map((sheet) => ({
            ...sheet,
            views: (sheet.views ?? []).map((view) => ({ ...view })),
        }));
        this.faultInjector = new DeterministicFaultInjector(options.faults ?? []);
        this.sessionFile =
            options.sessionFile ??
                external_node_path_default().join(external_node_os_default().tmpdir(), `nx-codex-mock-session-${process.pid}-${(0,external_node_crypto_namespaceObject.randomUUID)()}.json`);
    }
    get descriptorPath() {
        return this.sessionFile;
    }
    get faultEvents() {
        return this.faultInjector.events;
    }
    get remainingFaultRuleIds() {
        return this.faultInjector.remainingRuleIds;
    }
    async start() {
        if (process.platform !== "win32") {
            throw new Error("The mock Named Pipe bridge currently supports Windows only.");
        }
        if (this.server) {
            throw new Error("Mock bridge is already running.");
        }
        this.server = external_node_net_default().createServer((socket) => {
            let buffered = Buffer.alloc(0);
            socket.on("data", (chunk) => {
                buffered = Buffer.concat([buffered, chunk]);
                if (buffered.byteLength > MAX_REQUEST_BYTES) {
                    socket.end(`${JSON.stringify(failure((0,external_node_crypto_namespaceObject.randomUUID)(), "REQUEST_TOO_LARGE", "Request exceeded 64 KiB.", Date.now()))}\n`);
                    return;
                }
                const newline = buffered.indexOf(0x0a);
                if (newline < 0) {
                    return;
                }
                const line = buffered.subarray(0, newline).toString("utf8");
                void this.handleLine(line).then(async (response) => {
                    const parsed = this.parseRequestForFaults(line);
                    const afterFault = response?.ok === true && parsed !== undefined
                        ? this.faultInjector.take("after_execution", parsed.operation, parsed.requestId)
                        : undefined;
                    if (afterFault !== undefined) {
                        const disposition = await this.applyFault(afterFault);
                        if (disposition === null) {
                            socket.destroy();
                        }
                        return;
                    }
                    if (response === null) {
                        socket.destroy();
                        return;
                    }
                    if (response === undefined) {
                        // A modal-dialog/timeout fault deliberately leaves the pipe open.
                        // The client owns the deadline and will close its side.
                        return;
                    }
                    socket.end(`${JSON.stringify(response)}\n`);
                });
            });
        });
        await new Promise((resolve, reject) => {
            this.server?.once("error", reject);
            this.server?.listen(`\\\\.\\pipe\\${this.pipeName}`, resolve);
        });
        const now = Date.now();
        const descriptor = {
            protocolVersion: PROTOCOL_VERSION,
            pipeName: this.pipeName,
            token: this.token,
            processId: process.pid,
            createdUtc: new Date(now).toISOString(),
            expiresUtc: new Date(now + 8 * 60 * 60 * 1000).toISOString(),
        };
        if (this.options.corruptSessionFile) {
            this.discoveryServer = external_node_net_default().createServer((socket) => {
                let request = Buffer.alloc(0);
                socket.on("data", (chunk) => {
                    request = Buffer.concat([request, chunk]);
                    const newline = request.indexOf(0x0a);
                    if (newline < 0) {
                        return;
                    }
                    if (request.subarray(0, newline).toString("ascii") ===
                        "NX_CODEX_DISCOVER 1") {
                        socket.end(`${JSON.stringify(descriptor)}\n`);
                    }
                    else {
                        socket.destroy();
                    }
                });
            });
            await new Promise((resolve, reject) => {
                this.discoveryServer?.once("error", reject);
                this.discoveryServer?.listen(`\\\\.\\pipe\\nx-codex-discovery-${process.pid}`, resolve);
            });
        }
        await (0,promises_namespaceObject.mkdir)(external_node_path_default().dirname(this.sessionFile), {
            recursive: true,
            mode: 0o700,
        });
        if (this.options.corruptSessionFile) {
            await (0,promises_namespaceObject.writeFile)(this.sessionFile, Buffer.from([0x88, 0x7d, 0x1c, 0x28, 0x00, 0xff]), { mode: 0o600 });
        }
        else {
            await (0,promises_namespaceObject.writeFile)(this.sessionFile, JSON.stringify(descriptor), {
                encoding: "utf8",
                mode: 0o600,
            });
        }
    }
    async stop() {
        const server = this.server;
        this.server = null;
        if (server) {
            await new Promise((resolve, reject) => {
                server.close((error) => (error ? reject(error) : resolve()));
            });
        }
        const discoveryServer = this.discoveryServer;
        this.discoveryServer = null;
        if (discoveryServer) {
            await new Promise((resolve, reject) => {
                discoveryServer.close((error) => error ? reject(error) : resolve());
            });
        }
        for (let attempt = 0;; attempt++) {
            try {
                await (0,promises_namespaceObject.rm)(this.sessionFile, { force: true });
                break;
            }
            catch (error) {
                const code = error instanceof Error && "code" in error
                    ? String(error.code)
                    : "";
                if (attempt >= 9 ||
                    !["EBUSY", "EPERM", "EACCES"].includes(code)) {
                    throw error;
                }
                await new Promise((resolve) => setTimeout(resolve, 50 * (attempt + 1)));
            }
        }
    }
    async handleLine(line) {
        const started = Date.now();
        let parsed;
        try {
            parsed = JSON.parse(line);
        }
        catch {
            return failure((0,external_node_crypto_namespaceObject.randomUUID)(), "INVALID_JSON", "Request was not valid JSON.", started);
        }
        const requestResult = BridgeRequestSchema.safeParse(parsed);
        if (!requestResult.success) {
            const requestId = typeof parsed === "object" &&
                parsed !== null &&
                "requestId" in parsed &&
                typeof parsed.requestId === "string"
                ? parsed.requestId
                : (0,external_node_crypto_namespaceObject.randomUUID)();
            return failure(requestId, "INVALID_REQUEST", requestResult.error.issues[0]?.message ?? "Invalid request.", started);
        }
        const request = requestResult.data;
        if (request.token !== this.token) {
            return failure(request.requestId, "UNAUTHORIZED", "Session token was rejected.", started);
        }
        if (Date.parse(request.deadlineUtc) <= Date.now()) {
            return failure(request.requestId, "DEADLINE_EXCEEDED", "Request deadline has expired.", started);
        }
        if (this.requestIds.has(request.requestId)) {
            return failure(request.requestId, "REPLAY_DETECTED", "requestId has already been used.", started);
        }
        this.requestIds.add(request.requestId);
        const beforeFault = this.faultInjector.take("before_execution", request.operation, request.requestId);
        if (beforeFault !== undefined) {
            return await this.applyFault(beforeFault);
        }
        const nxOpenAssemblyVersion = this.options.nxVersion ?? "12.0.2.9";
        const versionProfile = selectVersionProfile(nxOpenAssemblyVersion);
        const base = {
            connected: true,
            status: versionProfile.compatibilityStatus === "verified"
                ? "ready"
                : "compatibility-blocked",
            bridgeVersion: "1.0.0-rc.1+codex.rc1",
            protocolVersion: PROTOCOL_VERSION,
            nxVersion: nxOpenAssemblyVersion,
            nxOpenAssemblyVersion,
            adapterId: versionProfile.adapterId,
            adapterContractId: versionProfile.adapterContractId,
            compatibilityStatus: versionProfile.compatibilityStatus,
            processId: process.pid,
            dispatcher: "mock-main-thread",
        };
        const allowedRoots = this.options.allowedRoots ?? [
            external_node_path_default().dirname(this.sessionFile),
        ];
        try {
            if (!versionProfile.capabilities.includes(request.operation)) {
                return failure(request.requestId, "NX_VERSION_NOT_SUPPORTED", `Operation '${request.operation}' is unavailable because NXOpen assembly version ${nxOpenAssemblyVersion} has no verified typed adapter.`, started);
            }
            switch (request.operation) {
                case "health":
                    return mock_bridge_success(request, base, started);
                case "get_capabilities":
                    return mock_bridge_success(request, {
                        ...base,
                        capabilities: [...versionProfile.capabilities],
                        allowedRoots,
                    }, started);
                case "get_session_state":
                    return mock_bridge_success(request, {
                        ...base,
                        application: this.options.application ?? "Modeling",
                        ...(this.currentPart === null
                            ? {}
                            : {
                                workPart: this.currentPart,
                                displayPart: this.currentPart,
                            }),
                        units: "Millimeters",
                        modified: this.modified,
                        featureCount: this.features.length,
                        bodyCount: this.solidBodyCount(),
                        solidBodyCount: this.solidBodyCount(),
                    }, started);
                case "get_assembly_capability":
                case "get_drafting_capability":
                case "get_cae_capability":
                case "get_cam_capability": {
                    const moduleName = request.operation
                        .replace(/^get_/, "")
                        .replace(/_capability$/, "");
                    if (moduleName === "cae") {
                        return mock_bridge_success(request, versionProfile.compatibilityStatus === "verified"
                            ? {
                                available: true,
                                licensed: this.options.licensedModules?.cae ?? false,
                                applicationName: this.options.application ?? "Modeling",
                                adapterId: versionProfile.adapterId,
                                compatibilityStatus: versionProfile.compatibilityStatus,
                                unsupportedReason: "",
                            }
                            : {
                                available: false,
                                licensed: false,
                                applicationName: this.options.application ?? "Modeling",
                                adapterId: versionProfile.adapterId,
                                compatibilityStatus: versionProfile.compatibilityStatus,
                                unsupportedReason: `NXOpen assembly version ${nxOpenAssemblyVersion} has no verified ${moduleName} capability adapter.`,
                            }, started);
                    }
                    return mock_bridge_success(request, versionProfile.compatibilityStatus === "verified"
                        ? {
                            ...base,
                            available: true,
                            licensed: this.options.licensedModules?.[moduleName] ?? false,
                            unsupportedReason: "",
                        }
                        : {
                            ...base,
                            available: false,
                            licensed: false,
                            unsupportedReason: `NXOpen assembly version ${nxOpenAssemblyVersion} has no verified ${moduleName} capability adapter.`,
                        }, started);
                }
                case "get_assembly_structure": {
                    const maxDepth = request.arguments.maxDepth ?? 8;
                    const maxComponents = request.arguments.maxComponents ?? 128;
                    const common = {
                        ...base,
                        application: "Modeling",
                        ...(this.currentPart === null
                            ? {}
                            : {
                                workPart: this.currentPart,
                                displayPart: this.currentPart,
                            }),
                        units: "Millimeters",
                        modified: this.modified,
                        featureCount: this.features.length,
                        bodyCount: this.solidBodyCount(),
                        solidBodyCount: this.solidBodyCount(),
                        maxDepth,
                        maxComponents,
                    };
                    if (this.options.licensedModules?.assembly !== true) {
                        return mock_bridge_success(request, {
                            ...common,
                            available: true,
                            licensed: false,
                            assemblyReadAvailable: false,
                            unsupportedReason: "No assembly license is active in the current NX session. No license was reserved or released, and the NX application was not changed.",
                            components: [],
                            componentCount: 0,
                            returnedComponentCount: 0,
                            componentCountComplete: false,
                            assemblyStructureTruncated: false,
                            depthTruncated: false,
                            componentLimitTruncated: false,
                            message: "Strict fake failed closed before traversing the configured assembly fixture. This does not imply that the installation has no assembly entitlement.",
                        }, started);
                    }
                    if (this.currentPart === null) {
                        return mock_bridge_success(request, {
                            ...common,
                            available: true,
                            licensed: true,
                            assemblyReadAvailable: false,
                            unsupportedReason: "No work part is loaded in the current NX session.",
                            components: [],
                            componentCount: 0,
                            returnedComponentCount: 0,
                            componentCountComplete: false,
                            assemblyStructureTruncated: false,
                            depthTruncated: false,
                            componentLimitTruncated: false,
                        }, started);
                    }
                    const root = this.options.assemblyRoot ?? null;
                    if (root === null) {
                        const fingerprint = (0,external_node_crypto_namespaceObject.createHash)("sha256")
                            .update("piece-part", "utf8")
                            .digest("hex");
                        return mock_bridge_success(request, {
                            ...common,
                            available: true,
                            licensed: true,
                            assemblyReadAvailable: true,
                            unsupportedReason: "",
                            isAssembly: false,
                            rootComponent: null,
                            components: [],
                            componentCount: 0,
                            returnedComponentCount: 0,
                            componentCountComplete: true,
                            assemblyStructureTruncated: false,
                            depthTruncated: false,
                            componentLimitTruncated: false,
                            assemblyStructureFingerprint: fingerprint,
                            message: "The strict fake work part is not an assembly; no components were returned.",
                        }, started);
                    }
                    const structure = boundedAssemblyStructure(root, maxDepth, maxComponents);
                    return mock_bridge_success(request, {
                        ...common,
                        available: true,
                        licensed: true,
                        assemblyReadAvailable: true,
                        unsupportedReason: "",
                        isAssembly: true,
                        rootComponent: structure.rootComponent,
                        components: structure.components,
                        componentCount: structure.components.length,
                        returnedComponentCount: structure.components.length,
                        componentCountComplete: structure.componentCountComplete,
                        assemblyStructureTruncated: structure.depthTruncated ||
                            structure.componentLimitTruncated,
                        depthTruncated: structure.depthTruncated,
                        componentLimitTruncated: structure.componentLimitTruncated,
                        assemblyStructureFingerprint: structure.fingerprint,
                        message: structure.componentCountComplete
                            ? "Strict fake returned the complete configured assembly tree within the requested limits without changing state."
                            : "Strict fake returned a bounded assembly tree; componentCount is a lower bound because the requested limits truncated the fixture.",
                    }, started);
                }
                case "get_drafting_structure": {
                    const maxSheets = request.arguments.maxSheets ?? 32;
                    const maxViews = request.arguments.maxViews ?? 128;
                    const common = {
                        ...base,
                        application: this.options.application ?? "Modeling",
                        ...(this.currentPart === null
                            ? {}
                            : {
                                workPart: this.currentPart,
                                displayPart: this.currentPart,
                            }),
                        units: "Millimeters",
                        modified: this.modified,
                        featureCount: this.features.length,
                        bodyCount: this.solidBodyCount(),
                        solidBodyCount: this.solidBodyCount(),
                        maxSheets,
                        maxViews,
                    };
                    if (this.options.licensedModules?.drafting !== true) {
                        return mock_bridge_success(request, {
                            ...common,
                            available: true,
                            licensed: false,
                            draftingReadAvailable: false,
                            unsupportedReason: "No drafting license is active in the current NX session. No license was reserved or released, and the NX application was not changed.",
                            sheets: [],
                            views: [],
                            sheetCount: 0,
                            returnedSheetCount: 0,
                            sheetCountComplete: false,
                            viewCount: 0,
                            returnedViewCount: 0,
                            viewCountComplete: false,
                            draftingStructureTruncated: false,
                            sheetLimitTruncated: false,
                            viewLimitTruncated: false,
                            message: "Strict fake failed closed before reading the configured drafting fixture. This does not imply that the installation has no drafting entitlement.",
                        }, started);
                    }
                    if (this.currentPart === null) {
                        return mock_bridge_success(request, {
                            ...common,
                            available: true,
                            licensed: true,
                            draftingReadAvailable: false,
                            unsupportedReason: "No work part is loaded in the current NX session.",
                            sheets: [],
                            views: [],
                            sheetCount: 0,
                            returnedSheetCount: 0,
                            sheetCountComplete: false,
                            viewCount: 0,
                            returnedViewCount: 0,
                            viewCountComplete: false,
                            draftingStructureTruncated: false,
                            sheetLimitTruncated: false,
                            viewLimitTruncated: false,
                        }, started);
                    }
                    const structure = boundedDraftingStructure(this.draftingSheets, maxSheets, maxViews);
                    const truncated = structure.sheetLimitTruncated ||
                        structure.viewLimitTruncated;
                    return mock_bridge_success(request, {
                        ...common,
                        available: true,
                        licensed: true,
                        draftingReadAvailable: true,
                        unsupportedReason: "",
                        hasDrawingSheets: structure.sheetCount > 0,
                        sheets: structure.sheets,
                        views: structure.views,
                        sheetCount: structure.sheetCount,
                        returnedSheetCount: structure.sheets.length,
                        sheetCountComplete: true,
                        viewCount: structure.viewCount,
                        returnedViewCount: structure.views.length,
                        viewCountComplete: structure.viewCountComplete,
                        draftingStructureTruncated: truncated,
                        sheetLimitTruncated: structure.sheetLimitTruncated,
                        viewLimitTruncated: structure.viewLimitTruncated,
                        draftingStructureFingerprint: structure.fingerprint,
                        message: structure.sheetCount === 0
                            ? "The strict fake work part has no drawing sheets; no drafting views were returned."
                            : truncated
                                ? "Strict fake returned bounded drawing sheets and drafting views without changing state."
                                : "Strict fake returned all configured drawing sheets and drafting views without changing state.",
                    }, started);
                }
                case "preflight_modeling": {
                    if (this.currentPart === null) {
                        return failure(request.requestId, "NO_WORK_PART", "Open or create a part before preflighting geometry.", started);
                    }
                    const preflightFailure = this.preflightFailure(request.arguments);
                    if (preflightFailure !== undefined) {
                        return failure(request.requestId, preflightFailure.code, preflightFailure.message, started);
                    }
                    return mock_bridge_success(request, {
                        ...base,
                        workPart: this.currentPart,
                        displayPart: this.currentPart,
                        units: "Millimeters",
                        modified: this.modified,
                        featureCount: this.features.length,
                        bodyCount: this.solidBodyCount(),
                        solidBodyCount: this.solidBodyCount(),
                        preflightPassed: true,
                        preflightId: `PF-${(0,external_node_crypto_namespaceObject.randomUUID)()}`,
                        preflightUtc: new Date().toISOString(),
                        plannedOperation: request.arguments.plannedOperation,
                        featureTreeFingerprint: this.featureTreeFingerprint(),
                        featureTreeTotalCount: this.features.length,
                        featureTreeReturnedCount: Math.min(this.features.length, 128),
                        featureTreeTruncated: this.features.length > 128,
                        message: "Strict-mock modeling preflight passed without executing the operation.",
                    }, started);
                }
                case "get_feature_tree": {
                    if (this.currentPart === null) {
                        return failure(request.requestId, "NO_WORK_PART", "Open or create a part before reading the feature tree.", started);
                    }
                    const startIndex = Math.max(0, this.features.length - 128);
                    const features = this.features.slice(startIndex).map((feature, offset) => ({
                        index: startIndex + offset,
                        journalIdentifier: feature.journalIdentifier,
                        name: feature.name,
                        featureType: this.mockFeatureType(feature),
                        timestamp: startIndex + offset + 1,
                        suppressed: false,
                        parentJournalIdentifiers: feature.parentJournalIdentifiers ?? [],
                    }));
                    return mock_bridge_success(request, {
                        ...base,
                        workPart: this.currentPart,
                        displayPart: this.currentPart,
                        units: "Millimeters",
                        modified: this.modified,
                        featureCount: this.features.length,
                        bodyCount: this.solidBodyCount(),
                        solidBodyCount: this.solidBodyCount(),
                        featureTreeFingerprint: this.featureTreeFingerprint(),
                        featureTreeTotalCount: this.features.length,
                        featureTreeReturnedCount: features.length,
                        featureTreeTruncated: this.features.length > features.length,
                        features,
                        message: "Read the strict-mock feature tree without modification.",
                    }, started);
                }
                case "capture_screenshot": {
                    if (this.currentPart === null) {
                        return failure(request.requestId, "NO_WORK_PART", "Open or create a part before capturing screenshot evidence.", started);
                    }
                    if (request.arguments.filePath === undefined) {
                        return failure(request.requestId, "INVALID_ARGUMENT", "filePath is required.", started);
                    }
                    const filePath = await validatePngPath(request.arguments.filePath, "create", allowedRoots);
                    const staging = external_node_path_default().join(external_node_path_default().dirname(filePath), `.nx-codex-screenshot-staging-${(0,external_node_crypto_namespaceObject.randomUUID)()}.png`);
                    const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=", "base64");
                    await (0,promises_namespaceObject.writeFile)(staging, png, { flag: "wx" });
                    try {
                        await (0,promises_namespaceObject.copyFile)(staging, filePath, external_node_fs_namespaceObject.constants.COPYFILE_EXCL);
                        await removeTransientFile(staging);
                    }
                    catch (error) {
                        await removeTransientFile(staging);
                        if (["EEXIST", "EPERM"].includes(error.code ?? "")) {
                            return failure(request.requestId, "TARGET_EXISTS", "The screenshot destination appeared during capture; no overwrite was performed.", started);
                        }
                        throw error;
                    }
                    return mock_bridge_success(request, {
                        ...base,
                        workPart: this.currentPart,
                        displayPart: this.currentPart,
                        units: "Millimeters",
                        modified: this.modified,
                        featureCount: this.features.length,
                        bodyCount: this.solidBodyCount(),
                        solidBodyCount: this.solidBodyCount(),
                        filePath,
                        captured: true,
                        screenshotBytes: png.byteLength,
                        screenshotSha256: (0,external_node_crypto_namespaceObject.createHash)("sha256").update(png).digest("hex"),
                        message: "Captured strict-mock no-overwrite PNG evidence without changing the part.",
                    }, started);
                }
                case "new_part": {
                    if (this.pendingTransactions.length > 0) {
                        return failure(request.requestId, "PENDING_TRANSACTION", "Undo or save the current transaction before creating a new part.", started);
                    }
                    if (request.arguments.filePath === undefined) {
                        return failure(request.requestId, "INVALID_ARGUMENT", "filePath is required.", started);
                    }
                    const filePath = await validatePartPath(request.arguments.filePath, "create", allowedRoots);
                    this.currentPart = filePath;
                    this.features.splice(0);
                    this.draftingSheets.splice(0);
                    this.testDrawingTransactionId = null;
                    this.pendingTransactions.splice(0);
                    this.modified = true;
                    return mock_bridge_success(request, {
                        ...base,
                        filePath,
                        workPart: filePath,
                        displayPart: filePath,
                        units: request.arguments.partUnits ?? "Millimeters",
                        modified: true,
                        featureCount: 0,
                        bodyCount: 0,
                        opened: true,
                        saved: false,
                        message: "Created a new unsaved mock part.",
                    }, started);
                }
                case "open_part": {
                    if (this.pendingTransactions.length > 0) {
                        return failure(request.requestId, "PENDING_TRANSACTION", "Undo or save the current transaction before opening another part.", started);
                    }
                    if (request.arguments.filePath === undefined) {
                        return failure(request.requestId, "INVALID_ARGUMENT", "filePath is required.", started);
                    }
                    const filePath = await validatePartPath(request.arguments.filePath, "open", allowedRoots);
                    this.currentPart = filePath;
                    this.features.splice(0);
                    this.draftingSheets.splice(0);
                    this.testDrawingTransactionId = null;
                    this.pendingTransactions.splice(0);
                    this.modified = false;
                    return mock_bridge_success(request, {
                        ...base,
                        filePath,
                        workPart: filePath,
                        displayPart: filePath,
                        units: "Millimeters",
                        modified: false,
                        featureCount: 0,
                        bodyCount: 0,
                        opened: true,
                        loadWarnings: [],
                        message: "Opened the mock part.",
                    }, started);
                }
                case "save_as": {
                    if (this.currentPart === null) {
                        return failure(request.requestId, "NO_WORK_PART", "Open or create a part before saving.", started);
                    }
                    if (request.arguments.filePath === undefined) {
                        return failure(request.requestId, "INVALID_ARGUMENT", "filePath is required.", started);
                    }
                    const filePath = await validatePartPath(request.arguments.filePath, "create", allowedRoots);
                    await (0,promises_namespaceObject.writeFile)(filePath, JSON.stringify({
                        strictFake: true,
                        features: this.features.map((feature) => feature.name),
                    }), { encoding: "utf8", flag: "wx" });
                    this.currentPart = filePath;
                    this.modified = false;
                    this.testDrawingTransactionId = null;
                    this.pendingTransactions.splice(0);
                    return mock_bridge_success(request, {
                        ...base,
                        filePath,
                        workPart: filePath,
                        displayPart: filePath,
                        modified: false,
                        featureCount: this.features.length,
                        bodyCount: this.solidBodyCount(),
                        saved: true,
                        opened: true,
                        loadWarnings: [],
                        message: "Saved the mock part without overwrite.",
                    }, started);
                }
                case "close_part": {
                    if (this.pendingTransactions.length > 0) {
                        return failure(request.requestId, "PENDING_TRANSACTION", "Undo or save the current transaction before closing.", started);
                    }
                    if (this.currentPart === null) {
                        return failure(request.requestId, "NO_WORK_PART", "There is no work part to close.", started);
                    }
                    if (this.modified) {
                        return failure(request.requestId, "UNSAVED_CHANGES", "The work part has unsaved changes.", started);
                    }
                    const filePath = this.currentPart;
                    this.currentPart = null;
                    this.features.splice(0);
                    this.draftingSheets.splice(0);
                    this.testDrawingTransactionId = null;
                    return mock_bridge_success(request, {
                        ...base,
                        filePath,
                        closed: true,
                        modified: false,
                        featureCount: 0,
                        bodyCount: 0,
                        message: "Closed the unmodified mock part.",
                    }, started);
                }
                case "create_test_drawing": {
                    if (this.currentPart === null) {
                        return failure(request.requestId, "NO_WORK_PART", "Open the protected copy before creating the test drawing.", started);
                    }
                    const expectedPath = request.arguments.filePath === undefined
                        ? undefined
                        : await validatePartPath(request.arguments.filePath, "open", allowedRoots);
                    const currentCanonicalPath = await validatePartPath(this.currentPart, "open", allowedRoots);
                    if (expectedPath === undefined ||
                        expectedPath.toLocaleLowerCase("en-US") !==
                            currentCanonicalPath.toLocaleLowerCase("en-US")) {
                        return failure(request.requestId, "WORK_PART_MISMATCH", "The displayed work part does not exactly match expectedWorkPartPath.", started);
                    }
                    if (this.options.application
                        ?.toLocaleUpperCase("en-US")
                        .includes("DRAFT") !== true) {
                        return failure(request.requestId, "DRAFTING_APPLICATION_NOT_ACTIVE", "Switch NX to Drafting before creating the test drawing.", started);
                    }
                    if (this.options.licensedModules?.drafting !== true) {
                        return failure(request.requestId, "DRAFTING_LICENSE_NOT_ACTIVE", "An already-active drafting license is required.", started);
                    }
                    if (this.modified || this.pendingTransactions.length > 0) {
                        return failure(request.requestId, this.modified
                            ? "WORK_PART_ALREADY_MODIFIED"
                            : "PENDING_TRANSACTION", "The protected test copy must be saved, unmodified, and have no pending transaction.", started);
                    }
                    if (this.draftingSheets.length !== 0) {
                        return failure(request.requestId, "EXISTING_DRAFTING_CONTENT", "The bounded test operation requires zero existing drawing sheets and views.", started);
                    }
                    const transactionId = `TX-${(0,external_node_crypto_namespaceObject.randomUUID)()}`;
                    this.draftingSheets.push({
                        journalIdentifier: "DRAWING_SHEET(TEST_A4)",
                        name: "NX_CODEX_TEST_A4",
                        length: 297,
                        height: 210,
                        units: "Millimeters",
                        projectionAngle: "ThirdAngle",
                        scaleNumerator: 1,
                        scaleDenominator: 1,
                        isOutOfDate: false,
                        views: [
                            {
                                journalIdentifier: "DRAFTING_VIEW(TEST_BASE)",
                                name: "WORK_VIEW@1",
                                scale: 1,
                                originX: 148.5,
                                originY: 105,
                                originZ: 0,
                                isOutOfDate: false,
                                isBroken: false,
                                isDecoration: false,
                                isSlave: false,
                            },
                        ],
                    });
                    this.testDrawingTransactionId = transactionId;
                    this.pendingTransactions.push(transactionId);
                    this.modified = true;
                    const structure = boundedDraftingStructure(this.draftingSheets, 1, 1);
                    return mock_bridge_success(request, {
                        ...base,
                        application: this.options.application ?? "Modeling",
                        workPart: this.currentPart,
                        displayPart: this.currentPart,
                        units: "Millimeters",
                        modified: true,
                        featureCount: this.features.length,
                        bodyCount: this.solidBodyCount(),
                        solidBodyCount: this.solidBodyCount(),
                        available: true,
                        licensed: true,
                        draftingReadAvailable: true,
                        hasDrawingSheets: true,
                        sheets: structure.sheets,
                        views: structure.views,
                        sheetCount: 1,
                        returnedSheetCount: 1,
                        sheetCountComplete: true,
                        viewCount: 1,
                        returnedViewCount: 1,
                        viewCountComplete: true,
                        draftingStructureTruncated: false,
                        sheetLimitTruncated: false,
                        viewLimitTruncated: false,
                        maxSheets: 1,
                        maxViews: 1,
                        draftingStructureFingerprint: structure.fingerprint,
                        transactionId,
                        message: "Created one mock A4 test sheet and one base view using fixed ratio and placement requests. The work part was not saved or explicitly updated.",
                    }, started);
                }
                case "create_block": {
                    if (this.currentPart === null) {
                        return failure(request.requestId, "NO_WORK_PART", "Open or create a part before creating geometry.", started);
                    }
                    const { length, width, height } = request.arguments;
                    if (length === undefined || width === undefined || height === undefined) {
                        return failure(request.requestId, "INVALID_ARGUMENT", "length, width, and height are required.", started);
                    }
                    const transactionId = `TX-${(0,external_node_crypto_namespaceObject.randomUUID)()}`;
                    const index = this.features.length + 1;
                    const feature = {
                        kind: "block",
                        transactionId,
                        journalIdentifier: `BLOCK(${index})`,
                        name: request.arguments.name ?? `BLOCK_${String(index).padStart(3, "0")}`,
                        solid: {
                            minX: request.arguments.originX ?? 0,
                            minY: request.arguments.originY ?? 0,
                            minZ: request.arguments.originZ ?? 0,
                            maxX: (request.arguments.originX ?? 0) + length,
                            maxY: (request.arguments.originY ?? 0) + width,
                            maxZ: (request.arguments.originZ ?? 0) + height,
                            surfaceArea: 2 * (length * width + length * height + width * height),
                            volume: length * width * height,
                            centroidX: (request.arguments.originX ?? 0) + length / 2,
                            centroidY: (request.arguments.originY ?? 0) + width / 2,
                            centroidZ: (request.arguments.originZ ?? 0) + height / 2,
                            axisAlignedBox: true,
                        },
                    };
                    this.features.push(feature);
                    this.pendingTransactions.push(transactionId);
                    this.modified = true;
                    return mock_bridge_success(request, {
                        ...base,
                        transactionId,
                        featureJournalIdentifier: feature.journalIdentifier,
                        featureName: feature.name,
                        featureCount: this.features.length,
                        bodyCount: this.solidBodyCount(),
                        message: `Created ${length} x ${width} x ${height} mock block.`,
                    }, started);
                }
                case "create_rectangle_sketch": {
                    if (this.currentPart === null) {
                        return failure(request.requestId, "NO_WORK_PART", "Open or create a part before creating geometry.", started);
                    }
                    const { profileWidth, profileHeight } = request.arguments;
                    if (profileWidth === undefined || profileHeight === undefined) {
                        return failure(request.requestId, "INVALID_ARGUMENT", "profileWidth and profileHeight are required.", started);
                    }
                    const transactionId = `TX-${(0,external_node_crypto_namespaceObject.randomUUID)()}`;
                    const index = this.features.length + 1;
                    const feature = {
                        kind: "rectangleSketch",
                        transactionId,
                        journalIdentifier: `SKETCH(${index})`,
                        name: request.arguments.name ??
                            `SKETCH_${String(index).padStart(3, "0")}`,
                        profile: {
                            width: profileWidth,
                            height: profileHeight,
                            centerX: request.arguments.centerX ?? 0,
                            centerY: request.arguments.centerY ?? 0,
                            planeZ: request.arguments.planeZ ?? 0,
                        },
                    };
                    this.features.push(feature);
                    this.pendingTransactions.push(transactionId);
                    this.modified = true;
                    return mock_bridge_success(request, {
                        ...base,
                        transactionId,
                        featureJournalIdentifier: feature.journalIdentifier,
                        featureName: feature.name,
                        curveCount: 4,
                        featureCount: this.features.length,
                        bodyCount: this.solidBodyCount(),
                        message: "Created a four-line mock rectangular sketch.",
                    }, started);
                }
                case "extrude_sketch": {
                    if (this.currentPart === null) {
                        return failure(request.requestId, "NO_WORK_PART", "Open or create a part before creating geometry.", started);
                    }
                    const { sketchFeatureJournalIdentifier, distance } = request.arguments;
                    if (sketchFeatureJournalIdentifier === undefined ||
                        distance === undefined) {
                        return failure(request.requestId, "INVALID_ARGUMENT", "sketchFeatureJournalIdentifier and distance are required.", started);
                    }
                    const sketch = this.features.find((feature) => feature.kind === "rectangleSketch" &&
                        feature.journalIdentifier === sketchFeatureJournalIdentifier);
                    if (sketch?.profile === undefined) {
                        return failure(request.requestId, "SKETCH_NOT_FOUND", "No sketch feature exactly matched the supplied journal identifier.", started);
                    }
                    const profile = sketch.profile;
                    const transactionId = `TX-${(0,external_node_crypto_namespaceObject.randomUUID)()}`;
                    const index = this.features.length + 1;
                    const minX = profile.centerX - profile.width / 2;
                    const minY = profile.centerY - profile.height / 2;
                    const feature = {
                        kind: "extrude",
                        transactionId,
                        journalIdentifier: `EXTRUDE(${index})`,
                        name: request.arguments.name ??
                            `EXTRUDE_${String(index).padStart(3, "0")}`,
                        parentJournalIdentifiers: [sketch.journalIdentifier],
                        solid: {
                            minX,
                            minY,
                            minZ: profile.planeZ,
                            maxX: minX + profile.width,
                            maxY: minY + profile.height,
                            maxZ: profile.planeZ + distance,
                            surfaceArea: 2 *
                                (profile.width * profile.height +
                                    profile.width * distance +
                                    profile.height * distance),
                            volume: profile.width * profile.height * distance,
                            centroidX: profile.centerX,
                            centroidY: profile.centerY,
                            centroidZ: profile.planeZ + distance / 2,
                            axisAlignedBox: true,
                        },
                    };
                    this.features.push(feature);
                    this.pendingTransactions.push(transactionId);
                    this.modified = true;
                    return mock_bridge_success(request, {
                        ...base,
                        transactionId,
                        featureJournalIdentifier: feature.journalIdentifier,
                        featureName: feature.name,
                        featureCount: this.features.length,
                        bodyCount: this.solidBodyCount(),
                        message: "Extruded the mock sketch as a new solid.",
                    }, started);
                }
                case "revolve_sketch": {
                    if (this.currentPart === null) {
                        return failure(request.requestId, "NO_WORK_PART", "Open or create a part before creating geometry.", started);
                    }
                    const { sketchFeatureJournalIdentifier, axisDirection, axisOriginX, axisOriginY, axisOriginZ, } = request.arguments;
                    if (sketchFeatureJournalIdentifier === undefined ||
                        axisDirection === undefined ||
                        axisOriginX === undefined ||
                        axisOriginY === undefined ||
                        axisOriginZ === undefined) {
                        return failure(request.requestId, "INVALID_ARGUMENT", "sketchFeatureJournalIdentifier, axisDirection, and all axis origin coordinates are required.", started);
                    }
                    const sketch = this.features.find((feature) => feature.kind === "rectangleSketch" &&
                        feature.journalIdentifier === sketchFeatureJournalIdentifier);
                    if (sketch?.profile === undefined) {
                        return failure(request.requestId, "SKETCH_NOT_FOUND", "No sketch feature exactly matched the supplied journal identifier.", started);
                    }
                    const profile = sketch.profile;
                    if (Math.abs(axisOriginZ - profile.planeZ) > 1e-6) {
                        return failure(request.requestId, "AXIS_NOT_IN_SKETCH_PLANE", "The full-revolution axis origin must lie on the sketch's absolute XY plane.", started);
                    }
                    const minX = profile.centerX - profile.width / 2;
                    const maxX = profile.centerX + profile.width / 2;
                    const minY = profile.centerY - profile.height / 2;
                    const maxY = profile.centerY + profile.height / 2;
                    const revolvesAboutX = axisDirection === "WCS_X";
                    const radialMinCoordinate = revolvesAboutX ? minY : minX;
                    const radialMaxCoordinate = revolvesAboutX ? maxY : maxX;
                    const radialAxisCoordinate = revolvesAboutX
                        ? axisOriginY
                        : axisOriginX;
                    if (radialAxisCoordinate > radialMinCoordinate &&
                        radialAxisCoordinate < radialMaxCoordinate) {
                        return failure(request.requestId, "PROFILE_CROSSES_AXIS", "The rectangular profile crosses the requested full-revolution axis.", started);
                    }
                    const radialDistance1 = Math.abs(radialMinCoordinate - radialAxisCoordinate);
                    const radialDistance2 = Math.abs(radialMaxCoordinate - radialAxisCoordinate);
                    const innerRadius = Math.min(radialDistance1, radialDistance2);
                    const outerRadius = Math.max(radialDistance1, radialDistance2);
                    const axialLength = revolvesAboutX
                        ? profile.width
                        : profile.height;
                    const annularArea = Math.PI *
                        (outerRadius * outerRadius - innerRadius * innerRadius);
                    const transactionId = `TX-${(0,external_node_crypto_namespaceObject.randomUUID)()}`;
                    const index = this.features.length + 1;
                    const feature = {
                        kind: "revolve",
                        transactionId,
                        journalIdentifier: `REVOLVE(${index})`,
                        name: request.arguments.name ??
                            `REVOLVE_${String(index).padStart(3, "0")}`,
                        parentJournalIdentifiers: [sketch.journalIdentifier],
                        solid: revolvesAboutX
                            ? {
                                minX,
                                minY: axisOriginY - outerRadius,
                                minZ: profile.planeZ - outerRadius,
                                maxX,
                                maxY: axisOriginY + outerRadius,
                                maxZ: profile.planeZ + outerRadius,
                                surfaceArea: 2 *
                                    Math.PI *
                                    (axialLength * (outerRadius + innerRadius) +
                                        outerRadius * outerRadius -
                                        innerRadius * innerRadius),
                                volume: annularArea * axialLength,
                                centroidX: profile.centerX,
                                centroidY: axisOriginY,
                                centroidZ: profile.planeZ,
                                axisAlignedBox: false,
                            }
                            : {
                                minX: axisOriginX - outerRadius,
                                minY,
                                minZ: profile.planeZ - outerRadius,
                                maxX: axisOriginX + outerRadius,
                                maxY,
                                maxZ: profile.planeZ + outerRadius,
                                surfaceArea: 2 *
                                    Math.PI *
                                    (axialLength * (outerRadius + innerRadius) +
                                        outerRadius * outerRadius -
                                        innerRadius * innerRadius),
                                volume: annularArea * axialLength,
                                centroidX: axisOriginX,
                                centroidY: profile.centerY,
                                centroidZ: profile.planeZ,
                                axisAlignedBox: false,
                            },
                    };
                    this.features.push(feature);
                    this.pendingTransactions.push(transactionId);
                    this.modified = true;
                    return mock_bridge_success(request, {
                        ...base,
                        transactionId,
                        featureJournalIdentifier: feature.journalIdentifier,
                        featureName: feature.name,
                        featureCount: this.features.length,
                        bodyCount: this.solidBodyCount(),
                        message: "Revolved the mock sketch through 360 degrees as a new solid.",
                    }, started);
                }
                case "create_simple_through_hole": {
                    if (this.currentPart === null) {
                        return failure(request.requestId, "NO_WORK_PART", "Open or create a part before creating geometry.", started);
                    }
                    const { holeCenterX, holeCenterY, holeDiameter } = request.arguments;
                    if (holeCenterX === undefined ||
                        holeCenterY === undefined ||
                        holeDiameter === undefined) {
                        return failure(request.requestId, "INVALID_ARGUMENT", "holeCenterX, holeCenterY, and holeDiameter are required.", started);
                    }
                    const solidFeatures = this.features.filter((feature) => feature.solid !== undefined);
                    if (solidFeatures.length !== 1) {
                        return failure(request.requestId, "HOLE_REQUIRES_ONE_SOLID_BODY", "A simple through hole requires exactly one solid body in the work part.", started);
                    }
                    const targetFeature = solidFeatures[0];
                    if (targetFeature === undefined) {
                        throw new Error("Strict fake did not return the unique target feature.");
                    }
                    const targetSolid = targetFeature.solid;
                    if (targetSolid === undefined) {
                        throw new Error("Strict fake lost the selected target solid.");
                    }
                    const radius = holeDiameter / 2;
                    const clearance = 1e-6;
                    if (holeCenterX - radius <= targetSolid.minX + clearance ||
                        holeCenterY - radius <= targetSolid.minY + clearance ||
                        holeCenterX + radius >= targetSolid.maxX - clearance ||
                        holeCenterY + radius >= targetSolid.maxY - clearance) {
                        return failure(request.requestId, "HOLE_CLEARANCE_OUTSIDE_FACE", "The requested hole circle does not fit strictly inside both selected planar face bounding boxes.", started);
                    }
                    for (const feature of this.features) {
                        if (feature.kind !== "hole" || feature.hole === undefined) {
                            continue;
                        }
                        const separation = Math.hypot(feature.hole.centerX - holeCenterX, feature.hole.centerY - holeCenterY);
                        if (separation <= feature.hole.diameter / 2 + radius) {
                            return failure(request.requestId, "HOLE_INTERSECTS_EXISTING_HOLE", "The requested simple hole intersects an existing mock hole.", started);
                        }
                    }
                    const bodyHeight = targetSolid.maxZ - targetSolid.minZ;
                    if (bodyHeight <= 1e-6) {
                        return failure(request.requestId, "HOLE_BODY_HEIGHT_INVALID", "The target body's absolute Z height is too small for a through hole.", started);
                    }
                    const removedVolume = Math.PI * radius * radius * bodyHeight;
                    const remainingVolume = targetSolid.volume - removedVolume;
                    if (remainingVolume <= 0) {
                        return failure(request.requestId, "HOLE_REMOVES_ENTIRE_BODY", "The requested hole would remove the entire mock solid.", started);
                    }
                    const previousSolid = { ...targetSolid };
                    targetFeature.solid = {
                        ...targetSolid,
                        surfaceArea: targetSolid.surfaceArea -
                            2 * Math.PI * radius * radius +
                            2 * Math.PI * radius * bodyHeight,
                        volume: remainingVolume,
                        centroidX: (targetSolid.centroidX * targetSolid.volume -
                            holeCenterX * removedVolume) /
                            remainingVolume,
                        centroidY: (targetSolid.centroidY * targetSolid.volume -
                            holeCenterY * removedVolume) /
                            remainingVolume,
                        centroidZ: (targetSolid.centroidZ * targetSolid.volume -
                            ((targetSolid.minZ + targetSolid.maxZ) / 2) * removedVolume) /
                            remainingVolume,
                        axisAlignedBox: false,
                    };
                    const transactionId = `TX-${(0,external_node_crypto_namespaceObject.randomUUID)()}`;
                    const index = this.features.length + 1;
                    const feature = {
                        kind: "hole",
                        transactionId,
                        journalIdentifier: `SIMPLE_HOLE(${index})`,
                        name: request.arguments.name ??
                            `SIMPLE_THROUGH_HOLE_${String(index).padStart(3, "0")}`,
                        parentJournalIdentifiers: [targetFeature.journalIdentifier],
                        hole: {
                            centerX: holeCenterX,
                            centerY: holeCenterY,
                            diameter: holeDiameter,
                            targetJournalIdentifier: targetFeature.journalIdentifier,
                            previousSolid,
                        },
                    };
                    this.features.push(feature);
                    this.pendingTransactions.push(transactionId);
                    this.modified = true;
                    return mock_bridge_success(request, {
                        ...base,
                        transactionId,
                        featureJournalIdentifier: feature.journalIdentifier,
                        featureName: feature.name,
                        featureCount: this.features.length,
                        bodyCount: this.solidBodyCount(),
                        message: "Created a semantic mock simple hole from the unique top face through the bottom face.",
                    }, started);
                }
                case "boolean_bodies": {
                    if (this.currentPart === null) {
                        return failure(request.requestId, "NO_WORK_PART", "Open or create a part before creating geometry.", started);
                    }
                    const { booleanOperation, targetFeatureJournalIdentifier, toolFeatureJournalIdentifier, } = request.arguments;
                    if (booleanOperation === undefined ||
                        targetFeatureJournalIdentifier === undefined ||
                        toolFeatureJournalIdentifier === undefined) {
                        return failure(request.requestId, "INVALID_ARGUMENT", "booleanOperation, targetFeatureJournalIdentifier, and toolFeatureJournalIdentifier are required.", started);
                    }
                    if (targetFeatureJournalIdentifier === toolFeatureJournalIdentifier) {
                        return failure(request.requestId, "BOOLEAN_REQUIRES_DISTINCT_FEATURES", "Boolean target and tool feature identifiers must be different.", started);
                    }
                    const targetSelection = this.features.find((feature) => feature.journalIdentifier === targetFeatureJournalIdentifier);
                    if (targetSelection === undefined) {
                        return failure(request.requestId, "BOOLEAN_TARGET_FEATURE_NOT_FOUND", "No feature exactly matched the supplied journal identifier.", started);
                    }
                    const toolSelection = this.features.find((feature) => feature.journalIdentifier === toolFeatureJournalIdentifier);
                    if (toolSelection === undefined) {
                        return failure(request.requestId, "BOOLEAN_TOOL_FEATURE_NOT_FOUND", "No feature exactly matched the supplied journal identifier.", started);
                    }
                    const targetFeature = this.currentSolidOwnerForFeature(targetSelection);
                    const toolFeature = this.currentSolidOwnerForFeature(toolSelection);
                    if (targetFeature === undefined || toolFeature === undefined) {
                        return failure(request.requestId, "BOOLEAN_BODY_NOT_CURRENT", "A selected feature does not map to a current solid body.", started);
                    }
                    if (targetFeature === toolFeature) {
                        return failure(request.requestId, "BOOLEAN_REQUIRES_DISTINCT_BODIES", "Boolean target and tool features resolve to the same current solid body.", started);
                    }
                    const targetSolid = targetFeature.solid;
                    const toolSolid = toolFeature.solid;
                    if (targetSolid === undefined || toolSolid === undefined) {
                        throw new Error("Strict fake lost a selected Boolean solid.");
                    }
                    if (targetSolid.axisAlignedBox !== true ||
                        toolSolid.axisAlignedBox !== true) {
                        return failure(request.requestId, "STRICT_FAKE_UNSUPPORTED_BOOLEAN_SOLID", "The strict fake only computes Boolean mass properties for axis-aligned rectangular solids.", started);
                    }
                    if (!boxesHavePositiveOverlap(targetSolid, toolSolid)) {
                        return failure(request.requestId, "BOOLEAN_BODIES_DO_NOT_OVERLAP", "The selected target and tool bodies do not have a positive-volume overlap.", started);
                    }
                    const resultSolid = booleanAxisAlignedSolids(targetSolid, toolSolid, booleanOperation);
                    if (resultSolid === null) {
                        return failure(request.requestId, "BOOLEAN_RESULT_BODY_COUNT_INVALID", "The Boolean operation did not return exactly one resultant body.", started);
                    }
                    const previousTargetSolid = { ...targetSolid };
                    const previousToolSolid = { ...toolSolid };
                    targetFeature.solid = resultSolid;
                    delete toolFeature.solid;
                    const transactionId = `TX-${(0,external_node_crypto_namespaceObject.randomUUID)()}`;
                    const index = this.features.length + 1;
                    const feature = {
                        kind: "boolean",
                        transactionId,
                        journalIdentifier: `BOOLEAN(${index})`,
                        name: request.arguments.name ??
                            `${booleanOperation}_${String(index).padStart(3, "0")}`,
                        parentJournalIdentifiers: [
                            targetFeature.journalIdentifier,
                            toolFeature.journalIdentifier,
                        ],
                        boolean: {
                            targetJournalIdentifier: targetFeature.journalIdentifier,
                            toolJournalIdentifier: toolFeature.journalIdentifier,
                            previousTargetSolid,
                            previousToolSolid,
                        },
                    };
                    this.features.push(feature);
                    this.pendingTransactions.push(transactionId);
                    this.modified = true;
                    return mock_bridge_success(request, {
                        ...base,
                        transactionId,
                        featureJournalIdentifier: feature.journalIdentifier,
                        featureName: feature.name,
                        featureCount: this.features.length,
                        bodyCount: this.solidBodyCount(),
                        message: `Completed the strict mock ${booleanOperation} Boolean and consumed one tool body.`,
                    }, started);
                }
                case "fillet_vertical_edges": {
                    if (this.currentPart === null) {
                        return failure(request.requestId, "NO_WORK_PART", "Open or create a part before creating geometry.", started);
                    }
                    const { bodyFeatureJournalIdentifier, filletRadius } = request.arguments;
                    if (bodyFeatureJournalIdentifier === undefined ||
                        filletRadius === undefined) {
                        return failure(request.requestId, "INVALID_ARGUMENT", "bodyFeatureJournalIdentifier and filletRadius are required.", started);
                    }
                    const selected = this.features.find((feature) => feature.journalIdentifier === bodyFeatureJournalIdentifier);
                    if (selected === undefined) {
                        return failure(request.requestId, "FILLET_BODY_FEATURE_NOT_FOUND", "No feature exactly matched the supplied journal identifier.", started);
                    }
                    const target = this.currentSolidOwnerForFeature(selected);
                    if (target === undefined) {
                        return failure(request.requestId, "FILLET_BODY_NOT_CURRENT", "The selected body feature does not map to a current solid body.", started);
                    }
                    const targetSolid = target.solid;
                    if (targetSolid === undefined) {
                        throw new Error("Strict fake lost the selected fillet solid.");
                    }
                    if (targetSolid.axisAlignedBox !== true) {
                        return failure(request.requestId, "STRICT_FAKE_UNSUPPORTED_FILLET_SOLID", "The strict fake only computes the four-vertical-edge fillet for an axis-aligned rectangular solid.", started);
                    }
                    const sizeX = targetSolid.maxX - targetSolid.minX;
                    const sizeY = targetSolid.maxY - targetSolid.minY;
                    if (filletRadius >= Math.min(sizeX, sizeY) / 2 - 1e-6) {
                        return failure(request.requestId, "FILLET_RADIUS_TOO_LARGE", "filletRadius must be strictly less than half the smaller exact absolute WCS X/Y body size.", started);
                    }
                    const previousSolid = { ...targetSolid };
                    const height = targetSolid.maxZ - targetSolid.minZ;
                    const cornerFactor = 4 - Math.PI;
                    target.solid = {
                        ...targetSolid,
                        surfaceArea: targetSolid.surfaceArea -
                            2 * cornerFactor *
                                (filletRadius * filletRadius + filletRadius * height),
                        volume: targetSolid.volume -
                            height * filletRadius * filletRadius * cornerFactor,
                        axisAlignedBox: false,
                    };
                    const transactionId = `TX-${(0,external_node_crypto_namespaceObject.randomUUID)()}`;
                    const index = this.features.length + 1;
                    const feature = {
                        kind: "fillet",
                        transactionId,
                        journalIdentifier: `BLEND(${index})`,
                        name: request.arguments.name ??
                            `VERTICAL_EDGE_FILLET_${String(index).padStart(3, "0")}`,
                        parentJournalIdentifiers: [target.journalIdentifier],
                        fillet: {
                            targetJournalIdentifier: target.journalIdentifier,
                            radius: filletRadius,
                            previousSolid,
                        },
                    };
                    this.features.push(feature);
                    this.pendingTransactions.push(transactionId);
                    this.modified = true;
                    return mock_bridge_success(request, {
                        ...base,
                        transactionId,
                        featureJournalIdentifier: feature.journalIdentifier,
                        featureName: feature.name,
                        featureCount: this.features.length,
                        bodyCount: this.solidBodyCount(),
                        message: "Created one strict-mock constant-radius blend on four validated vertical edges.",
                    }, started);
                }
                case "measure_work_part": {
                    if (this.currentPart === null) {
                        return failure(request.requestId, "NO_WORK_PART", "Open or create a part before measuring solid bodies.", started);
                    }
                    const solids = this.features.flatMap((feature) => feature.solid === undefined ? [] : [feature.solid]);
                    if (solids.length === 0) {
                        return failure(request.requestId, "NO_SOLID_BODY", "The mock work part contains no solid body to measure.", started);
                    }
                    const volume = solids.reduce((sum, solid) => sum + solid.volume, 0);
                    return mock_bridge_success(request, {
                        ...base,
                        workPart: this.currentPart,
                        displayPart: this.currentPart,
                        units: "Millimeters",
                        modified: this.modified,
                        featureCount: this.features.length,
                        bodyCount: this.solidBodyCount(),
                        solidBodyCount: this.solidBodyCount(),
                        measuredBodyCount: solids.length,
                        measurementUnits: "Millimeters",
                        boundingBoxMinX: Math.min(...solids.map((solid) => solid.minX)),
                        boundingBoxMinY: Math.min(...solids.map((solid) => solid.minY)),
                        boundingBoxMinZ: Math.min(...solids.map((solid) => solid.minZ)),
                        boundingBoxMaxX: Math.max(...solids.map((solid) => solid.maxX)),
                        boundingBoxMaxY: Math.max(...solids.map((solid) => solid.maxY)),
                        boundingBoxMaxZ: Math.max(...solids.map((solid) => solid.maxZ)),
                        boundingBoxSizeX: Math.max(...solids.map((solid) => solid.maxX)) -
                            Math.min(...solids.map((solid) => solid.minX)),
                        boundingBoxSizeY: Math.max(...solids.map((solid) => solid.maxY)) -
                            Math.min(...solids.map((solid) => solid.minY)),
                        boundingBoxSizeZ: Math.max(...solids.map((solid) => solid.maxZ)) -
                            Math.min(...solids.map((solid) => solid.minZ)),
                        surfaceArea: solids.reduce((sum, solid) => sum + solid.surfaceArea, 0),
                        volume,
                        centroidX: solids.reduce((sum, solid) => sum + solid.centroidX * solid.volume, 0) / volume,
                        centroidY: solids.reduce((sum, solid) => sum + solid.centroidY * solid.volume, 0) / volume,
                        centroidZ: solids.reduce((sum, solid) => sum + solid.centroidZ * solid.volume, 0) / volume,
                        message: "Measured mock solid bodies without modification.",
                    }, started);
                }
                case "export_step": {
                    if (this.currentPart === null) {
                        return failure(request.requestId, "NO_WORK_PART", "Open or create a part before exporting STEP.", started);
                    }
                    if (request.arguments.filePath === undefined) {
                        return failure(request.requestId, "INVALID_ARGUMENT", "filePath is required.", started);
                    }
                    const stepFormat = request.arguments.stepFormat ?? "AP214";
                    if (!["AP203", "AP214", "AP242"].includes(stepFormat)) {
                        return failure(request.requestId, "INVALID_ARGUMENT", "stepFormat must be AP203, AP214, or AP242.", started);
                    }
                    const filePath = await validateStepPath(request.arguments.filePath, "create", allowedRoots);
                    const staging = external_node_path_default().join(external_node_path_default().dirname(filePath), `.nx-codex-step-staging-${(0,external_node_crypto_namespaceObject.randomUUID)()}.stp`);
                    await (0,promises_namespaceObject.writeFile)(staging, [
                        "ISO-10303-21;",
                        "/* NX Codex strict fake STEP export */",
                        `/* format=${stepFormat} features=${this.features.length} */`,
                        "END-ISO-10303-21;",
                        "",
                    ].join("\n"), { encoding: "utf8", flag: "wx" });
                    try {
                        await (0,promises_namespaceObject.copyFile)(staging, filePath, external_node_fs_namespaceObject.constants.COPYFILE_EXCL);
                        await removeTransientFile(staging);
                    }
                    catch (error) {
                        await removeTransientFile(staging);
                        if (["EEXIST", "EPERM"].includes(error.code ?? "")) {
                            return failure(request.requestId, "TARGET_EXISTS", "The STEP destination appeared during export; no overwrite was performed.", started);
                        }
                        throw error;
                    }
                    return mock_bridge_success(request, {
                        ...base,
                        filePath,
                        exported: true,
                        stepFormat,
                        workPart: this.currentPart,
                        displayPart: this.currentPart,
                        units: "Millimeters",
                        modified: this.modified,
                        featureCount: this.features.length,
                        bodyCount: this.solidBodyCount(),
                        message: "Exported the mock work part to a precise STEP file without modifying the part.",
                    }, started);
                }
                case "undo_transaction": {
                    const transactionId = request.arguments.transactionId;
                    const latest = this.pendingTransactions[this.pendingTransactions.length - 1];
                    if (latest !== transactionId) {
                        return failure(request.requestId, latest === undefined
                            ? "TRANSACTION_NOT_FOUND"
                            : "TRANSACTION_NOT_LATEST", latest === undefined
                            ? "Transaction is unknown or has already been undone."
                            : "Only the latest transaction can be undone safely.", started);
                    }
                    if (this.testDrawingTransactionId === transactionId) {
                        this.draftingSheets.splice(0);
                        this.testDrawingTransactionId = null;
                        this.pendingTransactions.pop();
                        this.modified = this.features.length > 0;
                        return mock_bridge_success(request, {
                            ...base,
                            transactionId,
                            modified: this.modified,
                            featureCount: this.features.length,
                            bodyCount: this.solidBodyCount(),
                            solidBodyCount: this.solidBodyCount(),
                            message: "Test drawing transaction undone. The work part was not saved.",
                        }, started);
                    }
                    const index = this.features.findIndex((feature) => feature.transactionId === transactionId);
                    const feature = this.features[index];
                    if (feature?.kind === "hole" && feature.hole !== undefined) {
                        const target = this.features.find((candidate) => candidate.journalIdentifier ===
                            feature.hole?.targetJournalIdentifier);
                        if (target === undefined) {
                            throw new Error("Strict fake could not restore the hole target.");
                        }
                        target.solid = { ...feature.hole.previousSolid };
                    }
                    if (feature?.kind === "boolean" && feature.boolean !== undefined) {
                        const target = this.features.find((candidate) => candidate.journalIdentifier ===
                            feature.boolean?.targetJournalIdentifier);
                        const tool = this.features.find((candidate) => candidate.journalIdentifier ===
                            feature.boolean?.toolJournalIdentifier);
                        if (target === undefined || tool === undefined) {
                            throw new Error("Strict fake could not restore the Boolean bodies.");
                        }
                        target.solid = { ...feature.boolean.previousTargetSolid };
                        tool.solid = { ...feature.boolean.previousToolSolid };
                    }
                    if (feature?.kind === "fillet" && feature.fillet !== undefined) {
                        const target = this.features.find((candidate) => candidate.journalIdentifier ===
                            feature.fillet?.targetJournalIdentifier);
                        if (target === undefined) {
                            throw new Error("Strict fake could not restore the fillet target.");
                        }
                        target.solid = { ...feature.fillet.previousSolid };
                    }
                    this.features.splice(index, 1);
                    this.pendingTransactions.pop();
                    this.modified = this.features.length > 0;
                    return mock_bridge_success(request, {
                        ...base,
                        transactionId,
                        featureCount: this.features.length,
                        bodyCount: this.solidBodyCount(),
                        message: "Transaction undone.",
                    }, started);
                }
            }
        }
        catch (error) {
            if (error instanceof PathPolicyError) {
                return failure(request.requestId, error.code, error.message, started);
            }
            return failure(request.requestId, "STRICT_FAKE_FAILURE", error instanceof Error ? error.message : "Unknown strict fake error.", started);
        }
    }
    parseRequestForFaults(line) {
        try {
            const parsed = JSON.parse(line);
            const request = BridgeRequestSchema.safeParse(parsed);
            return request.success ? request.data : undefined;
        }
        catch {
            return undefined;
        }
    }
    async applyFault(fault) {
        if (fault.delayMs !== undefined && fault.delayMs > 0) {
            await new Promise((resolve) => setTimeout(resolve, fault.delayMs));
        }
        if (fault.kind === "disconnect") {
            return null;
        }
        if (fault.kind === "crash") {
            queueMicrotask(() => {
                void this.stop().catch(() => undefined);
            });
            return null;
        }
        return undefined;
    }
    preflightFailure(args) {
        const operation = args.plannedOperation;
        if (operation === undefined) {
            return { code: "INVALID_ARGUMENT", message: "plannedOperation is required." };
        }
        switch (operation) {
            case "create_block":
                return args.length === undefined ||
                    args.width === undefined ||
                    args.height === undefined ||
                    args.originX === undefined ||
                    args.originY === undefined ||
                    args.originZ === undefined
                    ? {
                        code: "INVALID_ARGUMENT",
                        message: "The complete block plan is required.",
                    }
                    : undefined;
            case "create_rectangle_sketch":
                return args.profileWidth === undefined ||
                    args.profileHeight === undefined ||
                    args.centerX === undefined ||
                    args.centerY === undefined ||
                    args.planeZ === undefined
                    ? {
                        code: "INVALID_ARGUMENT",
                        message: "The complete rectangular-sketch plan is required.",
                    }
                    : undefined;
            case "extrude_sketch": {
                if (args.sketchFeatureJournalIdentifier === undefined ||
                    args.distance === undefined) {
                    return {
                        code: "INVALID_ARGUMENT",
                        message: "The complete extrude plan is required.",
                    };
                }
                const sketch = this.features.find((feature) => feature.kind === "rectangleSketch" &&
                    feature.journalIdentifier === args.sketchFeatureJournalIdentifier);
                return sketch === undefined
                    ? {
                        code: "SKETCH_NOT_FOUND",
                        message: "No sketch feature exactly matched the supplied journal identifier.",
                    }
                    : undefined;
            }
            case "revolve_sketch": {
                if (args.sketchFeatureJournalIdentifier === undefined ||
                    args.axisDirection === undefined ||
                    args.axisOriginX === undefined ||
                    args.axisOriginY === undefined ||
                    args.axisOriginZ === undefined) {
                    return {
                        code: "INVALID_ARGUMENT",
                        message: "The complete revolve plan is required.",
                    };
                }
                const sketch = this.features.find((feature) => feature.kind === "rectangleSketch" &&
                    feature.journalIdentifier === args.sketchFeatureJournalIdentifier);
                if (sketch?.profile === undefined) {
                    return {
                        code: "SKETCH_NOT_FOUND",
                        message: "No sketch feature exactly matched the supplied journal identifier.",
                    };
                }
                if (Math.abs(args.axisOriginZ - sketch.profile.planeZ) > 1e-6) {
                    return {
                        code: "AXIS_NOT_IN_SKETCH_PLANE",
                        message: "The full-revolution axis origin must lie on the sketch plane.",
                    };
                }
                const radialMinimum = args.axisDirection === "WCS_X"
                    ? sketch.profile.centerY - sketch.profile.height / 2
                    : sketch.profile.centerX - sketch.profile.width / 2;
                const radialMaximum = args.axisDirection === "WCS_X"
                    ? sketch.profile.centerY + sketch.profile.height / 2
                    : sketch.profile.centerX + sketch.profile.width / 2;
                const radialAxis = args.axisDirection === "WCS_X" ? args.axisOriginY : args.axisOriginX;
                return radialAxis > radialMinimum && radialAxis < radialMaximum
                    ? {
                        code: "PROFILE_CROSSES_AXIS",
                        message: "The rectangular profile crosses the revolve axis.",
                    }
                    : undefined;
            }
            case "create_simple_through_hole": {
                if (args.holeCenterX === undefined ||
                    args.holeCenterY === undefined ||
                    args.holeDiameter === undefined) {
                    return {
                        code: "INVALID_ARGUMENT",
                        message: "The complete through-hole plan is required.",
                    };
                }
                const solids = this.features.filter((feature) => feature.solid !== undefined);
                if (solids.length !== 1 || solids[0]?.solid === undefined) {
                    return {
                        code: "HOLE_REQUIRES_ONE_SOLID_BODY",
                        message: "A simple through hole requires exactly one solid body.",
                    };
                }
                const solid = solids[0].solid;
                const radius = args.holeDiameter / 2;
                return args.holeCenterX - radius <= solid.minX + 1e-6 ||
                    args.holeCenterY - radius <= solid.minY + 1e-6 ||
                    args.holeCenterX + radius >= solid.maxX - 1e-6 ||
                    args.holeCenterY + radius >= solid.maxY - 1e-6
                    ? {
                        code: "HOLE_CLEARANCE_OUTSIDE_FACE",
                        message: "The requested hole circle does not fit strictly inside both face bounds.",
                    }
                    : undefined;
            }
            case "boolean_bodies": {
                if (args.booleanOperation === undefined ||
                    args.targetFeatureJournalIdentifier === undefined ||
                    args.toolFeatureJournalIdentifier === undefined) {
                    return {
                        code: "INVALID_ARGUMENT",
                        message: "The complete Boolean plan is required.",
                    };
                }
                if (args.targetFeatureJournalIdentifier ===
                    args.toolFeatureJournalIdentifier) {
                    return {
                        code: "BOOLEAN_REQUIRES_DISTINCT_FEATURES",
                        message: "Boolean target and tool identifiers must differ.",
                    };
                }
                const targetSelection = this.features.find((feature) => feature.journalIdentifier ===
                    args.targetFeatureJournalIdentifier);
                const toolSelection = this.features.find((feature) => feature.journalIdentifier === args.toolFeatureJournalIdentifier);
                if (targetSelection === undefined || toolSelection === undefined) {
                    return {
                        code: "BOOLEAN_FEATURE_NOT_FOUND",
                        message: "A selected Boolean feature was not found.",
                    };
                }
                const target = this.currentSolidOwnerForFeature(targetSelection);
                const tool = this.currentSolidOwnerForFeature(toolSelection);
                if (target === undefined ||
                    tool === undefined ||
                    target === tool ||
                    target.solid === undefined ||
                    tool.solid === undefined) {
                    return {
                        code: "BOOLEAN_BODY_NOT_CURRENT",
                        message: "The selected Boolean bodies are not two current solids.",
                    };
                }
                return boxesHavePositiveOverlap(target.solid, tool.solid)
                    ? undefined
                    : {
                        code: "BOOLEAN_BODIES_DO_NOT_OVERLAP",
                        message: "The selected bodies do not positively overlap.",
                    };
            }
            case "fillet_vertical_edges": {
                if (args.bodyFeatureJournalIdentifier === undefined ||
                    args.filletRadius === undefined) {
                    return {
                        code: "INVALID_ARGUMENT",
                        message: "The complete fillet plan is required.",
                    };
                }
                const selected = this.features.find((feature) => feature.journalIdentifier === args.bodyFeatureJournalIdentifier);
                const target = selected === undefined
                    ? undefined
                    : this.currentSolidOwnerForFeature(selected);
                if (target?.solid === undefined || target.solid.axisAlignedBox !== true) {
                    return {
                        code: "FILLET_BODY_NOT_CURRENT",
                        message: "The selected fillet feature does not map to one supported current solid.",
                    };
                }
                const sizeX = target.solid.maxX - target.solid.minX;
                const sizeY = target.solid.maxY - target.solid.minY;
                return args.filletRadius >= Math.min(sizeX, sizeY) / 2 - 1e-6
                    ? {
                        code: "FILLET_RADIUS_TOO_LARGE",
                        message: "filletRadius must be less than half the smaller transverse size.",
                    }
                    : undefined;
            }
        }
    }
    featureTreeFingerprint() {
        const canonical = this.features.map((feature, index) => ({
            index,
            journalIdentifier: feature.journalIdentifier,
            name: feature.name,
            featureType: this.mockFeatureType(feature),
            timestamp: index + 1,
            suppressed: false,
            parents: feature.parentJournalIdentifiers ?? [],
        }));
        return (0,external_node_crypto_namespaceObject.createHash)("sha256")
            .update(JSON.stringify(canonical), "utf8")
            .digest("hex");
    }
    mockFeatureType(feature) {
        switch (feature.kind) {
            case "block":
                return "BLOCK";
            case "rectangleSketch":
                return "SKETCH";
            case "extrude":
                return "EXTRUDE";
            case "revolve":
                return "REVOLVE";
            case "hole":
                return "SIMPLE HOLE";
            case "boolean":
                return "BOOLEAN";
            case "fillet":
                return "BLEND";
        }
    }
    solidBodyCount() {
        return this.features.filter((feature) => feature.solid !== undefined).length;
    }
    currentSolidOwnerForFeature(selected) {
        let current = selected;
        const visited = new Set();
        while (current !== undefined && !visited.has(current.journalIdentifier)) {
            visited.add(current.journalIdentifier);
            if (current.solid !== undefined)
                return current;
            const parentIdentifier = current.kind === "hole"
                ? current.hole?.targetJournalIdentifier
                : current.kind === "boolean"
                    ? current.boolean?.targetJournalIdentifier
                    : current.kind === "fillet"
                        ? current.fillet?.targetJournalIdentifier
                        : undefined;
            if (parentIdentifier === undefined)
                return undefined;
            current = this.features.find((feature) => feature.journalIdentifier === parentIdentifier);
        }
        return undefined;
    }
}

;// CONCATENATED MODULE: ./src/mock-bridge-cli.ts

const explicitSessionFile = process.env.NX_CODEX_SESSION_FILE;
const bridge = new MockBridge(explicitSessionFile === undefined
    ? {}
    : { sessionFile: explicitSessionFile });
async function stop() {
    await bridge.stop();
    process.exit(0);
}
process.once("SIGINT", () => void stop());
process.once("SIGTERM", () => void stop());
bridge
    .start()
    .then(() => {
    console.error(`Mock NX bridge session: ${bridge.descriptorPath}`);
})
    .catch((error) => {
    console.error(`Mock NX bridge failed: ${error instanceof Error ? error.message : "unknown error"}`);
    process.exit(1);
});

