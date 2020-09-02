jest.mock("../../src/gh-inputs/simple")

import { mocked } from "ts-jest/utils"
import { getCommitAndTagList, getInputForCommitsTagsAndAll } from "../../src/gh-inputs/muxed"
import { getList as _getList } from "../../src/gh-inputs/simple"

const getList = mocked(_getList)

describe("gh-inputs/muxed", () => {
    beforeEach(() => {
        jest.resetAllMocks()
    })

    describe("getInputForCommitTagList", () => {
        test("calls getList for commits and tags returning results in right order", () => {
            getList.mockReturnValueOnce(["cmit1", "cmit2"])
            getList.mockReturnValueOnce(["v1", "v231"])

            const res = getCommitAndTagList("included")

            expect(res).toEqual([
                ["cmit1", "cmit2"],
                ["v1", "v231"]
            ])

            expect(getList.mock.calls).toEqual([["includedCommits"], ["includedTags"]])
        })
    })

    describe("getInputForCommitsTagsAndAll", () => {
        test("use override if given", () => {
            const getInput = jest.fn<number | null, [string]>()
            getInput.mockReturnValueOnce(42)
            const res = getInputForCommitsTagsAndAll("footBar", getInput, 32)

            expect(res).toEqual([42, 42])
            expect(getInput).toHaveBeenCalledWith("footBar")
            expect(getInput).toHaveBeenCalledTimes(1)
        })

        test("if no override query tag and commit values", () => {
            const getInput = jest.fn<number | null, [string]>()
            getInput.mockReturnValueOnce(null)
            getInput.mockReturnValueOnce(12)
            getInput.mockReturnValueOnce(21)

            const res = getInputForCommitsTagsAndAll("barFoot", getInput, 32)

            expect(res).toEqual([12, 21])
            expect(getInput.mock.calls).toEqual([
                ["barFoot"],
                ["barFootForCommits"],
                ["barFootForTags"]
            ])
        })

        test("use default for tags", () => {
            const getInput = jest.fn<number | null, [string]>()
            getInput.mockReturnValueOnce(null)
            getInput.mockReturnValueOnce(12)
            getInput.mockReturnValueOnce(null)

            const res = getInputForCommitsTagsAndAll("barFoot", getInput, [42, 32])

            expect(res).toEqual([12, 32])
            expect(getInput.mock.calls).toEqual([
                ["barFoot"],
                ["barFootForCommits"],
                ["barFootForTags"]
            ])
        })

        test("use shared default for tags", () => {
            const getInput = jest.fn<number | null, [string]>()
            getInput.mockReturnValueOnce(null)
            getInput.mockReturnValueOnce(12)
            getInput.mockReturnValueOnce(null)

            const res = getInputForCommitsTagsAndAll("barFoot", getInput, 32)

            expect(res).toEqual([12, 32])
            expect(getInput.mock.calls).toEqual([
                ["barFoot"],
                ["barFootForCommits"],
                ["barFootForTags"]
            ])
        })

        test("use default for commits", () => {
            const getInput = jest.fn<number | null, [string]>()
            getInput.mockReturnValueOnce(null)
            getInput.mockReturnValueOnce(null)
            getInput.mockReturnValueOnce(21)

            const res = getInputForCommitsTagsAndAll("barFoot", getInput, [23, 32])

            expect(res).toEqual([23, 21])
            expect(getInput.mock.calls).toEqual([
                ["barFoot"],
                ["barFootForCommits"],
                ["barFootForTags"]
            ])
        })

        test("use shared default for commits", () => {
            const getInput = jest.fn<number | null, [string]>()
            getInput.mockReturnValueOnce(null)
            getInput.mockReturnValueOnce(null)
            getInput.mockReturnValueOnce(21)

            const res = getInputForCommitsTagsAndAll("barFoot", getInput, 22)

            expect(res).toEqual([22, 21])
            expect(getInput.mock.calls).toEqual([
                ["barFoot"],
                ["barFootForCommits"],
                ["barFootForTags"]
            ])
        })
    })
})
