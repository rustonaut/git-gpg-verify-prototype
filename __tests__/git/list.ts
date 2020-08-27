jest.mock("../../src/git/ffi")

import * as git from "../../src/git";
import { listAllTags } from "../../src/git";
import * as _git_ffi from "../../src/git/ffi";
// We can't use this directly as the mock injected for ffi and
// the module loaded by loading the source of that mock directly
// seem not the be the same, i.e. closure don't close over the
// same variables
import * as _ffi_mock from "../../src/git/__mocks__/ffi";

const ffi_mock = _git_ffi as typeof _ffi_mock

describe("git cli ffi", () => {
    describe("listAllTags", () => {
        test("return all tags", async () => {
            const tags = await git.listAllTags();
            expect(tags).toEqual(new Set([
                "v0.0.1",
                "v1.0.0",
                "v1.0.1",
                "foobar",
                "barfoo"
            ]))
        })

        test("checks exit code", async () => {
            ffi_mock.failNextNGitCalls(1)
            await expect(listAllTags()).rejects.toThrow(/list all tags failed/)
        })
    })

    describe("listTagsForCommit", () => {
        test("commit with no tags", async () => {
            const tags = await git.listTagsForCommit(ffi_mock.CM1)
            expect(tags).toEqual(new Set([]))
        })
        test("commit with one tag", async () => {
            const tags = await git.listTagsForCommit(ffi_mock.CM4)
            expect(tags).toEqual(new Set([
                "v0.0.1",
            ]))
        })
        test("commit with multiple tags", async () => {
            const tags = await git.listTagsForCommit(ffi_mock.CM2)
            expect(tags).toEqual(new Set([
                "foobar",
                "barfoo"
            ]))
        })
    })
})


