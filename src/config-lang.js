/**
 * Configuration Language Parser Implementation
 *
 * Implements the Configuration Language specification from https://deanebarker.net/tech/config-lang/
 * Provides classes for parsing command-based configuration syntax.
 */

class Argument {
  /**
   * Creates an Argument instance
   * @param {string} key - The argument key/name
   * @param {string} value - The argument value
   */
  constructor(key, value = "true") {
    this.key = key;
    this.value = value;
  }

  /**
   * Parses an argument from source string
   * @param {string} source - Source string like "-key:value" or "-key"
   * @returns {Argument} Parsed argument
   */
  static fromSource(source) {
    if (!source.startsWith("-")) {
      throw new Error(`Invalid argument format: ${source}`);
    }

    const withoutDash = source.substring(1);
    const colonIndex = withoutDash.indexOf(":");

    if (colonIndex === -1) {
      // No colon means boolean argument with default value "true"
      const key = withoutDash.trim();
      this.validateName(key);
      return new Argument(key, "true");
    }

    const key = withoutDash.substring(0, colonIndex);
    const value = withoutDash.substring(colonIndex + 1);

    this.validateName(key);
    return new Argument(key, value);
  }

  /**
   * Validates argument name follows naming rules
   * @param {string} name - Name to validate
   */
  static validateName(name) {
    if (!name || name.length === 0) {
      throw new Error("Argument name cannot be empty");
    }

    if (!/^[a-zA-Z][a-zA-Z0-9_.-]*$/.test(name)) {
      throw new Error(
        `Invalid argument name: ${name}. Must start with letter and contain only letters, digits, underscore, dash, or period.`
      );
    }
  }
}

class Command {
  /**
   * Creates a Command instance
   * @param {string} name - The command name
   * @param {Argument[]} args - Array of arguments
   * @param {string} target - Optional target name
   */
  constructor(name, args = [], target = null) {
    Command.validateName(name);
    this.name = name;
    this.arguments = args || [];
    this.target = target;
  }

  /**
   * Parses a command from source string
   * @param {string} source - Source string like "command -arg1:value1 -arg2:value2" or "command -arg1:value1 => target"
   * @param {Object} tokenMap - Map of token names to values for substitution
   * @returns {Command} Parsed command
   */
  static fromSource(source, tokenMap = {}) {
    const trimmed = source.trim();
    if (!trimmed) {
      throw new Error("Command source cannot be empty");
    }

    // Extract target if present (=> syntax)
    let target = null;
    let sourceWithoutTarget = trimmed;

    const arrowIndex = trimmed.indexOf("=>");
    if (arrowIndex !== -1) {
      const targetPart = trimmed.substring(arrowIndex + 2).trim();
      if (targetPart) {
        target = targetPart;
        Command.validateName(target);
        sourceWithoutTarget = trimmed.substring(0, arrowIndex).trim();
      }
    }

    const tokens = this.tokenize(sourceWithoutTarget);
    const commandName = tokens[0].value;

    Command.validateName(commandName);

    const args = [];
    const argKeys = new Set();

    for (let i = 1; i < tokens.length; i++) {
      const token = tokens[i];
      if (token.value.startsWith("-")) {
        const arg = Argument.fromSource(token.value);

        // Check for duplicate argument keys
        if (argKeys.has(arg.key)) {
          throw new Error(`Duplicate argument key: ${arg.key}`);
        }
        argKeys.add(arg.key);

        // Perform token substitution only for unquoted values
        if (arg.value.startsWith("$") && !token.wasQuoted) {
          const varName = arg.value.substring(1);
          if (tokenMap.hasOwnProperty(varName)) {
            arg.value = tokenMap[varName];
          } else {
            throw new Error(`Undefined token: ${varName}`);
          }
        }

        args.push(arg);
      }
    }

    return new Command(commandName, args, target);
  }

  /**
   * Tokenizes a command line respecting quotes
   * @param {string} line - Line to tokenize
   * @returns {Array} Array of token objects with value and quoted flag
   */
  static tokenize(line) {
    const tokens = [];
    let current = "";
    let inQuotes = false;
    let quoteChar = "";
    let escaped = false;
    let currentWasQuoted = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (escaped) {
        current += char;
        escaped = false;
        continue;
      }

      if (char === "\\" && inQuotes) {
        escaped = true;
        continue;
      }

      if ((char === '"' || char === "'") && !inQuotes) {
        inQuotes = true;
        quoteChar = char;
        currentWasQuoted = true;
        continue;
      }

      if (char === quoteChar && inQuotes) {
        inQuotes = false;
        quoteChar = "";
        continue;
      }

      if (!inQuotes && /\s/.test(char)) {
        if (current.length > 0) {
          tokens.push({ value: current, wasQuoted: currentWasQuoted });
          current = "";
          currentWasQuoted = false;
        }
        continue;
      }

      current += char;
    }

    if (current.length > 0) {
      tokens.push({ value: current, wasQuoted: currentWasQuoted });
    }

    if (inQuotes) {
      throw new Error("Unclosed quote in command");
    }

    return tokens;
  }

  /**
   * Validates command name follows naming rules
   * @param {string} name - Name to validate
   */
  static validateName(name) {
    if (!name || name.length === 0) {
      throw new Error("Command name cannot be empty");
    }

    if (!/^[a-zA-Z][a-zA-Z0-9_.-]*$/.test(name)) {
      throw new Error(
        `Invalid command name: ${name}. Must start with letter and contain only letters, digits, underscore, dash, or period.`
      );
    }
  }
}

class CommandSet {
  /**
   * Creates a CommandSet instance
   * @param {string} source - Optional source to parse immediately
   */
  constructor(source = "") {
    this.commands = [];
    this.tokens = {};

    if (source) {
      this.parse(source);
    }
  }

  /**
   * Parses configuration language source
   * @param {string} source - Source text to parse
   */
  parse(source) {
    if (typeof source !== 'string') {
      throw new Error('Source must be a string');
    }
    
    this.commands = [];
    this.tokens = {};

    const lines = source.split("\n");
    const processedLines = this.preprocessLines(lines);

    // Split into commands section and tokens section
    let tokenStartIndex = -1;
    for (let i = 0; i < processedLines.length; i++) {
      if (processedLines[i].trim().startsWith("$")) {
        tokenStartIndex = i;
        break;
      }
    }

    let commandLines, tokenLines;
    if (tokenStartIndex === -1) {
      commandLines = processedLines;
      tokenLines = [];
    } else {
      commandLines = processedLines.slice(0, tokenStartIndex);
      tokenLines = processedLines.slice(tokenStartIndex);
    }

    // Parse tokens first (needed for substitution)
    this.parseTokens(tokenLines);

    // Parse commands
    this.parseCommands(commandLines);

    // Clear tokens after parsing since they're no longer needed
    // Token substitution occurs at parse time, not runtime
    this.tokens = {};
  }

  /**
   * Preprocesses lines to handle indentation and comments
   * @param {string[]} lines - Raw lines from source
   * @returns {string[]} Processed lines
   */
  preprocessLines(lines) {
    const result = [];
    let currentLine = "";

    for (let line of lines) {
      // Skip comments and blank lines
      if (line.trim().startsWith("#") || line.trim() === "") {
        continue;
      }

      // Check if line is indented
      if (/^\s/.test(line)) {
        // Indented line - append to current line
        currentLine += " " + line.trim();
      } else {
        // Non-indented line
        if (currentLine) {
          result.push(currentLine);
        }
        currentLine = line;
      }
    }

    if (currentLine) {
      result.push(currentLine);
    }

    return result;
  }

  /**
   * Parses command lines
   * @param {string[]} lines - Command lines to parse
   */
  parseCommands(lines) {
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed) {
        try {
          const command = Command.fromSource(trimmed, this.tokens);
          this.commands.push(command);
        } catch (error) {
          throw new Error(
            `Error parsing command "${trimmed}": ${error.message}`
          );
        }
      }
    }
  }

  /**
   * Parses token definitions
   * @param {string[]} lines - Token lines to parse
   */
  parseTokens(lines) {
    let currentToken = null;
    let currentValue = [];

    for (const line of lines) {
      if (line.trim().startsWith("$")) {
        // Save previous token if exists
        if (currentToken) {
          this.tokens[currentToken] = currentValue.join("\n").trim();
        }

        // Start new token
        currentToken = line.trim().substring(1);
        CommandSet.validateTokenName(currentToken);
        currentValue = [];
      } else {
        // Token value line
        if (currentToken) {
          currentValue.push(line);
        }
      }
    }

    // Save last token
    if (currentToken) {
      this.tokens[currentToken] = currentValue.join("\n").trim();
    }
  }

  /**
   * Validates token name follows naming rules
   * @param {string} name - Name to validate
   */
  static validateTokenName(name) {
    if (!name || name.length === 0) {
      throw new Error("Token name cannot be empty");
    }

    if (!/^[a-zA-Z][a-zA-Z0-9_.-]*$/.test(name)) {
      throw new Error(
        `Invalid token name: ${name}. Must start with letter and contain only letters, digits, underscore, dash, or period.`
      );
    }
  }

  /**
   * Gets all commands with a specific name
   * @param {string} name - Command name to filter by
   * @returns {Command[]} Array of matching commands
   */
  getCommands(name) {
    return this.commands.filter((cmd) => cmd.name === name);
  }

  /**
   * Gets the first command with a specific name
   * @param {string} name - Command name to find
   * @returns {Command|null} First matching command or null
   */
  getCommand(name) {
    return this.commands.find((cmd) => cmd.name === name) || null;
  }

  /**
   * Adds a command to the command set
   * @param {Command} command - Command to add
   */
  addCommand(command) {
    if (!(command instanceof Command)) {
      throw new Error("Must provide a Command instance");
    }
    this.commands.push(command);
  }
}

export { CommandSet, Command, Argument };