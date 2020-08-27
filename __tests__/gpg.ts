import { ErrorKind, parseRawGpgOutput, Status, TrustLevel, trustLevelFromString } from "../src/gpg"
import * as mock_inputs from "../src/gpg/__mocks__/mock_gpg_outputs"

describe("gpg functionality", () => {
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
            ["mArgINal", TrustLevel.Marginal]
        ])("%s => %s", (strust_level, enum_variant) => {
            const res = trustLevelFromString(strust_level)
            expect(res).toBe(enum_variant)
        })
    })

    describe("parseRawGpgOutput", () => {
        test("an empty input is handled correctly", () => {
            const result = parseRawGpgOutput("")
            expect(result).toEqual([])
        })

        test.each([
            [ErrorKind.BadSignature, mock_inputs.INVALID_BAD_SIG],
            [ErrorKind.ExpiredKey, mock_inputs.INVALID_EXPIRED_KEY_SIG],
            [ErrorKind.ExpiredSignature, mock_inputs.INVALID_EXPIRED_SIG],
            [ErrorKind.RevokedKey, mock_inputs.INVALID_REVOKED_KEY_SIG],
            [ErrorKind.UnknownKey, mock_inputs.UNKNOWN_KEY_SIGN],
            [ErrorKind.UnrecognizedNonGoodSignature, mock_inputs.UNRECOGNIZED_GPG_OUTPUT_SIGN]
        ])("invalid sig because: %s", (error_kind: ErrorKind, mock_input) => {
            const result = parseRawGpgOutput(mock_input)
            expect(result).toEqual([
                {
                    status: Status.Invalid,
                    error_kind
                }
            ])
        })

        test.each([
            [TrustLevel.Never, mock_inputs.VALID_NEVER_TRUST_SIG],
            [TrustLevel.Unknown, mock_inputs.VALID_UNKNOWN_TRUST_SIG],
            [TrustLevel.Undefined, mock_inputs.VALID_UNDEFINED_TRUST_SIG],
            [TrustLevel.Marginal, mock_inputs.VALID_MARGINAL_TRUST_SIG],
            [TrustLevel.Full, mock_inputs.VALID_FULL_TRUST_SIG],
            [TrustLevel.Ultimate, mock_inputs.VALID_ULTIMATE_TRUST_SIG]
        ])("valid with trust level %s", (trust_level, mock_input) => {
            const result = parseRawGpgOutput(mock_input)
            expect(result).toEqual([
                {
                    status: Status.Valid,
                    trust_level
                }
            ])
        })

        test("multiple signatures can be parsed", () => {
            const result = parseRawGpgOutput(
                mock_inputs.UNKNOWN_KEY_SIGN + mock_inputs.INVALID_BAD_SIG
            )
            expect(result).toEqual([
                {
                    status: Status.Invalid,
                    error_kind: ErrorKind.UnknownKey
                },
                {
                    status: Status.Invalid,
                    error_kind: ErrorKind.BadSignature
                }
            ])
        })

        test("bad_sign_attack_correctly_parsed_as_two_signatures", () => {
            const result = parseRawGpgOutput(mock_inputs.BAD_SIGN_ATTACK)
            expect(result).toEqual([
                {
                    status: Status.Invalid,
                    error_kind: ErrorKind.BadSignature
                },
                {
                    status: Status.Valid,
                    trust_level: TrustLevel.Undefined
                }
            ])
        })
    })
})
