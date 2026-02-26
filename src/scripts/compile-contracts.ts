import { execSync } from "child_process";
import { copyFileSync, existsSync, mkdirSync, readdirSync } from "fs";
import { join } from "path";

export const compileContracts = async (): Promise<void> => {
  console.log("🔧 Starting contract compilation...");

  const uncompiledDir = join(process.cwd(), "src", "contracts", "uncompiled");
  const michelsonDir = join(process.cwd(), "src", "contracts", "michelson");
  const compiledDir = join(process.cwd(), "src", "contracts", "compiled");

  // Ensure compiled directory exists
  if (!existsSync(compiledDir)) {
    mkdirSync(compiledDir, { recursive: true });
    console.log(`📁 Created compiled directory: ${compiledDir}`);
  }

  let compiledCount = 0;

  // Compile JSLIGO contracts
  if (existsSync(uncompiledDir)) {
    const jsligoFiles = readdirSync(uncompiledDir).filter((file) =>
      file.endsWith(".jsligo"),
    );

    if (jsligoFiles.length > 0) {
      console.log(`📄 Found ${jsligoFiles.length} JSLIGO file(s) to compile`);

      for (const file of jsligoFiles) {
        const contractName = file.replace(".jsligo", "");
        const inputPath = join(uncompiledDir, file);
        const outputPath = join(compiledDir, `${contractName}.tz`);

        try {
          console.log(`⏳ Compiling ${file}...`);

          // Use LIGO to compile the contract
          const command = `ligo compile contract "${inputPath}" --output-file "${outputPath}" --skip-analytics`;

          execSync(command, {
            stdio: "pipe",
            cwd: process.cwd(),
          });

          console.log(`✅ Successfully compiled ${file} → ${contractName}.tz`);
          compiledCount++;
        } catch (error) {
          console.error(`❌ Failed to compile ${file}:`, error);
          throw new Error(
            `Compilation failed for ${file}. Make sure LIGO is installed and available in PATH.`,
          );
        }
      }
    }
  } else {
    console.log(
      "⚠️  No uncompiled directory found, skipping JSLIGO compilation",
    );
  }

  // Copy Michelson contracts to compiled directory
  if (existsSync(michelsonDir)) {
    const michelsonFiles = readdirSync(michelsonDir).filter((file) =>
      file.endsWith(".tz"),
    );

    if (michelsonFiles.length > 0) {
      console.log(
        `📄 Found ${michelsonFiles.length} Michelson file(s) to copy`,
      );

      for (const file of michelsonFiles) {
        const contractName = file.replace(".tz", "");
        const sourcePath = join(michelsonDir, file);
        const destPath = join(compiledDir, file);

        try {
          console.log(`⏳ Copying ${file}...`);
          copyFileSync(sourcePath, destPath);
          console.log(`✅ Successfully copied ${file} → ${contractName}.tz`);
          compiledCount++;
        } catch (error) {
          console.error(`❌ Failed to copy ${file}:`, error);
          throw new Error(`Failed to copy Michelson contract ${file}.`);
        }
      }
    }
  } else {
    console.log(
      "⚠️  No michelson directory found, skipping Michelson contracts",
    );
  }

  if (compiledCount === 0) {
    console.log("⚠️  No contracts found to compile or copy");
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
