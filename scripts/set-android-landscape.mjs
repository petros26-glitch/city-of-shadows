import { readFile, writeFile } from 'node:fs/promises';

const manifestPath = 'android/app/src/main/AndroidManifest.xml';
let manifest = await readFile(manifestPath, 'utf8');

const activityMatch = manifest.match(/<activity\b[^>]*>/);
if (!activityMatch) {
  throw new Error('Could not find the main Android activity in AndroidManifest.xml');
}

if (!/android:screenOrientation=/.test(activityMatch[0])) {
  const updatedActivity = activityMatch[0].replace(/\s*\/?>$/, (ending) => {
    return ' android:screenOrientation="landscape"' + ending;
  });
  manifest = manifest.replace(activityMatch[0], updatedActivity);
} else {
  manifest = manifest.replace(
    /(<activity\b[^>]*android:screenOrientation=")[^"]*(")/,
    '$1landscape$2'
  );
}

await writeFile(manifestPath, manifest);
console.log('COS Android orientation set to fixed landscape.');
