import * as core from "@actions/core"
import { parseGithubActionInputs } from "./gh-inputs"
import { collectAndVerify } from "./inner-api"

/** runs the action parsing inputs, verifying tags and commits and reporting the result */
export async function run_action(): Promise<void> {
    const options = parseGithubActionInputs()
    const results = await collectAndVerify(options)

    for (const error of results.errors) {
        core.error(error.message)
    }

    if (results.errors.length > 0) {
        core.setFailed("Signature verifications failed in at least one case.")
    } else {
        //Only set output is not failed as this contains all checked
        //commits and tags, not only the successful checked commits and tags.
        core.setOutput("verified-commits", results.commits)
        core.setOutput("verified-tags", results.tags)
    }
}
