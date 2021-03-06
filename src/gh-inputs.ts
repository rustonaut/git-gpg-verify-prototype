import { getCommitRange } from "./gh-inputs/commit-range"
import { getTagFilterRegex } from "./gh-inputs/filter"
import { getCommitAndTagList, getInputForCommitsTagsAndAll } from "./gh-inputs/muxed"
import { getBoolean, getCollectFromGitOption, getTrustLevel } from "./gh-inputs/simple"
import { TrustLevel } from "./gpg/interfaces"
import { Options } from "./inner-api"

/** parse/get all github action inputs returning an Options instance
 *
 *  This should parse following list github inputs, not that some are
 *  overrides for others and some are incompatible:
 *
 *  - ignoreUnknownKeys
 *  - ignoreUnknownKeysForTags
 *  - ignoreUnknownKeysForCommits
 *  - ignoreUntrustyKeys
 *  - ignoreUntrustyKeysForTags
 *  - ignoreUntrustyKeysForCommits
 *  - requireMinTrustLevel
 *  - requireMinTrustLevelForCommits
 *  - requireMinTrustLevelForTags
 *  - requireSignature
 *  - requireSignatureForCommits
 *  - requireSignatureForTags
 *  - includedTags
 *  - includedCommits
 *  - excludedTags
 *  - excludedCommits
 *  - includeTagsFromGit
 *  - includeCommitsFromGitAfter
 *  - includeCommitsFromGitUpTo
 *  - includePrCommits
 *  - filterTags
 */
export function parseGithubActionInputs(): Options {
    //ignoreUnknownKeys, ignoreUnknownKeysForCommits, ignoreUnknownKeysForTags
    const [ignoreUnknownKeysForCommits, ignoreUnknownKeysForTags] = getInputForCommitsTagsAndAll(
        "ignoreUnknownKeys",
        getBoolean,
        false
    )

    //ignoreUntrustyKeys, ignoreUntrustyKeysForCommits, ignoreUntrustyKeysForTags
    const [ignoreUntrustyKeysForCommits, ignoreUntrustyKeysForTags] = getInputForCommitsTagsAndAll(
        "ignoreUntrustyKeys",
        getBoolean,
        false
    )

    //requireMinTrustLevel, requireMinTrustLevelForCommits, requireMinTrustLevelForTags
    const [
        requireMinTrustLevelForCommits,
        requireMinTrustLevelForTags
    ] = getInputForCommitsTagsAndAll("requireMinTrustLevel", getTrustLevel, TrustLevel.Undefined)

    //requireSignature, requireMinTrustLevelForCommits, requireMinTrustLevelForTags
    const [
        requireSignatureForCommits,
        requireSignatureForTags
    ] = getInputForCommitsTagsAndAll("requireSignature", getBoolean, [false, true])

    //includedCommits, includedTags
    const [includedCommits, includedTags] = getCommitAndTagList("included")

    //excludedCommits, excludedTags
    const [excludedCommits, excludedTags] = getCommitAndTagList("excluded")

    //includeCommitsFromGitAfter, includeCommitsFromGitUpTo, includePrCommits
    const commitRange = getCommitRange()

    //includeTagsFromGit
    const includeTagsFromGit = getCollectFromGitOption()

    //filterTags
    const filterRegex = getTagFilterRegex()

    return {
        collection: {
            forCommits: {
                explicitlyInclude: includedCommits,
                includeInRange: commitRange,
                explicitlyExclude: excludedCommits
            },
            forTags: {
                explicitlyInclude: includedTags,
                includeFromGit: includeTagsFromGit,
                explicitlyExclude: excludedTags,
                filterRegex: filterRegex
            }
        },
        verification: {
            forCommits: {
                ignoreUnknownKeys: ignoreUnknownKeysForCommits,
                ignoreUntrustedKeys: ignoreUntrustyKeysForCommits,
                requireMinTrustLevel: requireMinTrustLevelForCommits,
                requireSignature: requireSignatureForCommits
            },
            forTags: {
                ignoreUnknownKeys: ignoreUnknownKeysForTags,
                ignoreUntrustedKeys: ignoreUntrustyKeysForTags,
                requireMinTrustLevel: requireMinTrustLevelForTags,
                requireSignature: requireSignatureForTags
            }
        }
    }
}
