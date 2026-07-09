const fs = require('fs');
const F = 'aws/admin-panel/index.js';
const a = s => fs.appendFileSync(F, Buffer.from(s + '\n'));

// Dashboard
a('async function pageDashboard(sess){');
a('  var r=await api("dashboardData",{});');
a('  var d=r.msg||{};');
a('  var stats=[');
a('    ["fa-users","Users",d.total_users||0,"#166534"],');
a('    ["fa-motorcycle","Riders",d.total_drivers||0,"#1e40af"],');
a('    ["fa-car","Trips",d.total_trips||0,"#7c3aed"],');
a('    ["fa-shopping-bag","Food Orders",d.total_food_orders||0,"#b45309"],');
a('    ["fa-box","Parcel Orders",d.total_parcel_orders||0,"#0e7490"],');
a('    ["fa-store","Restaurants",d.total_restaurants||0,"#065f46"]');
a('  ];');
a('  var cards=stats.map(function(s){');
a('    return "<div style=\\"background:#fff;border:1px solid #dee2e6;border-radius:8px;padding:20px;text-align:center\\">"');
a('      +"<div style=\\"font-size:22px;color:"+s[3]+"\\"><i class=\\"fas "+s[0]+"\\"></i></div>"');
a('      +"<div style=\\"font-size:36px;font-weight:700;color:"+s[3]+";margin:4px 0\\">"+s[2]+"</div>"');
a('      +"<p style=\\"font-size:13px;color:#6d7175;margin:0\\">"+s[1]+"</p></div>";');
a('  }).join("");');
a('  var grid="<div style=\\"display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:16px;margin-bottom:24px\\">"+cards+"</div>";');
a('  return layout(sess,"dashboard","<div class=\\"page-hdr\\"><h1 class=\\"page-title\\">Dashboard</h1></div>"+grid);');
a('}');
a('');

// Generic user table helper
a('function userRows(rows){');
a('  return tblH(["ID","Name","Email","Phone","Role","Joined"],rows,function(u){');
a('    return [');
a('      "<code>"+esc((u.id||u.userId||"").slice(0,8))+"...</code>",');
a('      esc((u.first_name||"")+" "+(u.last_name||"")),');
a('      esc(u.email||""),esc(u.phone||""),');
a('      "<span class=\\"badge badge-blue\\">"+esc(u.role||"user")+"</span>",');
a('      fmt(u.created)');
a('    ];');
a('  });');
a('}');
a('');

// Users
a('async function pageUsers(sess){');
a('  var r=await api("getAllUsers",{});');
a('  var rows=(r.msg||[]).map(function(x){return x.User||x;});');
a('  return layout(sess,"users","<div class=\\"page-hdr\\"><h1 class=\\"page-title\\">Users ("+rows.length+")</h1></div>"+userRows(rows));');
a('}');
a('');

// Riders
a('async function pageRiders(sess){');
a('  var r=await api("getAllRiders",{});');
a('  var rows=(r.msg||[]).map(function(x){return x.User||x;});');
a('  var t=tblH(["ID","Name","Email","Phone","Joined"],rows,function(u){');
a('    return ["<code>"+esc((u.id||u.userId||u.driverId||"").slice(0,8))+"...</code>",esc((u.first_name||"")+" "+(u.last_name||"")),esc(u.email||""),esc(u.phone||""),fmt(u.created)];');
a('  });');
a('  return layout(sess,"riders","<div class=\\"page-hdr\\"><h1 class=\\"page-title\\">Riders ("+rows.length+")</h1></div>"+t);');
a('}');
a('');

// Restaurants
a('async function pageRestaurants(sess){');
a('  var r=await api("getRestaurants",{});');
a('  var rows=(r.msg||[]).map(function(x){return x.Restaurant||x;});');
a('  var t=tblH(["ID","Name","Min Order","Delivery Fee","Rating","Status","Created"],rows,function(x){');
a('    return ["<code>"+esc((x.id||x.restaurantId||"").slice(0,8))+"...</code>",esc(x.name||""),esc(x.min_order_price||""),esc(x.delivery_fee||""),');
a('      "<span class=\\"badge badge-green\\">"+esc(x.rating||"4.0")+"</span>",');
a('      x.is_open?"<span class=\\"badge badge-green\\">Open</span>":"<span class=\\"badge badge-gray\\">Closed</span>",fmt(x.created)];');
a('  });');
a('  return layout(sess,"restaurants","<div class=\\"page-hdr\\"><h1 class=\\"page-title\\">Restaurants ("+rows.length+")</h1></div>"+t);');
a('}');
a('');

// Food Orders
a('async function pageFoodOrders(sess){');
a('  var r=await api("showFoodOrders",{});');
a('  var rows=r.msg||[];');
a('  var smap={"0":"<span class=\\"badge badge-gray\\">Pending</span>","1":"<span class=\\"badge badge-blue\\">Active</span>","2":"<span class=\\"badge badge-green\\">Completed</span>","3":"<span class=\\"badge badge-red\\">Cancelled</span>"};');
a('  var t=tblH(["Order ID","User","Restaurant","Total","Status","Created"],rows,function(o){');
a('    return ["<code>"+esc((o.orderId||o.id||"").slice(0,8))+"...</code>",esc(o.user_id||o.userId||""),esc(o.restaurant_id||""),esc(o.total_price||o.price||""),smap[o.status]||("<span class=\\"badge badge-gray\\">"+esc(o.status||"")+"</span>"),fmt(o.created)];');
a('  });');
a('  return layout(sess,"foodOrders","<div class=\\"page-hdr\\"><h1 class=\\"page-title\\">Food Orders ("+rows.length+")</h1></div>"+t);');
a('}');
a('');

// Trips
a('async function pageTrips(sess){');
a('  var r=await api("tripRequest",{});');
a('  var rows=r.msg||[];');
a('  var t=tblH(["Ride ID","User","Pickup","Dropoff","Fare","Status","Created"],rows,function(x){');
a('    return ["<code>"+esc((x.rideId||x.id||"").slice(0,8))+"...</code>",esc(x.userId||x.user_id||""),esc(x.pickup||""),esc(x.dropoff||""),esc(x.fare||""),"<span class=\\"badge badge-gray\\">"+esc(x.status||"pending")+"</span>",fmt(x.created)];');
a('  });');
a('  return layout(sess,"trips","<div class=\\"page-hdr\\"><h1 class=\\"page-title\\">Trip Requests ("+rows.length+")</h1></div>"+t);');
a('}');
a('');

// Parcel Orders
a('async function pageParcelOrders(sess){');
a('  var r=await api("showParcelOrders",{});');
a('  var rows=r.msg||[];');
a('  var t=tblH(["Order ID","User","Total","Status","Created"],rows,function(o){');
a('    return ["<code>"+esc((o.orderId||o.id||"").slice(0,8))+"...</code>",esc(o.userId||o.user_id||""),esc(o.total_price||""),"<span class=\\"badge badge-gray\\">"+esc(o.status||"pending")+"</span>",fmt(o.created)];');
a('  });');
a('  return layout(sess,"parcelOrders","<div class=\\"page-hdr\\"><h1 class=\\"page-title\\">Parcel Orders ("+rows.length+")</h1></div>"+t);');
a('}');
a('');

// Food Categories
a('async function pageFoodCategory(sess){');
a('  var r=await api("getFoodCategories",{});');
a('  var rows=(r.msg||[]).map(function(x){return x.FoodCategory||x;});');
a('  var t=tblH(["ID","Title"],rows,function(x){return [esc(x.id||""),esc(x.title||"")];});');
a('  return layout(sess,"foodCategory","<div class=\\"page-hdr\\"><h1 class=\\"page-title\\">Food Categories</h1></div>"+t);');
a('}');
a('');

// Ride Types
a('async function pageRideTypes(sess){');
a('  var r=await api("getRideTypes",{});');
a('  var rows=r.msg||[];');
a('  var t=tblH(["ID","Name","Description","Base Fare","Per Min","Per KM","Capacity"],rows,function(x){');
a('    return [esc(x.id||""),esc(x.name||""),esc(x.description||""),esc(x.base_fare||""),esc(x.cost_per_minute||""),esc(x.cost_per_distance||""),esc(x.passenger_capacity||"")];');
a('  });');
a('  return layout(sess,"rideTypes","<div class=\\"page-hdr\\"><h1 class=\\"page-title\\">Ride Types</h1></div>"+t);');
a('}');
a('');

// Package Sizes
a('async function pagePackageSize(sess){');
a('  var r=await api("getPackageSizes",{});');
a('  var rows=(r.msg||[]).map(function(x){return x.PackageSize||x;});');
a('  var t=tblH(["ID","Title","Description","Price"],rows,function(x){return [esc(x.id||""),esc(x.title||""),esc(x.description||""),esc(x.price||"")];});');
a('  return layout(sess,"packageSize","<div class=\\"page-hdr\\"><h1 class=\\"page-title\\">Package Sizes</h1></div>"+t);');
a('}');
a('');

// Good Types
a('async function pageGoodType(sess){');
a('  var r=await api("getGoodTypes",{});');
a('  var rows=(r.msg||[]).map(function(x){return x.GoodType||x;});');
a('  var t=tblH(["ID","Name"],rows,function(x){return [esc(x.id||""),esc(x.name||"")];});');
a('  return layout(sess,"goodType","<div class=\\"page-hdr\\"><h1 class=\\"page-title\\">Good Types</h1></div>"+t);');
a('}');
a('');

// Coupons
a('async function pageCoupons(sess){');
a('  var r=await api("manageCoupon",{});');
a('  var rows=r.msg||[];');
a('  var t=tblH(["ID","Code","Discount %","User Limit","Expiry"],rows,function(x){');
a('    return [esc(x.id||""),"<strong>"+esc(x.coupon_code||"")+"</strong>",esc(x.discount||""),esc(x.limit_users||""),esc(x.expiry_date||"")];');
a('  });');
a('  return layout(sess,"coupons","<div class=\\"page-hdr\\"><h1 class=\\"page-title\\">Coupons</h1></div>"+t);');
a('}');
a('');

// Service Fees
a('async function pageServiceFee(sess){');
a('  var r=await api("manageServiceFee",{});');
a('  var rows=r.msg||[];');
a('  var t=tblH(["ID","Name","Value","Type"],rows,function(x){return [esc(x.id||""),esc(x.name||""),esc(x.value||""),esc(x.type||"")];});');
a('  return layout(sess,"serviceFee","<div class=\\"page-hdr\\"><h1 class=\\"page-title\\">Service Fees</h1></div>"+t);');
a('}');
a('');

// Slider Images
a('async function pageSliderImages(sess){');
a('  var r=await api("getAppSliderImages",{});');
a('  var rows=(r.msg||[]).map(function(x){return x.AppSlider||x;});');
a('  var t=tblH(["ID","URL"],rows,function(x){return [esc(x.id||""),esc(x.url||"")];});');
a('  return layout(sess,"sliderImages","<div class=\\"page-hdr\\"><h1 class=\\"page-title\\">Slider Images</h1></div>"+t);');
a('}');
a('');

// Report Reasons
a('async function pageReportReasons(sess){');
a('  var r=await api("manageReportReasons",{});');
a('  var rows=r.msg||[];');
a('  var t=tblH(["ID","Reason"],rows,function(x){return [esc(x.id||""),esc(x.title||"")];});');
a('  return layout(sess,"reportReasons","<div class=\\"page-hdr\\"><h1 class=\\"page-title\\">Report Reasons</h1></div>"+t);');
a('}');
a('');

// Policies
a('async function pagePolicies(sess){');
a('  var names=["privacy_policy","terms_and_conditions","about_us"];');
a('  var blocks=await Promise.all(names.map(async function(n){');
a('    var r=await api("getHtmlPage",{name:n});');
a('    var d=r.msg||{};');
a('    var title=n.replace(/_/g," ").replace(/\\b\\w/g,function(c){return c.toUpperCase();});');
a('    return "<div class=\\"card\\" style=\\"padding:20px\\"><h3 style=\\"font-size:15px;font-weight:600;margin:0 0 8px\\">"+esc(title)+"</h3><div style=\\"font-size:13px;color:#6d7175\\">"+(d.text||"No content set.")+"</div></div>";');
a('  }));');
a('  return layout(sess,"policies","<div class=\\"page-hdr\\"><h1 class=\\"page-title\\">Policies</h1></div>"+blocks.join(""));');
a('}');
a('');

// Admin Users
a('async function pageAdminUsers(sess){');
a('  var r=await api("getAdminUsers",{});');
a('  var rows=(r.msg||[]).map(function(x){return x.User||x;});');
a('  var t=tblH(["ID","Name","Email","Role","Joined"],rows,function(u){');
a('    return ["<code>"+esc((u.id||u.userId||"").slice(0,8))+"...</code>",esc((u.first_name||"")+" "+(u.last_name||"")),esc(u.email||""),"<span class=\\"badge badge-blue\\">"+esc(u.role||"admin")+"</span>",fmt(u.created)];');
a('  });');
a('  return layout(sess,"adminUsers","<div class=\\"page-hdr\\"><h1 class=\\"page-title\\">Admin Users</h1></div>"+t);');
a('}');
a('');

// Settings page
a('function pageSetting(sess){');
a('  var c="<div class=\\"card\\" style=\\"padding:20px\\"><ul style=\\"list-style:none;padding:0;margin:0;display:flex;flex-wrap:wrap\\">"');
a('    +"<li style=\\"width:32%\\"><a href=\\"?p=changePassword\\" style=\\"display:flex;align-items:center;padding:16px;text-decoration:none;color:#919eab\\">"');
a('    +"<div style=\\"width:40px;height:40px;background:#f4f6f8;border-radius:3px;display:flex;align-items:center;justify-content:center;margin-right:12px\\">"');
a('    +"<i class=\\"fas fa-key\\" style=\\"color:#919eab\\"></i></div>"');
a('    +"<div><h2 style=\\"font-size:14px;margin:0;color:#0070b6;font-weight:600\\">Change Password</h2>"');
a('    +"<p style=\\"margin:0;font-size:13px\\">Update your security details</p></div></a></li>"');
a('    +"</ul></div>";');
a('  return layout(sess,"setting","<div class=\\"page-hdr\\"><h1 class=\\"page-title\\">Settings</h1></div>"+c);');
a('}');
a('');

// Main Lambda handler
a('exports.handler = async function(event){');
a('  var path=getPath(event);');
a('  var query=gq(event);');
a('  var cookie=(event.headers||{}).cookie||(event.headers||{}).Cookie||"";');
a('  var sess=getSession(cookie);');
a('');
a('  // OPTIONS preflight');
a('  if((event.requestContext&&event.requestContext.http&&event.requestContext.http.method==="OPTIONS")||event.httpMethod==="OPTIONS"){');
a('    return{statusCode:200,headers:{"Access-Control-Allow-Origin":"*"},body:""};');
a('  }');
a('');
a('  // Logout');
a('  if(query.action==="logout"){');
a('    if(sess){var sk=cookie.split(";").map(function(c){return c.trim();}).find(function(c){return c.indexOf("sid=")===0;});if(sk)delete sessions[sk.slice(4)];}');
a('    return redir("?","sid=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT");');
a('  }');
a('');
a('  // Login POST');
a('  if(query.action==="login"){');
a('    var body=await parseBody(event);');
a('    var r=await api("loginVendor",{email:body.email,password:body.password});');
a('    if(r.code==="200"){');
a('      var u=r.msg.User||r.msg;');
a('      var id=sid();');
a('      sessions[id]={userId:u.userId||u.id,first_name:u.first_name||"Admin",last_name:u.last_name||"",email:u.email||"",role:u.role||"admin"};');
a('      return redir("?p=dashboard",setCookie(id));');
a('    }');
a('    return H(200,loginPage("Invalid email or password"));');
a('  }');
a('');
a('  // Not logged in');
a('  if(!sess) return H(200,loginPage(""));');
a('');
a('  // Route');
a('  var p=query.p||"dashboard";');
a('  try{');
a('    if(p==="dashboard")    return H(200,await pageDashboard(sess));');
a('    if(p==="users")        return H(200,await pageUsers(sess));');
a('    if(p==="riders")       return H(200,await pageRiders(sess));');
a('    if(p==="restaurants")  return H(200,await pageRestaurants(sess));');
a('    if(p==="foodOrders")   return H(200,await pageFoodOrders(sess));');
a('    if(p==="trips")        return H(200,await pageTrips(sess));');
a('    if(p==="parcelOrders") return H(200,await pageParcelOrders(sess));');
a('    if(p==="foodCategory") return H(200,await pageFoodCategory(sess));');
a('    if(p==="rideTypes")    return H(200,await pageRideTypes(sess));');
a('    if(p==="packageSize")  return H(200,await pagePackageSize(sess));');
a('    if(p==="goodType")     return H(200,await pageGoodType(sess));');
a('    if(p==="coupons")      return H(200,await pageCoupons(sess));');
a('    if(p==="serviceFee")   return H(200,await pageServiceFee(sess));');
a('    if(p==="sliderImages") return H(200,await pageSliderImages(sess));');
a('    if(p==="reportReasons")return H(200,await pageReportReasons(sess));');
a('    if(p==="policies")     return H(200,await pagePolicies(sess));');
a('    if(p==="adminUsers")   return H(200,await pageAdminUsers(sess));');
a('    if(p==="setting")      return H(200,pageSetting(sess));');
a('    return redir("?p=dashboard");');
a('  }catch(err){');
a('    console.error("[Admin Panel Error]",err);');
a('    return H(500,"<h1 style=\\"font-family:sans-serif;padding:40px\\">Server Error: "+esc(err.message)+"</h1>");');
a('  }');
a('};');
a('');
a("process.stdout.write('index.js complete: '+require('fs').statSync(F).size+' bytes\\n');");
