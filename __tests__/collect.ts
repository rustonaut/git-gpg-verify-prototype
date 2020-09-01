jest.mock("../src/git")

import { mocked } from "ts-jest/utils"
import {
    collectCommits,
    collectCommitsAndTags,
    CollectFromGitOptions,
    collectTags,
    collectTagsFromGit,
    CommitCollectionOptions,
    filterTags,
    TagCollectionOptions
} from "../src/collect"
import {
    listAllTags as _listAllTags,
    listCommitsInRange as _listCommitsInRange,
    listTagsForCommits as _listTagsForCommits
} from "../src/git"

const listAllTags = mocked(_listAllTags)
const listTagsForCommits = mocked(_listTagsForCommits)
const listCommitsInRange = mocked(_listCommitsInRange)

describe("collection of tags/commits", () => {
    describe("collectCommitsAndTags", () => {
        beforeEach(() => {
            jest.resetAllMocks()
        })

        // Close to all logic was moved from collectTags to subfunctions
        // which are tested independently, collectTags just wires them
        // together so only one test is fine
        test("run collectCommits and pipe result to collectTags and return combined results", async () => {
            // combine test from collectCommits and from collectTags
            const commit_options: CommitCollectionOptions = {
                explicitly_include: ["abcdef", "0123"],
                include_in_range: { from_ref: "/ref/from", to_ref: "/refs/to" },
                explicitly_exclude: ["0123", "hijk"]
            }

            listCommitsInRange.mockResolvedValueOnce(new Set(["defg", "hijk"]))

            const tag_options: TagCollectionOptions = {
                explicitly_include: ["v1", "v5"],
                include_from_git: CollectFromGitOptions.ForCommits,
                explicitly_exclude: ["v3", "v5"],
                filter_regex: /v\d+/
            }

            listTagsForCommits.mockResolvedValueOnce(new Set(["v2", "v3", "testA"]))

            const res = await collectCommitsAndTags({
                for_tags: tag_options,
                for_commits: commit_options
            })

            expect(res.commits).toEqual(new Set(["abcdef", "defg"]))
            expect(listCommitsInRange).toHaveBeenCalledTimes(1)
            expect(listCommitsInRange).toHaveBeenCalledWith("/ref/from", "/refs/to")

            expect(res.tags).toEqual(new Set(["v1", "v2"]))
            expect(listTagsForCommits).toHaveBeenCalledTimes(1)
            expect(listTagsForCommits).toHaveBeenCalledWith(res.commits)
        })
    })

    describe("collectCommits", () => {
        beforeEach(() => {
            jest.resetAllMocks()
        })

        // Close to all logic was moved from collectTags to subfunctions
        // which are tested independently, collectTags just wires them
        // together so only one test is fine
        test("runs the 3 options in a pipeline", async () => {
            // add "abcdef", "0123"
            // add "defg", "hijk" from git
            // rm "0123", "hijk"
            // == "abcdef", "defg"
            const options: CommitCollectionOptions = {
                explicitly_include: ["abcdef", "0123"],
                include_in_range: { from_ref: "/ref/from", to_ref: "/refs/to" },
                explicitly_exclude: ["0123", "hijk"]
            }

            listCommitsInRange.mockResolvedValueOnce(new Set(["defg", "hijk"]))

            const res = await collectCommits(options)

            expect(res).toEqual(new Set(["abcdef", "defg"]))
            expect(listCommitsInRange).toHaveBeenCalledTimes(1)

            expect(listCommitsInRange).toHaveBeenCalledWith("/ref/from", "/refs/to")
        })
    })

    describe("collectTags", () => {
        beforeEach(() => {
            jest.resetAllMocks()
        })

        // Close to all logic was moved from collectTags to subfunctions
        // which are tested independently, collectTags just wires them
        // together so only one test is fine
        test("runs the 4 options in a pipeline", async () => {
            // add v1,v5
            // add v2,v3, testA from commits
            // delete v3,v5 explicitly
            // filter out testA
            // == v1,v2

            const options: TagCollectionOptions = {
                explicitly_include: ["v1", "v5"],
                include_from_git: CollectFromGitOptions.ForCommits,
                explicitly_exclude: ["v3", "v5"],
                filter_regex: /v\d+/
            }

            const commits = new Set(["abcdsaffew", "aspojdjadasd"])
            const _commits = new Set(commits)

            listTagsForCommits.mockResolvedValueOnce(new Set(["v2", "v3", "testA"]))

            const res = await collectTags(options, commits)

            expect(res).toEqual(new Set(["v1", "v2"]))
            expect(listTagsForCommits).toHaveBeenCalledTimes(1)
            expect(listTagsForCommits).toHaveBeenCalledWith(commits)
            expect(commits).toEqual(_commits)
        })
    })

    describe("filterTags", () => {
        test("do not filter tags if regex is null", () => {
            const tags = new Set(["v1", "v2", "x10"])
            const res = filterTags(tags, null)
            expect(res).toEqual(new Set(["v1", "v2", "x10"]))
        })

        test("filter out non matching tags", () => {
            const regex = /v\d+/
            const tags = new Set(["v", "v1", "v2", "x10"])
            const res = filterTags(tags, regex)
            expect(res).toEqual(new Set(["v1", "v2"]))
        })

        test("doesn't mess with regex options", () => {
            const regex = /v\d+/i
            const tags = new Set(["v", "V1", "v2", "x10"])
            const res = filterTags(tags, regex)
            expect(res).toEqual(new Set(["V1", "v2"]))
        })

        test("doesn't modify the passed in set", () => {
            const regex = /v\d+/
            const tags = new Set(["v", "V1", "v2", "x10"])
            const tags2 = new Set(tags)
            const res = filterTags(tags, regex)
            expect(res).toEqual(new Set(["v2"]))
            expect(tags).toEqual(tags2)
        })
    })

    describe("collectTagsFromGit", () => {
        beforeEach(() => {
            jest.resetAllMocks()
        })

        test("None will return an empty set", async () => {
            const commits = new Set(["abcdef"])
            const _commits = new Set(commits)
            const options = CollectFromGitOptions.None
            const res = await collectTagsFromGit(options, commits)
            expect(res).toEqual(new Set())
            expect(listAllTags).not.toHaveBeenCalled()
            expect(listTagsForCommits).not.toHaveBeenCalled()
            expect(commits).toEqual(_commits)
        })

        test("All will return the result of listAllTags", async () => {
            const commits = new Set(["abcdef"])
            const _commits = new Set(commits)
            const options = CollectFromGitOptions.All
            const mock_res = new Set(["v1", "v2", "v3"])
            listAllTags.mockResolvedValueOnce(mock_res)

            const res = await collectTagsFromGit(options, commits)

            expect(res).toEqual(mock_res)
            expect(listAllTags).toHaveBeenCalledTimes(1)
            expect(listTagsForCommits).not.toHaveBeenCalled()
            expect(commits).toEqual(_commits)
        })

        test("ForCommits will return the result of listAllTagsForCommits", async () => {
            const commits = new Set(["abcdef"])
            const _commits = new Set(commits)
            const options = CollectFromGitOptions.ForCommits
            const mock_res = new Set(["v1"])
            listTagsForCommits.mockResolvedValueOnce(mock_res)

            const res = await collectTagsFromGit(options, commits)

            expect(res).toEqual(mock_res)
            expect(listAllTags).not.toHaveBeenCalled()
            expect(listTagsForCommits).toHaveBeenCalledTimes(1)
            expect(listTagsForCommits).toHaveBeenCalledWith(commits)
            expect(commits).toEqual(_commits)
        })
    })
})
