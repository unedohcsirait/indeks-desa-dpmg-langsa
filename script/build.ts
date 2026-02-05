import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import { platform } from 'os';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const isWindows = platform() === 'win32';
const binExt = isWindows ? '.cmd' : '';

function runCommand(command: string, description: string) {
  console.log(`\n${description}...`);
  try {
    execSync(command, { 
      cwd: rootDir, 
      stdio: 'inherit',
      env: { ...process.env, NODE_ENV: 'production' },
      shell: isWindows ? 'powershell.exe' : undefined
    });
    console.log(`✅ ${description} completed!`);
  } catch (error) {
    console.error(`❌ ${description} failed!`);
    throw error;
  }
}

async function main() {
  try {
    // Build client using Vite CLI (this will use vite.config.ts automatically)
    const viteBin = path.join(rootDir, 'node_modules', '.bin', `vite${binExt}`);
    runCommand(`"${viteBin}" build`, 'Building client');
    
    // Build server using esbuild CLI
    const esbuildBin = path.join(rootDir, 'node_modules', '.bin', `esbuild${binExt}`);
    runCommand(
      `"${esbuildBin}" server/index.ts --bundle --platform=node --target=node20 --format=cjs --outfile=dist/index.cjs --external:express --external:pg --external:bcrypt --external:drizzle-orm --external:passport --external:express-session --external:dotenv --external:ws --external:connect-pg-simple --external:memorystore --external:csv-parse --external:exceljs --external:xlsx --external:openid-client --external:passport-local`,
      'Building server'
    );
    
    console.log('\n✅ Build completed successfully!');
  } catch (error) {
    console.error('\n❌ Build failed:', error);
    process.exit(1);
  }
}

main();
