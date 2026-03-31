# Configuration Language Parser

A JavaScript implementation of the Configuration Language specification from [https://deanebarker.net/tech/config-lang/](https://deanebarker.net/tech/config-lang/).

## Overview

This parser converts configuration text into structured data using a simple command-based syntax. Each line represents a command with optional arguments, supporting features like tokens, multi-line values, and indented argument lists.

## Features

- **Commands**: Simple command definitions with optional arguments
- **Arguments**: Key-value pairs with support for boolean flags
- **Tokens**: Multi-line token definitions with substitution
- **Indentation**: Support for indented argument lists
- **Comments**: Lines starting with `#` are ignored
- **Quotes**: Support for single and double-quoted values with escaping
- **Validation**: Strict naming rules for commands, arguments, and tokens

## Usage

### Basic Example

```javascript
const { CommandSet } = require("./config-lang.js");

const config = `
deploy -env:production -force
backup -database:users -path:/tmp/backup
cleanup
`;

const commandSet = new CommandSet(config);

// Access parsed commands
commandSet.commands.forEach((command) => {
  console.log(`Command: ${command.name}`);
  command.arguments.forEach((arg) => {
    console.log(`  ${arg.key}: ${arg.value}`);
  });
});
```

### Tokens Example

```javascript
const config = `
email -to:$admin -subject:$subject

$admin
admin@example.com

$subject
System Alert: Deployment Complete
`;

const commandSet = new CommandSet(config);
// Tokens are automatically substituted in argument values
```

### Indented Arguments

```javascript
const config = `
server
  -host:localhost
  -port:8080
  -ssl
  -config:/etc/server.conf
`;

const commandSet = new CommandSet(config);
// Indented arguments are merged with the command
```

## API Reference

### CommandSet

The main class for parsing and managing configuration.

#### Constructor

- `new CommandSet(source?)` - Creates a new command set, optionally parsing source text

#### Properties

- `commands: Command[]` - Array of parsed commands
- `tokens: Object` - Map of token names to values

#### Methods

- `parse(source: string)` - Parses configuration source text
- `getCommands(name: string): Command[]` - Gets all commands with specified name
- `getCommand(name: string): Command|null` - Gets first command with specified name
- `addCommand(command: Command)` - Adds a command to the set

### Command

Represents a single command with arguments.

#### Constructor

- `new Command(name: string, args?: Argument[])` - Creates a new command

#### Properties

- `name: string` - Command name
- `arguments: Argument[]` - Array of command arguments

#### Static Methods

- `Command.fromSource(source: string, tokenMap?: Object): Command` - Parses command from source text

### Argument

Represents a key-value argument pair.

#### Constructor

- `new Argument(key: string, value?: string)` - Creates a new argument (default value is 'true')

#### Properties

- `key: string` - Argument key/name
- `value: string` - Argument value

#### Static Methods

- `Argument.fromSource(source: string): Argument` - Parses argument from source text like "-key:value"

## Syntax Rules

### Commands

- Each line represents a command
- Command names must start with a letter
- Can contain letters, digits, underscore, dash, or period
- Multiple commands with the same name are allowed

### Arguments

- Arguments start with `-` followed by name and optional `:value`
- Arguments without values default to `"true"`
- Arguments can be on the same line or indented on following lines
- Duplicate argument keys within a command are not allowed

### Tokens

- Tokens are defined after commands, starting with `$name`
- Token values can be multi-line
- Tokens are substituted in argument values at parse time
- Token names follow the same rules as commands/arguments

### Naming Rules

All names (commands, arguments, tokens) must:

- Start with an ASCII letter
- Contain only letters, digits, underscore, dash, or period
- Be case-sensitive

### Quotes and Escaping

- Values with spaces must be quoted with single or double quotes
- Escape quotes inside quoted values with backslash: `\"`
- Quoted values are not evaluated for token substitution

### Comments

- Lines starting with `#` are comments and ignored
- Blank lines are ignored

## Files

- `config-lang.js` - Main implementation with all classes
- `test-config-lang.js` - Comprehensive unit tests
- `examples.js` - Usage examples and demonstrations

## Running Tests

```bash
node test-config-lang.js
```

## Running Examples

```bash
node examples.js
```

## Specification Compliance

This implementation fully complies with the Configuration Language specification, including:

- ✅ Command parsing with arguments
- ✅ Boolean argument support (no value = "true")
- ✅ Multi-line indented argument syntax
- ✅ Token definitions and substitution
- ✅ Comment and blank line handling
- ✅ Quote parsing with escape sequences
- ✅ Naming validation for all identifiers
- ✅ Duplicate argument detection
- ✅ Order preservation for commands and arguments
- ✅ Programmatic command construction
- ✅ All specification examples pass tests

## Error Handling

The parser throws descriptive errors for:

- Invalid syntax or malformed commands
- Duplicate argument keys within commands
- Invalid character usage in names
- Unclosed quotes
- Empty command or argument names

## License

This implementation is provided as-is for educational and practical use.
