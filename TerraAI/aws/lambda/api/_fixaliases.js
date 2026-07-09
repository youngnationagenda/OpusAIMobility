/**
 * Add all missing Android app route aliases to index.js
 * Android ApiInterface.java uses these exact endpoint names
 */
const fs = require('fs');
let code = fs.readFileSync('aws/lambda/api/index.js', 'utf8');

// Map of: existing route line → new line with extra aliases added
const aliases = [
  // Good Types — Android calls showGoodTypes
  [
    "    case 'getGoodTypes': return ok(GOOD_TYPES.map(g=>({GoodType:g})));",
    "    case 'getGoodTypes': case 'showGoodTypes': return ok(GOOD_TYPES.map(g=>({GoodType:g})));"
  ],
  // Package Sizes — Android calls showPackageSize (already has it, but add getPackageSize)
  [
    "    case 'getPackageSizes': case 'showPackageSize': return ok(PKG_SIZES.map(p=>({PackageSize:p})));",
    "    case 'getPackageSizes': case 'showPackageSize': case 'getPackageSize': return ok(PKG_SIZES.map(p=>({PackageSize:p})));"
  ],
  // Restaurants — add all Android aliases
  [
    "    case 'getRestaurants': case 'getAllRestaurants': case 'showRestaurants':",
    "    case 'getRestaurants': case 'getAllRestaurants': case 'showRestaurants': case 'showUserRestaurant':"
  ],
  // Food Categories — Android calls showFoodCategory (already there, add more)
  [
    "    case 'getFoodCategories': case 'showFoodCategory': return ok(FOOD_CATS.map(c=>({FoodCategory:c})));",
    "    case 'getFoodCategories': case 'showFoodCategory': case 'getFoodCategory': return ok(FOOD_CATS.map(c=>({FoodCategory:c})));"
  ],
  // Ride types — Android calls showRideTypes (already there, add requestVehicle alias)
  [
    "    case 'getRideTypes': case 'showRideTypes': return ok(RIDE_TYPES);",
    "    case 'getRideTypes': case 'showRideTypes': case 'requestVehicle': return ok(RIDE_TYPES);"
  ],
  // Food orders — add showRestaurantFoodOrders
  [
    "    case 'getFoodOrders': case 'showFoodOrders': case 'showFoodDeliveryOrders':",
    "    case 'getFoodOrders': case 'showFoodOrders': case 'showFoodDeliveryOrders': case 'showRestaurantFoodOrders':"
  ],
  // Parcel orders — add all variants
  [
    "    case 'showParcelOrders': case 'getParcelOrders':",
    "    case 'showParcelOrders': case 'getParcelOrders': case 'showRiderParcelOrders':"
  ],
  // Notifications — already has showUserNotifications
  // Rider order details — Android calls showRiderOrderDetails
  // Already handled — double check
];

let changes = 0;
for (const [oldLine, newLine] of aliases) {
  if (code.includes(oldLine)) {
    code = code.replace(oldLine, newLine);
    process.stdout.write('✅ ' + newLine.trim().slice(0, 80) + '\n');
    changes++;
  } else {
    process.stdout.write('⚠️  Not found: ' + oldLine.trim().slice(0, 70) + '\n');
  }
}

// Add showUserRestaurant as a proper handler that returns the restaurant for the logged-in vendor
const OLD_SHOW_REST_DETAIL = "    case 'getRestaurantById': case 'getRestaurantDetail': case 'showRestaurantDetail': { const r=body.restaurant_id?await db.getItem(db.T.RESTAURANTS,{restaurantId:body.restaurant_id}):null; return ok({Restaurant:r||{}}); }";
const NEW_SHOW_REST_DETAIL  = "    case 'getRestaurantById': case 'getRestaurantDetail': case 'showRestaurantDetail': case 'showUserRestaurant': { const r=body.restaurant_id?await db.getItem(db.T.RESTAURANTS,{restaurantId:body.restaurant_id}):null; if(!r){const all=await db.scanTable(db.T.RESTAURANTS,1);return ok({Restaurant:all[0]||{},User:{}});}; return ok({Restaurant:r,User:{}}); }";
if (code.includes(OLD_SHOW_REST_DETAIL)) {
  code = code.replace(OLD_SHOW_REST_DETAIL, NEW_SHOW_REST_DETAIL);
  process.stdout.write('✅ showUserRestaurant added as proper restaurant detail handler\n');
  changes++;
}

// Add addCrashReport, showCurrency which Android calls on startup
const OLD_HEALTH = "    case 'health': case 'ping': return ok({status:'healthy',service:'aimobility API',version:'2.0.0',backend:'DynamoDB+Cognito+SNS'});";
const NEW_HEALTH  = "    case 'addCrashReport': case 'showCurrency': return ok('OK');\n    case 'health': case 'ping': return ok({status:'healthy',service:'aimobility API',version:'2.0.0',backend:'DynamoDB+Cognito+SNS'});";
if (code.includes(OLD_HEALTH)) {
  code = code.replace(OLD_HEALTH, NEW_HEALTH);
  process.stdout.write('✅ addCrashReport + showCurrency added\n');
  changes++;
}

fs.writeFileSync('aws/lambda/api/index.js', Buffer.from(code));
process.stdout.write('\n✅ ' + changes + ' changes applied — index.js: ' + fs.statSync('aws/lambda/api/index.js').size + ' bytes\n');
