jest.mock("../../src/git/ffi")

import * as git from "../../src/git";
import { listAllTags } from "../../src/git";
import * as git_ffi from "../../src/git/ffi";


const failNextNGitCalls = (git_ffi as any).failNextNGitCalls as (n?: number) => void

/**
Following was used to create mock output for tests:
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


describe("git cli ffi", () => {
    describe("listAllTags", () => {
        test("return all tags", async () => {
            const tags = await git.listAllTags();
            expect(tags).toEqual(new Set([
                "v0.0.1",
                "v1.0.0",
                "v1.0.1",
                "foobar",
                "barfoo"
            ]))
        })

        test("checks exit code", async () => {
            failNextNGitCalls(1)
            await expect(listAllTags()).rejects.toThrow(/list all tags failed/)
        })
    })
})


