import { CommitRang } from "../git/collect"
import { getPrCommitRange } from "./pr"
import { getManualCommitRange } from "./simple"

// We split this out instead of having pr.* and simple.getManualCommitRange here
// so that we can have much easier testing with module mocks. I'm not super happy
// about this but it works well

/** get's the commit range paramter by trying all possible commit rang options
 *
 *  If multiple options return a commit range this will throw and exceptions.
 */
export function getCommitRange(): CommitRang | null {
    const manual = getManualCommitRange()
    const pr = getPrCommitRange()

    if (manual !== null && pr !== null) {
        throw Error("the options includePrCommits and includeCommitsFromGit* are not compatible")
    }

    return manual ?? pr
}
