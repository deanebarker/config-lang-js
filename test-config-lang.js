/**
 * Unit Tests for Configuration Language Parser
 *
 * Tests all functionality as specified in the Configuration Language specification
 */

const { CommandSet, Command, Argument } = require("./src/config-lang.js");

// Simple test framework
class TestRunner {
  constructor() {
    this.tests = [];
    this.passed = 0;
    this.failed = 0;
  }

  test(name, testFn) {
    this.tests.push({ name, testFn });
  }

  async run() {
    console.log("Running Configuration Language Parser Tests\n");

    for (const { name, testFn } of this.tests) {
      try {
        await testFn();
        console.log(`✓ ${name}`);
        this.passed++;
      } catch (error) {
        console.log(`✗ ${name}`);
        console.log(`  Error: ${error.message}`);
        this.failed++;
      }
    }

    console.log(`\nResults: ${this.passed} passed, ${this.failed} failed`);

    if (this.failed > 0) {
      process.exit(1);
    }
  }
}

function assert(condition, message = "Assertion failed") {
  if (!condition) {
    throw new Error(message);
  }
}

function assertEqual(actual, expected, message = "") {
  if (actual !== expected) {
    throw new Error(`${message}\nExpected: ${expected}\nActual: ${actual}`);
  }
}

function assertArrayEqual(actual, expected, message = "") {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(
      `${message}\nExpected: ${JSON.stringify(
        expected
      )}\nActual: ${JSON.stringify(actual)}`
    );
  }
}

function assertThrows(fn, expectedMessage = null) {
  try {
    fn();
    throw new Error("Expected function to throw an error");
  } catch (error) {
    if (expectedMessage && !error.message.includes(expectedMessage)) {
      throw new Error(
        `Expected error message to contain "${expectedMessage}", got "${error.message}"`
      );
    }
  }
}

const runner = new TestRunner();

// Test Argument class
runner.test("Argument constructor", () => {
  const arg = new Argument("test", "value");
  assertEqual(arg.key, "test");
  assertEqual(arg.value, "value");
});

runner.test("Argument default value", () => {
  const arg = new Argument("test");
  assertEqual(arg.key, "test");
  assertEqual(arg.value, "true");
});

runner.test("Argument fromSource with value", () => {
  const arg = Argument.fromSource("-test:value");
  assertEqual(arg.key, "test");
  assertEqual(arg.value, "value");
});

runner.test("Argument fromSource without value (boolean)", () => {
  const arg = Argument.fromSource("-test");
  assertEqual(arg.key, "test");
  assertEqual(arg.value, "true");
});

runner.test("Argument fromSource with empty value", () => {
  const arg = Argument.fromSource("-test:");
  assertEqual(arg.key, "test");
  assertEqual(arg.value, "");
});

runner.test("Argument fromSource invalid format", () => {
  assertThrows(
    () => Argument.fromSource("test:value"),
    "Invalid argument format"
  );
});

runner.test("Argument name validation - valid names", () => {
  // Should not throw
  Argument.validateName("test");
  Argument.validateName("test123");
  Argument.validateName("test_name");
  Argument.validateName("test-name");
  Argument.validateName("test.name");
});

runner.test("Argument name validation - invalid names", () => {
  assertThrows(() => Argument.validateName(""), "cannot be empty");
  assertThrows(() => Argument.validateName("123test"), "Invalid argument name");
  assertThrows(
    () => Argument.validateName("test@name"),
    "Invalid argument name"
  );
  assertThrows(
    () => Argument.validateName("test name"),
    "Invalid argument name"
  );
});

// Test Command class
runner.test("Command constructor", () => {
  const cmd = new Command("test");
  assertEqual(cmd.name, "test");
  assertEqual(cmd.arguments.length, 0);
});

runner.test("Command constructor with arguments", () => {
  const args = [new Argument("arg1", "value1")];
  const cmd = new Command("test", args);
  assertEqual(cmd.name, "test");
  assertEqual(cmd.arguments.length, 1);
  assertEqual(cmd.arguments[0].key, "arg1");
});

runner.test("Command constructor with source", () => {
  const args = [new Argument("arg1", "value1")];
  const cmd = new Command("test", args, "test -arg1:value1");
  assertEqual(cmd.name, "test");
  assertEqual(cmd.arguments.length, 1);
  assertEqual(cmd.source, "test -arg1:value1");
});

runner.test("Command constructor with default empty source", () => {
  const cmd = new Command("test");
  assertEqual(cmd.name, "test");
  assertEqual(cmd.source, "");
});

runner.test("Command fromSource simple command", () => {
  const cmd = Command.fromSource("test");
  assertEqual(cmd.name, "test");
  assertEqual(cmd.arguments.length, 0);
  assertEqual(cmd.source, "test");
});

runner.test("Command fromSource with arguments", () => {
  const cmd = Command.fromSource("test -arg1:value1 -arg2:value2");
  assertEqual(cmd.name, "test");
  assertEqual(cmd.arguments.length, 2);
  assertEqual(cmd.arguments[0].key, "arg1");
  assertEqual(cmd.arguments[0].value, "value1");
  assertEqual(cmd.arguments[1].key, "arg2");
  assertEqual(cmd.arguments[1].value, "value2");
  assertEqual(cmd.source, "test -arg1:value1 -arg2:value2");
});

runner.test("Command fromSource with boolean argument", () => {
  const cmd = Command.fromSource("test -flag");
  assertEqual(cmd.name, "test");
  assertEqual(cmd.arguments.length, 1);
  assertEqual(cmd.arguments[0].key, "flag");
  assertEqual(cmd.arguments[0].value, "true");
  assertEqual(cmd.source, "test -flag");
});

runner.test("Command fromSource mixed arguments", () => {
  const cmd = Command.fromSource("test -arg1:value1 -flag -arg2:value2");
  assertEqual(cmd.name, "test");
  assertEqual(cmd.arguments.length, 3);
  assertEqual(cmd.arguments[0].key, "arg1");
  assertEqual(cmd.arguments[0].value, "value1");
  assertEqual(cmd.arguments[1].key, "flag");
  assertEqual(cmd.arguments[1].value, "true");
  assertEqual(cmd.arguments[2].key, "arg2");
  assertEqual(cmd.arguments[2].value, "value2");
});

runner.test("Command fromSource duplicate arguments", () => {
  assertThrows(
    () => Command.fromSource("test -arg1:value1 -arg1:value2"),
    "Duplicate argument key"
  );
});

runner.test("Command fromSource with token substitution", () => {
  const tokenMap = { var1: "substituted_value" };
  const cmd = Command.fromSource("test -arg1:$var1", tokenMap);
  assertEqual(cmd.arguments[0].value, "substituted_value");
  assertEqual(cmd.source, "test -arg1:$var1");
});

runner.test("Command tokenize simple", () => {
  const tokens = Command.tokenize("test arg1 arg2");
  const values = tokens.map((t) => t.value);
  assertArrayEqual(values, ["test", "arg1", "arg2"]);
});

runner.test("Command tokenize with quotes", () => {
  const tokens = Command.tokenize('test "quoted value" arg2');
  const values = tokens.map((t) => t.value);
  assertArrayEqual(values, ["test", "quoted value", "arg2"]);
  assert(!tokens[0].wasQuoted); // "test" was not quoted
  assert(tokens[1].wasQuoted); // "quoted value" was quoted
  assert(!tokens[2].wasQuoted); // "arg2" was not quoted
});

runner.test("Command tokenize with single quotes", () => {
  const tokens = Command.tokenize("test 'quoted value' arg2");
  const values = tokens.map((t) => t.value);
  assertArrayEqual(values, ["test", "quoted value", "arg2"]);
  assert(tokens[1].wasQuoted); // "quoted value" was quoted
});

runner.test("Command tokenize with escaped quotes", () => {
  const tokens = Command.tokenize('test "He said, \\"Hello\\""');
  const values = tokens.map((t) => t.value);
  assertArrayEqual(values, ["test", 'He said, "Hello"']);
  assert(tokens[1].wasQuoted); // The escaped quote string was quoted
});

runner.test("Command tokenize unclosed quote", () => {
  assertThrows(
    () => Command.tokenize('test "unclosed quote'),
    "Unclosed quote"
  );
});

runner.test("Command name validation - valid names", () => {
  // Should not throw
  Command.validateName("test");
  Command.validateName("test123");
  Command.validateName("test_name");
  Command.validateName("test-name");
  Command.validateName("test.name");
});

runner.test("Command name validation - invalid names", () => {
  assertThrows(() => Command.validateName(""), "cannot be empty");
  assertThrows(() => Command.validateName("123test"), "Invalid command name");
  assertThrows(() => Command.validateName("test@name"), "Invalid command name");
});

// Test CommandSet class
runner.test("CommandSet constructor empty", () => {
  const cs = new CommandSet();
  assertEqual(cs.commands.length, 0);
  assertEqual(Object.keys(cs.tokens).length, 0);
});

runner.test("CommandSet parse simple commands", () => {
  const source = `foo
bar`;
  const cs = new CommandSet(source);
  assertEqual(cs.commands.length, 2);
  assertEqual(cs.commands[0].name, "foo");
  assertEqual(cs.commands[1].name, "bar");
});

runner.test("CommandSet parse with blank lines and comments", () => {
  const source = `foo
# This is a comment
  
bar
# Another comment

baz`;
  const cs = new CommandSet(source);
  assertEqual(cs.commands.length, 3);
  assertEqual(cs.commands[0].name, "foo");
  assertEqual(cs.commands[1].name, "bar");
  assertEqual(cs.commands[2].name, "baz");
});

runner.test("CommandSet parse with arguments", () => {
  const source = `foo -bar:baz
test -arg1:value1 -flag -arg2:value2`;
  const cs = new CommandSet(source);
  assertEqual(cs.commands.length, 2);

  const foo = cs.commands[0];
  assertEqual(foo.name, "foo");
  assertEqual(foo.arguments.length, 1);
  assertEqual(foo.arguments[0].key, "bar");
  assertEqual(foo.arguments[0].value, "baz");
  assertEqual(foo.source, "foo -bar:baz");

  const test = cs.commands[1];
  assertEqual(test.name, "test");
  assertEqual(test.arguments.length, 3);
  assertEqual(test.arguments[0].key, "arg1");
  assertEqual(test.arguments[0].value, "value1");
  assertEqual(test.arguments[1].key, "flag");
  assertEqual(test.arguments[1].value, "true");
  assertEqual(test.arguments[2].key, "arg2");
  assertEqual(test.arguments[2].value, "value2");
  assertEqual(test.source, "test -arg1:value1 -flag -arg2:value2");
});

runner.test("CommandSet parse with indented arguments", () => {
  const source = `foo
  -bar:baz
  -flag
  -arg:value
test`;
  const cs = new CommandSet(source);
  assertEqual(cs.commands.length, 2);

  const foo = cs.commands[0];
  assertEqual(foo.name, "foo");
  assertEqual(foo.arguments.length, 3);
  assertEqual(foo.arguments[0].key, "bar");
  assertEqual(foo.arguments[0].value, "baz");
  assertEqual(foo.arguments[1].key, "flag");
  assertEqual(foo.arguments[1].value, "true");
  assertEqual(foo.arguments[2].key, "arg");
  assertEqual(foo.arguments[2].value, "value");
  assertEqual(foo.source, "foo -bar:baz -flag -arg:value");
});

runner.test("CommandSet parse with tokens", () => {
  const source = `foo -bar:$var1
test -arg:$var2

$var1
This is token 1

$var2
This is token 2`;

  const cs = new CommandSet(source);
  assertEqual(cs.commands.length, 2);
  assertEqual(Object.keys(cs.tokens).length, 0); // Tokens cleared after parse

  // Check token substitution occurred correctly
  assertEqual(cs.commands[0].arguments[0].value, "This is token 1");
  assertEqual(cs.commands[1].arguments[0].value, "This is token 2");
});

runner.test("CommandSet parse with multiline tokens", () => {
  const source = `foo -bar:$var1

$var1
Line 1
Line 2
Line 3`;

  const cs = new CommandSet(source);
  assertEqual(Object.keys(cs.tokens).length, 0); // Tokens cleared after parse
  assertEqual(cs.commands[0].arguments[0].value, "Line 1\nLine 2\nLine 3");
});

runner.test("CommandSet getCommands", () => {
  const source = `foo -arg1:value1
bar -arg2:value2
foo -arg3:value3`;
  const cs = new CommandSet(source);

  const fooCommands = cs.getCommands("foo");
  assertEqual(fooCommands.length, 2);
  assertEqual(fooCommands[0].arguments[0].key, "arg1");
  assertEqual(fooCommands[1].arguments[0].key, "arg3");

  const barCommands = cs.getCommands("bar");
  assertEqual(barCommands.length, 1);
  assertEqual(barCommands[0].arguments[0].key, "arg2");
});

runner.test("CommandSet getCommand", () => {
  const source = `foo -arg1:value1
bar -arg2:value2
foo -arg3:value3`;
  const cs = new CommandSet(source);

  const foo = cs.getCommand("foo");
  assert(foo !== null);
  assertEqual(foo.arguments[0].key, "arg1"); // Gets first occurrence

  const notFound = cs.getCommand("notfound");
  assertEqual(notFound, null);
});

runner.test("CommandSet addCommand", () => {
  const cs = new CommandSet();
  const cmd = new Command("test", [new Argument("arg", "value")]);
  cs.addCommand(cmd);

  assertEqual(cs.commands.length, 1);
  assertEqual(cs.commands[0].name, "test");
});

runner.test("CommandSet addCommand invalid argument", () => {
  const cs = new CommandSet();
  assertThrows(
    () => cs.addCommand("not a command"),
    "Must provide a Command instance"
  );
});

runner.test("CommandSet token name validation", () => {
  assertThrows(() => CommandSet.validateTokenName(""), "cannot be empty");
  assertThrows(
    () => CommandSet.validateTokenName("123var"),
    "Invalid token name"
  );
  assertThrows(
    () => CommandSet.validateTokenName("var@name"),
    "Invalid token name"
  );
});

runner.test("CommandSet parse validates string input", () => {
  const cs = new CommandSet();
  assertThrows(() => cs.parse(123), "Source must be a string");
  assertThrows(() => cs.parse(null), "Source must be a string");
  assertThrows(() => cs.parse(undefined), "Source must be a string");
  assertThrows(() => cs.parse({}), "Source must be a string");
});

// Test specification examples
runner.test("Specification Example 1", () => {
  const source = `foo
bar`;
  const cs = new CommandSet(source);

  assertEqual(cs.commands.length, 2);
  assertEqual(cs.commands[0].name, "foo");
  assertEqual(cs.commands[0].arguments.length, 0);
  assertEqual(cs.commands[1].name, "bar");
  assertEqual(cs.commands[1].arguments.length, 0);
});

runner.test("Specification Example 2", () => {
  const source = `foo -bar:baz
bar -qux`;
  const cs = new CommandSet(source);

  assertEqual(cs.commands.length, 2);
  assertEqual(cs.commands[0].name, "foo");
  assertEqual(cs.commands[0].arguments.length, 1);
  assertEqual(cs.commands[0].arguments[0].key, "bar");
  assertEqual(cs.commands[0].arguments[0].value, "baz");

  assertEqual(cs.commands[1].name, "bar");
  assertEqual(cs.commands[1].arguments.length, 1);
  assertEqual(cs.commands[1].arguments[0].key, "qux");
  assertEqual(cs.commands[1].arguments[0].value, "true");
});

runner.test("Specification Example 3", () => {
  const source = `foo -bar:$baz

$baz
This is the value of baz`;
  const cs = new CommandSet(source);

  assertEqual(cs.commands.length, 1);
  assertEqual(cs.commands[0].name, "foo");
  assertEqual(cs.commands[0].arguments.length, 1);
  assertEqual(cs.commands[0].arguments[0].key, "bar");
  assertEqual(cs.commands[0].arguments[0].value, "This is the value of baz");
});

runner.test("Specification Example 4", () => {
  const source = `foo -bar: -baz`;
  const cs = new CommandSet(source);

  assertEqual(cs.commands.length, 1);
  assertEqual(cs.commands[0].name, "foo");
  assertEqual(cs.commands[0].arguments.length, 2);
  assertEqual(cs.commands[0].arguments[0].key, "bar");
  assertEqual(cs.commands[0].arguments[0].value, "");
  assertEqual(cs.commands[0].arguments[1].key, "baz");
  assertEqual(cs.commands[0].arguments[1].value, "true");
});

// Test edge cases and error conditions
runner.test("Empty source", () => {
  const cs = new CommandSet("");
  assertEqual(cs.commands.length, 0);
});

runner.test("Whitespace only source", () => {
  const cs = new CommandSet("   \n  \n  ");
  assertEqual(cs.commands.length, 0);
});

runner.test("Commands with same name allowed", () => {
  const source = `foo -arg1:value1
foo -arg2:value2
foo -arg3:value3`;
  const cs = new CommandSet(source);
  assertEqual(cs.commands.length, 3);
  assertEqual(cs.getCommands("foo").length, 3);
});

runner.test("Token substitution with missing token", () => {
  const source = `foo -bar:$missing`;
  // Should throw an exception when token doesn't exist
  assertThrows(() => new CommandSet(source), "Undefined token: missing");
});

runner.test("Quoted token references should not be substituted", () => {
  const source = `foo -bar:"$missing"`;
  // Quoted values should not be evaluated for tokens
  // Note: This test may need adjustment based on current quote handling implementation
  const cs = new CommandSet(source);
  assertEqual(cs.commands[0].arguments[0].value, "$missing");
});

runner.test("Complex indentation handling", () => {
  const source = `foo
    -arg1:value1
        -arg2:value2
  -arg3:value3
bar`;

  const cs = new CommandSet(source);
  assertEqual(cs.commands.length, 2);
  assertEqual(cs.commands[0].arguments.length, 3);
  assertEqual(cs.commands[1].name, "bar");
  assertEqual(
    cs.commands[0].source,
    "foo -arg1:value1 -arg2:value2 -arg3:value3"
  );
  assertEqual(cs.commands[1].source, "bar");
});

runner.test("Command source property handles whitespace trimming", () => {
  const cmd = Command.fromSource("  test -arg:value  ");
  assertEqual(cmd.source, "test -arg:value");
});

// Target tests
runner.test("Command with target", () => {
  const cmd = Command.fromSource("deploy -env:production => production_server");
  assertEqual(cmd.name, "deploy");
  assertEqual(cmd.target, "production_server");
  assertEqual(cmd.arguments.length, 1);
  assertEqual(cmd.arguments[0].key, "env");
});

runner.test("Command without target has null target", () => {
  const cmd = Command.fromSource("deploy -env:production");
  assertEqual(cmd.name, "deploy");
  assertEqual(cmd.target, null);
});

runner.test("Command target with only command name", () => {
  const cmd = Command.fromSource("cleanup => cleanup_server");
  assertEqual(cmd.name, "cleanup");
  assertEqual(cmd.target, "cleanup_server");
  assertEqual(cmd.arguments.length, 0);
});

runner.test("Command target with multiple arguments", () => {
  const cmd = Command.fromSource("backup -database:users -path:/tmp => backup_dest");
  assertEqual(cmd.name, "backup");
  assertEqual(cmd.target, "backup_dest");
  assertEqual(cmd.arguments.length, 2);
});

runner.test("Command target validation invalid name", () => {
  assertThrows(
    () => Command.fromSource("deploy -env:prod => 123invalid"),
    "Invalid command name"
  );
});

runner.test("CommandSet parses commands with targets", () => {
  const source = `deploy -env:production => prod_server
backup -path:/tmp => backup_server`;
  const cs = new CommandSet(source);

  assertEqual(cs.commands.length, 2);
  assertEqual(cs.commands[0].target, "prod_server");
  assertEqual(cs.commands[1].target, "backup_server");
});

runner.test("CommandSet handles mixed commands with and without targets", () => {
  const source = `deploy -env:production => prod_server
cleanup
backup -path:/tmp`;
  const cs = new CommandSet(source);

  assertEqual(cs.commands.length, 3);
  assertEqual(cs.commands[0].target, "prod_server");
  assertEqual(cs.commands[1].target, null);
  assertEqual(cs.commands[2].target, null);
});

runner.test("Command constructor with target", () => {
  const cmd = new Command("test", [new Argument("arg", "value")], "target_name");
  assertEqual(cmd.name, "test");
  assertEqual(cmd.target, "target_name");
  assertEqual(cmd.arguments.length, 1);
});

// Run all tests
runner.run().catch(console.error);
