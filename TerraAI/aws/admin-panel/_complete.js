// Complete Lambda remaining code
const fs = require('fs');
const F = 'aws/admin-panel/index.js';
const a = s => fs.appendFileSync(F, Buffer.from(s + '\n'));

// CSS continued
a("CSS+='.sidebar li a i{color:#5c5f62;font-size:14px;width:16px}';");
a("CSS+='table.tbl{width:100%;border-collapse:collapse}';");
a("CSS+='table.tbl th{font-size:13px;font-weight:600;padding:12px 16px;border-bottom:1px solid #dee2e6;text-align:left;background:#f9fafb}';");
a("CSS+='table.tbl td{font-size:13px;padding:12px 16px;border-bottom:1px solid #dee2e6}';");
a("CSS+='table.tbl tbody tr:hover{background:#fafafa}';");
a("CSS+='.badge{border-radius:100px;padding:2px 10px;font-size:12px;display:inline-block}';");
a("CSS+='.badge-green{background:rgb(174,233,209);color:#166534}';");
a("CSS+='.badge-gray{background:rgb(242,242,242);color:#374151}';");
a("CSS+='.badge-red{background:rgb(251,230,233);color:#7f1d1d}';");
a("CSS+='.badge-blue{background:#dbeafe;color:#1e40af}';");
a("CSS+='.btn{border:none;border-radius:4px;padding:7px 14px;font-size:13px;cursor:pointer;font-family:inherit}';");
a("CSS+='.btn-green{background:rgba(0,128,96,1);color:#fff}';");
a("CSS+='.empty{text-align:center;padding:48px;color:#9ca3af;font-size:14px}';");
a("CSS+='.notice{background:#f0fdf4;border:1px solid #bbf7d0;border-radius:6px;padding:12px 16px;font-size:13px;color:#166534;margin-bottom:16px}';");
a("CSS+='.notice-err{background:#fff5f5;border-color:#fecaca;color:#7f1d1d}';");
a('');

// Logo and nav
a("var LOGO='<svg width=\"150\" height=\"36\" viewBox=\"0 0 150 36\"><rect width=\"150\" height=\"36\" rx=\"5\" fill=\"#084c3f\"/><text x=\"12\" y=\"24\" font-family=\"Poppins,sans-serif\" font-size=\"15\" font-weight=\"600\" fill=\"#fff\">aimobility</text></svg>';");
a("var BS='<script src=\"https://ajax.googleapis.com/ajax/libs/jquery/3.5.1/jquery.min.js\"><\\/script><script src=\"https://maxcdn.bootstrapcdn.com/bootstrap/4.5.2/js/bootstrap.min.js\"><\\/script>';");
a("var BSCSS='<link rel=\"stylesheet\" href=\"https://maxcdn.bootstrapcdn.com/bootstrap/4.5.2/css/bootstrap.min.css\">';");
a("var FA='<link rel=\"stylesheet\" href=\"https://pro.fontawesome.com/releases/v5.10.0/css/all.css\" integrity=\"sha384-AYmEC3Yw5cVb3ZcuHtOA93w35dYTsvhLPVnYs9eStHfGJvOvKxVfELGroGkvsg+p\" crossorigin=\"anonymous\">';");
a('');

// head() function
a('function head(t){');
a('  return "<!DOCTYPE html><html lang=en><head><meta charset=UTF-8><meta name=viewport content=\\"width=device-width,initial-scale=1\\">"');
a('    +"<link href=\\"https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap\\" rel=stylesheet>"');
a('    +BSCSS+FA');
a('    +"<title>"+esc(t)+" | aimobility Admin</title><style>"+CSS+"</style></head>";');
a('}');
a('');

// NAV
a('var NAV=[');
a('  ["dashboard","fa-tachometer-alt","Dashboard"],');
a('  ["users","fa-users","Users"],');
a('  ["riders","fa-motorcycle","Riders"],');
a('  ["restaurants","fa-store","Restaurants"],');
a('  ["foodOrders","fa-shopping-bag","Food Orders"],');
a('  ["trips","fa-car","Trip Requests"],');
a('  ["parcelOrders","fa-box","Parcel Orders"],');
a('  ["foodCategory","fa-tag","Food Categories"],');
a('  ["rideTypes","fa-car-side","Ride Types"],');
a('  ["packageSize","fa-cube","Package Sizes"],');
a('  ["goodType","fa-boxes","Good Types"],');
a('  ["coupons","fa-ticket-alt","Coupons"],');
a('  ["serviceFee","fa-percent","Service Fees"],');
a('  ["sliderImages","fa-images","Slider Images"],');
a('  ["reportReasons","fa-flag","Report Reasons"],');
a('  ["policies","fa-file-alt","Policies"],');
a('  ["adminUsers","fa-user-shield","Admin Users"]');
a('];');
a('');

// layout()
a('function layout(sess,page,content,flash){');
a('  var fn=sess.first_name||"Admin",ln=sess.last_name||"";');
a('  var ini=(fn[0]||"A").toUpperCase()+(ln[0]||"").toUpperCase();');
a('  var navHtml=NAV.map(function(n){');
a('    return "<li><a href=\\"?p="+n[0]+"\\" class=\\""+( page===n[0]?"active":"")+"\\">"');
a('      +"<i class=\\"fas "+n[1]+"\\"></i>"+esc(n[2])+"</a></li>";');
a('  }).join("");');
a('  var fh=flash?"<div class=\\"notice"+(flash.t?"":"-err")+"\\">"+(flash.m||"")+"</div>":"";');
a('  return head(page)+"<body>"');
a('    +"<div class=\\"hdr\\"><a href=\\"?p=dashboard\\">"+LOGO+"</a>"');
a('    +"<div class=\\"hdr-right\\"><div class=\\"avatar\\">"+ini+"</div>"');
a('    +"<span class=\\"hdr-name\\">"+esc(fn)+" "+esc(ln)+"</span>"');
a('    +"<a href=\\"?action=logout\\" class=\\"logout-a\\">Logout</a></div></div>"');
a('    +"<div class=\\"sidebar\\"><ul>"+navHtml+"</ul></div>"');
a('    +"<div class=\\"main\\"><div class=\\"page\\">"+fh+content+"</div></div>"');
a('    +BS+"</body></html>";');
a('}');
a('');

// loginPage()
a('function loginPage(err){');
a('  var e=err?"<div class=\\"err-box\\">"+esc(err)+"</div>":"";');
a('  return head("Login")+"<body>"');
a('    +"<div class=\\"login-wrap\\"><div class=\\"login-box\\">"');
a('    +LOGO');
a('    +"<h1 style=\\"font-size:22px;font-weight:500;margin:0 0 4px\\">Log in</h1>"');
a('    +"<p style=\\"color:#6d7175;font-size:14px;margin:0 0 20px\\">Continue to aimobility Admin</p>"');
a('    +e');
a('    +"<form method=\\"POST\\" action=\\"?action=login\\">"');
a('    +"<div class=\\"form-field\\"><label>Email</label><input type=\\"email\\" name=\\"email\\" required></div>"');
a('    +"<div class=\\"form-field\\"><label>Password</label><input type=\\"password\\" name=\\"password\\" required></div>"');
a('    +"<button class=\\"submit-btn\\" type=\\"submit\\">Log in</button>"');
a('    +"</form></div></div>"+BS+"</body></html>";');
a('}');
a('');

// tableHTML()
a('function tblH(cols,rows,mapFn){');
a('  var th=cols.map(function(c){return "<th>"+esc(c)+"</th>";}).join("");');
a('  var tb=rows.length?rows.map(function(r){');
a('    var cells=mapFn(r);');
a('    return "<tr>"+cells.map(function(c){return "<td>"+c+"</td>";}).join("")+"</tr>";');
a('  }).join("")');
a('  :"<tr><td colspan=\\""+cols.length+"\\" style=\\"text-align:center;padding:40px;color:#9ca3af\\">No data found</td></tr>";');
a('  return "<div class=\\"card\\"><table class=\\"tbl\\"><thead><tr>"+th+"</tr></thead><tbody>"+tb+"</tbody></table></div>";');
a('}');
a('');
