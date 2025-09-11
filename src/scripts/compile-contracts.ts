import { existsSync, readdirSync, mkdirSync } from "fs";
import { join } from "path";
import { execSync } from "child_process";

export const compileContracts = async (): Promise<void> => {
  console.log("🔧 Starting JSLIGO contract compilation...");

  const uncompiledDir = join(process.cwd(), "src", "contracts", "uncompiled");
  const compiledDir = join(process.cwd(), "src", "contracts", "compiled");

  // Check if uncompiled directory exists
  if (!existsSync(uncompiledDir)) {
    console.log("⚠️  No uncompiled directory found, skipping compilation");
    return;
  }

  // Ensure compiled directory exists
  if (!existsSync(compiledDir)) {
    mkdirSync(compiledDir, { recursive: true });
    console.log(`📁 Created compiled directory: ${compiledDir}`);
  }

  // Find all JSLIGO files
  const jsligoFiles = readdirSync(uncompiledDir).filter((file) =>
    file.endsWith(".jsligo"),
  );

  if (jsligoFiles.length === 0) {
    console.log("⚠️  No JSLIGO files found in uncompiled directory");
    return;
  }

  console.log(`📄 Found ${jsligoFiles.length} JSLIGO file(s) to compile`);

  // Compile each JSLIGO file
  for (const file of jsligoFiles) {
    const contractName = file.replace(".jsligo", "");
    const inputPath = join(uncompiledDir, file);
    const outputPath = join(compiledDir, `${contractName}.tz`);

    try {
      console.log(`⏳ Compiling ${file}...`);

      // Use LIGO to compile the contract
      const command = `ligo compile contract "${inputPath}" --output-file "${outputPath}"`;

      execSync(command, {
        stdio: "pipe",
        cwd: process.cwd(),
      });

      console.log(`✅ Successfully compiled ${file} → ${contractName}.tz`);
    } catch (error) {
      console.error(`❌ Failed to compile ${file}:`, error);
      throw new Error(
        `Compilation failed for ${file}. Make sure LIGO is installed and available in PATH.`,
      );
    }
  }
};

// If running this script directly
if (process.argv[1] && process.argv[1].includes("compile-contracts")) {
  compileContracts()
    .then(() => {
      console.log(`\n🎉 Compilation completed successfully!`);
      process.exit(0);
    })
    .catch((error) => {
      console.error(`\n💥 Failed to compile contracts:`, error);
      process.exit(1);
    });
}
