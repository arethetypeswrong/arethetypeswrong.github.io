# arethetypeswrong/cli

A CLI wrapper for [arethetypeswrong](https://arethetypeswrong.github.io/).

## Installation

**NOTE:** The package has not yet been published to NPM.

```shell
npm i -g @arethetypeswrong/cli
```

<!-- Or, using `npx`: -->
<!---->
<!-- ```shell -->
<!-- npx attw -->
<!-- ``` -->

## Usage

The `attw` command acts very similarly to [the arethetypeswrong website](https://arethetypeswrong.github.io/), with some additional features that are useful for command line usage.

The usage is:

```shell
attw [options] <file-name>
```

Where `<file-name>` is a required positional argument - either the path to a local `.tar.gz` file, or the name of an NPM package.

## Configuration

`attw` supports a JSON config file (by default named `.attw.json`) which allows you to pre-set the command line arguments. The options are a one-to-one mapping of the command line flags, changed to camelCase, and are all documented in their relevant `Options` section below.

Note that the `--config-path` option cannot be set from the config file :upside_down_face:

### Options

#### Help

Show help information and exit.

In the CLI: `--help`, `-h`

```shell
attw --help
```

#### Version

Print the current version of `attw` and exit.

In the CLI: `--version`, `-v`

```shell
attw --version
```

#### Format

The format to print the output in. Defaults to `table`.

The available values are:
- `table`
- `table-flipped`, where the resolution kinds are the table's head, and the entry points label the table's rows
- `ascii`, for large tables where the output is clunky
- `raw`, outputs the raw JSON data (overriding all other rendering options)

In the CLI: `--format`, `-F`

```shell
attw --format <format> <file-name>
```

In the config file, `format` can be a string value.

#### From NPM

Treat `<file-name>` as the name (and, optionally, version) of a package from the NPM registry.

In the CLI: `--from-npm`, `-f`

```shell
attw --from-npm <package-name>
```

In the config file, `fromNpm` can be a boolean value.

#### Ignore Rules

Specifies rules/problems to ignore (i.e. not raise an error for).

The available values are:
- `wildcard`
- `no-resolution`
- `untyped-resolution`
- `false-cjs`
- `false-esm`
- `cjs-resolves-to-esm`
- `fallback-condition`
- `cjs-only-exports-default`
- `false-export-default`
- `unexpected-esm-syntax`
- `unexpected-cjs-syntax`

In the CLI: `--ignore-rules`

```shell
attw <file-name> --ignore-rules <rules...>
```

In the config file, `ignoreRules` can be an array of strings.

#### Summary/No Summary

Whether to display a summary of what the different errors/problems mean. Defaults to showing the summary (`--summary`).

In the CLI: `--summary`/`--no-summary`

```shell
attw --summary/--no-summary <file-name>
```

In the config file, `summary` can be a boolean value.

#### Emoji/No Emoji

Whether to print the information with emojis. Defaults to printing with emojis (`--emoji`).

In the CLI: `--emoji`/`--no-emoji`

```shell
attw --emoji/--no-emoji <file-name>
```

In the config file, `emoji` can be a boolean value.

#### Color/No Color

Whether to print with colors. Defaults to printing with colors (`--color`).

The `FORCE_COLOR` env variable is also available for use (set is to `0` or `1`).

In the CLI: `--color`/`--no-color`

```shell
attw --color/--no-color <file-name>
```

In the config file, `color` can be a boolean value.

#### Quiet

When set, nothing will be printed to STDOUT.

In the CLI: `--quiet`, `-q`

```shell
attw --quiet <file-name>
```

In the config file, `quiet` can be a boolean value.

#### Config Path

The path to the config file. Defaults to `./.attw.json`.

In the CLI: `--config-path <path>`

```shell
attw --config-path <path> <file-name>
```

Cannot be set from within the config file itself.

