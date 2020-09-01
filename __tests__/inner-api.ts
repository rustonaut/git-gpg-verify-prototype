jest.mock("../src/git")

import { mocked } from "ts-jest/utils"
import {
    collectCommitsAndTags as _collectCommitsAndTags,
    CollectFromGitOptions,
    verifyCommitsAndTags as _verifyCommitsAndTags
} from "../src/git"
import { TrustLevel } from "../src/gpg"
import { collectAndVerify, Options } from "../src/inner-api"

const collectCommitsAndTags = mocked(_collectCommitsAndTags)
const verifyCommitsAndTags = mocked(_verifyCommitsAndTags)

describe("inner-api", () => {
    beforeEach(() => {
        jest.resetAllMocks()
    })

    describe("collectAndVerify", () => {
        test("calls the right functions with the right params", async () => {
            const options: Options = {
                collection: {
                    for_commits: {
                        explicitly_include: ["abc"],
                        include_in_range: { from_ref: "/ref/from", to_ref: "/ref/to" },
                        explicitly_exclude: ["def"]
                    },
                    for_tags: {
                        explicitly_include: ["v0"],
                        include_from_git: CollectFromGitOptions.All,
                        explicitly_exclude: ["v102"],
                        filter_regex: null
                    }
                },
                verification: {
                    for_commits: {
                        ignoreUnknownKeys: false,
                        ignoreUntrustedKeys: false,
                        requireMinTrustLevel: TrustLevel.Marginal,
                        requireSignature: false
                    },
                    for_tags: {
                        ignoreUnknownKeys: false,
                        ignoreUntrustedKeys: false,
                        requireMinTrustLevel: TrustLevel.Full,
                        requireSignature: true
                    }
                }
            }

            collectCommitsAndTags.mockResolvedValueOnce({
                commits: new Set(["abc", "hij"]),
                tags: new Set(["v0", "v1"])
            })

            verifyCommitsAndTags.mockResolvedValueOnce([
                new Error("hyho"),
                new Error("duda"),
                new Error("dumdum")
            ])

            const res = await collectAndVerify(options)

            expect(res.commits).toEqual(new Set(["abc", "hij"]))
            expect(res.tags).toEqual(new Set(["v0", "v1"]))

            const error_msgs = new Set(res.errors.map(err => err.message))
            expect(error_msgs).toEqual(new Set(["hyho", "duda", "dumdum"]))
            expect(res.errors.length).toEqual(3)

            expect(collectCommitsAndTags).toHaveBeenCalledTimes(1)
            expect(collectCommitsAndTags).toHaveBeenCalledWith(options.collection)
            expect(verifyCommitsAndTags).toHaveBeenCalledTimes(1)
            expect(verifyCommitsAndTags).toHaveBeenLastCalledWith(
                {
                    commits: new Set(["abc", "hij"]),
                    tags: new Set(["v0", "v1"])
                },
                options.verification
            )
        })
    })
})
