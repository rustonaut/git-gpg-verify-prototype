import { getStringList } from "./simple"

/** combines the baseName with the Commits/Tags suffix and returns a list input for both
 *
 *  The first entry in the tuple is the list for commits and the
 *  second is the list for tags.
 *
 *  E.g. getInputForCommitTagList("included") to get both
 *  "includedCommits" and "includedTags" as lists.
 */
export function getCommitAndTagList(baseName: string): [string[], string[]] {
    const commitList = getStringList(`${baseName}Commits`) ?? []
    const tagList = getStringList(`${baseName}Tags`) ?? []
    return [commitList, tagList]
}

/** call getFn on the base name and if empty on the baseName with ForCommits and ForTags prefix
 *
 * If the base name returns a value that value is returned duplicated as tuple.
 *
 * The first tuple variant is the value for commits the second the value for tags.
 *
 * If the base name doesn't return a value then it's called with a "ForCommits" and
 * "ForTags" suffix and that values are used as first and second value of the return value.
 *
 * If any of the calls with suffix doesn't return a value the default value is used, instead
 * of a default value for both suffixes a tuple of two default values can be passed in where
 * the first is for the commit suffix and the second for the tag suffix.
 *
 * This handles situations like having three inputs: "requireSignature",
 * "requireSignatureForCommits" and "requireSignatureForTags" where the
 * first if given is applied to both the second and third overwriting them.
 *
 * For this example we would use:
 *
 * const [requireSignaturesForCommits, requireSignaturesForTags] =
 *     getInputForCommitsTagsAndAll("requireSignatures", getBoolean, [false, true]))
 *
 * Making it default to false for commits but default to
 * true for tags.
 *
 */
export function getInputForCommitsTagsAndAll<T>(
    baseName: string,
    getFn: (name: string) => T | null,
    defaultVal: T | [T, T]
): [T, T] {
    const forAll = getFn(baseName)
    if (forAll !== null) {
        return [forAll, forAll]
    }

    let commitDefault: T
    let tagDefault: T

    if (defaultVal instanceof Array) {
        commitDefault = defaultVal[0]
        tagDefault = defaultVal[1]
    } else {
        commitDefault = defaultVal
        tagDefault = defaultVal
    }

    const forCommits = getFn(`${baseName}ForCommits`) ?? commitDefault
    const forTags = getFn(`${baseName}ForTags`) ?? tagDefault
    return [forCommits, forTags]
}
