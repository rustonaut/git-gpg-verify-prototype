jest.mock("../src/git")

import { mocked } from "ts-jest/utils"
import {
    collectCommitsAndTags as _collectCommitsAndTags,
    CollectTagsFromGitOption,
    verifyCommitsAndTags as _verifyCommitsAndTags
} from "../src/git"
import { TrustLevel } from "../src/gpg"
import { collectAndVerify, Options } from "../src/inner-api"

const collectCommitsAndTags = mocked(_collectCommitsAndTags)
const verifyCommitsAndTags = mocked(_verifyCommitsAndTags)

beforeEach(() => {
    jest.resetAllMocks()
})

describe("collectAndVerify", () => {
    test("calls the right functions with the right params", async () => {
        const options: Options = {
            collection: {
                forCommits: {
                    explicitlyInclude: ["abc"],
                    includeInRange: { fromRef: "/ref/from", toRef: "/ref/to" },
                    explicitlyExclude: ["def"]
                },
                forTags: {
                    explicitlyInclude: ["v0"],
                    includeFromGit: CollectTagsFromGitOption.All,
                    explicitlyExclude: ["v102"],
                    filterRegex: null
                }
            },
            verification: {
                forCommits: {
                    ignoreUnknownKeys: false,
                    ignoreUntrustedKeys: false,
                    requireMinTrustLevel: TrustLevel.Marginal,
                    requireSignature: false
                },
                forTags: {
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
