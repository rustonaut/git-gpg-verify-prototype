import { EOL } from "os"
import {
    addTo,
    deleteFrom,
    isString,
    isStringArray,
    rSplitOnce,
    trimmedLineSet
} from "../src/utils"

describe("utility module", () => {
    describe("isStringArray", () => {
        test.each([
            [[], true],
            [["hy", "ho"], true],
            [[1], false],
            [["hy", 1, "ho"], false],
            [["hy", {}, "ho"], false],
            [[new String()], false]
        ])("given inputs expected results %s => %s", (givenInput, expectedResult) => {
            const res = isStringArray(givenInput)
            expect(res).toBe(expectedResult)
        })
    })

    describe("isString", () => {
        test.each([
            [1, false],
            [{}, false],
            ["", true],
            [new String(), false]
        ])("given inputs expected results %s => %s", (givenInput, expectedResult) => {
            const res = isString(givenInput)
            expect(res).toBe(expectedResult)
        })
    })

    describe("rsplitOnce", () => {
        test("splits once from the back", () => {
            const res = rSplitOnce("a.b.c.d", ".")
            expect(res).toEqual(["a.b.c", "d"])
        })

        test("returns array of length 1 if no split exists", () => {
            const res = rSplitOnce("a.b.c", "/")
            expect(res).toEqual(["a.b.c"])
        })
    })

    describe("trimmedLineSet", () => {
        test("splits lines correctly", () => {
            const lines = `a1${EOL}b${EOL}c3${EOL}`
            const res = trimmedLineSet(lines)
            expect(res).toEqual(new Set(["a1", "b", "c3"]))
        })

        test("handles empty lines", () => {
            const lines = `${EOL}b${EOL}${EOL}c3${EOL}`
            const res = trimmedLineSet(lines)
            expect(res).toEqual(new Set(["", "b", "c3"]))
        })

        test("handles no tailing EOL", () => {
            const lines = `a1${EOL}b${EOL}c3`
            const res = trimmedLineSet(lines)
            expect(res).toEqual(new Set(["a1", "b", "c3"]))
        })

        test("remove duplicate lines", () => {
            const lines = `a1${EOL}b${EOL}c3${EOL}`
            const res = trimmedLineSet(lines)
            expect(res).toEqual(new Set(["a1", "b", "c3"]))
        })

        test("uses os.EOL", () => {
            expect(EOL).not.toEqual
            const oneLine = "abc\rdef\rghi"
            const res = trimmedLineSet(oneLine)
            expect(res).toEqual(new Set([oneLine]))
        })

        test("trims all lines independently", () => {
            const lines = ` a1${EOL}  b ${EOL}c3${EOL}  `
            const res = trimmedLineSet(lines)
            expect(res).toEqual(new Set(["a1", "b", "c3", ""]))
        })

        test("works with git out", () => {
            const lines =
                `barfoo${EOL}` + `foobar${EOL}` + `v0.0.1${EOL}` + `v1.0.0${EOL}` + `v1.0.1${EOL}`
            const res = trimmedLineSet(lines)
            expect(res).toEqual(new Set(["barfoo", "foobar", "v0.0.1", "v1.0.0", "v1.0.1"]))
        })

        test("works with empty git out", () => {
            const lines = EOL
            const res = trimmedLineSet(lines)
            expect(res).toEqual(new Set([]))
        })

        test("works with empty out", () => {
            const lines = ""
            const res = trimmedLineSet(lines)
            expect(res).toEqual(new Set([]))
        })
    })

    describe("addAllTo", () => {
        test("adds all values of second param to first param", () => {
            const set = new Set()
            const r = addTo(set, new Set([1, 2, 3]))
            expect(set).toEqual(new Set([1, 2, 3]))
            expect(set).toBe(r)
        })

        test("can be used with different iterables", () => {
            const set = new Set()
            const r = addTo(set, [1, 2, 3])
            expect(set).toEqual(new Set([1, 2, 3]))
            expect(set).toBe(r)
        })
    })

    describe("deleteAllFrom", () => {
        test("deletes all values of second param to first param", () => {
            const set = new Set([1, 2, 3, 4, 5])
            const r = deleteFrom(set, new Set([1, 2, 3]))
            expect(set).toEqual(new Set([4, 5]))
            expect(set).toBe(r)
        })

        test("can be used with different iterables", () => {
            const set = new Set([1, 2, 3, 4, 5])
            const r = deleteFrom(set, [1, 2, 3])
            expect(set).toEqual(new Set([4, 5]))
            expect(set).toBe(r)
        })
    })
})
