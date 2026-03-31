/**
 * Configuration Language Parser - Usage Examples
 *
 * Demonstrates how to use the Configuration Language parser
 */

const { CommandSet, Command, Argument } = require("./src/config-lang.js");

console.log("Configuration Language Parser - Usage Examples\n");

// Example 1: Basic usage
console.log("=== Example 1: Basic Commands ===");
const example1 = `
# This is a comment - it will be ignored
deploy -env:production -force
backup -database:users -path:/tmp/backup
cleanup
`;

const cs1 = new CommandSet(example1);
console.log(`Parsed ${cs1.commands.length} commands:`);
cs1.commands.forEach((cmd) => {
  console.log(`- ${cmd.name} (${cmd.arguments.length} arguments)`);
  cmd.arguments.forEach((arg) => {
    console.log(`  ${arg.key}: "${arg.value}"`);
  });
});

// Example 2: Indented arguments
console.log("\n=== Example 2: Indented Arguments ===");
const example2 = `
server
  -host:localhost
  -port:8080
  -ssl
  -config:/etc/server.conf
database
  -type:postgresql
  -host:db.example.com
  -database:myapp
`;

const cs2 = new CommandSet(example2);
cs2.commands.forEach((cmd) => {
  console.log(`${cmd.name}:`);
  cmd.arguments.forEach((arg) => {
    console.log(`  ${arg.key}: "${arg.value}"`);
  });
});

// Example 3: Tokens
console.log("\n=== Example 3: Tokens ===");
const example3 = `
email -to:$admin_email -subject:$subject -body:$email_body
log -message:$log_message

$admin_email
admin@example.com

$subject
System Alert: Deployment Complete

$email_body
The deployment has completed successfully.
All systems are operational.

Thank you!

$log_message
Deployment notification sent to administrator
`;

const cs3 = new CommandSet(example3);
console.log("Commands with token substitution:");
cs3.commands.forEach((cmd) => {
  console.log(`${cmd.name}:`);
  cmd.arguments.forEach((arg) => {
    console.log(`  ${arg.key}: "${arg.value}"`);
  });
});

console.log(
  "\nTokens are cleared after parsing (substitution occurs at parse time):"
);
console.log(`  Tokens remaining: ${Object.keys(cs3.tokens).length}`);
console.log(
  "  But token substitution was successful in argument values above."
);

// Example 4: Programmatic usage
console.log("\n=== Example 4: Programmatic Usage ===");
const cs4 = new CommandSet();

// Add commands programmatically
cs4.addCommand(
  new Command("start", [
    new Argument("service", "web-server"),
    new Argument("port", "3000"),
  ])
);

cs4.addCommand(
  new Command("monitor", [
    new Argument("interval", "30"),
    new Argument("alerts"), // Boolean argument (defaults to 'true')
  ])
);

console.log("Programmatically created commands:");
cs4.commands.forEach((cmd) => {
  console.log(`${cmd.name}:`);
  cmd.arguments.forEach((arg) => {
    console.log(`  ${arg.key}: "${arg.value}"`);
  });
});

// Example 5: Querying commands
console.log("\n=== Example 5: Querying Commands ===");
const example5 = `
deploy -env:staging -region:us-west
deploy -env:production -region:us-east
backup -target:staging
monitor -service:api
deploy -env:development -region:local
`;

const cs5 = new CommandSet(example5);
console.log(`Total commands: ${cs5.commands.length}`);

// Get all deploy commands
const deployCommands = cs5.getCommands("deploy");
console.log(`Deploy commands: ${deployCommands.length}`);
deployCommands.forEach((cmd, index) => {
  const env =
    cmd.arguments.find((arg) => arg.key === "env")?.value || "unknown";
  const region =
    cmd.arguments.find((arg) => arg.key === "region")?.value || "unknown";
  console.log(`  ${index + 1}. Environment: ${env}, Region: ${region}`);
});

// Get first backup command
const backupCommand = cs5.getCommand("backup");
if (backupCommand) {
  console.log(
    `First backup command targets: ${backupCommand.arguments[0].value}`
  );
}

console.log("\nConfiguration Language Parser examples completed!");
