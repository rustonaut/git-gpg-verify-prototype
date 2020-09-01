import {
    EntityType,
    VerificationOptions as CommitVerificationOptions,
    VerificationOptions as TagVerificationOptions,
    verify
} from "./git/verify"

export {
    collectCommits,
    collectCommitsAndTags,
    CollectedEntities,
    CollectFromGitOptions,
    CollectionOptions,
    collectTags,
    CommitCollectionOptions,
    CommitRang,
    TagCollectionOptions
} from "./git/collect"
export * from "./git/list"
export { TagVerificationOptions, CommitVerificationOptions, EntityType, verify }

/** Options for commit and tag verification */
export interface VerificationOptions {
    for_tags: TagVerificationOptions
    for_commits: CommitVerificationOptions
}

/** simple type containing a set of commits and tags */
export interface CommitsAndTags {
    tags: Set<string>
    commits: Set<string>
}

// I declare this here instead of in ./git/verify as declaring it in the
// same module as verify makes tasting MUCH more complex to do while when
// declaring it here I can just easily mock verify with jest.mock("./git/verify")
/** verify all commits and tags */
export async function verifyCommitsAndTags(
    commitsAndTags: CommitsAndTags,
    options: VerificationOptions
): Promise<Error[]> {
    const { tags, commits } = commitsAndTags
    const commit_errors = await verifyAll(EntityType.Commit, commits, options.for_commits)
    const tag_errors = await verifyAll(EntityType.Tag, tags, options.for_tags)
    return commit_errors.concat(tag_errors)
}

/** verifies all commits/tags  in given set concatenating the lists of returned errors*/
export async function verifyAll(
    type: EntityType,
    ids: Set<string>,
    options: CommitVerificationOptions | TagVerificationOptions
): Promise<Error[]> {
    let errors: Error[] = []
    for (const id of ids) {
        const new_errors = await verify(type, id, options)
        errors = errors.concat(new_errors)
    }
    return errors
}
