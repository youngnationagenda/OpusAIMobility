/**
 * Scans the Customer app Java source tree and finds ALL files that reference
 * excluded classes, generating a complete exclude list for build.gradle.
 */
const fs   = require('fs');
const path = require('path');

const SRC_DIR = 'D:/omnisonietest/OpusAIMobility/MobilityAIapp/android/customer/app/src/main/java';

// Seed — originally excluded classes (from build.gradle)
const EXCLUDED_CLASSES = new Set([
  // com.terraai tree
  'com.terraai',
  // Explicitly excluded yna files
  'LoginOrSignupFragment',
  'ConfirmYourEmalFragment',
  'AddPhoneNumFragment',
  'UpdateEmailFragment',
  'MapWorker',
  'AddToCartFragment',
  'FiltersFragment',
  'FoodHomeFragment',
  'PlaceOrdersFragment',
  'ReviewDeliveryFragment',
  'RideOrRentFragment',
  'StartRideFragment',
  'ConfirmPickUpFragment',
  'WheretoFragment',
  'ActiveRideA',
  'HomeFragment',
  'FoodActivity',
  'HomeActivity',
  'LoginActivity',
  'SplashActivity',
  'Notification_Receive',
  'AddDeliveryNote',
  'FoodHomeTwo',
  'TrackFoodActivity',
  'ParcelChangeAddress',
  'TrackParcelActivity',
  // Iteration 1 secondaries
  'ViewPagerAdapter',
  'DataParse',
  'FavouriteFragment',
  'RestaurantDetailsFragment',
  'RestaurantMenuFragment',
  'ResturantAgainstCatFragment',
  'ResturantClosedDialog',
  'SearchFragmentResturant',
  'DeliveryDetailsFragment',
  'DeliveryRecipientF',
  'AccountFragment',
  'RatingFragment',
  'ConfirmYourNumberFragment',
  'LogInFragment',
  'OtpFragment',
  'SignUpFragment',
  // Iteration 2
  'BrowseFragment',
  'OrderDetailsFragment',
  'MenuListAdapter',
  'HistoryParcelDetailFragment',
  'RideHistoryDetail',
  'MainFragment',
]);

// Scan all Java files
function walk(dir) {
  let files = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files = files.concat(walk(full));
    else if (entry.name.endsWith('.java')) files.push(full);
  }
  return files;
}

const javaFiles = walk(SRC_DIR);
console.log(`Found ${javaFiles.length} Java files`);

// Build map: className -> relative path
const classMap = new Map();
for (const f of javaFiles) {
  const name = path.basename(f, '.java');
  const rel = f.replace(SRC_DIR + '/', '').replace(SRC_DIR + path.sep, '').replace(/\\/g, '/');
  classMap.set(name, rel);
}

// Iteratively find all files that reference excluded classes
const toExclude = new Set(EXCLUDED_CLASSES);
let changed = true;
let iteration = 0;

while (changed) {
  changed = false;
  iteration++;
  for (const f of javaFiles) {
    const name = path.basename(f, '.java');
    if (toExclude.has(name)) continue; // already excluded

    const content = fs.readFileSync(f, 'utf8');
    for (const exc of toExclude) {
      if (content.includes(exc)) {
        toExclude.add(name);
        changed = true;
        break;
      }
    }
  }
  console.log(`Iteration ${iteration}: ${toExclude.size} classes to exclude`);
}

// Generate exclude list (only files that exist in the source tree)
const excludeLines = [];
for (const f of javaFiles) {
  const name = path.basename(f, '.java');
  if (toExclude.has(name) && !name.startsWith('com.terraai')) {
    const rel = f.replace(SRC_DIR + '/', '').replace(SRC_DIR + path.sep, '').replace(/\\/g, '/');
    // Skip if it's a com.terraai path (whole tree excluded)
    if (!rel.startsWith('com/terraai')) {
      excludeLines.push(`                exclude '${rel}'`);
    }
  }
}

console.log(`\nTotal files to exclude: ${excludeLines.length}`);
console.log('\n--- Paste into build.gradle sourceSets.main.java block ---');
console.log(excludeLines.sort().join('\n'));

// Write to file for easy copy
fs.writeFileSync('D:/omnisonietest/OpusAIMobility/MobilityAIapp/android/exclude-list.txt',
  excludeLines.sort().join('\n'), 'utf8');
console.log('\nWritten to: android/exclude-list.txt');
