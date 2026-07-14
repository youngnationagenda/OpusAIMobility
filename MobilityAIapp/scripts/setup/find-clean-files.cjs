/**
 * Find all Java files that do NOT reference excluded classes.
 * These are the "clean" files that can compile successfully.
 */
const fs   = require('fs');
const path = require('path');

const SRC_DIR = 'D:/omnisonietest/OpusAIMobility/MobilityAIapp/android/customer/app/src/main/java';

const EXCLUDED_CLASSES = new Set([
  'com.terraai','LoginOrSignupFragment','ConfirmYourEmalFragment','AddPhoneNumFragment',
  'UpdateEmailFragment','MapWorker','AddToCartFragment','FiltersFragment','FoodHomeFragment',
  'PlaceOrdersFragment','ReviewDeliveryFragment','RideOrRentFragment','StartRideFragment',
  'ConfirmPickUpFragment','WheretoFragment','ActiveRideA','HomeFragment','FoodActivity',
  'HomeActivity','LoginActivity','SplashActivity','Notification_Receive','AddDeliveryNote',
  'FoodHomeTwo','TrackFoodActivity','ParcelChangeAddress','TrackParcelActivity',
  'ViewPagerAdapter','DataParse','FavouriteFragment','RestaurantDetailsFragment',
  'RestaurantMenuFragment','ResturantAgainstCatFragment','ResturantClosedDialog',
  'SearchFragmentResturant','DeliveryDetailsFragment','DeliveryRecipientF','AccountFragment',
  'RatingFragment','ConfirmYourNumberFragment','LogInFragment','OtpFragment','SignUpFragment',
  'BrowseFragment','OrderDetailsFragment','MenuListAdapter','HistoryParcelDetailFragment',
  'RideHistoryDetail','MainFragment',
]);

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

// Iteratively build exclusion set
const toExclude = new Set(EXCLUDED_CLASSES);
let changed = true;
let iteration = 0;
while (changed) {
  changed = false;
  iteration++;
  for (const f of javaFiles) {
    const name = path.basename(f, '.java');
    if (toExclude.has(name)) continue;
    const content = fs.readFileSync(f, 'utf8');
    for (const exc of toExclude) {
      if (content.includes(exc)) {
        toExclude.add(name);
        changed = true;
        break;
      }
    }
  }
  console.log(`Iteration ${iteration}: ${toExclude.size} excluded`);
}

// Remaining clean files
const clean = [];
const alsoExclude = [];

for (const f of javaFiles) {
  const name = path.basename(f, '.java');
  const rel = f.replace(SRC_DIR.replace(/\//g, path.sep), '').replace(/^[\\\/]/, '').replace(/\\/g, '/');

  if (rel.startsWith('com/terraai/')) continue; // already excluded by glob

  if (toExclude.has(name)) {
    alsoExclude.push(`                exclude '${rel}'`);
  } else {
    clean.push(`${rel} (${name})`);
  }
}

console.log(`\n=== CLEAN files (compile without issues): ${clean.length} ===`);
clean.forEach(f => console.log(' ', f));

console.log(`\n=== ADDITIONAL excludes needed (beyond com/terraai/**): ${alsoExclude.length} ===`);
console.log(alsoExclude.sort().join('\n'));

fs.writeFileSync(
  'D:/omnisonietest/OpusAIMobility/MobilityAIapp/android/additional-excludes.txt',
  alsoExclude.sort().join('\n'),
  'utf8'
);
console.log('\nWritten to android/additional-excludes.txt');
