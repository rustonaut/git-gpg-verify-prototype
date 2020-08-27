//Raw output from attack.
//- Source URL: https://dev.gentoo.org/~mgorny/articles/attack-on-git-signature-verification.html
//  Author: Michał Górny
//  Article Date: 2019-01-26
//  Copyright: https://creativecommons.org/licenses/by/3.0/
export const BAD_SIGN_ATTACK = `[GNUPG:] NEWSIG
[GNUPG:] KEYEXPIRED 1376950668
[GNUPG:] KEY_CONSIDERED 3408B1B906EB579B41D9CB0CDF84256885283521 0
[GNUPG:] KEYEXPIRED 1376950668
[GNUPG:] KEY_CONSIDERED 3408B1B906EB579B41D9CB0CDF84256885283521 0
[GNUPG:] BADSIG BABF1D5FF8C8110A Michał Górny (Gentoo) <mgorny@gentoo.org>
[GNUPG:] VERIFICATION_COMPLIANCE_MODE 23
[GNUPG:] NEWSIG
[GNUPG:] KEY_CONSIDERED 55642983197252C35550375FBBC7E6E002FE74E8 0
[GNUPG:] SIG_ID 2Jjh1WK6tNxktx0Ijiy+rdV9VGk 2018-08-14 1534241226
[GNUPG:] KEY_CONSIDERED 55642983197252C35550375FBBC7E6E002FE74E8 0
[GNUPG:] GOODSIG BBC7E6E002FE74E8 Example key <example@example.com>
[GNUPG:] NOTATION_NAME issuer-fpr@notations.openpgp.fifthhorseman.net
[GNUPG:] NOTATION_FLAGS 0 1
[GNUPG:] NOTATION_DATA 55642983197252C35550375FBBC7E6E002FE74E8
[GNUPG:] VALIDSIG 55642983197252C35550375FBBC7E6E002FE74E8 2018-08-14 1534241226 0 4 0 1 10 00 55642983197252C35550375FBBC7E6E002FE74E8
[GNUPG:] KEY_CONSIDERED 55642983197252C35550375FBBC7E6E002FE74E8 0
[GNUPG:] TRUST_UNDEFINED 0 pgp
[GNUPG:] VERIFICATION_COMPLIANCE_MODE 23
`

export const VALID_NEVER_TRUST_SIG = `[GNUPG:] NEWSIG
[GNUPG:] KEY_CONSIDERED F693DC8376A63F05830FDE32DC653E72D02B615E 0
[GNUPG:] SIG_ID 6LLPOBH3a6aHefnha/yl5zUoZ7U 2020-08-27 1598543492
[GNUPG:] KEY_CONSIDERED F693DC8376A63F05830FDE32DC653E72D02B615E 0
[GNUPG:] GOODSIG 8F2CBBA19343C9DD Philipp Korber <philipp@korber.dev>
[GNUPG:] VALIDSIG 3819FE19A61C835FE122D3788F2CBBA19343C9DD 2020-08-27 1598543492 0 4 0 22 8 00 F693DC8376A63F05830FDE32DC653E72D02B615E
[GNUPG:] KEY_CONSIDERED F693DC8376A63F05830FDE32DC653E72D02B615E 0
[GNUPG:] KEY_CONSIDERED F693DC8376A63F05830FDE32DC653E72D02B615E 0
[GNUPG:] TRUST_NEVER 0 pgp
`

export const VALID_UNKNOWN_TRUST_SIG = `[GNUPG:] NEWSIG
[GNUPG:] KEY_CONSIDERED F693DC8376A63F05830FDE32DC653E72D02B615E 0
[GNUPG:] SIG_ID 6LLPOBH3a6aHefnha/yl5zUoZ7U 2020-08-27 1598543492
[GNUPG:] KEY_CONSIDERED F693DC8376A63F05830FDE32DC653E72D02B615E 0
[GNUPG:] GOODSIG 8F2CBBA19343C9DD Philipp Korber <philipp@korber.dev>
[GNUPG:] VALIDSIG 3819FE19A61C835FE122D3788F2CBBA19343C9DD 2020-08-27 1598543492 0 4 0 22 8 00 F693DC8376A63F05830FDE32DC653E72D02B615E
[GNUPG:] KEY_CONSIDERED F693DC8376A63F05830FDE32DC653E72D02B615E 0
[GNUPG:] KEY_CONSIDERED F693DC8376A63F05830FDE32DC653E72D02B615E 0
[GNUPG:] TRUST_UNKNOWN 0 pgp
`

export const VALID_UNDEFINED_TRUST_SIG = `[GNUPG:] NEWSIG
[GNUPG:] KEY_CONSIDERED F693DC8376A63F05830FDE32DC653E72D02B615E 0
[GNUPG:] SIG_ID 6LLPOBH3a6aHefnha/yl5zUoZ7U 2020-08-27 1598543492
[GNUPG:] KEY_CONSIDERED F693DC8376A63F05830FDE32DC653E72D02B615E 0
[GNUPG:] GOODSIG 8F2CBBA19343C9DD Philipp Korber <philipp@korber.dev>
[GNUPG:] VALIDSIG 3819FE19A61C835FE122D3788F2CBBA19343C9DD 2020-08-27 1598543492 0 4 0 22 8 00 F693DC8376A63F05830FDE32DC653E72D02B615E
[GNUPG:] KEY_CONSIDERED F693DC8376A63F05830FDE32DC653E72D02B615E 0
[GNUPG:] KEY_CONSIDERED F693DC8376A63F05830FDE32DC653E72D02B615E 0
[GNUPG:] TRUST_UNDEFINED 0 pgp
`

export const VALID_MARGINAL_TRUST_SIG = `[GNUPG:] NEWSIG
[GNUPG:] KEY_CONSIDERED F693DC8376A63F05830FDE32DC653E72D02B615E 0
[GNUPG:] SIG_ID 6LLPOBH3a6aHefnha/yl5zUoZ7U 2020-08-27 1598543492
[GNUPG:] KEY_CONSIDERED F693DC8376A63F05830FDE32DC653E72D02B615E 0
[GNUPG:] GOODSIG 8F2CBBA19343C9DD Philipp Korber <philipp@korber.dev>
[GNUPG:] VALIDSIG 3819FE19A61C835FE122D3788F2CBBA19343C9DD 2020-08-27 1598543492 0 4 0 22 8 00 F693DC8376A63F05830FDE32DC653E72D02B615E
[GNUPG:] KEY_CONSIDERED F693DC8376A63F05830FDE32DC653E72D02B615E 0
[GNUPG:] KEY_CONSIDERED F693DC8376A63F05830FDE32DC653E72D02B615E 0
[GNUPG:] TRUST_MARGINAL 0 pgp
`

export const VALID_FULL_TRUST_SIG = `[GNUPG:] NEWSIG
[GNUPG:] KEY_CONSIDERED F693DC8376A63F05830FDE32DC653E72D02B615E 0
[GNUPG:] SIG_ID 6LLPOBH3a6aHefnha/yl5zUoZ7U 2020-08-27 1598543492
[GNUPG:] KEY_CONSIDERED F693DC8376A63F05830FDE32DC653E72D02B615E 0
[GNUPG:] GOODSIG 8F2CBBA19343C9DD Philipp Korber <philipp@korber.dev>
[GNUPG:] VALIDSIG 3819FE19A61C835FE122D3788F2CBBA19343C9DD 2020-08-27 1598543492 0 4 0 22 8 00 F693DC8376A63F05830FDE32DC653E72D02B615E
[GNUPG:] KEY_CONSIDERED F693DC8376A63F05830FDE32DC653E72D02B615E 0
[GNUPG:] KEY_CONSIDERED F693DC8376A63F05830FDE32DC653E72D02B615E 0
[GNUPG:] TRUST_FULL 0 pgp
`

export const VALID_ULTIMATE_TRUST_SIG = `[GNUPG:] NEWSIG
[GNUPG:] KEY_CONSIDERED F693DC8376A63F05830FDE32DC653E72D02B615E 0
[GNUPG:] SIG_ID 6LLPOBH3a6aHefnha/yl5zUoZ7U 2020-08-27 1598543492
[GNUPG:] KEY_CONSIDERED F693DC8376A63F05830FDE32DC653E72D02B615E 0
[GNUPG:] GOODSIG 8F2CBBA19343C9DD Philipp Korber <philipp@korber.dev>
[GNUPG:] VALIDSIG 3819FE19A61C835FE122D3788F2CBBA19343C9DD 2020-08-27 1598543492 0 4 0 22 8 00 F693DC8376A63F05830FDE32DC653E72D02B615E
[GNUPG:] KEY_CONSIDERED F693DC8376A63F05830FDE32DC653E72D02B615E 0
[GNUPG:] KEY_CONSIDERED F693DC8376A63F05830FDE32DC653E72D02B615E 0
[GNUPG:] TRUST_ULTIMATE 0 pgp
`

//Raw output from attack.
//- Source URL: https://dev.gentoo.org/~mgorny/articles/attack-on-git-signature-verification.html
//  Author: Michał Górny
//  Article Date: 2019-01-26
//  Copyright: https://creativecommons.org/licenses/by/3.0/
export const INVALID_BAD_SIG = `[GNUPG:] NEWSIG
[GNUPG:] KEYEXPIRED 1376950668
[GNUPG:] KEY_CONSIDERED 3408B1B906EB579B41D9CB0CDF84256885283521 0
[GNUPG:] KEYEXPIRED 1376950668
[GNUPG:] KEY_CONSIDERED 3408B1B906EB579B41D9CB0CDF84256885283521 0
[GNUPG:] BADSIG BABF1D5FF8C8110A Michał Górny (Gentoo) <mgorny@gentoo.org>
[GNUPG:] VERIFICATION_COMPLIANCE_MODE 23`

//TODO get proper mock data
export const INVALID_EXPIRED_KEY_SIG = `[GNUPG:] NEWSIG
[GNUPG:] EXPKEYSIG 8F2CBBA19343C9DD 22 8 00 1598543492 9 3819FE19A61C835FE122D3788F2CBBA19343C9DD
[GNUPG:] TRUST_FULL 8F2CBBA19343C9DD
`
//TODO get proper mock data
export const INVALID_EXPIRED_SIG = `[GNUPG:] NEWSIG
[GNUPG:] EXPSIG 8F2CBBA19343C9DD 22 8 00 1598543492 9 3819FE19A61C835FE122D3788F2CBBA19343C9DD
[GNUPG:] TRUST_FULL 8F2CBBA19343C9DD
`
//TODO get proper mock data
export const INVALID_REVOKED_KEY_SIG = `[GNUPG:] NEWSIG
[GNUPG:] REVKEYSIG 8F2CBBA19343C9DD 22 8 00 1598543492 9 3819FE19A61C835FE122D3788F2CBBA19343C9DD
[GNUPG:] TRUST_FULL 8F2CBBA19343C9DD
`

export const UNKNOWN_KEY_SIGN = `[GNUPG:] NEWSIG
[GNUPG:] ERRSIG 8F2CBBA19343C9DD 22 8 00 1598543492 9 3819FE19A61C835FE122D3788F2CBBA19343C9DD
[GNUPG:] NO_PUBKEY 8F2CBBA19343C9DD
`
export const UNRECOGNIZED_GPG_OUTPUT_SIGN = `[GNUPG:] NEWSIG
[GNUPG:] KEY_CONSIDERED F693DC8376A63F05830FDE32DC653E72D02B615E 0
[GNUPG:] SIG_ID 6LLPOBH3a6aHefnha/yl5zUoZ7U 2020-08-27 1598543492
[GNUPG:] KEY_CONSIDERED F693DC8376A63F05830FDE32DC653E72D02B615E 0
[GNUPG:] MEGASIG 8F2CBBA19343C9DD Philipp Korber <philipp@korber.dev>
[GNUPG:] KEY_CONSIDERED F693DC8376A63F05830FDE32DC653E72D02B615E 0
[GNUPG:] KEY_CONSIDERED F693DC8376A63F05830FDE32DC653E72D02B615E 0
[GNUPG:] TRUST_ULTIMATE 0 pgp
`
