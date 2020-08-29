import {
    checkSignature,
    checkSignatureList,
    filterOutUnknownKeys,
    filterOutUntrustyKeys,
    VerificationOption
} from "../../src/git/verify"
import { ErrorKind, GpgSignature, Status, TrustLevel } from "../../src/gpg"

//TODO add a some tests for verify itself with mocked git

describe("verify commits/tags", () => {
    //Note: We already thoroughly tested the parsing
    //      of git/gpg output. Because of this we
    //      don't need to test all this variants
    //      here but can focus on `checkSignatureList`
    //      instead which makes testing much easier.

    describe("checkSignatureList", () => {
        test("fail if signatures are required but not given", () => {
            const options: VerificationOption = {
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
            const options: VerificationOption = {
                requireMinTrustLevel: TrustLevel.Marginal,
                requireSignature: false,
                ignoreUnknownKeys: false,
                ignoreUntrustedKeys: false
            }
            const res = checkSignatureList([], options, "tag(v)")
            expect(res).toEqual([])
        })
        test("create no error if signatures are not needed but given but ignored", () => {
            const options: VerificationOption = {
                requireMinTrustLevel: TrustLevel.Marginal,
                requireSignature: false,
                ignoreUnknownKeys: true,
                ignoreUntrustedKeys: true
            }
            const signatures: GpgSignature[] = [
                {
                    status: Status.Invalid,
                    error_kind: ErrorKind.UnknownKey
                },
                {
                    status: Status.Valid,
                    trust_level: TrustLevel.Never
                }
            ]
            const res = checkSignatureList(signatures, options, "tag(v)")
            expect(res).toEqual([])
        })
        test("create a error for each invalid signature", () => {
            const options: VerificationOption = {
                requireMinTrustLevel: TrustLevel.Marginal,
                requireSignature: false,
                ignoreUnknownKeys: false,
                ignoreUntrustedKeys: false
            }
            const signatures: GpgSignature[] = [
                {
                    status: Status.Invalid,
                    error_kind: ErrorKind.UnknownKey
                },
                {
                    status: Status.Valid,
                    trust_level: TrustLevel.Ultimate
                },
                {
                    status: Status.Invalid,
                    error_kind: ErrorKind.BadSignature
                },
                {
                    status: Status.Invalid,
                    error_kind: ErrorKind.ExpiredKey
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
            const options: VerificationOption = {
                requireMinTrustLevel: TrustLevel.Marginal,
                requireSignature: false,
                ignoreUnknownKeys: false,
                ignoreUntrustedKeys: false
            }
            const signatures: GpgSignature[] = [
                {
                    status: Status.Valid,
                    trust_level: TrustLevel.Never
                },
                {
                    status: Status.Valid,
                    trust_level: TrustLevel.Marginal
                },
                {
                    status: Status.Valid,
                    trust_level: TrustLevel.Undefined
                },
                {
                    status: Status.Valid,
                    trust_level: TrustLevel.Unknown
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
            const options: VerificationOption = {
                requireMinTrustLevel: TrustLevel.Marginal,
                requireSignature: false,
                ignoreUnknownKeys: true,
                ignoreUntrustedKeys: false
            }
            const signatures: GpgSignature[] = [
                {
                    status: Status.Invalid,
                    error_kind: ErrorKind.UnknownKey
                },
                {
                    status: Status.Valid,
                    trust_level: TrustLevel.Never
                },
                {
                    status: Status.Invalid,
                    error_kind: ErrorKind.UnknownKey
                },
                {
                    status: Status.Invalid,
                    error_kind: ErrorKind.ExpiredKey
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
            const options: VerificationOption = {
                requireMinTrustLevel: TrustLevel.Marginal,
                requireSignature: false,
                ignoreUnknownKeys: false,
                ignoreUntrustedKeys: true
            }
            const signatures: GpgSignature[] = [
                {
                    status: Status.Valid,
                    trust_level: TrustLevel.Never
                },
                {
                    status: Status.Valid,
                    trust_level: TrustLevel.Marginal
                },
                {
                    status: Status.Invalid,
                    error_kind: ErrorKind.BadSignature
                },
                {
                    status: Status.Invalid,
                    error_kind: ErrorKind.UnknownKey
                },
                {
                    status: Status.Valid,
                    trust_level: TrustLevel.Unknown
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
            const options: VerificationOption = {
                requireMinTrustLevel: TrustLevel.Marginal,
                requireSignature: true,
                ignoreUnknownKeys: true,
                ignoreUntrustedKeys: false
            }
            const signatures: GpgSignature[] = [
                {
                    status: Status.Invalid,
                    error_kind: ErrorKind.UnknownKey
                },
                {
                    status: Status.Invalid,
                    error_kind: ErrorKind.UnknownKey
                }
            ]
            const res = checkSignatureList(signatures, options, "tag(v)")
            expect(res.length).toBe(1)
            expect(res[0].message).toMatch("tag(v)")
            expect(res[0].message).toMatch(/requires signature/i)
        })

        test("error if all untrusty keys are ignored but signature is required", () => {
            const options: VerificationOption = {
                requireMinTrustLevel: TrustLevel.Marginal,
                requireSignature: true,
                ignoreUnknownKeys: false,
                ignoreUntrustedKeys: true
            }
            const signatures: GpgSignature[] = [
                {
                    status: Status.Valid,
                    trust_level: TrustLevel.Never
                },
                {
                    status: Status.Valid,
                    trust_level: TrustLevel.Unknown
                }
            ]
            const res = checkSignatureList(signatures, options, "tag(v)")
            expect(res.length).toBe(1)
            expect(res[0].message).toMatch("tag(v)")
            expect(res[0].message).toMatch(/requires signature/i)
        })

        test("create no error if all signatures are valid", () => {
            const options: VerificationOption = {
                requireMinTrustLevel: TrustLevel.Marginal,
                requireSignature: true,
                ignoreUnknownKeys: false,
                ignoreUntrustedKeys: false
            }
            const signatures: GpgSignature[] = [
                {
                    status: Status.Valid,
                    trust_level: TrustLevel.Marginal
                },
                {
                    status: Status.Valid,
                    trust_level: TrustLevel.Full
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
        ])("reject invalid signatures (%s)", (error_kind: ErrorKind) => {
            const res = checkSignature(
                {
                    status: Status.Invalid,
                    error_kind
                },
                TrustLevel.Undefined,
                "tag(v0.0.1)"
            )

            expect(res).not.toBe(true)
            if (res !== true) {
                expect(res.message).toMatch("tag(v0.0.1)")
                expect(res.message).toMatch(error_kind)
            }
        })

        // We already tested the "is trust enough" check
        // enough so this is enough.
        test.each([
            [TrustLevel.Never],
            [TrustLevel.Undefined],
            [TrustLevel.Unknown],
            [TrustLevel.Marginal]
        ])("reject signatures which are not trusted enough (%s)", trust_level => {
            const res = checkSignature(
                {
                    status: Status.Valid,
                    trust_level
                },
                TrustLevel.Full,
                "commit(abcdef342eqfjqo3)"
            )

            expect(res).not.toBe(true)
            if (res !== true) {
                expect(res.message).toMatch("commit(abcdef342eqfjqo3)")
                expect(res.message).toMatch(trust_level)
                expect(res.message).toMatch(TrustLevel.Full)
            }
        })

        test.each([[TrustLevel.Full], [TrustLevel.Ultimate]])(
            "no error for valid trusted signatures (%s)",
            trust_level => {
                const res = checkSignature(
                    {
                        status: Status.Valid,
                        trust_level
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
        ])("don't filter out any other error kind (%s)", error_kind => {
            const signatures: GpgSignature[] = [
                {
                    status: Status.Invalid,
                    error_kind
                }
            ]

            const result = filterOutUnknownKeys(signatures, "tag(v1)")

            expect(result).toEqual(signatures)
        })

        test("filter out unknown key invalid signatures", () => {
            const signatures: GpgSignature[] = [
                {
                    status: Status.Invalid,
                    error_kind: ErrorKind.UnknownKey
                }
            ]

            const result = filterOutUnknownKeys(signatures, "tag(v1)")

            expect(result).toEqual([])
        })

        test.each([[TrustLevel.Never], [TrustLevel.Undefined], [TrustLevel.Marginal]])(
            "don't filter out valid signatures (%s)",
            trust_level => {
                const signatures: GpgSignature[] = [
                    {
                        status: Status.Valid,
                        trust_level
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
                    trust_level: TrustLevel.Ultimate
                },
                {
                    status: Status.Invalid,
                    error_kind: ErrorKind.UnknownKey
                },
                {
                    status: Status.Invalid,
                    error_kind: ErrorKind.UnknownKey
                },
                {
                    status: Status.Invalid,
                    error_kind: ErrorKind.ExpiredKey
                },
                {
                    status: Status.Invalid,
                    error_kind: ErrorKind.UnknownKey
                }
            ]

            const result = filterOutUnknownKeys(signatures, "tag(v1)")

            expect(result).toEqual([
                {
                    status: Status.Valid,
                    trust_level: TrustLevel.Ultimate
                },
                {
                    status: Status.Invalid,
                    error_kind: ErrorKind.ExpiredKey
                }
            ])
        })
    })

    describe("filterOutUntrustyKeys", () => {
        test.each([[TrustLevel.Full], [TrustLevel.Ultimate]])(
            "do not filter out trusted keys (%s)",
            trust_level => {
                const signatures: GpgSignature[] = [
                    {
                        status: Status.Valid,
                        trust_level
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
        ])("filter out untrusty keys (%s)", trust_level => {
            const signatures: GpgSignature[] = [
                {
                    status: Status.Valid,
                    trust_level
                }
            ]

            const result = filterOutUntrustyKeys(signatures, TrustLevel.Full, "tag(v1)")

            expect(result).toEqual([])
        })

        test.each([[ErrorKind.BadSignature], [ErrorKind.ExpiredKey], [ErrorKind.UnknownKey]])(
            "do not filter out invalid keys (%s)",
            error_kind => {
                const signatures: GpgSignature[] = [
                    {
                        status: Status.Invalid,
                        error_kind
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
                    trust_level: TrustLevel.Marginal
                },
                {
                    status: Status.Invalid,
                    error_kind: ErrorKind.RevokedKey
                },
                {
                    status: Status.Valid,
                    trust_level: TrustLevel.Full
                },
                {
                    status: Status.Valid,
                    trust_level: TrustLevel.Undefined
                }
            ]

            const result = filterOutUntrustyKeys(signatures, TrustLevel.Full, "tag(v1)")

            expect(result).toEqual([
                {
                    status: Status.Invalid,
                    error_kind: ErrorKind.RevokedKey
                },
                {
                    status: Status.Valid,
                    trust_level: TrustLevel.Full
                }
            ])
        })
    })
})
