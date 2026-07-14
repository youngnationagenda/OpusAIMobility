<?php

date_default_timezone_set('Asia/Karachi');


define('APP_STATUS', 'live');
define('APP_NAME', 'GoGrab');
define('BASE_URL', '');
define('API_KEY', '12345-76543-34567-8765');
define('ADMIN_API_KEY', '12345-76543-34567-8765');

//Datebase
define('DATABASE_HOST', 'localhost');
define('DATABASE_USER', '');
define('DATABASE_PASSWORD', ';');
define('DATABASE_NAME', '');

//Folder paths
define('UPLOADS_FOLDER_URI', 'app/webroot/uploads');
define('UPLOADS_FOLDER_CATEGORY_URI', 'app/webroot/uploads/category');
define('UPLOADS_FOLDER_STORE_URI', 'app/webroot/uploads/store');

//show restaurants around this radius
define('RADIUS', '1000000');

//show drivers around this radius
define('DISTANCE_DRIVER_IN_KM', '20000000000000');
define('DISTANCE_UNIT', 'K'); //USE M for Miles

//Twilio for phone verification otp
define('TWILIO_ACCOUNTSID', '');
define('TWILIO_AUTHTOKEN', '');
define('TWILIO_NUMBER', '');

//Phone text message
define('VERIFICATION_PHONENO_MESSAGE', 'Your verification code is');
define('CONTACT_US_SUBJECT', 'new message from app');

//Facebook
define('FACEBOOK_APP_ID', '');
define('FACEBOOK_APP_SECRET', '');
define('FACEBOOK_GRAPH_VERSION', 'v2.10');

//value will be in seconds
define('FOOD_ORDER_CANCEL_AFTER', '300');

//Google
define('GOOGLE_CLIENT_ID', '');

//push notification key
define('FIREBASE_PUSH_NOTIFICATION_KEY', '');

//google maps key
define('GOOGLE_MAPS_KEY', '');

//strip details
define('STRIPE_API_KEY','');
define('STRIPE_CURRENCY', 'usd');


define('AUTOMATIC_ASSIGN_FOOD_DELIVERY_ORDER','YES'); // NO Means No
define('AUTOMATIC_ASSIGN_PARCEL_DELIVERY_ORDER', 'YES');

//Mail Settings

define('MAIL_HOST', 'mail.qboxus.com');
define('MAIL_USERNAME', 'no-reply@qboxus.com');
define('MAIL_PASSWORD', '');
define('MAIL_FROM', '');
define('MAIL_NAME', '');
define('MAIL_REPLYTO', 'no-reply@qboxus.com');

?>
