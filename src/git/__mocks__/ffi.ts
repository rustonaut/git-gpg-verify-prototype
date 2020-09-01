import { EOL } from "os"
import { ExecResult } from "../../utils"

/**
Following was used to create the mock for tests:
```
git init
git config tag.forceSignAnnotated false
git config commit.gpgSign false
echo a > f
git add f
git commit -am "initial"  #7f278a6e410de88b3e5daaa98695553249c4fce
echo b > f
git commit -am "foobar"  #ecf7509020264d6c2602448781c10501d9dbb500
git tag -am "msg:foobar" foobar
git tag -am "msg:barfoo" barfoo
echo c > f
git commit -am "c3"  #8a57e91b2a4a14070337af9847fb4d5156aa886c
echo d > f
git commit -am "c4"  #01292479cf8cddec4cc4ab21a3e205aaf14d95c5
git tag -am "Version 0.0.1" v0.0.1
echo e > f
git commit -am "c5"  #a06dc059c714f46886a41392374f2a504b23b14f
git tag -am "Version 1.0.0" v1.0.0
echo f > f
git commit -am "c6"  #59ebd4ef2e19763fd0e672a9583480df2d500f4d
git tag -am "Version 1.0.1" v1.0.1
```
*/

export const CM1 = "7f278a6e410de88b3e5daaa98695553249c4fceb"
export const CM2 = "ecf7509020264d6c2602448781c10501d9dbb500"
export const CM3 = "8a57e91b2a4a14070337af9847fb4d5156aa886c"
export const CM4 = "01292479cf8cddec4cc4ab21a3e205aaf14d95c5"
export const CM5 = "a06dc059c714f46886a41392374f2a504b23b14f"
export const CM6 = "59ebd4ef2e19763fd0e672a9583480df2d500f4d"
export const COMMITS = [CM1, CM2, CM3, CM4, CM5, CM6]

const LIST_ALL_TAGS_OUTPUT =
    `barfoo${EOL}` + `foobar${EOL}` + `v0.0.1${EOL}` + `v1.0.0${EOL}` + `v1.0.1${EOL}`

let _failNextNGitCalls = 0

/** cause the next n git calls to fail (n defaults to 1)*/
export function failNextNGitCalls(n?: number): void {
    if (n == null) {
        n = 1
    }
    _failNextNGitCalls = n
}

/** mock for callGit with some pre-determined outputs scrapped from real git outputs */
async function _callGit(params: string[]): Promise<ExecResult> {
    if (_failNextNGitCalls > 0) {
        _failNextNGitCalls -= 1
        return Promise.resolve({
            stdout: "",
            stderr: "error: Injected error",
            exit_code: 1
        })
    }
    switch (params[0]) {
        case "tag": {
            const res = callGitTag(params)
            if (res !== null) {
                return res
            }
            break
        }
        case "rev-list": {
            const res = callGitRevList(params)
            if (res !== null) {
                return res
            }
            break
        }
    }
    throw new Error(`not supported git mock call. Params: ${params}`)
}

// It's important to make this a Mock fn so that for cases
// where we don't want to use this complex mock we can just
// use `.mockResolvedOnce` and similar.
const callGit = jest.fn(_callGit)
export { callGit }

function callGitTag(params: string[]): Promise<ExecResult> | null {
    if (params[1] !== "--list") {
        throw new Error(`only support git tag --list in mock. Params: ${params}`)
    }
    if (params.length === 2) {
        return Promise.resolve({
            stdout: LIST_ALL_TAGS_OUTPUT,
            stderr: "",
            exit_code: 0
        })
    }
    if (params[2] === "--points-at" && params.length === 4) {
        const commit = params[3]
        let mock_out = EOL
        switch (commit) {
            case CM1:
                break
            case CM2:
                mock_out = `foobar${EOL}barfoo${EOL}`
                break
            case CM3:
                break
            case CM4:
                mock_out = `v0.0.1${EOL}`
                break
            case CM5:
                mock_out = `v1.0.0${EOL}`
                break
            case CM6:
                mock_out = `v1.0.1${EOL}`
                break
            default:
                throw new Error(`unknown commit ${commit}`)
        }
        return Promise.resolve({
            stdout: mock_out,
            stderr: "",
            exit_code: 0
        })
    }
    return null
}

function callGitRevList(params: string[]): Promise<ExecResult> | null {
    if (params.length != 2) {
        return null
    }
    const [from, to] = params[1].split("..")
    let from_idx
    let to_idx
    if (to == undefined) {
        from_idx = 0
        to_idx = COMMITS.indexOf(from) + 1
    } else {
        if (from == "") {
            from_idx = -1
            to_idx = -1
        } else {
            from_idx = COMMITS.indexOf(from) + 1
            if (from_idx <= 0) {
                throw new Error(`malformed "from" ref for this mock: ${from}`)
            }
            if (to == "") {
                to_idx = COMMITS.length
            } else {
                to_idx = COMMITS.indexOf(to) + 1
                if (to_idx <= 0) {
                    throw new Error(`malformed "to" ref for this mock: ${from}`)
                }
            }
        }
    }

    const stdout = COMMITS.slice(from_idx, to_idx).join(EOL) + EOL

    return Promise.resolve({
        stdout,
        stderr: "",
        exit_code: 0
    })
}
