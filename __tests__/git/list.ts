jest.mock("../../src/git/ffi")

import * as git from "../../src/git"
import { listAllTags } from "../../src/git"
import * as _gitFfi from "../../src/git/ffi"
// We can't use this directly as the mock injected for ffi and
// the module loaded by loading the source of that mock directly
// seem not the be the same, i.e. closure don't close over the
// same variables
import * as _ffiMock from "../../src/git/__mocks__/ffi"

const ffiMock = _gitFfi as typeof _ffiMock

describe("listAllTags", () => {
    test("return all tags", async () => {
        const tags = await git.listAllTags()
        expect(tags).toEqual(new Set(["v0.0.1", "v1.0.0", "v1.0.1", "foobar", "barfoo"]))
    })

    test("checks exit code", async () => {
        ffiMock.failNextNGitCalls(1)
        await expect(listAllTags()).rejects.toThrow(/list all tags failed/)
    })
})

describe("listTagsForCommit", () => {
    test("commit with no tags", async () => {
        const tags = await git.listTagsForCommit(ffiMock.CM1)
        expect(tags).toEqual(new Set([]))
    })
    test("commit with one tag", async () => {
        const tags = await git.listTagsForCommit(ffiMock.CM4)
        expect(tags).toEqual(new Set(["v0.0.1"]))
    })
    test("commit with multiple tags", async () => {
        const tags = await git.listTagsForCommit(ffiMock.CM2)
        expect(tags).toEqual(new Set(["foobar", "barfoo"]))
    })
})

describe("listTagsForCommits", () => {
    test("including commits with no, one and multiple tags", async () => {
        const tags = await git.listTagsForCommits([ffiMock.CM2, ffiMock.CM3, ffiMock.CM4])
        expect(tags).toEqual(new Set(["v0.0.1", "foobar", "barfoo"]))
    })

    test("can handle input sets", async () => {
        const tags = await git.listTagsForCommits(new Set([ffiMock.CM2, ffiMock.CM3, ffiMock.CM4]))
        expect(tags).toEqual(new Set(["v0.0.1", "foobar", "barfoo"]))
    })

    test("can handle an empty input list", async () => {
        const tags = await git.listTagsForCommits([])
        expect(tags).toEqual(new Set([]))
    })

    test("can handle duplicate inputs", async () => {
        const tags = await git.listTagsForCommits([ffiMock.CM4, ffiMock.CM4])
        expect(tags).toEqual(new Set(["v0.0.1"]))
    })
})

describe("listCommitsInRange", () => {
    test.each([
        [ffiMock.CM3, ffiMock.CM6, [ffiMock.CM4, ffiMock.CM5, ffiMock.CM6]],
        [ffiMock.CM1, ffiMock.CM4, [ffiMock.CM2, ffiMock.CM3, ffiMock.CM4]],
        [ffiMock.CM2, ffiMock.CM2, []],
        [ffiMock.CM2, ffiMock.CM3, [ffiMock.CM3]],
        [ffiMock.CM6, ffiMock.CM1, []],
        [ffiMock.CM4, "", [ffiMock.CM5, ffiMock.CM6]],
        ["", ffiMock.CM2, [ffiMock.CM1, ffiMock.CM2]]
    ])(
        "contains all commits in range: %s..%s",
        async (from: string, to: string, expected: string[]) => {
            const commits = await git.listCommitsInRange(from, to)

            expect(commits).toEqual(new Set(expected))
        }
    )
})
