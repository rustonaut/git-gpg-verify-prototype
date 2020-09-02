jest.mock("@actions/core")

import { getInput as _getInput } from "@actions/core"
import { mocked } from "ts-jest/utils"
import {
    getTagFilterRegex,
    lookupPredefinedRegExp,
    NO_PREFIX_SEMVER,
    tryParseRawRegExp,
    V_PREFIX_SEMVER
} from "../../src/gh-inputs/filter"

const getInput = mocked(_getInput)

//TODO test RegExps ??

beforeEach(() => {
    jest.resetAllMocks()
})

describe("getTagFilterRegex", () => {
    test("return null on empty input", () => {
        getInput.mockReturnValueOnce("")

        const res = getTagFilterRegex()

        expect(res).toBe(null)
        expect(getInput).toHaveBeenCalledWith("filterTags")
        expect(getInput).toHaveBeenCalledTimes(1)
    })

    test("if it stats with / parse regex", () => {
        getInput.mockReturnValueOnce("/hy/")

        const res = getTagFilterRegex()

        expect(res).not.toBe(null)
        if (res !== null) {
            expect(res).toBeInstanceOf(RegExp)
            expect(res.toString()).toEqual("/hy/")
            expect(getInput).toHaveBeenCalledWith("filterTags")
            expect(getInput).toHaveBeenCalledTimes(1)
        }
    })

    test("if it doesn't start with / lookup pre-defined regex", () => {
        getInput.mockReturnValueOnce("semver")

        const res = getTagFilterRegex()

        expect(res).not.toBe(null)
        expect(res).toBeInstanceOf(RegExp)
        expect(res).toBe(NO_PREFIX_SEMVER)
        expect(getInput).toHaveBeenCalledWith("filterTags")
        expect(getInput).toHaveBeenCalledTimes(1)
    })

    test("if it's not starting with / and not pre-defined throw error", () => {
        getInput.mockReturnValueOnce("bad")
        expect(() => getTagFilterRegex()).toThrowError()
    })

    test("if it's malformed regex it's expected to throw an error", () => {
        getInput.mockReturnValueOnce("/bad")
        expect(() => getTagFilterRegex()).toThrowError()
        getInput.mockReturnValueOnce("/*/")
        expect(() => getTagFilterRegex()).toThrowError()
    })
})

describe("tryParseRawRegExp", () => {
    test("return null if it doesn't start with /", () => {
        const res = tryParseRawRegExp("semver")
        expect(res).toBe(null)
    })

    test("throws error if ending / can't be found", () => {
        expect(() => tryParseRawRegExp("/badbadbad")).toThrowError("malformed RegExp input")
    })

    test("sets flags correctly", () => {
        const res = tryParseRawRegExp("/hy/i")
        expect(res).not.toBe(null)
        if (res !== null) {
            expect(res.test("HY")).toBe(true)
        }
    })

    test("can handle / in regex", () => {
        const res = tryParseRawRegExp("/^a/b$/")
        expect(res).not.toBe(null)
        if (res !== null) {
            expect(res.test("a/b")).toBe(true)
            expect(res.toString()).toEqual("/^a\\/b$/")
        }
    })
})

describe("lookupPredefinedRegExp", () => {
    test("looking up semver works", () => {
        let res = lookupPredefinedRegExp("semver")
        expect(res).toBe(NO_PREFIX_SEMVER)
        res = lookupPredefinedRegExp("Semver")
        expect(res).toBe(NO_PREFIX_SEMVER)
        res = lookupPredefinedRegExp("sEmVEr")
        expect(res).toBe(NO_PREFIX_SEMVER)
    })

    test("looking up v_semver works", () => {
        let res = lookupPredefinedRegExp("v_semver")
        expect(res).toBe(V_PREFIX_SEMVER)
        res = lookupPredefinedRegExp("V_Semver")
        expect(res).toBe(V_PREFIX_SEMVER)
        res = lookupPredefinedRegExp("v_sEmVEr")
        expect(res).toBe(V_PREFIX_SEMVER)
    })

    test("looking up bad regex throw an error", () => {
        expect(() => lookupPredefinedRegExp("malFORmed")).toThrowError("malFORmed")
    })
})

describe("pre-defined RegExp", () => {
    //MAYBE_TODO: More test cases for semver regex, but
    //            then it's from the semver specification
    //            site so I guess we can expect it to work.
    describe("semver", () => {
        test.each(["0.0.0", "1.0.1", "12.31.124", "0.4.1-beta", "0.4.1-beta.1+meta-hex77213d"])(
            "basic accepted cases: %s",
            version => {
                expect(NO_PREFIX_SEMVER.test(version)).toBe(true)
            }
        )

        test.each(["1", "1.1", "v1.2.3", "1..."])("basic rejected cases: %s", version => {
            expect(NO_PREFIX_SEMVER.test(version)).toBe(false)
        })
    })

    describe("v_semver", () => {
        test.each([
            "v0.0.0",
            "v1.0.1",
            "v12.31.124",
            "v0.4.1-beta",
            "v0.4.1-beta.1+meta-hex77213d"
        ])("basic accepted cases: %s", version => {
            expect(V_PREFIX_SEMVER.test(version)).toBe(true)
        })

        test.each(["1.0.0"])("basic rejected cases: %s", version => {
            expect(V_PREFIX_SEMVER.test(version)).toBe(false)
        })
    })
})
