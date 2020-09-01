import { listAllTags, listCommitsInRange, listTagsForCommits } from "./git"
import { addTo, deleteFrom } from "./utils"

/** all commits and tags which have been collected */
export interface CollectedEntities {
    /** collected tags (names) */
    tags: Set<string>

    /** collected commits (hashes) */
    commits: Set<string>
}

/** options about how to collect tags and commits */
export interface CollectionOptions {
    for_tags: TagCollectionOptions
    for_commits: CommitCollectionOptions
}

/** collect all commits and tags which needs to be checked
 *
 *  If running git commands fail this will throw an error /
 *  the promise will be rejected.
 */
export async function collectCommitsAndTags(
    collectionOptions: CollectionOptions
): Promise<CollectedEntities> {
    const commits = await collectCommits(collectionOptions.for_commits)
    const tags = await collectTags(collectionOptions.for_tags, commits)
    return {
        tags,
        commits
    }
}

/** Options for collection commits
 *
 *  The options are applied in following order:
 *
 *  - first add all explicitly included commits
 *    (it's not checked that they do actually exist)
 *
 *  - then add all commits from git
 *
 *  - then remove all explicitly excluded commits from the set of commits
 */
export interface CommitCollectionOptions {
    /** commits to explicitly include */
    explicitly_include: string[]

    /** the "range" of commits to include using `git rev-list` */
    include_in_range: CommitRang

    /** commits to explicitly exclude */
    explicitly_exclude: string[]
}

/** A commit range roughly as used by `git rev-list`
 *
 *  This will lead to a `git rev-list` call roughly like following:
 *
 *  `git rev-list ${from_ref}..${to_ref}`
 *
 *  Except if start_ref is "" in which case it roughly matches to:
 *
 *  `git rev-list ${to_ref}`
 *
 *  To produce the expected range like behavior.
 *
 *  If both `from_ref` and `to_ref` are "" a error will be returned.
 *
 *  WARNING: The exact way the range is done might change in the future,
 *  But using something like `master..` to list all commits on this branch
 *  since forking out from master should always work.
 */
export interface CommitRang {
    /** the start ref which can be "" or a commit, branch or "raw" ref */
    from_ref: string
    /** the end ref which can be "" or commit, branch or "raw" ref */
    to_ref: string
}

/** collect commits */
export async function collectCommits(
    collectionOptions: CommitCollectionOptions
): Promise<Set<string>> {
    const commits = new Set(collectionOptions.explicitly_include)
    const { from_ref, to_ref } = collectionOptions.include_in_range
    addTo(commits, await listCommitsInRange(from_ref, to_ref))
    deleteFrom(commits, collectionOptions.explicitly_exclude)
    return commits
}

/** specify how tags should be collected
 *
 *  The options are applied in following order:
 *
 *  - first all explicitly included tags are added to the set of tags
 *
 *  - then tags are included from the git repo based on the given CollectFromGitOptions
 *
 *  - then all explicitly exclude tags are removed from the set
 *
 *  - lastly the filter is (if given) applied to all tags and all not matching tags are removed
 *
 *  This means a Tag included explicitly can still be removed through explicit exclusion or
 *  the regex filter.
 */
export interface TagCollectionOptions {
    /** explicitly include following tags
     *
     * It's not checked if the explicitly included tags do exists!
     */
    explicitly_include: string[]

    /** include all tags found through `git tags --list`  */
    include_from_git: CollectFromGitOptions

    /** exclude following tags */
    explicitly_exclude: string[]

    /** filter all found tags with given regex, THIS IS APPLIED last
     *
     *  Apply a regex on the tag *name* to determine weather or not to
     *  keep or discard it.
     */
    filter_regex: RegExp | null
}

/** how git tags should  be collected from the git repo */
export enum CollectFromGitOptions {
    /** do not collect any tags from the git repo */
    None = "None",

    /** collect all tags returned by `git tag --list` */
    All = "All",

    /** collect all tags for all included commits */
    ForCommits = "ForCommits"
}

/** collect tags */
export async function collectTags(
    collectionOptions: TagCollectionOptions,
    commits: Set<string>
): Promise<Set<string>> {
    const tags = new Set(collectionOptions.explicitly_include)
    addTo(tags, await collectTagsFromGit(collectionOptions.include_from_git, commits))
    deleteFrom(tags, collectionOptions.explicitly_exclude)
    return filterTags(tags, collectionOptions.filter_regex)
}

/** collect tags form git */
export async function collectTagsFromGit(
    collectionOptions: CollectFromGitOptions,
    commits: Set<string>
): Promise<Set<string>> {
    switch (collectionOptions) {
        case CollectFromGitOptions.None:
            return new Set()
        case CollectFromGitOptions.All:
            return await listAllTags()
        case CollectFromGitOptions.ForCommits:
            return await listTagsForCommits(commits)
    }
}

/* filter tags with regex */
export function filterTags(
    tags: Set<string>,
    regex: TagCollectionOptions["filter_regex"]
): Set<string> {
    if (regex !== null) {
        return new Set([...tags].filter(tag => regex.test(tag)))
    } else {
        return tags
    }
}
