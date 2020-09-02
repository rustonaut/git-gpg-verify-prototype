import * as core from "@actions/core"
import { rSplitOnce } from "../utils"

/** return the tag filter github input from the environment */
export function getTagFilterRegex(): RegExp | null {
    const input = core.getInput("filterTags")
    if (input === "") {
        return null
    }
    const regexp = tryParseRawRegExp(input)
    if (regexp !== null) {
        return regexp
    }
    return lookupPredefinedRegExp(input)
}

/** tries to parse the input as a regular expressions of the form /regex/flags
 *
 *  If the input doesn't start with "/" null is returned as this
 *  clearly is no regex input.
 *
 *  If it starts with / but is malformed a error is thrown.
 */
export function tryParseRawRegExp(input: string): RegExp | null {
    if (input.startsWith("/")) {
        const [regex, flags] = rSplitOnce(input.substring(1), "/")
        if (flags === undefined) {
            throw new Error("malformed RegExp input without closing /")
        }
        return new RegExp(regex, flags)
    } else {
        return null
    }
}

/**
 * Stringly regex matching a semver version number without leading ^ and trailing $/
 *
 * Taken from `https://semver.org` but without ^ and $ and \ escaped
 * License: CC BY 3.0,
 * Author: Tom Preston-Werner
 */
const SEMVER_REGEX_BASE =
    "(0|[1-9]\\d*)\\.(0|[1-9]\\d*)\\.(0|[1-9]\\d*)(?:-((?:0|[1-9]\\d*|\\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\\.(?:0|[1-9]\\d*|\\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\\+([0-9a-zA-Z-]+(?:\\.[0-9a-zA-Z-]+)*))?"

/** RegExp matching semver */
export const NO_PREFIX_SEMVER = new RegExp(`^${SEMVER_REGEX_BASE}$`)

/** RegExp matching semver with v prefix*/
export const V_PREFIX_SEMVER = new RegExp(`^v${SEMVER_REGEX_BASE}$`)

/** assuming input is no regex return a predefined regex associated with given input if possible
 *
 *  The input is lowercased to tread is case-insensitive.
 *
 *  Following regexes are predefined:
 *
 *  - "semver" : a regex matching a semver version number (semver.org)
 *  - "v_semver" : like semver but with a v prefix e.g. "v1.0.2"
 *
 *  If the input doesn't match a predefined regex an exception is thrown.
 */
export function lookupPredefinedRegExp(input: string): RegExp {
    switch (input.toLowerCase()) {
        case "semver":
            return NO_PREFIX_SEMVER
        case "v_semver":
            return V_PREFIX_SEMVER
        default:
            throw new Error(
                `unknown pre-defined regex (use /regex/flags to use a non pre-defined regex): ${input} `
            )
    }
}
