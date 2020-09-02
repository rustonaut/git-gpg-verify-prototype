jest.mock("../../src/git/ffi")

import { mocked } from "ts-jest/utils"
import { callGit as _callGit } from "../../src/git/ffi"
import {
    checkSignature,
    checkSignatureList,
    EntityType,
    filterOutUnknownKeys,
    filterOutUntrustyKeys,
    inspectSignatures,
    VerificationOptions,
    verificationSubCommandForType,
    verify
} from "../../src/git/verify"
import { ErrorKind, GpgSignature, Status, TrustLevel } from "../../src/gpg"
import { BAD_SIGN_ATTACK, VALID_MARGINAL_TRUST_SIG } from "../../src/gpg/__mocks__/mock_gpg_outputs"

const callGit = mocked(_callGit)

describe("verify", () => {
    beforeEach(() => {
        jest.resetAllMocks()
    })

    // One test is nearly enough as all components are tested properly and
    // it just wires them together.
    //MAYBE_TODO make another test with malformed stderr where parsing throws an error
    //    (but this should only happen if there are bugs in gpg...)
    test("calls inspectSignature and checks signature list", async () => {
        callGit.mockResolvedValueOnce({
            stdout: "",
            stderr: BAD_SIGN_ATTACK,
            exitCode: 0
        })

        const options: VerificationOptions = {
            ignoreUnknownKeys: false,
            ignoreUntrustedKeys: false,
            requireMinTrustLevel: TrustLevel.Marginal,
            requireSignature: false
        }

        const res = await verify(EntityType.Commit, "abcdef", options)

        //TODO that is wrong it's two errors
        expect(res[0].message).toMatch("Commit(abcdef)")
        expect(res[0].message).toMatch(ErrorKind.BadSignature)
        expect(res[1].message).toMatch("Commit(abcdef)")
        expect(res[1].message).toMatch(TrustLevel.Undefined)
        expect(res[1].message).toMatch(TrustLevel.Marginal)
        expect(res.length).toBe(2)

        expect(callGit).toHaveBeenCalledTimes(1)
        expect(callGit).toHaveBeenCalledWith(["verify-commit", "--raw", "--", "abcdef"])
    })

    test("exceptions throwing errors are caught and handled", async () => {
        callGit.mockRejectedValueOnce(new Error("message hy"))

        const options: VerificationOptions = {
            ignoreUnknownKeys: false,
            ignoreUntrustedKeys: false,
            requireMinTrustLevel: TrustLevel.Undefined,
            requireSignature: false
        }

        const res = await verify(EntityType.Commit, "abcdef", options)

        expect(res.length).toBe(1)
        expect(res[0].message).toEqual("message hy")
    })

    test("exceptions throwing other things are caught and handled", async () => {
        callGit.mockRejectedValueOnce("message hy")

        const options: VerificationOptions = {
            ignoreUnknownKeys: false,
            ignoreUntrustedKeys: false,
            requireMinTrustLevel: TrustLevel.Undefined,
            requireSignature: false
        }

        const res = await verify(EntityType.Commit, "abcdef", options)

        expect(res.length).toBe(1)
        expect(res[0].message).toEqual("message hy")
    })
})

describe("inspectSignatures", () => {
    beforeEach(() => {
        jest.resetAllMocks()
    })

    // One test is enough as all components are tested properly and
    // it just wires them together.
    test("calls git the right way and parses the output", async () => {
        callGit.mockResolvedValueOnce({
            stdout: "",
            stderr: VALID_MARGINAL_TRUST_SIG,
            exitCode: 123
        })
        const res = await inspectSignatures(EntityType.Tag, "v0.0.1")

        expect(res).toEqual([
            {
                status: Status.Valid,
                trustLevel: TrustLevel.Marginal
            }
        ])

        expect(callGit).toHaveBeenCalledTimes(1)
        expect(callGit).toHaveBeenCalledWith(["verify-tag", "--raw", "--", "v0.0.1"])
    })
})

describe("verificationSubCommandForType", () => {
    test.each([
        [EntityType.Commit, "verify-commit"],
        [EntityType.Tag, "verify-tag"]
    ])("%s returns %s", (type, expectedSubCmd) => {
        const subCmd = verificationSubCommandForType(type)
        expect(subCmd).toEqual(expectedSubCmd)
    })
})

describe("checkSignatureList", () => {
    test("fail if signatures are required but not given", () => {
        const options: VerificationOptions = {
            requireMinTrustLevel: TrustLevel.Marginal,
            requireSignature: true,
            ignoreUnknownKeys: false,
            ignoreUntrustedKeys: false
        }
        const res = checkSignatureList([], options, "tag(v)")
        expect(res.length).toBe(1)
        expect(res[0].message).toMatch("tag(v)")
        expect(res[0].message).toMatch(/requires signature/i)
    })
    test("create no error if no signature is needed and not given", () => {
        const options: VerificationOptions = {
            requireMinTrustLevel: TrustLevel.Marginal,
            requireSignature: false,
            ignoreUnknownKeys: false,
            ignoreUntrustedKeys: false
        }
        const res = checkSignatureList([], options, "tag(v)")
        expect(res).toEqual([])
    })
    test("create no error if signatures are not needed but given but ignored", () => {
        const options: VerificationOptions = {
            requireMinTrustLevel: TrustLevel.Marginal,
            requireSignature: false,
            ignoreUnknownKeys: true,
            ignoreUntrustedKeys: true
        }
        const signatures: GpgSignature[] = [
            {
                status: Status.Invalid,
                errorKind: ErrorKind.UnknownKey
            },
            {
                status: Status.Valid,
                trustLevel: TrustLevel.Never
            }
        ]
        const res = checkSignatureList(signatures, options, "tag(v)")
        expect(res).toEqual([])
    })
    test("create a error for each invalid signature", () => {
        const options: VerificationOptions = {
            requireMinTrustLevel: TrustLevel.Marginal,
            requireSignature: false,
            ignoreUnknownKeys: false,
            ignoreUntrustedKeys: false
        }
        const signatures: GpgSignature[] = [
            {
                status: Status.Invalid,
                errorKind: ErrorKind.UnknownKey
            },
            {
                status: Status.Valid,
                trustLevel: TrustLevel.Ultimate
            },
            {
                status: Status.Invalid,
                errorKind: ErrorKind.BadSignature
            },
            {
                status: Status.Invalid,
                errorKind: ErrorKind.ExpiredKey
            }
        ]
        const res = checkSignatureList(signatures, options, "tag(v)")
        expect(res.length).toBe(3)
        expect(res[0].message).toMatch("tag(v)")
        expect(res[0].message).toMatch(ErrorKind.UnknownKey)
        expect(res[1].message).toMatch("tag(v)")
        expect(res[1].message).toMatch(ErrorKind.BadSignature)
        expect(res[2].message).toMatch("tag(v)")
        expect(res[2].message).toMatch(ErrorKind.ExpiredKey)
    })

    test("create a error for each untrusty signature", () => {
        const options: VerificationOptions = {
            requireMinTrustLevel: TrustLevel.Marginal,
            requireSignature: false,
            ignoreUnknownKeys: false,
            ignoreUntrustedKeys: false
        }
        const signatures: GpgSignature[] = [
            {
                status: Status.Valid,
                trustLevel: TrustLevel.Never
            },
            {
                status: Status.Valid,
                trustLevel: TrustLevel.Marginal
            },
            {
                status: Status.Valid,
                trustLevel: TrustLevel.Undefined
            },
            {
                status: Status.Valid,
                trustLevel: TrustLevel.Unknown
            }
        ]
        const res = checkSignatureList(signatures, options, "tag(v)")
        expect(res.length).toBe(3)
        expect(res[0].message).toMatch("tag(v)")
        expect(res[0].message).toMatch(TrustLevel.Never)
        expect(res[0].message).toMatch(TrustLevel.Marginal)
        expect(res[1].message).toMatch("tag(v)")
        expect(res[1].message).toMatch(TrustLevel.Undefined)
        expect(res[1].message).toMatch(TrustLevel.Marginal)
        expect(res[2].message).toMatch("tag(v)")
        expect(res[2].message).toMatch(TrustLevel.Unknown)
        expect(res[2].message).toMatch(TrustLevel.Marginal)
    })
    test("if ignore unknown keys is set don't create errors for them", () => {
        const options: VerificationOptions = {
            requireMinTrustLevel: TrustLevel.Marginal,
            requireSignature: false,
            ignoreUnknownKeys: true,
            ignoreUntrustedKeys: false
        }
        const signatures: GpgSignature[] = [
            {
                status: Status.Invalid,
                errorKind: ErrorKind.UnknownKey
            },
            {
                status: Status.Valid,
                trustLevel: TrustLevel.Never
            },
            {
                status: Status.Invalid,
                errorKind: ErrorKind.UnknownKey
            },
            {
                status: Status.Invalid,
                errorKind: ErrorKind.ExpiredKey
            }
        ]
        const res = checkSignatureList(signatures, options, "tag(v)")
        expect(res.length).toBe(2)
        expect(res[0].message).toMatch("tag(v)")
        expect(res[0].message).toMatch(TrustLevel.Never)
        expect(res[0].message).toMatch(TrustLevel.Marginal)
        expect(res[1].message).toMatch("tag(v)")
        expect(res[1].message).toMatch(ErrorKind.ExpiredKey)
    })

    test("if ignore untrusty keys is set don't create errors for them", () => {
        const options: VerificationOptions = {
            requireMinTrustLevel: TrustLevel.Marginal,
            requireSignature: false,
            ignoreUnknownKeys: false,
            ignoreUntrustedKeys: true
        }
        const signatures: GpgSignature[] = [
            {
                status: Status.Valid,
                trustLevel: TrustLevel.Never
            },
            {
                status: Status.Valid,
                trustLevel: TrustLevel.Marginal
            },
            {
                status: Status.Invalid,
                errorKind: ErrorKind.BadSignature
            },
            {
                status: Status.Invalid,
                errorKind: ErrorKind.UnknownKey
            },
            {
                status: Status.Valid,
                trustLevel: TrustLevel.Unknown
            }
        ]
        const res = checkSignatureList(signatures, options, "tag(v)")
        expect(res.length).toBe(2)
        expect(res[0].message).toMatch("tag(v)")
        expect(res[0].message).toMatch(ErrorKind.BadSignature)
        expect(res[1].message).toMatch("tag(v)")
        expect(res[1].message).toMatch(ErrorKind.UnknownKey)
    })

    test("error if all unknown keys are ignored but signature is required", () => {
        const options: VerificationOptions = {
            requireMinTrustLevel: TrustLevel.Marginal,
            requireSignature: true,
            ignoreUnknownKeys: true,
            ignoreUntrustedKeys: false
        }
        const signatures: GpgSignature[] = [
            {
                status: Status.Invalid,
                errorKind: ErrorKind.UnknownKey
            },
            {
                status: Status.Invalid,
                errorKind: ErrorKind.UnknownKey
            }
        ]
        const res = checkSignatureList(signatures, options, "tag(v)")
        expect(res.length).toBe(1)
        expect(res[0].message).toMatch("tag(v)")
        expect(res[0].message).toMatch(/requires signature/i)
    })

    test("error if all untrusty keys are ignored but signature is required", () => {
        const options: VerificationOptions = {
            requireMinTrustLevel: TrustLevel.Marginal,
            requireSignature: true,
            ignoreUnknownKeys: false,
            ignoreUntrustedKeys: true
        }
        const signatures: GpgSignature[] = [
            {
                status: Status.Valid,
                trustLevel: TrustLevel.Never
            },
            {
                status: Status.Valid,
                trustLevel: TrustLevel.Unknown
            }
        ]
        const res = checkSignatureList(signatures, options, "tag(v)")
        expect(res.length).toBe(1)
        expect(res[0].message).toMatch("tag(v)")
        expect(res[0].message).toMatch(/requires signature/i)
    })

    test("create no error if all signatures are valid", () => {
        const options: VerificationOptions = {
            requireMinTrustLevel: TrustLevel.Marginal,
            requireSignature: true,
            ignoreUnknownKeys: false,
            ignoreUntrustedKeys: false
        }
        const signatures: GpgSignature[] = [
            {
                status: Status.Valid,
                trustLevel: TrustLevel.Marginal
            },
            {
                status: Status.Valid,
                trustLevel: TrustLevel.Full
            }
        ]
        const res = checkSignatureList(signatures, options, "tag(v)")
        expect(res).toEqual([])
    })
})

describe("checkSignature", () => {
    test.each([
        [ErrorKind.BadSignature],
        [ErrorKind.ExpiredKey],
        [ErrorKind.ExpiredSignature],
        [ErrorKind.RevokedKey],
        [ErrorKind.SigValidationError],
        [ErrorKind.UnknownKey],
        [ErrorKind.UnrecognizedNonGoodSignature]
    ])("reject invalid signatures (%s)", (errorKind: ErrorKind) => {
        const res = checkSignature(
            {
                status: Status.Invalid,
                errorKind
            },
            TrustLevel.Undefined,
            "tag(v0.0.1)"
        )

        expect(res).not.toBe(true)
        if (res !== true) {
            expect(res.message).toMatch("tag(v0.0.1)")
            expect(res.message).toMatch(errorKind)
        }
    })

    // We already tested the "is trust enough" check
    // enough so this is enough.
    test.each([
        [TrustLevel.Never],
        [TrustLevel.Undefined],
        [TrustLevel.Unknown],
        [TrustLevel.Marginal]
    ])("reject signatures which are not trusted enough (%s)", trustLevel => {
        const res = checkSignature(
            {
                status: Status.Valid,
                trustLevel
            },
            TrustLevel.Full,
            "commit(abcdef342eqfjqo3)"
        )

        expect(res).not.toBe(true)
        if (res !== true) {
            expect(res.message).toMatch("commit(abcdef342eqfjqo3)")
            expect(res.message).toMatch(trustLevel)
            expect(res.message).toMatch(TrustLevel.Full)
        }
    })

    test.each([[TrustLevel.Full], [TrustLevel.Ultimate]])(
        "no error for valid trusted signatures (%s)",
        trustLevel => {
            const res = checkSignature(
                {
                    status: Status.Valid,
                    trustLevel
                },
                TrustLevel.Full,
                "tag(v0)"
            )

            expect(res).toBe(true)
        }
    )
})

describe("filterOutUnknownKeys", () => {
    test.each([
        [ErrorKind.BadSignature],
        [ErrorKind.ExpiredKey],
        [ErrorKind.ExpiredSignature],
        [ErrorKind.RevokedKey],
        [ErrorKind.SigValidationError],
        [ErrorKind.UnrecognizedNonGoodSignature]
    ])("don't filter out any other error kind (%s)", errorKind => {
        const signatures: GpgSignature[] = [
            {
                status: Status.Invalid,
                errorKind
            }
        ]

        const result = filterOutUnknownKeys(signatures, "tag(v1)")

        expect(result).toEqual(signatures)
    })

    test("filter out unknown key invalid signatures", () => {
        const signatures: GpgSignature[] = [
            {
                status: Status.Invalid,
                errorKind: ErrorKind.UnknownKey
            }
        ]

        const result = filterOutUnknownKeys(signatures, "tag(v1)")

        expect(result).toEqual([])
    })

    test.each([[TrustLevel.Never], [TrustLevel.Undefined], [TrustLevel.Marginal]])(
        "don't filter out valid signatures (%s)",
        trustLevel => {
            const signatures: GpgSignature[] = [
                {
                    status: Status.Valid,
                    trustLevel
                }
            ]

            const result = filterOutUnknownKeys(signatures, "tag(v1)")

            expect(result).toEqual(signatures)
        }
    )

    test("work with multiple signatures", () => {
        const signatures: GpgSignature[] = [
            {
                status: Status.Valid,
                trustLevel: TrustLevel.Ultimate
            },
            {
                status: Status.Invalid,
                errorKind: ErrorKind.UnknownKey
            },
            {
                status: Status.Invalid,
                errorKind: ErrorKind.UnknownKey
            },
            {
                status: Status.Invalid,
                errorKind: ErrorKind.ExpiredKey
            },
            {
                status: Status.Invalid,
                errorKind: ErrorKind.UnknownKey
            }
        ]

        const result = filterOutUnknownKeys(signatures, "tag(v1)")

        expect(result).toEqual([
            {
                status: Status.Valid,
                trustLevel: TrustLevel.Ultimate
            },
            {
                status: Status.Invalid,
                errorKind: ErrorKind.ExpiredKey
            }
        ])
    })
})

describe("filterOutUntrustyKeys", () => {
    test.each([[TrustLevel.Full], [TrustLevel.Ultimate]])(
        "do not filter out trusted keys (%s)",
        trustLevel => {
            const signatures: GpgSignature[] = [
                {
                    status: Status.Valid,
                    trustLevel
                }
            ]

            const result = filterOutUntrustyKeys(signatures, TrustLevel.Full, "tag(v1)")

            expect(result).toEqual(signatures)
        }
    )

    test.each([
        [TrustLevel.Never],
        [TrustLevel.Undefined],
        [TrustLevel.Unknown],
        [TrustLevel.Marginal]
    ])("filter out untrusty keys (%s)", trustLevel => {
        const signatures: GpgSignature[] = [
            {
                status: Status.Valid,
                trustLevel
            }
        ]

        const result = filterOutUntrustyKeys(signatures, TrustLevel.Full, "tag(v1)")

        expect(result).toEqual([])
    })

    test.each([[ErrorKind.BadSignature], [ErrorKind.ExpiredKey], [ErrorKind.UnknownKey]])(
        "do not filter out invalid keys (%s)",
        errorKind => {
            const signatures: GpgSignature[] = [
                {
                    status: Status.Invalid,
                    errorKind
                }
            ]

            const result = filterOutUntrustyKeys(signatures, TrustLevel.Full, "tag(v1)")

            expect(result).toEqual(signatures)
        }
    )

    test("work with multiple signatures", () => {
        const signatures: GpgSignature[] = [
            {
                status: Status.Valid,
                trustLevel: TrustLevel.Marginal
            },
            {
                status: Status.Invalid,
                errorKind: ErrorKind.RevokedKey
            },
            {
                status: Status.Valid,
                trustLevel: TrustLevel.Full
            },
            {
                status: Status.Valid,
                trustLevel: TrustLevel.Undefined
            }
        ]

        const result = filterOutUntrustyKeys(signatures, TrustLevel.Full, "tag(v1)")

        expect(result).toEqual([
            {
                status: Status.Invalid,
                errorKind: ErrorKind.RevokedKey
            },
            {
                status: Status.Valid,
                trustLevel: TrustLevel.Full
            }
        ])
    })
})
