import { readFileSync, writeFileSync } from 'fs';

const packageJson = JSON.parse(readFileSync('package.json', 'utf-8'));
const version = packageJson.version;

const tauriConfPath = 'src-tauri/tauri.conf.json';
const tauriConf = JSON.parse(readFileSync(tauriConfPath, 'utf-8'));
tauriConf.version = version;
writeFileSync(tauriConfPath, `${JSON.stringify(tauriConf, null, 2)}\n`);

const cargoPath = 'src-tauri/Cargo.toml';
const cargoToml = readFileSync(cargoPath, 'utf-8').replace(
  /^version\s*=\s*"[^"]+"/m,
  `version = "${version}"`,
);
writeFileSync(cargoPath, cargoToml);

console.log(`Synced app version to ${version}`);
