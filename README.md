# rustonaut/git-gpg-verify

[![.github/workflows/integration.yml](https://github.com/actions/github-script/workflows/Integration/badge.svg?event=push&branch=main)](https://github.com/actions/github-script/actions?query=workflow%3AIntegration+branch%3Amain+event%3Apush)
[![.github/workflows/ci.yml](https://github.com/actions/github-script/workflows/CI/badge.svg?event=push&branch=main)](https://github.com/actions/github-script/actions?query=workflow%3ACI+branch%3Amain+event%3Apush)
[![.github/workflows/licensed.yml](https://github.com/actions/github-script/workflows/Licensed/badge.svg?event=push&branch=main)](https://github.com/actions/github-script/actions?query=workflow%3ALicensed+branch%3Amain+event%3Apush)

When this action is run it mainly verifies signed git commits and tags.
Which commits and tags are signed is determined by the input. This can
be used to for example verify the signature of all commits in a Pull Request.

Gpg public keys can be added through a folder so that a new contributor can
directly add their gpg public key BUT trust levels of such keys are configured
using github secrets.

This allows to easy onboard new contributors without giving them any trust
besides that they signed their own commits.

Enforcement of trust levels and requirement of a commit/tag to be signed can
be configured separately.

Besides handling PR's this can also be used as a middle step checking tags/commits
provided by a previously run step/job and e.g. erroring if they are not signed
with a key you gave full trust to.


## Development

See [development.md](/docs/development.md).

## Examples

```yaml

```

## License

This library on itself is MIT licensed, the license of dependencies might
differ but is checked to be MIT compatible.

Large parts of the pipline have been copied over from the
[action/github-script action](https://github.com/actions/github-script) (which
is also MIT licensed). This include:

- All of .github/
    - including the badges in this README file (but adapted to changed repo name)
- tsconfig.json
- the commands/pipelines in package.json
- .gitignore
- .vscode
- .eslintrc.yml

Through they might have been modified since then to adapt
to this action (see the github history for details).
