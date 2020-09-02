jest.mock("../../src/gh-inputs/simple")

import { mocked } from "ts-jest/utils"
import {
    fixGithubBaseRef,
    fixGithubRef,
    getFixedGithubBaseRef,
    getFixedGithubRef,
    getPrCommitRange
} from "../../src/gh-inputs/pr"
import { getBoolean as _getBoolean } from "../../src/gh-inputs/simple"

const getBoolean = mocked(_getBoolean)

describe("fixGithubBaseRef", () => {
    test("if it's not a ref assume it's a branch name and redirect it to refs/remotes/origin/<branch>", () => {
        const res = fixGithubBaseRef("nightly")
        expect(res).toEqual("refs/remotes/origin/nightly")
    })

    test("don't change it if it's already a ref", () => {
        const res = fixGithubBaseRef("refs/remotes/magic/dog")
        expect(res).toEqual("refs/remotes/magic/dog")
    })
})

describe("fixGithubRef", () => {
    test("if it's refs/pull redirect to ref/remotes/pull", () => {
        const res = fixGithubRef("refs/pull/15/merge")
        expect(res).toEqual("refs/remotes/pull/15/merge")
    })

    test("don't change it if it's not refs/pull", () => {
        const res = fixGithubRef("refs/remotes/magic")
        expect(res).toEqual("refs/remotes/magic")
    })
})

describe("with env mocking", () => {
    const OLD_ENV = process.env

    beforeEach(() => {
        jest.resetAllMocks()
        //NOTE: This won't work if a module accessed the env during
        //      module load time. To work with that we need to use
        //      resetModules to clear the cache and then load the
        //      module during the test.
        process.env = { ...OLD_ENV }
    })

    afterAll(() => {
        process.env = OLD_ENV
    })

    describe("getPrCommitRange", () => {
        test("return null if unset", () => {
            getBoolean.mockReturnValueOnce(null)

            const res = getPrCommitRange()

            expect(res).toBe(null)
            expect(getBoolean).toHaveBeenCalledWith("includePrCommits")
            expect(getBoolean).toHaveBeenCalledTimes(1)
        })

        test("return null if explicitly disabled", () => {
            getBoolean.mockReturnValueOnce(false)

            const res = getPrCommitRange()

            expect(res).toBe(null)
            expect(getBoolean).toHaveBeenCalledWith("includePrCommits")
            expect(getBoolean).toHaveBeenCalledTimes(1)
        })

        test("else grab GITHUB_REF and GITHUB_BASE_REF and fix them", () => {
            getBoolean.mockReturnValueOnce(true)
            process.env.GITHUB_REF = "refs/pull/15/merge"
            process.env.GITHUB_BASE_REF = "nightly"

            const res = getPrCommitRange()

            expect(res).toEqual({
                from_ref: "refs/remotes/origin/nightly",
                to_ref: "refs/remotes/pull/15/merge"
            })

            expect(getBoolean).toHaveBeenCalledWith("includePrCommits")
            expect(getBoolean).toHaveBeenCalledTimes(1)
        })
    })

    describe("getFixedGithubBaseRef", () => {
        test("throws error if GITHUB_BASE_REF is empty", () => {
            getBoolean.mockReturnValueOnce(true)
            process.env.GITHUB_BASE_REF = ""

            expect(() => getFixedGithubBaseRef()).toThrowError("GITHUB_BASE_REF")
        })

        test("throws error if GITHUB_BASE_REF is not set", () => {
            getBoolean.mockReturnValueOnce(true)
            delete process.env.GITHUB_BASE_REF

            expect(() => getFixedGithubBaseRef()).toThrowError("GITHUB_BASE_REF")
        })

        test("uses fixGithubBaseRef", () => {
            getBoolean.mockReturnValueOnce(true)
            process.env.GITHUB_BASE_REF = "nightly"

            const res = getFixedGithubBaseRef()

            expect(res).toEqual("refs/remotes/origin/nightly")
        })
    })

    describe("getFixedGithubRef", () => {
        test("throws error if GITHUB_REF is empty", () => {
            getBoolean.mockReturnValueOnce(true)
            process.env.GITHUB_REF = ""

            expect(() => getFixedGithubRef()).toThrowError("GITHUB_REF")
        })

        test("throws error if GITHUB_REF is not set", () => {
            getBoolean.mockReturnValueOnce(true)
            delete process.env.GITHUB_REF

            expect(() => getFixedGithubRef()).toThrowError("GITHUB_REF")
        })

        test("uses fixGithubRef", () => {
            getBoolean.mockReturnValueOnce(true)
            process.env.GITHUB_REF = "refs/pull/15/merge"

            const res = getFixedGithubRef()

            expect(res).toEqual("refs/remotes/pull/15/merge")
        })
    })
})
