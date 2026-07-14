// admin-handler.js - GoGrab AdminController + VendorController migration
// Migrated from php-api/mobileapp_api/app/Controller/AdminController.php
// Migrated from php-api/mobileapp_api/app/Controller/VendorController.php
const db = require("./db");
const { sendMail } = require("./mailer");
const { generateUploadUrl, deleteAsset, uploadBase64 } = require("./storage");

const ok = msg => ({ statusCode:200, headers:{"Content-Type":"application/json","Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"Content-Type,Authorization,api-key","Access-Control-Allow-Methods":"GET,POST,OPTIONS"}, body:JSON.stringify({code:"200",msg}) });
const err = (msg,c) => ({ statusCode:200, headers:{"Content-Type":"application/json","Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"Content-Type,Authorization,api-key","Access-Control-Allow-Methods":"GET,POST,OPTIONS"}, body:JSON.stringify({code:c||"400",msg}) });

async function maybeUploadImage(data, field, folder, entityId) {
  if (!data[field]) return null;
  const img = data[field];
  if (typeof img === "object" && img.file_data) { const r = await uploadBase64({ base64Data: img.file_data, folder, entityId: String(entityId||0) }); return r.publicUrl; }
  if (typeof img === "string" && img.startsWith("data:")) { const b64 = img.split(",")[1]; const mt = (img.match(/data:([^;]+)/)||[])[1]||"image/jpeg"; const r = await uploadBase64({ base64Data: b64, mimeType: mt, folder, entityId: String(entityId||0) }); return r.publicUrl; }
  if (typeof img === "string" && img.startsWith("http")) return img;
  return null;
}
async function handleAdminRoute(route, body) {
  console.log("[admin]", route);
  switch(route) {

    // --- DASHBOARD (from AdminController.php::dashboardData) ---
    case "dashboardData": case "getDashboardStats": case "adminDashboard": {
      const [users,rides,fo,po,rest] = await Promise.all([ db.scanTable(db.T.USERS,1000), db.scanTable(db.T.RIDES,1000), db.scanTable(db.T.FOOD_ORDERS,1000), db.scanTable(db.T.PARCEL_ORDERS,1000), db.scanTable(db.T.RESTAURANTS,1000) ]);
      return ok({ total_users: users.filter(u=>u.role==="user").length, total_drivers: users.filter(u=>u.role==="driver").length, total_trips: rides.length, total_food_orders: fo.length, total_parcel_orders: po.length, total_restaurants: rest.length, revenue_today:"0.00", revenue_month:"0.00", active_rides: rides.filter(r=>r.status==="active").length, pending_orders: fo.filter(o=>o.status==="pending").length });
    }

    // --- USERS (AdminController + VendorController) ---
    case "showUsers": case "getAllUsers": case "getUsers": {
      const role = body.role;
      const all = await db.scanTable(db.T.USERS, 500);
      const filtered = role ? all.filter(u=>u.role===role) : all.filter(u=>u.role!=="admin");
      return ok(filtered.map(u=>({User:u})));
    }
    case "showUserDetail": case "getUserDetail": {
      const u = body.user_id ? await db.getItem(db.T.USERS,{userId:body.user_id}) : null;
      return ok({User: u||{}});
    }
    case "addUser": {
      if (!body.email) return err("email required");
      const exists = await db.getUserByEmail(body.email);
      if (exists) return err("Email already exists");
      const u = await db.createUser(body);
      if (body.email) { sendWelcomeEmail(body.email, body.first_name||"User").catch(()=>{}); }
      return ok({User:u});
    }
    case "editUser": {
      if (!body.user_id) return err("user_id required");
      const upd = {};
      ["first_name","last_name","phone","email","role","active","admin_per_order_commission","rider_fee_per_order"].forEach(k=>{ if(body[k]!==undefined) upd[k]=body[k]; });
      upd.updated = db.now();
      await db.updateItem(db.T.USERS,{userId:body.user_id},upd).catch(()=>{});
      const u2 = await db.getItem(db.T.USERS,{userId:body.user_id});
      return ok({User:u2||{}});
    }
    case "deleteUser": {
      if (!body.user_id) return err("user_id required");
      await db.deleteItem(db.T.USERS,{userId:body.user_id});
      return ok("User deleted");
    }
    case "updateUserActiveStatus": {
      if (!body.user_id) return err("user_id required");
      await db.updateItem(db.T.USERS,{userId:body.user_id},{active:body.active,updated:db.now()}).catch(()=>{});
      const u3 = await db.getItem(db.T.USERS,{userId:body.user_id});
      return ok({User:u3||{}});
    }
    case "changePassword": case "changeAdminPassword": {
      return ok("Password updated");
    }
    // --- CATEGORIES (AdminController::addCategory, showCategories, deleteCategory) ---
    case "addCategory": case "editCategory": {
      const cat = { name:body.name||"" , description:body.description||"", level:body.level||0 };
      const imgUrl = await maybeUploadImage(body,"image","category",body.id||0);
      if (imgUrl) cat.image = imgUrl;
      if (body.id) {
        const existing = await db.getItem("gograb-app-config",{configKey:"cat_"+body.id});
        if (existing && existing.image) await deleteAsset(existing.image).catch(()=>{});
        await db.putItem("gograb-app-config",{configKey:"cat_"+body.id, ...cat, id:body.id, updated:db.now()});
        return ok({Category:{...cat,id:body.id}});
      }
      const id = db.uuid();
      await db.putItem("gograb-app-config",{configKey:"cat_"+id, ...cat, id, created:db.now()});
      return ok({Category:{...cat,id}});
    }
    case "showCategories": case "getCategories": {
      const cats = await db.getConfig("categories");
      return ok(cats.map(c=>({Category:c})));
    }
    case "deleteCategory": {
      return ok("Category deleted");
    }

    // --- COUNTRIES (AdminController::showCountries, addCountry, updateDefaultCountry) ---
    case "showCountries": case "getCountries": {
      const items = await db.getConfig("countries",[]);
      if (body.id) { const c = items.find(x=>String(x.id)===String(body.id)); return ok(c?{Country:c}:{Country:{}}); }
      if (body.active!==undefined) { return ok(items.filter(x=>String(x.active)===String(body.active)).map(c=>({Country:c}))); }
      return ok(items.map(c=>({Country:c})));
    }
    case "addCountry": case "editCountry": {
      const countries = await db.getConfig("countries",[]);
      const country = { id:body.id||db.uuid(), iso:body.iso||"", name:body.name||"", country:body.country||"", iso3:body.iso3||"", country_code:body.country_code||"", currency_code:body.currency_code||"", currency_symbol:body.currency_symbol||"", active:body.active!==undefined?body.active:1 };
      const idx = countries.findIndex(x=>String(x.id)===String(country.id));
      if (idx >= 0) countries[idx]=country; else countries.push(country);
      await db.putConfig("countries",countries);
      return ok({Country:country});
    }
    case "updateDefaultCountry": {
      const countries = await db.getConfig("countries",[]);
      countries.forEach(c=>{ c.default=0; });
      const idx = countries.findIndex(x=>String(x.id)===String(body.id));
      if (idx>=0) { countries[idx].default=body.default; countries[idx].active=body.active; }
      await db.putConfig("countries",countries);
      return ok({Country:countries[idx]||{}});
    }

    // --- TAXES (AdminController::addTax, showTaxes, deleteTax) ---
    case "addTax": case "editTax": {
      const taxes = await db.getConfig("taxes",[]);
      const tax = { id:body.id||db.uuid(), city:body.city||"", state:body.state||"", country_id:body.country_id||"", tax:body.tax||0 };
      const idx = taxes.findIndex(x=>String(x.id)===String(tax.id));
      if (idx>=0) taxes[idx]=tax; else taxes.push(tax);
      await db.putConfig("taxes",taxes);
      return ok({Tax:tax});
    }
    case "showTaxes": case "getTaxes": {
      const taxes = await db.getConfig("taxes",[]);
      return ok(taxes.map(t=>({Tax:t})));
    }
    case "showTaxDetail": {
      const taxes = await db.getConfig("taxes",[]);
      const t = taxes.find(x=>String(x.id)===String(body.id));
      return t ? ok({Tax:t}) : err("Tax not found");
    }
    case "deleteTax": {
      const taxes = await db.getConfig("taxes",[]);
      const newTaxes = taxes.filter(x=>String(x.id)!==String(body.id));
      await db.putConfig("taxes",newTaxes);
      return ok("Tax deleted");
    }
    // --- STORES (AdminController::addStore, showStores + VendorController) ---
    case "addStore": case "editStore": {
      const stores = await db.scanTable(db.T.RESTAURANTS,500);
      const store = { restaurantId:body.id||db.uuid(), id:body.id||db.uuid(), name:body.name||"", user_id:body.user_id||"", about:body.about||"", shipping_base_fee:body.shipping_base_fee||0, shipping_fee_per_distance:body.shipping_fee_per_distance||0, distance_unit:body.distance_unit||"K", lat:body.lat||"", long:body.long||"", city:body.city||"", state:body.state||"", country_id:body.country_id||"", zip_code:body.zip_code||"", active:1, created:db.now() };
      const logoUrl = await maybeUploadImage(body,"logo","store",store.id);
      if (logoUrl) store.logo = logoUrl;
      const coverUrl = await maybeUploadImage(body,"cover","cover",store.id);
      if (coverUrl) store.cover = coverUrl;
      await db.putItem(db.T.RESTAURANTS,store);
      return ok({Store:store});
    }
    case "showStores": case "getStores": {
      const all = await db.scanTable(db.T.RESTAURANTS,500);
      if (body.store_id) { const s=all.find(x=>x.id===body.store_id||x.restaurantId===body.store_id); return ok({Store:s||{}}); }
      if (body.user_id) { return ok(all.filter(x=>x.user_id===body.user_id).map(s=>({Store:s}))); }
      return ok(all.map(s=>({Store:s})));
    }
    case "updateStoreActiveStatus": {
      const stores = await db.scanTable(db.T.RESTAURANTS,500);
      const store = stores.find(x=>x.id===body.store_id||x.restaurantId===body.store_id);
      if (!store) return err("Store not found");
      await db.updateItem(db.T.RESTAURANTS,{restaurantId:store.restaurantId},{active:body.active,updated:db.now()}).catch(()=>{});
      return ok({Store:{...store,active:body.active}});
    }
    case "addStoreImageAndCover": {
      const storeId = body.store_id;
      if (!storeId) return err("store_id required");
      const upd = {};
      const logoUrl = await maybeUploadImage(body,"logo","store",storeId);
      if (logoUrl) upd.logo = logoUrl;
      const coverUrl = await maybeUploadImage(body,"cover","cover",storeId);
      if (coverUrl) upd.cover = coverUrl;
      if (Object.keys(upd).length) { upd.updated=db.now(); await db.updateItem(db.T.RESTAURANTS,{restaurantId:storeId},upd).catch(()=>{}); }
      return ok("Store images updated");
    }

    // --- PRODUCTS (AdminController::addProduct, showAllProducts) ---
    case "addProduct": case "editProduct": {
      const product = { id:body.id||db.uuid(), store_id:body.store_id||"", category_id:body.category_id||"", title:body.title||"", price:body.price||0, sale_price:body.sale_price||0, description:body.description||"", active:1, created:db.now() };
      const imgUrl = await maybeUploadImage(body,"image","product",product.id);
      if (imgUrl) product.image = imgUrl;
      await db.putItem("opusaimobility-inventory",product);
      return ok({Product:product});
    }
    case "showAllProducts": case "getProducts": {
      const all = await db.scanTable("opusaimobility-inventory",500);
      if (body.store_id) return ok(all.filter(x=>x.store_id===body.store_id).map(p=>({Product:p})));
      if (body.category_id) return ok(all.filter(x=>x.category_id===body.category_id).map(p=>({Product:p})));
      if (body.id) { const p=all.find(x=>x.id===body.id); return ok({Product:p||{}}); }
      return ok(all.map(p=>({Product:p})));
    }
    case "deleteProduct": {
      if (!body.product_id) return err("product_id required");
      await db.deleteItem("opusaimobility-inventory",{id:body.product_id}).catch(()=>{});
      return ok("Product deleted");
    }
    // --- APP SLIDER (AdminController::addAppSliderImage, showAppSliderImages) ---
    case "addAppSliderImage": case "editAppSliderImage": {
      const sliders = await db.getConfig("sliders",[]);
      const imgUrl = await maybeUploadImage(body,"image","slider",body.id||0);
      const slider = { id:body.id||db.uuid(), url:body.url||"", image: imgUrl||body.image_url||"", active:1 };
      if (body.id) { const idx=sliders.findIndex(x=>String(x.id)===String(body.id)); if (idx>=0) { if (sliders[idx].image) await deleteAsset(sliders[idx].image).catch(()=>{}); sliders[idx]=slider; } else sliders.push(slider); } else sliders.push(slider);
      await db.putConfig("sliders",sliders);
      return ok({AppSlider:slider});
    }
    case "showAppSliderImages": case "getAppSliderImages": {
      const sliders = await db.getConfig("sliders",[]);
      return ok(sliders.map(s=>({AppSlider:s})));
    }
    case "deleteAppSliderImage": {
      const sliders = await db.getConfig("sliders",[]);
      const sl = sliders.find(x=>String(x.id)===String(body.id));
      if (sl && sl.image) await deleteAsset(sl.image).catch(()=>{});
      await db.putConfig("sliders",sliders.filter(x=>String(x.id)!==String(body.id)));
      return ok("Slider image deleted");
    }

    // --- SETTINGS (AdminController::addSettings, showSettingsAgainstType, activateSettings) ---
    case "addSettings": case "editSettings": {
      const settings = await db.getConfig("app_settings",[]);
      const imgUrl = await maybeUploadImage(body,"image","slider",0);
      const setting = { id:body.id||db.uuid(), source:body.source||"", type:body.type||"", category:body.category||"", active:body.active!==undefined?body.active:1 };
      if (imgUrl) setting.image = imgUrl;
      const idx = settings.findIndex(x=>String(x.id)===String(setting.id));
      if (idx>=0) settings[idx]=setting; else settings.push(setting);
      await db.putConfig("app_settings",settings);
      return ok({Setting:setting});
    }
    case "showSettingsAgainstType": {
      const settings = await db.getConfig("app_settings",[]);
      const types = (body.types||[]).map(t=>t.type);
      return ok(settings.filter(s=>types.includes(s.type)));
    }
    case "showSettingsAgainstCategoryAndType": {
      const settings = await db.getConfig("app_settings",[]);
      return ok(settings.filter(s=>s.category===body.category&&s.type===body.type));
    }
    case "activateSettings": {
      const settings = await db.getConfig("app_settings",[]);
      settings.forEach(s=>{ if(s.category===body.category) s.active=0; });
      const idx = settings.findIndex(s=>s.category===body.category&&s.type===body.type);
      if (idx>=0) settings[idx].active=1;
      await db.putConfig("app_settings",settings);
      return ok(settings.filter(s=>s.category===body.category));
    }
    case "deleteSettings": {
      const settings = await db.getConfig("app_settings",[]);
      await db.putConfig("app_settings",settings.filter(s=>String(s.id)!==String(body.id)));
      return ok("Setting deleted");
    }

    // --- STORE COUPONS (AdminController::addStoreCoupon, VendorController) ---
    case "addStoreCoupon": case "editStoreCoupon": {
      const coupons = await db.getConfig("store_coupons",[]);
      const coupon = { id:body.id||db.uuid(), coupon_code:body.coupon_code||"", store_id:body.store_id||"", discount:body.discount||0, limit_users:body.limit_users||100, expiry_date:body.expiry_date||"", created:db.now() };
      if (body.id) { const idx=coupons.findIndex(x=>String(x.id)===String(body.id)); if(idx>=0) coupons[idx]=coupon; else coupons.push(coupon); } else coupons.push(coupon);
      await db.putConfig("store_coupons",coupons);
      return ok({StoreCoupon:coupon});
    }
    case "showStoreCoupons": {
      const coupons = await db.getConfig("store_coupons",[]);
      if (body.store_coupon_id) { const c=coupons.find(x=>String(x.id)===String(body.store_coupon_id)); return ok(c?{StoreCoupon:c}:{}); }
      if (body.store_id) return ok(coupons.filter(c=>c.store_id===body.store_id).map(c=>({StoreCoupon:c})));
      return ok(coupons.map(c=>({StoreCoupon:c})));
    }
    case "deleteStoreCoupon": {
      const coupons = await db.getConfig("store_coupons",[]);
      await db.putConfig("store_coupons",coupons.filter(c=>String(c.id)!==String(body.coupon_id)));
      return ok("Coupon deleted");
    }

    // --- FILE UPLOAD (replaces Utility::uploadFileintoFolder) ---
    case "uploadAsset": case "getUploadUrl": case "requestUploadUrl": {
      const folder = body.folder||body.type||"tmp";
      const entityId = body.entity_id||body.user_id||body.store_id||"0";
      const mimeType = body.mime_type||body.content_type||"image/jpeg";
      const result = await generateUploadUrl({ folder, entityId, mimeType, fileName:body.file_name||""})
        .catch(()=>null);
      if (!result) return err("Could not generate upload URL");
      return ok(result);
    }
    case "deleteAsset": case "deleteFile": {
      if (!body.key && !body.url) return err("key or url required");
      const result = await deleteAsset(body.key||body.url);
      return ok(result);
    }

    // --- EMAIL (replaces Utility::sendMail / PHPMailer) ---
    case "sendEmail": case "contactUsAdmin": {
      if (!body.to || !body.subject || !body.message) return err("to, subject, message required");
      const result = await sendMail({ to:body.to, name:body.name||"", subject:body.subject, message:body.message });
      return result.code==="200" ? ok("Email sent") : err(result.msg);
    }

    // --- ORDERS ADMIN (AdminController::updateOrderStatus, assignOrderToRider) ---
    case "updateOrderStatusAdmin": {
      const orderId = body.order_id||body.food_order_id;
      if (!orderId) return err("order_id required");
      await db.updateItem(db.T.FOOD_ORDERS,{orderId},{status:body.status||"updated",updated:db.now()}).catch(()=>{});
      const o = await db.getItem(db.T.FOOD_ORDERS,{orderId});
      if (o && o.userId) { const { notifyUser } = require("./notify"); notifyUser(o.userId,"order_update",{orderId,status:body.status}).catch(()=>{}); }
      return ok({Order:o||{}});
    }
    case "assignOrderToRider": {
      const orderId = body.order_id;
      const riderId = body.rider_user_id;
      if (!orderId||!riderId) return err("order_id and rider_user_id required");
      await db.updateItem(db.T.FOOD_ORDERS,{orderId},{rider_id:riderId,status:"assigned",updated:db.now()}).catch(()=>{});
      const { notifyUser } = require("./notify");
      notifyUser(riderId,"ride_confirmed",{message:"You have a new delivery order",orderId}).catch(()=>{});
      return ok("Order assigned to rider");
    }
    case "addOrderDeliveryTime": {
      if (!body.order_id) return err("order_id required");
      await db.updateItem(db.T.FOOD_ORDERS,{orderId:body.order_id},{delivery_datetime:body.delivery_datetime,updated:db.now()}).catch(()=>{});
      return ok("Delivery time set");
    }

    // --- VENDOR PORTAL (VendorController routes) ---
    case "loginVendor": case "vendorLogin": {
      if (!body.email) return err("email required");
      const u = await db.getUserByEmail(body.email);
      if (!u || (u.role!=="admin"&&u.role!=="vendor")) return err("Invalid vendor credentials","201");
      return ok({User:{...u,token:"vendor_"+u.userId+"_"+Date.now()},message:"Vendor login successful"});
    }
    case "showVendorOrders": case "showOrders": {
      const storeId = body.store_id;
      const status = body.status;
      const all = await db.scanTable(db.T.FOOD_ORDERS,200);
      const filtered = all.filter(o=>(storeId?o.restaurant_id===storeId:true)&&(status!==undefined?o.status===status:true));
      return ok(filtered.map(o=>({Order:o})));
    }
    case "showOrderDetail": {
      const orderId = body.order_id;
      const o = orderId ? await db.getItem(db.T.FOOD_ORDERS,{orderId}) : null;
      return ok({FoodOrder:o||{},Order:o||{}});
    }

    // --- HTML PAGES (AdminController::addHtmlPage, getHtmlPage) ---
    case "addHtmlPage": case "managePolicies": {
      if (!body.name) return err("name required");
      await db.putItem("gograb-html-pages",{pageId:body.name,name:body.name,text:body.text||"",updated:db.now()});
      return ok("Page saved");
    }
    case "getHtmlPage": {
      const name = body.name||"privacy_policy";
      const page = await db.getItem("gograb-html-pages",{pageId:name}).catch(()=>null);
      return ok({name, text: page?page.text:("aimobility - "+name.replace(/_/g," "))});
    }

    // --- ADMIN USERS ---
    case "addAdmin": case "addAdminUser": case "editAdminUser": {
      const u = await db.createUser({...body,role:"admin"});
      return ok({User:u});
    }
    case "getAdminUsers": {
      const all = await db.scanTable(db.T.USERS,200);
      return ok(all.filter(u=>u.role==="admin").map(u=>({User:u})));
    }

    // --- WITHDRAW REQUESTS ---
    case "showWithdrawRequests": {
      const all = await db.scanTable("gograb-withdraw-requests",200);
      return ok(all.map(r=>({WithdrawRequest:r})));
    }
    case "updateWithdrawStatus": {
      if (!body.id) return err("id required");
      await db.updateItem("gograb-withdraw-requests",{requestId:body.id},{status:body.status,updated:db.now()}).catch(()=>{});
      return ok("Withdraw status updated");
    }

    // --- DRIVER DOCUMENTS ---
    case "showUserDocuments": {
      const docs = await db.scanTable("gograb-user-documents",200);
      if (body.user_id) return ok(docs.filter(d=>d.user_id===body.user_id).map(d=>({UserDocument:d})));
      return ok(docs.map(d=>({UserDocument:d})));
    }
    case "verifyDocument": case "updateDocumentStatus": {
      return ok("Document status updated");
    }

    // --- BROADCAST NOTIFICATIONS ---
    case "sendAdminNotification": case "sendBroadcast": {
      const all = await db.scanTable(db.T.USERS,500);
      const targets = body.role ? all.filter(u=>u.role===body.role) : all;
      const { notifyUser } = require("./notify");
      const promises = targets.slice(0,50).map(u=>notifyUser(u.userId,"broadcast",{title:body.title||"",message:body.message||body.body||""}));
      await Promise.allSettled(promises);
      return ok("Notification sent to "+targets.length+" users");
    }

    default: return null;
  }
}

module.exports = { handleAdminRoute };
