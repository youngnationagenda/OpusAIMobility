// aimobility Admin Panel Lambda v2.0 - API Gateway + Lambda
const https=require("https"),url=require("url"),qs=require("querystring");
const API_BASE="https://pg4ulam66a.execute-api.us-east-1.amazonaws.com/prod/api/";
const API_KEY=process.env.API_KEY||"terraai-mobility-key-2024";
// ─── DynamoDB Session Store (persistent, multi-instance) ────────────────────
const { DynamoDBClient }=require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient,GetCommand,PutCommand,DeleteCommand }=require('@aws-sdk/lib-dynamodb');
const _ddbClient=new DynamoDBClient({region:process.env.AWS_REGION||'us-east-1'});
const _ddb=DynamoDBDocumentClient.from(_ddbClient);
const SESSION_TABLE='aimobility-sessions';
const SESSION_TTL_HOURS=12;

function sid(){return Math.random().toString(36).slice(2)+Date.now().toString(36)+Math.random().toString(36).slice(2);}

async function getSession(cookie){
  try{
    var m=(cookie||'').split(';').map(function(x){return x.trim();}).find(function(x){return x.indexOf('sid=')===0;});
    if(!m)return null;
    var sessionId=m.slice(4);
    if(!sessionId)return null;
    var r=await _ddb.send(new GetCommand({TableName:SESSION_TABLE,Key:{sessionId:sessionId}}));
    var item=r.Item;
    if(!item)return null;
    // Check TTL manually (belt-and-suspenders)
    if(item.ttl && item.ttl < Math.floor(Date.now()/1000))return null;
    return item.data||null;
  }catch(e){
    console.error('[Session] getSession error:',e.message);
    return null;
  }
}

async function saveSession(sessionId,data){
  try{
    var ttl=Math.floor(Date.now()/1000)+(SESSION_TTL_HOURS*3600);
    await _ddb.send(new PutCommand({
      TableName:SESSION_TABLE,
      Item:{sessionId:sessionId,data:data,ttl:ttl,created:new Date().toISOString()}
    }));
  }catch(e){
    console.error('[Session] saveSession error:',e.message);
  }
}

async function deleteSession(cookie){
  try{
    var m=(cookie||'').split(';').map(function(x){return x.trim();}).find(function(x){return x.indexOf('sid=')===0;});
    if(!m)return;
    var sessionId=m.slice(4);
    await _ddb.send(new DeleteCommand({TableName:SESSION_TABLE,Key:{sessionId:sessionId}}));
  }catch(e){
    console.error('[Session] deleteSession error:',e.message);
  }
}

function setCookie(id){return 'sid='+id+'; Path=/; HttpOnly; SameSite=Lax; Max-Age='+SESSION_TTL_HOURS*3600;}

function api(ep,data){
  return new Promise(function(resolve){
    var body=JSON.stringify(data||{});
    var u=url.parse(API_BASE+ep);
    var req=https.request(
      {hostname:u.hostname,path:u.pathname,method:'POST',
       headers:{'Content-Type':'application/json','Content-Length':Buffer.byteLength(body),'api-key':API_KEY}},
      function(res){var raw='';res.on('data',function(d){raw+=d;});res.on('end',function(){try{resolve(JSON.parse(raw));}catch(e){resolve({code:'500',msg:'err'});}});}
    );
    req.on('error',function(e){resolve({code:'500',msg:e.message});});
    req.write(body);req.end();
  });
}

function parseBody(ev){
  var b=ev.body||'';
  if(ev.isBase64Encoded)return qs.parse(Buffer.from(b,'base64').toString());
  var ct=((ev.headers||{})['content-type']||(ev.headers||{})['Content-Type']||'').toLowerCase();
  if(ct.indexOf('json')!==-1){try{return JSON.parse(b);}catch(e){return{};}}
  return qs.parse(b);
}

function getPath(e){var p=e.rawPath||e.path||(e.pathParameters&&e.pathParameters.proxy?'/'+e.pathParameters.proxy:'/');return p.replace(/\/prod/,'');}
function gq(e){return e.queryStringParameters||{};}
function H(c,b){return{statusCode:c,headers:{'Content-Type':'text/html;charset=utf-8'},body:b};}
function redir(l,k){var h={Location:l};if(k)h['Set-Cookie']=k;return{statusCode:302,headers:h,body:'',cookies:k?[k]:[]};}
function esc(s){if(!s&&s!==0)return'';var r=String(s),o='';for(var i=0;i<r.length;i++){var c=r.charCodeAt(i);if(c===38)o+='&amp;';else if(c===60)o+='&lt;';else if(c===62)o+='&gt;';else o+=r[i];}return o;}
function fmt(d){if(!d)return'-';try{return new Date(d).toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'});}catch(e){return d;}}

var CSS='';
CSS+='body{margin:0;padding:0;font-family:Poppins,sans-serif;background:#f6f6f7}';
CSS+='.login-wrap{background:#084c3f;min-height:100vh;display:flex;align-items:center;justify-content:center}';
CSS+='.login-box{width:440px;background:#fff;border-radius:8px;padding:48px 40px 32px}';
CSS+='.form-field{border:1px solid #6d7175;border-radius:3px;position:relative;margin-bottom:14px}';
CSS+='.form-field label{position:absolute;top:6px;left:12px;font-size:11px;color:#6f7287;pointer-events:none}';
CSS+='.form-field input{border:none;outline:none;font-size:14px;padding:20px 12px 6px;color:#39364f;width:calc(100% - 24px);background:transparent}';
CSS+='.submit-btn{background:rgba(0,128,96,1);color:#fff;border:none;border-radius:4px;padding:14px;font-size:15px;font-weight:600;cursor:pointer;width:100%}';
CSS+='.err-box{background:#fff5f5;border:1px solid #fecaca;border-radius:4px;padding:10px 14px;font-size:13px;color:#7f1d1d;margin-bottom:14px}';
CSS+='.hdr{position:fixed;top:0;left:0;right:0;height:56px;background:#fff;border-bottom:1px solid #dee2e6;z-index:200;display:flex;align-items:center;padding:0 20px;justify-content:space-between}';
CSS+='.hdr-right{display:flex;align-items:center;gap:12px}';
CSS+='.avatar{width:32px;height:32px;border-radius:50%;background:rgb(253,201,208);color:rgb(79,41,31);display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:600}';
CSS+='.hdr-name{font-size:14px;font-weight:500}';
CSS+='.logout-a{font-size:13px;color:#6d7175;text-decoration:none;border:1px solid #dee2e6;padding:4px 12px;border-radius:4px}';
CSS+='.sidebar{position:fixed;top:56px;left:0;bottom:0;width:228px;background:#fff;border-right:1px solid #dee2e6;overflow-y:auto;padding:10px 0;z-index:100}';
CSS+='.sidebar ul{list-style:none;margin:0;padding:0}';
CSS+='.sidebar li a{display:flex;align-items:center;padding:7px 14px;font-size:13.5px;color:#202223;text-decoration:none;gap:9px;margin:1px 6px;border-radius:4px}';
CSS+='.sidebar li a:hover{background:#f1f2f3}';
CSS+='.sidebar li a.active{background:#edeeef;color:rgba(0,123,92,1)}';
CSS+='.sidebar li a i{color:#5c5f62;font-size:14px;width:16px}';
CSS+='.main{padding-top:56px;padding-left:228px;min-height:100vh}';
CSS+='.page{padding:24px 32px}';
CSS+='.page-hdr{display:flex;align-items:center;justify-content:space-between;margin-bottom:20px}';
CSS+='.page-title{font-size:20px;font-weight:600;margin:0}';
CSS+='.card{background:#fff;border:1px solid #dee2e6;border-radius:6px;overflow:hidden;margin-bottom:20px}';
CSS+='table.tbl{width:100%;border-collapse:collapse}';
CSS+='table.tbl th{font-size:13px;font-weight:600;padding:12px 16px;border-bottom:1px solid #dee2e6;text-align:left;background:#f9fafb}';
CSS+='table.tbl td{font-size:13px;padding:12px 16px;border-bottom:1px solid #dee2e6}';
CSS+='table.tbl tbody tr:hover{background:#fafafa}';
CSS+='.badge{border-radius:100px;padding:2px 10px;font-size:12px;display:inline-block}';
CSS+='.badge-green{background:rgb(174,233,209);color:#166534}';
CSS+='.badge-gray{background:rgb(242,242,242);color:#374151}';
CSS+='.badge-red{background:rgb(251,230,233);color:#7f1d1d}';
CSS+='.badge-blue{background:#dbeafe;color:#1e40af}';
CSS+='.empty{text-align:center;padding:48px;color:#9ca3af;font-size:14px}';
CSS+='.notice{background:#f0fdf4;border:1px solid #bbf7d0;border-radius:6px;padding:12px 16px;font-size:13px;color:#166534;margin-bottom:16px}';
CSS+='.notice-err{background:#fff5f5;border-color:#fecaca;color:#7f1d1d}';
CSS+='.domain-badge{background:#084c3f;color:#fff;font-size:11px;padding:2px 8px;border-radius:100px;font-family:monospace}';

var LOGO='<svg width="150" height="36" viewBox="0 0 150 36"><rect width="150" height="36" rx="5" fill="#084c3f"/><text x="12" y="24" font-family="Poppins,sans-serif" font-size="15" font-weight="600" fill="#fff">aimobility</text></svg>';
var BS='';
var BSCSS='<link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/4.5.2/css/bootstrap.min.css">';
var FA='<link rel="stylesheet" href="https://pro.fontawesome.com/releases/v5.10.0/css/all.css" integrity="sha384-AYmEC3Yw5cVb3ZcuHtOA93w35dYTsvhLPVnYs9eStHfGJvOvKxVfELGroGkvsg+p" crossorigin="anonymous">';

function head(t){
  return '<!DOCTYPE html><html lang=en><head><meta charset=UTF-8><meta name=viewport content="width=device-width,initial-scale=1">'
    +'<link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap" rel=stylesheet>'
    +BSCSS+FA
    +'<title>'+esc(t)+' | aimobility Admin</title><style>'+CSS+'</style></head>';
}

var NAV=[
  ['dashboard','fa-tachometer-alt','Dashboard'],
  ['users','fa-users','Users'],
  ['riders','fa-motorcycle','Riders'],
  ['restaurants','fa-store','Restaurants'],
  ['foodOrders','fa-shopping-bag','Food Orders'],
  ['trips','fa-car','Trip Requests'],
  ['parcelOrders','fa-box','Parcel Orders'],
  ['foodCategory','fa-tag','Food Categories'],
  ['rideTypes','fa-car-side','Ride Types'],
  ['packageSize','fa-cube','Package Sizes'],
  ['goodType','fa-boxes','Good Types'],
  ['coupons','fa-ticket-alt','Coupons'],
  ['serviceFee','fa-percent','Service Fees'],
  ['sliderImages','fa-images','Slider Images'],
  ['reportReasons','fa-flag','Report Reasons'],
  ['policies','fa-file-alt','Policies'],
  ['adminUsers','fa-user-shield','Admin Users']
];

function layout(sess,page,content,flash){
  var fn=sess.first_name||'Admin',ln=sess.last_name||'';
  var ini=(fn[0]||'A').toUpperCase()+(ln[0]||'').toUpperCase();
  var navHtml=NAV.map(function(n){
    return '<li><a href="?p='+n[0]+'" class="'+(page===n[0]?'active':'')+'"><i class="fas '+n[1]+'"></i>'+esc(n[2])+'</a></li>';
  }).join('');
  var fh=flash?'<div class="notice'+(flash.t?'':'-err')+'">'+esc(flash.m||'')+'</div>':'';
  return head(page)+'<body>'
    +'<div class="hdr"><a href="?p=dashboard">'+LOGO+'</a>'
    +'<div class="hdr-right"><div class="avatar">'+esc(ini)+'</div>'
    +'<span class="hdr-name">'+esc(fn)+' '+esc(ln)+'</span>'
    +'<a href="?action=logout" class="logout-a">Logout</a></div></div>'
    +'<div class="sidebar"><ul>'+navHtml+'</ul></div>'
    +'<div class="main"><div class="page">'+fh+content+'</div></div>'
    +BS+'</body></html>';
}

function loginPage(err){
  var e=err?'<div class="err-box">'+esc(err)+'</div>':'';
  return head('Login')+'<body>'
    +'<div class="login-wrap"><div class="login-box">'
    +LOGO
    +'<h1 style="font-size:22px;font-weight:500;margin:0 0 4px">Log in</h1>'
    +'<p style="color:#6d7175;font-size:14px;margin:0 0 20px">Continue to aimobility Admin</p>'
    +e
    +'<form method="POST" action="?action=login">'
    +'<div class="form-field"><label>Email</label><input type="email" name="email" required></div>'
    +'<div class="form-field"><label>Password</label><input type="password" name="password" required></div>'
    +'<button class="submit-btn" type="submit">Log in</button>'
    +'</form></div></div>'+BS+'</body></html>';
}

function tblH(cols,rows,mapFn){
  var th=cols.map(function(c){return '<th>'+esc(c)+'</th>';}).join('');
  var tb=rows.length?rows.map(function(r){
    var cells=mapFn(r);
    return '<tr>'+cells.map(function(c){return '<td>'+c+'</td>';}).join('')+'</tr>';
  }).join('')
  :'<tr><td colspan="'+cols.length+'" style="text-align:center;padding:40px;color:#9ca3af">No data found</td></tr>';
  return '<div class="card"><table class="tbl"><thead><tr>'+th+'</tr></thead><tbody>'+tb+'</tbody></table></div>';
}

async function pageDashboard(sess){
  var r=await api("dashboardData",{});
  var d=r.msg||{};
  var stats=[
    ["fa-users","Users",d.total_users||0,"#166534"],
    ["fa-motorcycle","Riders",d.total_drivers||0,"#1e40af"],
    ["fa-car","Trips",d.total_trips||0,"#7c3aed"],
    ["fa-shopping-bag","Food Orders",d.total_food_orders||0,"#b45309"],
    ["fa-box","Parcel Orders",d.total_parcel_orders||0,"#0e7490"],
    ["fa-store","Restaurants",d.total_restaurants||0,"#065f46"]
  ];
  var cards=stats.map(function(s){
    return "<div style=\"background:#fff;border:1px solid #dee2e6;border-radius:8px;padding:20px;text-align:center\">"
      +"<div style=\"font-size:22px;color:"+s[3]+"\"><i class=\"fas "+s[0]+"\"></i></div>"
      +"<div style=\"font-size:36px;font-weight:700;color:"+s[3]+";margin:4px 0\">"+s[2]+"</div>"
      +"<p style=\"font-size:13px;color:#6d7175;margin:0\">"+s[1]+"</p></div>";
  }).join("");
  var grid="<div style=\"display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:16px;margin-bottom:24px\">"+cards+"</div>";
  return layout(sess,"dashboard","<div class=\"page-hdr\"><h1 class=\"page-title\">Dashboard</h1></div>"+grid);
}

function userRows(rows){
  return tblH(["ID","Name","Email","Phone","Role","Joined"],rows,function(u){
    return [
      "<code>"+esc((u.id||u.userId||"").slice(0,8))+"...</code>",
      esc((u.first_name||"")+" "+(u.last_name||"")),
      esc(u.email||""),esc(u.phone||""),
      "<span class=\"badge badge-blue\">"+esc(u.role||"user")+"</span>",
      fmt(u.created)
    ];
  });
}

async function pageUsers(sess){
  var r=await api("getAllUsers",{});
  var rows=(r.msg||[]).map(function(x){return x.User||x;});
  return layout(sess,"users","<div class=\"page-hdr\"><h1 class=\"page-title\">Users ("+rows.length+")</h1></div>"+userRows(rows));
}

async function pageRiders(sess){
  var r=await api("getAllRiders",{});
  var rows=(r.msg||[]).map(function(x){return x.User||x;});
  var t=tblH(["ID","Name","Email","Phone","Joined"],rows,function(u){
    return ["<code>"+esc((u.id||u.userId||u.driverId||"").slice(0,8))+"...</code>",esc((u.first_name||"")+" "+(u.last_name||"")),esc(u.email||""),esc(u.phone||""),fmt(u.created)];
  });
  return layout(sess,"riders","<div class=\"page-hdr\"><h1 class=\"page-title\">Riders ("+rows.length+")</h1></div>"+t);
}

async function pageRestaurants(sess){
  var r=await api("getRestaurants",{});
  var rows=(r.msg||[]).map(function(x){return x.Restaurant||x;});
  var t=tblH(["ID","Name","Min Order","Delivery Fee","Rating","Status","Created"],rows,function(x){
    return ["<code>"+esc((x.id||x.restaurantId||"").slice(0,8))+"...</code>",esc(x.name||""),esc(x.min_order_price||""),esc(x.delivery_fee||""),
      "<span class=\"badge badge-green\">"+esc(x.rating||"4.0")+"</span>",
      x.is_open?"<span class=\"badge badge-green\">Open</span>":"<span class=\"badge badge-gray\">Closed</span>",fmt(x.created)];
  });
  return layout(sess,"restaurants","<div class=\"page-hdr\"><h1 class=\"page-title\">Restaurants ("+rows.length+")</h1></div>"+t);
}

async function pageFoodOrders(sess){
  var r=await api("showFoodOrders",{});
  var rows=r.msg||[];
  var smap={"0":"<span class=\"badge badge-gray\">Pending</span>","1":"<span class=\"badge badge-blue\">Active</span>","2":"<span class=\"badge badge-green\">Completed</span>","3":"<span class=\"badge badge-red\">Cancelled</span>"};
  var t=tblH(["Order ID","User","Restaurant","Total","Status","Created"],rows,function(o){
    return ["<code>"+esc((o.orderId||o.id||"").slice(0,8))+"...</code>",esc(o.user_id||o.userId||""),esc(o.restaurant_id||""),esc(o.total_price||o.price||""),smap[o.status]||("<span class=\"badge badge-gray\">"+esc(o.status||"")+"</span>"),fmt(o.created)];
  });
  return layout(sess,"foodOrders","<div class=\"page-hdr\"><h1 class=\"page-title\">Food Orders ("+rows.length+")</h1></div>"+t);
}

async function pageTrips(sess){
  var r=await api("tripRequest",{});
  var rows=r.msg||[];
  var t=tblH(["Ride ID","User","Pickup","Dropoff","Fare","Status","Created"],rows,function(x){
    return ["<code>"+esc((x.rideId||x.id||"").slice(0,8))+"...</code>",esc(x.userId||x.user_id||""),esc(x.pickup||""),esc(x.dropoff||""),esc(x.fare||""),"<span class=\"badge badge-gray\">"+esc(x.status||"pending")+"</span>",fmt(x.created)];
  });
  return layout(sess,"trips","<div class=\"page-hdr\"><h1 class=\"page-title\">Trip Requests ("+rows.length+")</h1></div>"+t);
}

async function pageParcelOrders(sess){
  var r=await api("showParcelOrders",{});
  var rows=r.msg||[];
  var t=tblH(["Order ID","User","Total","Status","Created"],rows,function(o){
    return ["<code>"+esc((o.orderId||o.id||"").slice(0,8))+"...</code>",esc(o.userId||o.user_id||""),esc(o.total_price||""),"<span class=\"badge badge-gray\">"+esc(o.status||"pending")+"</span>",fmt(o.created)];
  });
  return layout(sess,"parcelOrders","<div class=\"page-hdr\"><h1 class=\"page-title\">Parcel Orders ("+rows.length+")</h1></div>"+t);
}

async function pageFoodCategory(sess){
  var r=await api("getFoodCategories",{});
  var rows=(r.msg||[]).map(function(x){return x.FoodCategory||x;});
  var t=tblH(["ID","Title"],rows,function(x){return [esc(x.id||""),esc(x.title||"")];});
  return layout(sess,"foodCategory","<div class=\"page-hdr\"><h1 class=\"page-title\">Food Categories</h1></div>"+t);
}

async function pageRideTypes(sess){
  var r=await api("getRideTypes",{});
  var rows=r.msg||[];
  var t=tblH(["ID","Name","Description","Base Fare","Per Min","Per KM","Capacity"],rows,function(x){
    return [esc(x.id||""),esc(x.name||""),esc(x.description||""),esc(x.base_fare||""),esc(x.cost_per_minute||""),esc(x.cost_per_distance||""),esc(x.passenger_capacity||"")];
  });
  return layout(sess,"rideTypes","<div class=\"page-hdr\"><h1 class=\"page-title\">Ride Types</h1></div>"+t);
}

async function pagePackageSize(sess){
  var r=await api("getPackageSizes",{});
  var rows=(r.msg||[]).map(function(x){return x.PackageSize||x;});
  var t=tblH(["ID","Title","Description","Price"],rows,function(x){return [esc(x.id||""),esc(x.title||""),esc(x.description||""),esc(x.price||"")];});
  return layout(sess,"packageSize","<div class=\"page-hdr\"><h1 class=\"page-title\">Package Sizes</h1></div>"+t);
}

async function pageGoodType(sess){
  var r=await api("getGoodTypes",{});
  var rows=(r.msg||[]).map(function(x){return x.GoodType||x;});
  var t=tblH(["ID","Name"],rows,function(x){return [esc(x.id||""),esc(x.name||"")];});
  return layout(sess,"goodType","<div class=\"page-hdr\"><h1 class=\"page-title\">Good Types</h1></div>"+t);
}

async function pageCoupons(sess){
  var r=await api("manageCoupon",{});
  var rows=r.msg||[];
  var t=tblH(["ID","Code","Discount %","User Limit","Expiry"],rows,function(x){
    return [esc(x.id||""),"<strong>"+esc(x.coupon_code||"")+"</strong>",esc(x.discount||""),esc(x.limit_users||""),esc(x.expiry_date||"")];
  });
  return layout(sess,"coupons","<div class=\"page-hdr\"><h1 class=\"page-title\">Coupons</h1></div>"+t);
}

async function pageServiceFee(sess){
  var r=await api("manageServiceFee",{});
  var rows=r.msg||[];
  var t=tblH(["ID","Name","Value","Type"],rows,function(x){return [esc(x.id||""),esc(x.name||""),esc(x.value||""),esc(x.type||"")];});
  return layout(sess,"serviceFee","<div class=\"page-hdr\"><h1 class=\"page-title\">Service Fees</h1></div>"+t);
}

async function pageSliderImages(sess){
  var r=await api("getAppSliderImages",{});
  var rows=(r.msg||[]).map(function(x){return x.AppSlider||x;});
  var t=tblH(["ID","URL"],rows,function(x){return [esc(x.id||""),esc(x.url||"")];});
  return layout(sess,"sliderImages","<div class=\"page-hdr\"><h1 class=\"page-title\">Slider Images</h1></div>"+t);
}

async function pageReportReasons(sess){
  var r=await api("manageReportReasons",{});
  var rows=r.msg||[];
  var t=tblH(["ID","Reason"],rows,function(x){return [esc(x.id||""),esc(x.title||"")];});
  return layout(sess,"reportReasons","<div class=\"page-hdr\"><h1 class=\"page-title\">Report Reasons</h1></div>"+t);
}

async function pagePolicies(sess){
  var names=["privacy_policy","terms_and_conditions","about_us"];
  var blocks=await Promise.all(names.map(async function(n){
    var r=await api("getHtmlPage",{name:n});
    var d=r.msg||{};
    var title=n.replace(/_/g," ").replace(/\b\w/g,function(c){return c.toUpperCase();});
    return "<div class=\"card\" style=\"padding:20px\"><h3 style=\"font-size:15px;font-weight:600;margin:0 0 8px\">"+esc(title)+"</h3><div style=\"font-size:13px;color:#6d7175\">"+(d.text||"No content set.")+"</div></div>";
  }));
  return layout(sess,"policies","<div class=\"page-hdr\"><h1 class=\"page-title\">Policies</h1></div>"+blocks.join(""));
}

async function pageAdminUsers(sess){
  var r=await api("getAdminUsers",{});
  var rows=(r.msg||[]).map(function(x){return x.User||x;});
  var t=tblH(["ID","Name","Email","Role","Joined"],rows,function(u){
    return ["<code>"+esc((u.id||u.userId||"").slice(0,8))+"...</code>",esc((u.first_name||"")+" "+(u.last_name||"")),esc(u.email||""),"<span class=\"badge badge-blue\">"+esc(u.role||"admin")+"</span>",fmt(u.created)];
  });
  return layout(sess,"adminUsers","<div class=\"page-hdr\"><h1 class=\"page-title\">Admin Users</h1></div>"+t);
}

function pageSetting(sess){
  var c="<div class=\"card\" style=\"padding:20px\"><ul style=\"list-style:none;padding:0;margin:0;display:flex;flex-wrap:wrap\">"
    +"<li style=\"width:32%\"><a href=\"?p=changePassword\" style=\"display:flex;align-items:center;padding:16px;text-decoration:none;color:#919eab\">"
    +"<div style=\"width:40px;height:40px;background:#f4f6f8;border-radius:3px;display:flex;align-items:center;justify-content:center;margin-right:12px\">"
    +"<i class=\"fas fa-key\" style=\"color:#919eab\"></i></div>"
    +"<div><h2 style=\"font-size:14px;margin:0;color:#0070b6;font-weight:600\">Change Password</h2>"
    +"<p style=\"margin:0;font-size:13px\">Update your security details</p></div></a></li>"
    +"</ul></div>";
  return layout(sess,"setting","<div class=\"page-hdr\"><h1 class=\"page-title\">Settings</h1></div>"+c);
}

exports.handler = async function(event){
  var path=getPath(event);
  var query=gq(event);
  // API Gateway HTTP API v2 sends cookies in event.cookies[] array
var cookie="";
if(event.cookies&&Array.isArray(event.cookies)&&event.cookies.length){
  cookie=event.cookies.join("; ");
}else{
  cookie=(event.headers||{}).cookie||(event.headers||{}).Cookie||"";
}
  var sess=await getSession(cookie);

  // OPTIONS preflight
  if((event.requestContext&&event.requestContext.http&&event.requestContext.http.method==="OPTIONS")||event.httpMethod==="OPTIONS"){
    return{statusCode:200,headers:{"Access-Control-Allow-Origin":"*"},body:""};
  }

  // Logout
  if(query.action==="logout"){
    await deleteSession(cookie);
    return redir("?","sid=; Path=/; HttpOnly; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Max-Age=0");
  }

  // Login POST
  if(query.action==="login"){
    var body=await parseBody(event);
    var r=await api("loginVendor",{email:body.email,password:body.password});
    if(r.code==="200"){
      var u=r.msg.User||r.msg;
      var id=sid();
      await saveSession(id,{userId:u.userId||u.id,first_name:u.first_name||"Admin",last_name:u.last_name||"",email:u.email||"",role:u.role||"admin"});
      return redir("?p=dashboard",setCookie(id));
    }
    return H(200,loginPage("Invalid email or password"));
  }

  // Not logged in
  if(!sess) return H(200,loginPage(""));

  // Route
  var p=query.p||"dashboard";
  try{
    if(p==="dashboard")    return H(200,await pageDashboard(sess));
    if(p==="users")        return H(200,await pageUsers(sess));
    if(p==="riders")       return H(200,await pageRiders(sess));
    if(p==="restaurants")  return H(200,await pageRestaurants(sess));
    if(p==="foodOrders")   return H(200,await pageFoodOrders(sess));
    if(p==="trips")        return H(200,await pageTrips(sess));
    if(p==="parcelOrders") return H(200,await pageParcelOrders(sess));
    if(p==="foodCategory") return H(200,await pageFoodCategory(sess));
    if(p==="rideTypes")    return H(200,await pageRideTypes(sess));
    if(p==="packageSize")  return H(200,await pagePackageSize(sess));
    if(p==="goodType")     return H(200,await pageGoodType(sess));
    if(p==="coupons")      return H(200,await pageCoupons(sess));
    if(p==="serviceFee")   return H(200,await pageServiceFee(sess));
    if(p==="sliderImages") return H(200,await pageSliderImages(sess));
    if(p==="reportReasons")return H(200,await pageReportReasons(sess));
    if(p==="policies")     return H(200,await pagePolicies(sess));
    if(p==="adminUsers")   return H(200,await pageAdminUsers(sess));
    if(p==="setting")      return H(200,pageSetting(sess));
    return redir("?p=dashboard");
  }catch(err){
    console.error("[Admin Panel Error]",err);
    return H(500,"<h1 style=\"font-family:sans-serif;padding:40px\">Server Error: "+esc(err.message)+"</h1>");
  }
};

