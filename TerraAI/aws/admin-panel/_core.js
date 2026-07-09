const fs = require('fs');
const F = 'aws/admin-panel/index.js';
const a = s => fs.appendFileSync(F, Buffer.from(s + '\n'));

// Session helpers
a("function sid(){return Math.random().toString(36).slice(2)+Date.now().toString(36);}");
a("function getSession(c){var m=(c||'').split(';').map(function(x){return x.trim();}).find(function(x){return x.indexOf('sid=')===0;});return m?sessions[m.slice(4)]||null:null;}");
a("function setCookie(id){return 'sid='+id+'; Path=/; HttpOnly; SameSite=Lax';}");
a('');

// API helper
a("function api(ep,data){");
a("  return new Promise(function(resolve){");
a("    var body=JSON.stringify(data||{});");
a("    var u=url.parse(API_BASE+ep);");
a("    var req=https.request(");
a("      {hostname:u.hostname,path:u.pathname,method:'POST',");
a("       headers:{'Content-Type':'application/json','Content-Length':Buffer.byteLength(body),'api-key':API_KEY}},");
a("      function(res){var raw='';res.on('data',function(d){raw+=d;});res.on('end',function(){try{resolve(JSON.parse(raw));}catch(e){resolve({code:'500',msg:'err'});}});}");
a("    );");
a("    req.on('error',function(e){resolve({code:'500',msg:e.message});});");
a("    req.write(body);req.end();");
a("  });");
a("}");
a('');

// parseBody
a("function parseBody(ev){");
a("  var b=ev.body||'';");
a("  if(ev.isBase64Encoded)return qs.parse(Buffer.from(b,'base64').toString());");
a("  var ct=((ev.headers||{})['content-type']||(ev.headers||{})['Content-Type']||'').toLowerCase();");
a("  if(ct.indexOf('json')!==-1){try{return JSON.parse(b);}catch(e){return{};}}");
a("  return qs.parse(b);");
a("}");
a('');

// Path/query helpers
a("function getPath(e){var p=e.rawPath||e.path||(e.pathParameters&&e.pathParameters.proxy?'/'+e.pathParameters.proxy:'/');return p.replace(/\\/prod/,'');}");
a("function gq(e){return e.queryStringParameters||{};}");
a("function H(c,b){return{statusCode:c,headers:{'Content-Type':'text/html;charset=utf-8'},body:b};}");
a("function redir(l,k){var h={Location:l};if(k)h['Set-Cookie']=k;return{statusCode:302,headers:h,body:''};}");

// esc function - no literal & < > in object keys
a("function esc(s){if(!s&&s!==0)return'';var r=String(s),o='';for(var i=0;i<r.length;i++){var c=r.charCodeAt(i);if(c===38)o+='&amp;';else if(c===60)o+='&lt;';else if(c===62)o+='&gt;';else o+=r[i];}return o;}");
a("function fmt(d){if(!d)return'-';try{return new Date(d).toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'});}catch(e){return d;}}");
a('');

// CSS
a("var CSS='';");
a("CSS+='body{margin:0;padding:0;font-family:Poppins,sans-serif;background:#f6f6f7}';");
a("CSS+='.login-wrap{background:#084c3f;min-height:100vh;display:flex;align-items:center;justify-content:center}';");
a("CSS+='.login-box{width:440px;background:#fff;border-radius:8px;padding:48px 40px 32px}';");
a("CSS+='.form-field{border:1px solid #6d7175;border-radius:3px;position:relative;margin-bottom:14px}';");
a("CSS+='.form-field label{position:absolute;top:6px;left:12px;font-size:11px;color:#6f7287;pointer-events:none}';");
a("CSS+='.form-field input{border:none;outline:none;font-size:14px;padding:20px 12px 6px;color:#39364f;width:calc(100% - 24px);background:transparent}';");
a("CSS+='.submit-btn{background:rgba(0,128,96,1);color:#fff;border:none;border-radius:4px;padding:14px;font-size:15px;font-weight:600;cursor:pointer;width:100%}';");
a("CSS+='.err-box{background:#fff5f5;border:1px solid #fecaca;border-radius:4px;padding:10px 14px;font-size:13px;color:#7f1d1d;margin-bottom:14px}';");
a("CSS+='.hdr{position:fixed;top:0;left:0;right:0;height:56px;background:#fff;border-bottom:1px solid #dee2e6;z-index:200;display:flex;align-items:center;padding:0 20px;justify-content:space-between}';");
a("CSS+='.hdr-right{display:flex;align-items:center;gap:12px}';");
a("CSS+='.avatar{width:32px;height:32px;border-radius:50%;background:rgb(253,201,208);color:rgb(79,41,31);display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:600}';");
a("CSS+='.hdr-name{font-size:14px;font-weight:500}';");
a("CSS+='.logout-a{font-size:13px;color:#6d7175;text-decoration:none;border:1px solid #dee2e6;padding:4px 12px;border-radius:4px}';");
a("CSS+='.sidebar{position:fixed;top:56px;left:0;bottom:0;width:228px;background:#fff;border-right:1px solid #dee2e6;overflow-y:auto;padding:10px 0;z-index:100}';");
a("CSS+='.sidebar ul{list-style:none;margin:0;padding:0}';");
a("CSS+='.sidebar li a{display:flex;align-items:center;padding:7px 14px;font-size:13.5px;color:#202223;text-decoration:none;gap:9px;margin:1px 6px;border-radius:4px}';");
a("CSS+='.sidebar li a:hover{background:#f1f2f3}';");
a("CSS+='.sidebar li a.active{background:#edeeef;color:rgba(0,123,92,1)}';");
a("CSS+='.sidebar li a i{color:#5c5f62;font-size:14px;width:16px}';");
a("CSS+='.main{padding-top:56px;padding-left:228px;min-height:100vh}';");
a("CSS+='.page{padding:24px 32px}';");
a("CSS+='.page-hdr{display:flex;align-items:center;justify-content:space-between;margin-bottom:20px}';");
a("CSS+='.page-title{font-size:20px;font-weight:600;margin:0}';");
a("CSS+='.card{background:#fff;border:1px solid #dee2e6;border-radius:6px;overflow:hidden;margin-bottom:20px}';");
a("CSS+='table.tbl{width:100%;border-collapse:collapse}';");
a("CSS+='table.tbl th{font-size:13px;font-weight:600;padding:12px 16px;border-bottom:1px solid #dee2e6;text-align:left;background:#f9fafb}';");
a("CSS+='table.tbl td{font-size:13px;padding:12px 16px;border-bottom:1px solid #dee2e6}';");
a("CSS+='table.tbl tbody tr:hover{background:#fafafa}';");
a("CSS+='.badge{border-radius:100px;padding:2px 10px;font-size:12px;display:inline-block}';");
a("CSS+='.badge-green{background:rgb(174,233,209);color:#166534}';");
a("CSS+='.badge-gray{background:rgb(242,242,242);color:#374151}';");
a("CSS+='.badge-red{background:rgb(251,230,233);color:#7f1d1d}';");
a("CSS+='.badge-blue{background:#dbeafe;color:#1e40af}';");
a("CSS+='.empty{text-align:center;padding:48px;color:#9ca3af;font-size:14px}';");
a("CSS+='.notice{background:#f0fdf4;border:1px solid #bbf7d0;border-radius:6px;padding:12px 16px;font-size:13px;color:#166534;margin-bottom:16px}';");
a("CSS+='.notice-err{background:#fff5f5;border-color:#fecaca;color:#7f1d1d}';");
a('');

// HTML helpers
a("var LOGO='<svg width=\"150\" height=\"36\" viewBox=\"0 0 150 36\"><rect width=\"150\" height=\"36\" rx=\"5\" fill=\"#084c3f\"/><text x=\"12\" y=\"24\" font-family=\"Poppins,sans-serif\" font-size=\"15\" font-weight=\"600\" fill=\"#fff\">aimobility</text></svg>';");
a("var BS='';");
a("var BSCSS='<link rel=\"stylesheet\" href=\"https://maxcdn.bootstrapcdn.com/bootstrap/4.5.2/css/bootstrap.min.css\">';");
a("var FA='<link rel=\"stylesheet\" href=\"https://pro.fontawesome.com/releases/v5.10.0/css/all.css\" integrity=\"sha384-AYmEC3Yw5cVb3ZcuHtOA93w35dYTsvhLPVnYs9eStHfGJvOvKxVfELGroGkvsg+p\" crossorigin=\"anonymous\">';");
a('');

// head()
a("function head(t){");
a("  return '<!DOCTYPE html><html lang=en><head><meta charset=UTF-8><meta name=viewport content=\"width=device-width,initial-scale=1\">'");
a("    +'<link href=\"https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap\" rel=stylesheet>'");
a("    +BSCSS+FA");
a("    +'<title>'+esc(t)+' | aimobility Admin</title><style>'+CSS+'</style></head>';");
a("}");
a('');

// NAV
a("var NAV=[");
a("  ['dashboard','fa-tachometer-alt','Dashboard'],");
a("  ['users','fa-users','Users'],");
a("  ['riders','fa-motorcycle','Riders'],");
a("  ['restaurants','fa-store','Restaurants'],");
a("  ['foodOrders','fa-shopping-bag','Food Orders'],");
a("  ['trips','fa-car','Trip Requests'],");
a("  ['parcelOrders','fa-box','Parcel Orders'],");
a("  ['foodCategory','fa-tag','Food Categories'],");
a("  ['rideTypes','fa-car-side','Ride Types'],");
a("  ['packageSize','fa-cube','Package Sizes'],");
a("  ['goodType','fa-boxes','Good Types'],");
a("  ['coupons','fa-ticket-alt','Coupons'],");
a("  ['serviceFee','fa-percent','Service Fees'],");
a("  ['sliderImages','fa-images','Slider Images'],");
a("  ['reportReasons','fa-flag','Report Reasons'],");
a("  ['policies','fa-file-alt','Policies'],");
a("  ['adminUsers','fa-user-shield','Admin Users']");
a("];");
a('');

// layout()
a("function layout(sess,page,content,flash){");
a("  var fn=sess.first_name||'Admin',ln=sess.last_name||'';");
a("  var ini=(fn[0]||'A').toUpperCase()+(ln[0]||'').toUpperCase();");
a("  var navHtml=NAV.map(function(n){");
a("    return '<li><a href=\"?p='+n[0]+'\" class=\"'+(page===n[0]?'active':'')+'\"><i class=\"fas '+n[1]+'\"></i>'+esc(n[2])+'</a></li>';");
a("  }).join('');");
a("  var fh=flash?'<div class=\"notice'+(flash.t?'':'-err')+'\">'+esc(flash.m||'')+'</div>':'';");
a("  return head(page)+'<body>'");
a("    +'<div class=\"hdr\"><a href=\"?p=dashboard\">'+LOGO+'</a>'");
a("    +'<div class=\"hdr-right\"><div class=\"avatar\">'+esc(ini)+'</div>'");
a("    +'<span class=\"hdr-name\">'+esc(fn)+' '+esc(ln)+'</span>'");
a("    +'<a href=\"?action=logout\" class=\"logout-a\">Logout</a></div></div>'");
a("    +'<div class=\"sidebar\"><ul>'+navHtml+'</ul></div>'");
a("    +'<div class=\"main\"><div class=\"page\">'+fh+content+'</div></div>'");
a("    +BS+'</body></html>';");
a("}");
a('');

// loginPage()
a("function loginPage(err){");
a("  var e=err?'<div class=\"err-box\">'+esc(err)+'</div>':'';");
a("  return head('Login')+'<body>'");
a("    +'<div class=\"login-wrap\"><div class=\"login-box\">'");
a("    +LOGO");
a("    +'<h1 style=\"font-size:22px;font-weight:500;margin:0 0 4px\">Log in</h1>'");
a("    +'<p style=\"color:#6d7175;font-size:14px;margin:0 0 20px\">Continue to aimobility Admin</p>'");
a("    +e");
a("    +'<form method=\"POST\" action=\"?action=login\">'");
a("    +'<div class=\"form-field\"><label>Email</label><input type=\"email\" name=\"email\" required></div>'");
a("    +'<div class=\"form-field\"><label>Password</label><input type=\"password\" name=\"password\" required></div>'");
a("    +'<button class=\"submit-btn\" type=\"submit\">Log in</button>'");
a("    +'</form></div></div>'+BS+'</body></html>';");
a("}");
a('');

// tblH()
a("function tblH(cols,rows,mapFn){");
a("  var th=cols.map(function(c){return '<th>'+esc(c)+'</th>';}).join('');");
a("  var tb=rows.length?rows.map(function(r){");
a("    var cells=mapFn(r);");
a("    return '<tr>'+cells.map(function(c){return '<td>'+c+'</td>';}).join('')+'</tr>';");
a("  }).join('')");
a("  :'<tr><td colspan=\"'+cols.length+'\" style=\"text-align:center;padding:40px;color:#9ca3af\">No data found</td></tr>';");
a("  return '<div class=\"card\"><table class=\"tbl\"><thead><tr>'+th+'</tr></thead><tbody>'+tb+'</tbody></table></div>';");
a("}");
a('');

process.stdout.write('_core.js done: ' + require('fs').statSync(F).size + ' bytes\n');
