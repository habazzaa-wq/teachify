#!/usr/bin/env node

import { execSync } from "child_process";
import { existsSync, readFileSync, appendFileSync } from "fs";
import path from "path";

const args = process.argv.slice(2);
const domain = args[0];
const flags = args.filter(a => a.startsWith("--"));
const positional = args.filter(a => !a.startsWith("--"));
const port = positional[1] || "3000";
const openBrowser = flags.includes("--open");

if (!domain) {
  console.error("Usage: node add-tenant-domain.mjs <domain> [port] [--open]");
  console.error("Example: node add-tenant-domain.mjs school1.academy.test 3000 --open");
  process.exit(1);
}

const hostsPath = path.join(
  process.env.SystemRoot || "C:\\Windows",
  "System32",
  "drivers",
  "etc",
  "hosts"
);

const entry = `127.0.0.1\t${domain}`;

// Check if already exists
if (existsSync(hostsPath)) {
  const content = readFileSync(hostsPath, "utf-8");
  if (content.includes(domain)) {
    console.log(`✓ ${domain} already in hosts file`);
  } else {
    try {
      appendFileSync(hostsPath, `\n${entry}`);
      console.log(`✓ Added ${domain} to hosts file`);
    } catch {
      // Need admin - try via PowerShell
      console.log(`→ Need admin rights to edit hosts file. Running as administrator...`);
      try {
        const psCmd = `powershell -Command "Start-Process powershell -Verb RunAs -ArgumentList '-NoProfile -Command \\\"Add-Content -LiteralPath \\\\\\\"${hostsPath}\\\\\\\" -Value \\\\\\\"${entry}\\\\\\\"\\\"' -Wait"`;
        execSync(psCmd, { stdio: "inherit" });
        console.log(`✓ Added ${domain} to hosts file`);
      } catch {
        console.log(`\n⚠ Could not automatically add to hosts.`);
        console.log(`  Run this command as Administrator:\n`);
        console.log(`  Add-Content -LiteralPath "${hostsPath}" -Value "${entry}"\n`);
        console.log(`  Or manually add this line to ${hostsPath}:`);
        console.log(`  ${entry}\n`);
      }
    }
  }
}

if (openBrowser) {
  const url = `http://${domain}:${port}`;
  console.log(`→ Opening ${url}`);
  try {
    execSync(`start "" "${url}"`, { stdio: "ignore" });
  } catch {
    // fallback
    execSync(`powershell -Command "Start-Process '${url}'"`, { stdio: "ignore" });
  }
}
