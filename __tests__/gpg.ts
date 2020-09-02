import {
    ErrorKind,
    isTrustLevelCompatibleWithMinTrustLevel,
    parseRawGpgOutput,
    Status,
    TrustLevel,
    trustLevelFromString
} from "../src/gpg"
import * as mockInputs from "../src/gpg/__mocks__/mock_gpg_outputs"

describe("min TrustLevel check", () => {
    test.each([
        [TrustLevel.Ultimate, TrustLevel.Unknown, true],
        [TrustLevel.Ultimate, TrustLevel.Undefined, true],
        [TrustLevel.Ultimate, TrustLevel.Marginal, true],
        [TrustLevel.Ultimate, TrustLevel.Full, true],
        // min tl never always fails
        [TrustLevel.Never, TrustLevel.Never, false],
        [TrustLevel.Unknown, TrustLevel.Never, false],
        [TrustLevel.Undefined, TrustLevel.Never, false],
        [TrustLevel.Marginal, TrustLevel.Never, false],
        [TrustLevel.Full, TrustLevel.Never, false],
        [TrustLevel.Ultimate, TrustLevel.Never, false],
        // important they are treated the same
        [TrustLevel.Undefined, TrustLevel.Unknown, true],
        [TrustLevel.Unknown, TrustLevel.Undefined, true],
        // some other tests
        [TrustLevel.Never, TrustLevel.Unknown, false],
        [TrustLevel.Marginal, TrustLevel.Full, false],
        [TrustLevel.Full, TrustLevel.Marginal, true],
        [TrustLevel.Unknown, TrustLevel.Marginal, false],
        [TrustLevel.Marginal, TrustLevel.Unknown, true],
        [TrustLevel.Full, TrustLevel.Ultimate, false]
    ])("TL %s with min TL %s is compatible = %s", (trustLevel, minTrustLevel, compatible) => {
        const res = isTrustLevelCompatibleWithMinTrustLevel(trustLevel, minTrustLevel)
        expect(res).toBe(compatible)
    })
})

describe("TrustLevel from string", () => {
    test.each([
        ["NEVER", TrustLevel.Never],
        ["UNKNOWN", TrustLevel.Unknown],
        ["UNDEFINED", TrustLevel.Undefined],
        ["MARGINAL", TrustLevel.Marginal],
        ["FULL", TrustLevel.Full],
        ["ULTIMATE", TrustLevel.Ultimate],
        ["marginal", TrustLevel.Marginal],
        ["Full", TrustLevel.Full],
        ["mArgINal", TrustLevel.Marginal],
        ["malformed", null]
    ])("%s => %s", (strTrustLevel, enumVariant) => {
        const res = trustLevelFromString(strTrustLevel)
        expect(res).toBe(enumVariant)
    })
})

describe("parseRawGpgOutput", () => {
    test("an empty input is handled correctly", () => {
        const result = parseRawGpgOutput("")
        expect(result).toEqual([])
    })

    test.each([
        [ErrorKind.BadSignature, mockInputs.INVALID_BAD_SIG],
        [ErrorKind.ExpiredKey, mockInputs.INVALID_EXPIRED_KEY_SIG],
        [ErrorKind.ExpiredSignature, mockInputs.INVALID_EXPIRED_SIG],
        [ErrorKind.RevokedKey, mockInputs.INVALID_REVOKED_KEY_SIG],
        [ErrorKind.UnknownKey, mockInputs.UNKNOWN_KEY_SIGN],
        [ErrorKind.UnrecognizedNonGoodSignature, mockInputs.UNRECOGNIZED_GPG_OUTPUT_SIGN]
    ])("invalid sig because: %s", (errorKind: ErrorKind, mockInput) => {
        const result = parseRawGpgOutput(mockInput)
        expect(result).toEqual([
            {
                status: Status.Invalid,
                errorKind
            }
        ])
    })

    test.each([
        [TrustLevel.Never, mockInputs.VALID_NEVER_TRUST_SIG],
        [TrustLevel.Unknown, mockInputs.VALID_UNKNOWN_TRUST_SIG],
        [TrustLevel.Undefined, mockInputs.VALID_UNDEFINED_TRUST_SIG],
        [TrustLevel.Marginal, mockInputs.VALID_MARGINAL_TRUST_SIG],
        [TrustLevel.Full, mockInputs.VALID_FULL_TRUST_SIG],
        [TrustLevel.Ultimate, mockInputs.VALID_ULTIMATE_TRUST_SIG]
    ])("valid with trust level %s", (trustLevel, mockInput) => {
        const result = parseRawGpgOutput(mockInput)
        expect(result).toEqual([
            {
                status: Status.Valid,
                trustLevel
            }
        ])
    })

    test("multiple signatures can be parsed", () => {
        const result = parseRawGpgOutput(mockInputs.UNKNOWN_KEY_SIGN + mockInputs.INVALID_BAD_SIG)
        expect(result).toEqual([
            {
                status: Status.Invalid,
                errorKind: ErrorKind.UnknownKey
            },
            {
                status: Status.Invalid,
                errorKind: ErrorKind.BadSignature
            }
        ])
    })

    test("bad_sign_attack_correctly_parsed_as_two_signatures", () => {
        const result = parseRawGpgOutput(mockInputs.BAD_SIGN_ATTACK)
        expect(result).toEqual([
            {
                status: Status.Invalid,
                errorKind: ErrorKind.BadSignature
            },
            {
                status: Status.Valid,
                trustLevel: TrustLevel.Undefined
            }
        ])
    })
})
