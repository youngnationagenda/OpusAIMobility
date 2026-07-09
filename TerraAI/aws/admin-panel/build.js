/**
 * aimobility Admin Panel — build helper
 * Run: node build.js  →  writes index.js, html.js, styles.js
 */
const fs = require('fs');
const path = require('path');

/* ─── CSS (inlined from original style.css) ──────────────────────────────── */
const CSS_INLINE = `
body{margin:0;padding:0;font-family:'Poppins',sans-serif;background-color:#f6f6f7!important}
.table td,.table th{vertical-align:middle!important}
input,textarea,select{outline-color:rgba(0,123,92,1)!important}
select{background:#fff!important}
.artwork{position:fixed;right:0;top:0;z-index:0;background-color:#084c3f;height:100%}
.login-page-conatiner{background-color:#084c3f;display:flex}
.table-hover tbody tr:hover{background-color:#f6f6f7!important}
.login-page-content{width:468px;background:#fff;border-radius:8px;margin:3vw 10vw}
.login-card{padding:59px 40px 10px}
.login-card-header{margin-bottom:50px}
.login-card-logo{width:116px}
.login-card-logo img{width:100%}
.ui-heading{font-size:23px;line-height:1.2em;margin-bottom:.2rem;font-weight:500;margin-top:0}
.ui-desc{color:#6d7175;margin:0;font-size:15px;margin-bottom:20px}
.login--input{border:1px solid #6d7175;border-radius:2px;position:relative}
.login--input label{padding:6px 12px 0;margin:0;font-size:12px;color:#6f7287;position:absolute}
.login--input input{border:none;outline:none;font-size:14px;min-height:22px;padding:20px 12px 6px;color:#39364f;width:92%}
.ui-submit-btn{box-shadow:0 1px 0 rgba(0,0,0,.05),inset 0 -1px 0 rgba(0,0,0,.2);background:rgba(0,128,96,1);color:#fff;border:none;border-radius:4px;padding:16px 24px;margin:12px 0;font-size:16px;font-weight:700;cursor:pointer;width:100%}
.login-footer{padding:3rem 1.2rem 2rem;display:flex;justify-content:flex-end}
.login-footer-link{color:#6d7175;font-size:14px;margin-right:12px;text-decoration:none}
.actionBar{position:fixed;right:15px;top:85vh;z-index:9999;width:350px;border-radius:6px;padding:8px;color:#fff}
.actionBar.success{background:rgba(0,123,92,1);border-left:5px solid rgba(0,123,92,1)}
.actionBar.error{background:rgb(225,94,111)}
.header-container{position:fixed;z-index:512;top:0;display:flex;height:3.6rem;background-color:#fff;width:100%;border-bottom:1px solid #dedede}
.header-logo-container{width:15rem;display:flex;height:100%;align-items:center;padding:0 .8rem}
.header-search-bar-container{z-index:10;display:flex;flex:1 1 auto;align-items:center;justify-content:flex-end;height:100%;width:100%}
.user-dropdown svg{width:2rem;color:rgb(79,41,31);background:rgb(253,201,208);border-radius:50%}
.user-dropdown-btn{background:transparent;color:#000;font-size:14px;font-weight:500;border:none;margin-right:10px}
.user-dropdown .dropdown-menu{background:#202123!important;top:12px!important;border-radius:8px}
.user-dropdown .dropdown-item{color:rgb(227,229,231)!important;display:flex!important;align-items:center;padding:8px 16px!important;font-size:14px}
.header-drop-border{border-bottom:1px solid rgb(69,71,73);padding-bottom:8px}
.user-dropdown .dropdown-item:hover{background:#3e4043}
.sidebar-container{position:fixed;top:58px;height:100%;border-right:1px solid #dee2e6;min-height:100%}
.sidebar-navigation-container{width:235px;height:100%}
.sidebar-navigation{padding-top:12px;display:flex;flex-direction:column;min-height:82vh}
.footerSidebar{min-height:15vh}
.navigation-content-container{padding-bottom:22px;margin:0;padding-left:0}
.navigation-list-item{display:flex;flex-wrap:nowrap;width:100%;margin-bottom:1px}
.list-item-content{display:flex;align-items:center;padding-left:14px;padding-right:4px;position:relative;font-size:14px;color:#202223;width:100%;margin-left:6px;margin-right:12px;font-weight:400;text-decoration:none}
.list-item-content:hover{text-decoration:none;color:inherit;background:#f1f2f3;border-radius:4px}
.list-item-content .sidebarIcon{width:36px;height:24px;margin-top:6px;margin-bottom:6px;color:#5c5f62;font-size:17px;display:flex;align-items:center}
.active-side-bar::before{content:"";position:absolute;top:0;bottom:0;left:-6px;height:100%;width:3px;background:rgba(0,123,92,1);border-top-right-radius:12px;border-bottom-right-radius:12px}
.active-side-bar{background:#edeeef;color:rgba(0,123,92,1);border-radius:4px}
.active-side-bar i{color:rgba(0,123,92,1)!important}
.main-content-container{padding-top:58px;padding-left:240px;overflow:hidden}
.main-content-container-wrap{padding:0 32px;width:100%}
.content-page-header{padding-top:22px;display:flex;align-items:center}
.page-header-text{width:50%;font-size:20px;font-weight:500}
.page-header-btn{width:50%;text-align:right}
.add-product-btn{border:none;font-size:14px;font-weight:400;padding:7px 12px;background:rgba(0,128,96,1);border-radius:4px;color:#fff;cursor:pointer}
.add-product-btn:hover{background:rgb(0,110,82)}
.content-page-container{margin-top:18px}
.content-tabel-container{margin-top:16px;background:#fff;border:1px solid #dee2e6;padding-bottom:50px;border-radius:4px}
.nav-tabs .nav-link.active,.nav-tabs .nav-link:hover,.nav-tabs .nav-link,.nav-tabs{border:none!important}
.nav-link{color:rgb(109,113,117)!important;font-size:14px;position:relative}
.nav-link.active{color:#000!important}
.content-tabel-nav{border-bottom:1px solid #dee2e6;padding:0 8px}
.nav-link.active::before{content:"";position:absolute;top:42px;left:0;height:3px;width:100%;background:rgba(0,123,92,1);border-radius:12px}
.nav-item{padding:8px 4px}
.order-tabel-container th{font-size:14px;font-weight:600;border-bottom:1px solid #dee2e6!important;border-top:none!important}
.order-tabel-container td{font-size:14px;font-weight:400;border-bottom:1px solid #dee2e6}
.td-container{display:flex;align-items:center}
.tabel-img-container{display:flex;align-items:center}
.statusbtn{border-radius:100px;border:transparent;padding:2px 11px;font-size:12px;color:rgba(32,34,35,.98)}
.statusBtnActive{background:rgb(174,233,209)}
.statusBtnPending{background:rgb(242,242,242)}
.statusBtnCancel{background:rgb(251,230,233)}
.PopupParent{background-color:rgba(0,0,0,.5);display:none;position:fixed;top:0;width:100%;height:100%;z-index:99999}
.Modelwidth{width:600px;margin:40px auto}
.modal-content{background:#fff;border-radius:8px;padding:20px}
.name-input-container{width:48%}
.input-username-container{display:flex;justify-content:space-between}
.name-input-container label,.input-email-container label,.phone-input-container label{font-size:14px;margin-bottom:6px}
.name-input-container input,.input-email-container input,.phone-input-container input{border:1px solid rgb(201,204,207);width:100%;border-radius:4px;padding:4px 16px}
.input-email-container{margin-top:16px}
.input-submit-container{margin-top:16px}
.input-submit-container .add-product-btn{width:100%}
.page-content-card-container{display:grid;grid-template-columns:2fr 1fr;padding-left:20px;margin:20px auto}
.left-sec-card-container{grid-column:1/2;grid-row:1/2;margin-left:-20px}
.right-sec-card-container{grid-column:2/3;grid-row:1/4;margin-top:0;margin-left:20px}
.items-card-container{background:#fff;box-shadow:0 0 5px rgba(23,24,24,.05),0 1px 2px rgba(0,0,0,.15);border-radius:4px;margin-bottom:20px}
.items-card-header{padding:20px}
.item-card-body-container{padding:15px 20px}
.item-card-body-content{display:flex;justify-content:space-between;align-items:center;padding-bottom:8px}
.item-card-body-content h3{font-size:13px;margin:0;text-transform:uppercase}
.item-note{font-size:14px}
.b--top{border-top:1px solid rgb(225,227,229)}
.descriptionTitle{font-size:16px;line-height:24px;margin:0;padding:20px}
.orderDetail{display:flex;justify-content:space-between;align-items:center}
.payment-card-body-container{padding:5px 20px}
.shipping-address{font-size:14px}
.setting-content-container-wrap{padding:0 32px;width:1000px;margin:0 auto}
.setting-page-content-container{margin:14px 0}
.setting-page-content-container-wrap{box-shadow:0 0 0 1px rgba(63,63,68,.05),0 1px 3px rgba(63,63,68,.15);background:#fff;border-radius:8px}
.setting-page-content{padding:16px;margin:0;display:flex;flex-wrap:wrap}
.setting-page-content li{display:flex;width:32%;list-style:none}
.setting-page-content li a{color:#919eab;font-weight:400;padding:20px 15px;display:flex;text-decoration:none}
.setting-page-content-icon{margin-right:16px;background:#f4f6f8;height:43px;border-radius:3px}
.setting-page-content-icon .cuctomIcon{margin:11px;font-size:20px;color:#919eab}
.setting-page-content-text p{margin:0;font-size:14px}
.setting-page-content-text h2{font-size:14px;margin:0;color:#0070b6;font-weight:600}
.security-content-container-wrap{padding:12px 22px;width:1000px;margin:0 auto}
.security-page-header{padding:18px 0 30px;border-bottom:1px solid rgb(201,204,207)}
.security-content-sec-container{margin:16px 0}
.security-page-header-container{padding:0 30px}
.security-content-sec-wrap{display:flex;padding:0 30px}
.security-content-text{width:40%;padding:0 6.4rem 0 0}
.security-content-text h2{font-size:16px;padding:16px 0;margin:0}
.security-content-card-container{width:60%;background:#fff;box-shadow:0 0 0 1px rgba(63,63,68,.05),0 1px 3px rgba(63,63,68,.15);border-radius:6px}
.card-sec-text{padding:20px}
.card-sec-text p{margin:0;font-size:14px}
.card-sec-footer{padding:20px;padding-top:0}
.footer-card-btn{background:transparent;border:1px solid rgb(201,204,207)!important;border-radius:4px;padding:6px 16px;font-size:14px;font-weight:500}
.footer-card-btn:hover{background:rgb(241,242,243)}
.filter-bar-container{display:none}
.dashboard-stats{display:grid;grid-template-columns:repeat(3,1fr);gap:20px;margin-top:20px}
.stat-card{background:#fff;border:1px solid #dee2e6;border-radius:8px;padding:24px;text-align:center}
.stat-card h2{font-size:36px;font-weight:700;color:rgba(0,128,96,1);margin:0}
.stat-card p{font-size:14px;color:#6d7175;margin:0;margin-top:4px}
.alert-banner{background:#fff3cd;border:1px solid #ffc107;border-radius:4px;padding:12px 16px;margin-top:16px;font-size:14px}
`;

/* ─── HTML builder helpers ───────────────────────────────────────────────── */
const API_URL  = 'https://pg4ulam66a.execute-api.us-east-1.amazonaws.com/prod/api/';
const API_KEY  = 'terraai-mobility-key-2024';
const APP_NAME = 'aimobility Admin';

function htmlHead(title, extraCss='') {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<link rel="shortcut icon" href="data:,">
<link href="https://fonts.googleapis.com/css2?family=Poppins:wght@100;200;300;400;500;600;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/4.5.2/css/bootstrap.min.css">
<link rel="stylesheet" href="https://pro.fontawesome.com/releases/v5.10.0/css/all.css" integrity="sha384-AYmEC3Yw5cVb3ZcuHtOA93w35dYTsvhLPVnYs9eStHfGJvOvKxVfELGroGkvsg+p" crossorigin="anonymous">
<title>${title} | ${APP_NAME}</title>
<style>${CSS_INLINE}${extraCss}</style>
</head>`;
}

function htmlFoot(extraJs='') {
  return `
<script src="https://ajax.googleapis.com/ajax/libs/jquery/3.5.1/jquery.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/popper.js/1.16.0/umd/popper.min.js"></script>
<script src="https://maxcdn.bootstrapcdn.com/bootstrap/4.5.2/js/bootstrap.min.js"></script>
${extraJs}
</body></html>`;
}

/* ─── Shared layout: header + sidebar ───────────────────────────────────── */
function layoutOpen(firstName, lastName, activePage='') {
  const initials = (firstName[0]||'A').toUpperCase()+(lastName[0]||'').toUpperCase();
  const fullName = firstName+' '+lastName;
  const nav = [
    { id:'dashboard',   icon:'fa-tachometer-alt', label:'Dashboard' },
    { id:'users',       icon:'fa-users',          label:'Manage Users' },
    { id:'riders',      icon:'fa-motorcycle',     label:'Manage Riders' },
    { id:'restaurants', icon:'fa-store',          label:'Restaurants' },
    { id:'foodOrders',  icon:'fa-shopping-bag',   label:'Food Orders' },
    { id:'trips',       icon:'fa-car',            label:'Trip Requests' },
    { id:'parcelOrders',icon:'fa-box',            label:'Parcel Orders' },
    { id:'foodCategory',icon:'fa-tag',            label:'Food Categories' },
    { id:'rideTypes',   icon:'fa-car-side',       label:'Ride Types' },
    { id:'packageSize', icon:'fa-cube',           label:'Package Sizes' },
    { id:'goodType',    icon:'fa-boxes',          label:'Good Types' },
    { id:'coupons',     icon:'fa-ticket-alt',     label:'Coupons' },
    { id:'serviceFee',  icon:'fa-percent',        label:'Service Fees' },
    { id:'sliderImage', icon:'fa-images',         label:'Slider Images' },
    { id:'reportReasons',icon:'fa-flag',          label:'Report Reasons' },
    { id:'policies',    icon:'fa-file-alt',       label:'Policies' },
    { id:'admins',      icon:'fa-user-shield',    label:'Admin Users' },
  ];
  const navHtml = nav.map(n => {
    const active = activePage===n.id ? 'active-side-bar' : '';
    return \`<li class="navigation-list-item">
      <a href="?p=\${n.id}" class="list-item-content \${active}">
        <i class="fa \${n.icon} sidebarIcon"></i>
        <span class="list-item-text">\${n.label}</span>
      </a>
    </li>\`;
  }).join('');

  return \`<body>
<div class="main-container">
  <div class="header-container">
    <div class="header-logo-container">
      <a href="?p=dashboard">
        <svg width="120" height="32" viewBox="0 0 120 32"><rect width="120" height="32" rx="4" fill="#084c3f"/><text x="10" y="22" font-family="Poppins,sans-serif" font-size="14" font-weight="600" fill="#fff">aimobility</text></svg>
      </a>
    </div>
    <div class="header-search-bar-container">
      <div class="user-dropdown">
        <button class="user-dropdown-btn dropdown-toggle" type="button" data-toggle="dropdown">
          <svg viewBox="0 0 40 40"><text x="50%" y="50%" dy=".35em" fill="currentColor" font-size="16" text-anchor="middle">\${initials}</text></svg>
          <span class="svg-name"> \${fullName}</span>
        </button>
        <div class="dropdown-menu dropdown-menu-right">
          <div class="header-drop-border">
            <a class="dropdown-item" href="?p=setting"><i class="fa fa-cog"></i> Setting</a>
            <a class="dropdown-item" href="?action=logout"><i class="im im-arrow-right-circle"></i> Log out</a>
          </div>
          <a class="dropdown-item" href="#">Help Center</a>
        </div>
      </div>
    </div>
  </div>
  <div class="sidebar-container">
    <div class="sidebar-navigation-container">
      <div class="sidebar-navigation">
        <ul class="navigation-content-container">\${navHtml}</ul>
      </div>
      <div class="footerSidebar">
        <ul class="navigation-content-container">
          <li class="navigation-list-item">
            <a href="?p=setting" class="list-item-content \${activePage==='setting'?'active-side-bar':''}">
              <i class="fa fa-cog sidebarIcon"></i><span class="list-item-text">Settings</span>
            </a>
          </li>
        </ul>
      </div>
    </div>
  </div>\`;
}

function layoutClose() {
  return \`</div>
<div class="PopupParent" id="PopupParent">
  <div class="Modelwidth">
    <div class="modal-content" id="contentReceived"><div class="p-3" id="loading">Loading...</div></div>
  </div>
</div>\`;
}

fs.writeFileSync('aws/admin-panel/layout.js', \`module.exports={layoutOpen,layoutClose,htmlHead,htmlFoot,CSS_INLINE,API_URL,API_KEY,APP_NAME};\`
  .replace('module.exports', 'module.exports')
);

console.log('build.js loaded — run index.js for Lambda handler');
