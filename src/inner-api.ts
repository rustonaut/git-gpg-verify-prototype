import {
    collectCommitsAndTags,
    CollectionOptions,
    VerificationOptions,
    verifyCommitsAndTags
} from "./git"

/** the options our inner API uses */
export interface Options {
    collection: CollectionOptions
    verification: VerificationOptions
}

/** the result of our inner API */
export interface Results {
    commits: Set<string>
    tags: Set<string>
    errors: Error[]
}

/** collects all requested commits and tags and then verifies them returning a list of errors and the collected commits/tags */
export async function collectAndVerify(options: Options): Promise<Results> {
    const commitsAndTags = await collectCommitsAndTags(options.collection)
    const errors = await verifyCommitsAndTags(commitsAndTags, options.verification)
    return {
        commits: commitsAndTags.commits,
        tags: commitsAndTags.tags,
        errors
    }
}
