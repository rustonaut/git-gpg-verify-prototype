import { EOL } from 'os'
import { ExecResult } from '../../utils'

const CM1 = "7f278a6e410de88b3e5daaa98695553249c4fceb"
const CM2 = "ecf7509020264d6c2602448781c10501d9dbb500"
const CM3 = "8a57e91b2a4a14070337af9847fb4d5156aa886c"
const CM4 = "01292479cf8cddec4cc4ab21a3e205aaf14d95c5"
const CM5 = "a06dc059c714f46886a41392374f2a504b23b14f"
const CM6 = "59ebd4ef2e19763fd0e672a9583480df2d500f4d"

const LIST_ALL_TAGS_OUTPUT =
    `barfoo${EOL}` +
    `foobar${EOL}` +
    `v0.0.1${EOL}` +
    `v1.0.0${EOL}` +
    `v1.0.1${EOL}`


let _failNextNGitCalls = 0

/** cause the next n git calls to fail (n defaults to 1)*/
export function failNextNGitCalls(n?: number) {
    if (n == null) {
        n = 1
    }
    _failNextNGitCalls = n
}


/** mock for callGit with some pre-determined outputs scrapped from real git outputs */
export async function callGit(params: string[]): Promise<ExecResult> {
    if (_failNextNGitCalls > 0) {
        _failNextNGitCalls -= 1
        return Promise.resolve({
            stdout: "",
            stderr: "error: Injected error",
            exit_code: 1
        })
    }
    switch (params[0]) {
        case "tag":
            if (params[1] !== "--list") {
                throw new Error(`only support git tag --list in mock. Params: ${params}`)
            }
            if (params.length == 2) {
                return Promise.resolve({
                    stdout: LIST_ALL_TAGS_OUTPUT,
                    stderr: "",
                    exit_code: 0
                });
            }
    }
    throw new Error(`not supported git mock call. Params: ${params}`)
}