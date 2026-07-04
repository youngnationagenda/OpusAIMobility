'use strict';
const{DynamoDBClient}=require('@aws-sdk/client-dynamodb');
const{DynamoDBDocumentClient,GetCommand,PutCommand,DeleteCommand,ScanCommand}=require('@aws-sdk/lib-dynamodb');
const{CognitoIdentityProviderClient,InitiateAuthCommand,SignUpCommand}=require('@aws-sdk/client-cognito-identity-provider');
const{SecretsManagerClient,GetSecretValueCommand}=require('@aws-sdk/client-secrets-manager');
const{SNSClient,PublishCommand}=require('@aws-sdk/client-sns');
const https=require('https');
const REGION=process.env.REGION||'us-east-1',CLIENT_ID=process.env.CLIENT_ID,USER_POOL_ID=process.env.USER_POOL_ID,SNS_TOPIC=process.env.SNS_TOPIC_ARN,GEM_SECRET=process.env.GEMINI_SECRET_NAME||'omniride/gemini-api-key';
const ddb=DynamoDBDocumentClient.from(new DynamoDBClient({region:REGION})),cognito=new CognitoIdentityProviderClient({region:REGION}),sns=new SNSClient({region:REGION}),sm=new SecretsManagerClient({region:REGION});
let _gKey=null;
async function getGeminiKey(){if(_gKey)return _gKey;_gKey=(await sm.send(new GetSecretValueCommand({SecretId:GEM_SECRET}))).SecretString;return _gKey;}
const T={USERS:'omniride-users',TRIPS:'omniride-trips',ORDERS:'omniride-orders',ERRANDS:'omniride-errands',TX:'omniride-transactions',STATIONS:'omniride-swap-stations',INV:'omniride-inventory',CHAIN:'omniride-blockchain',AUDIT:'omniride-audit-logs',PLATFORM:'omniride-platform'};
const CORS={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'GET,POST,PUT,PATCH,DELETE,OPTIONS','Access-Control-Allow-Headers':'Content-Type,Authorization'};
const ok=(b,s)=>({statusCode:s||200,headers:CORS,body:JSON.stringify(b)}),err=(m,s)=>({statusCode:s||500,headers:CORS,body:JSON.stringify({error:m})});
const dbGet=async(t,k)=>{const r=await ddb.send(new GetCommand({TableName:t,Key:k}));return r.Item||null;};
const dbPut=async(t,i)=>{await ddb.send(new PutCommand({TableName:t,Item:i}));return i;};
const dbDel=async(t,k)=>ddb.send(new DeleteCommand({TableName:t,Key:k}));
const dbScan=async(t)=>{const r=await ddb.send(new ScanCommand({TableName:t}));return r.Items||[];};
async function callGemini(p,f){const k=await getGeminiKey(),m='gemini-2.0-flash',u='https://generativelanguage.googleapis.com/v1beta/models/'+m+':generateContent?key='+k,b=JSON.stringify({contents:[{parts:[{text:p}]}],generationConfig:f==='json'?{responseMimeType:'application/json'}:{}});return new Promise((res,rej)=>{const req=https.request(u,{method:'POST',headers:{'Content-Type':'application/json','Content-Length':Buffer.byteLength(b)}},(r)=>{let d='';r.on('data',c=>d+=c);r.on('end',()=>{try{res(JSON.parse(d).candidates?.[0]?.content?.parts?.[0]?.text||'');}catch(e){rej(e);}});});req.on('error',rej);req.write(b);req.end();});}
async function authSignup(b){const{email,password,name,phone,role}=b;await cognito.send(new SignUpCommand({ClientId:CLIENT_ID,Username:email,Password:password,UserAttributes:[{Name:'email',Value:email},{Name:'name',Value:name},{Name:'phone_number',Value:phone||''},{Name:'custom:role',Value:role||'user'},{Name:'custom:permissions',Value:'[]'}]}));const id='usr_'+Date.now().toString(36);const u={id,email,name,phone:phone||'',role:role||'user',status:'active',joinedAt:Date.now(),walletBalance:0,rating:5,totalTrips:0,points:0,favorites:[],language:'en',paymentMethods:[],coupons:[]};await dbPut(T.USERS,u);return ok({user:u,message:'Signup successful. Check email to verify.'});}
async function authSignin(b){const{email,password}=b;const r=await cognito.send(new InitiateAuthCommand({AuthFlow:'USER_PASSWORD_AUTH',ClientId:CLIENT_ID,AuthParameters:{USERNAME:email,PASSWORD:password}}));const tokens=r.AuthenticationResult;const users=await dbScan(T.USERS);let u=users.find(x=>x.email===email);if(!u){u={id:'usr_'+Date.now().toString(36),email,name:email.split('@')[0],role:'user',status:'active',joinedAt:Date.now(),walletBalance:0,rating:5,totalTrips:0,points:0,favorites:[],language:'en',paymentMethods:[],coupons:[]};await dbPut(T.USERS,u);}return ok({user:u,accessToken:tokens.AccessToken,idToken:tokens.IdToken,refreshToken:tokens.RefreshToken});}
async function authRefresh(b){const{refreshToken}=b;const r=await cognito.send(new InitiateAuthCommand({AuthFlow:'REFRESH_TOKEN_AUTH',ClientId:CLIENT_ID,AuthParameters:{REFRESH_TOKEN:refreshToken}}));return ok({accessToken:r.AuthenticationResult.AccessToken,idToken:r.AuthenticationResult.IdToken});}
async function syncUser(b){if(!b?.id)return err('Missing id',400);await dbPut(T.USERS,b);return ok({user:b});}
async function getUser(id){const u=await dbGet(T.USERS,{id});return u?ok(u):err('Not found',404);}
async function listUsers(){return ok(await dbScan(T.USERS));}
async function updateBalance(id,b){const u=await dbGet(T.USERS,{id});if(!u)return err('Not found',404);if(b.isBusiness&&u.businessProfile)u.businessProfile.walletBalance=(u.businessProfile.walletBalance||0)+b.amount;else u.walletBalance=(u.walletBalance||0)+b.amount;await dbPut(T.USERS,u);return ok({user:u});}
async function requestRide(b){await dbPut(T.TRIPS,b);const u=await dbGet(T.USERS,{id:b.customerId});if(u&&!u.employerId&&u.role!=='business'){u.walletBalance=Math.max(0,(u.walletBalance||0)-b.price);await dbPut(T.USERS,u);await dbPut(T.TX,{id:'TRP-'+Date.now().toString(36).toUpperCase(),amount:b.price,currency:'USD',status:'successful',method:'OmniWallet',gateway:'OmniWallet',timestamp:Date.now(),description:'Ride:'+b.provider,userType:u.role,direction:'out'});}return ok({user:u});}
async function getFleet(){const r=await dbGet(T.PLATFORM,{configKey:'fleet'});return ok(r?.data||[]);}
async function updateFleet(b){await dbPut(T.PLATFORM,{configKey:'fleet',data:b});return ok({success:true});}
async function getPricing(){const r=await dbGet(T.PLATFORM,{configKey:'pricing'});return ok(r?.data||{baseFare:2.5,perKmRate:0.85,demandMultiplier:1.0});}
async function updatePricing(b){await dbPut(T.PLATFORM,{configKey:'pricing',data:b});return ok({success:true});}
async function placeOrder(b){await dbPut(T.ORDERS,b);const fee='fee' in b?b.fee:b.total;const u=await dbGet(T.USERS,{id:b.customerId});if(u&&!u.employerId&&u.role!=='business'){u.walletBalance=Math.max(0,(u.walletBalance||0)-fee);await dbPut(T.USERS,u);await dbPut(T.TX,{id:'ORD-'+Date.now().toString(36).toUpperCase(),amount:fee,currency:'USD',status:'successful',method:'OmniWallet',gateway:'OmniWallet',timestamp:Date.now(),description:'restaurantName' in b?'Food':'Logistics',userType:u.role,direction:'out'});}return ok({user:u});}
async function updateOrderStatus(id,b){const o=await dbGet(T.ORDERS,{id});if(!o)return err('Not found',404);o.status=b.status;await dbPut(T.ORDERS,o);return ok({success:true});}
async function placeErrand(b){await dbPut(T.ERRANDS,b);const total=b.baseFee+b.shoppingTotal;const u=await dbGet(T.USERS,{id:b.customerId});if(u&&!u.employerId&&u.role!=='business'){u.walletBalance=Math.max(0,(u.walletBalance||0)-total);await dbPut(T.USERS,u);await dbPut(T.TX,{id:'ERN-'+Date.now().toString(36).toUpperCase(),amount:total,currency:'USD',status:'successful',method:'OmniWallet',gateway:'OmniWallet',timestamp:Date.now(),description:'Errand:'+b.plan,userType:u.role,direction:'out'});}return ok({user:u});}
async function paymentHistory(){return ok(await dbScan(T.TX));}
async function mpesaTopup(b){const tx={id:'MPX-'+Date.now().toString(36).toUpperCase(),amount:b.amount,currency:'USD',status:'successful',method:b.phone,gateway:'M-Pesa Express',timestamp:Date.now(),description:'Wallet Top-up',userType:'customer',direction:'in'};await dbPut(T.TX,tx);const u=await dbGet(T.USERS,{id:b.userId});if(u){u.walletBalance=(u.walletBalance||0)+b.amount;await dbPut(T.USERS,u);}return ok({transaction:tx});}
async function stripePayment(b){const tx={id:'STR-'+Date.now().toString(36).toUpperCase(),amount:b.amount,currency:'USD',status:'successful',method:'Stripe',gateway:b.gateway||'Stripe',timestamp:Date.now(),description:'Payment',userType:'customer',direction:'out'};await dbPut(T.TX,tx);return ok({success:true});}
async function bankTransferRequest(b){const tx={id:'BTF-'+Date.now().toString(36).toUpperCase(),amount:b.amount,currency:'USD',status:'awaiting_approval',method:'Bank Transfer',gateway:'Bank Transfer',reference:b.reference,timestamp:Date.now(),description:'Corporate Deposit',userType:'business',direction:'in'};await dbPut(T.TX,tx);return ok({transaction:tx});}
async function bankTransferApprove(b){const txs=await dbScan(T.TX);const tx=txs.find(t=>t.id===b.txnId);if(!tx)return err('Not found',404);tx.status='successful';await dbPut(T.TX,tx);return ok({success:true,amount:tx.amount});}
async function p2pTransfer(b){const u=await dbGet(T.USERS,{id:b.fromUserId});if(!u)return err('Not found',404);u.walletBalance=Math.max(0,(u.walletBalance||0)-b.amount);await dbPut(T.USERS,u);await dbPut(T.TX,{id:'TXF-'+Date.now().toString(36).toUpperCase(),amount:b.amount,currency:'USD',status:'successful',method:'OmniWallet',gateway:'OmniWallet',timestamp:Date.now(),description:'Transfer to '+b.toAddress,userType:u.role,direction:'out'});return ok({success:true});}
async function swapPayment(b){const{riderId,stationId,amount,isDedicated}=b;const pfee=amount*0.1,orev=amount-pfee;const stations=await dbScan(T.STATIONS);const stn=stations.find(s=>s.id===stationId);const rider=await dbGet(T.USERS,{id:riderId});if(!stn||!rider)return err('Not found',404);if(!isDedicated){rider.walletBalance=Math.max(0,(rider.walletBalance||0)-amount);await dbPut(T.USERS,rider);}if(stn.ownerId){const own=await dbGet(T.USERS,{id:stn.ownerId});if(own){own.walletBalance=(own.walletBalance||0)+orev;await dbPut(T.USERS,own);}}stn.revenue=(stn.revenue||0)+orev;stn.availableSlots=Math.max(0,(stn.availableSlots||1)-1);await dbPut(T.STATIONS,stn);await dbPut(T.TX,{id:'SWP-'+Date.now().toString(36).toUpperCase(),amount,currency:'USD',status:'successful',method:isDedicated?'Corporate':'OmniWallet',gateway:'OmniWallet',timestamp:Date.now(),description:'Swap:'+stn.name,userType:'rider',direction:'out'});return ok({success:true,rider});}
async function listVendors(){return ok(await dbScan(T.USERS));}
async function updateVendorStatus(id,b){const u=await dbGet(T.USERS,{id});if(!u)return err('Not found',404);if(u.vendorProfile)u.vendorProfile.status=b.status,await dbPut(T.USERS,u);return ok(u);}
async function listStations(){return ok(await dbScan(T.STATIONS));}
async function registerStation(b){await dbPut(T.STATIONS,b);return ok(b);}
async function updateStationStatus(id,b){const s=await dbGet(T.STATIONS,{id});if(!s)return err('Not found',404);s.isOpen=b.isOpen;await dbPut(T.STATIONS,s);return ok(s);}
async function listInventory(){return ok(await dbScan(T.INV));}
async function updateInventory(b){await dbPut(T.INV,b);return ok(b);}
async function deleteInventory(id){await dbDel(T.INV,{id});return ok({success:true});}
async function seedBlockchain(b){const prev=await dbScan(T.CHAIN);const last=prev.sort((a,c)=>c.blockHeight-a.blockHeight)[0];const ev={id:'TXN-'+Date.now().toString(36).toUpperCase(),blockHeight:(last?.blockHeight||18442910)+Math.ceil(Math.random()*10),hash:'0x'+[...Array(40)].map(()=>Math.floor(Math.random()*16).toString(16)).join(''),eventType:b.type,payload:b.payload,timestamp:Date.now(),gasUsed:String(Math.floor(Math.random()*50000)+21000)};await dbPut(T.CHAIN,ev);return ok({event:ev});}
async function getLedger(){return ok((await dbScan(T.CHAIN)).sort((a,b)=>b.blockHeight-a.blockHeight));}
async function carbonValidate(){return ok({status:'verified',certId:'CER-VCS-'+Math.random().toString(36).substr(2,6).toUpperCase()});}
async function carbonRate(){return ok({rate:0.52});}
async function defiAssetLoan(b){const P=1500,R=0.1,M=b.months||12,total=P+P*R*(M/12);return ok({loan:{id:'ASSET-'+Date.now().toString(36).toUpperCase(),principal:P,totalAmount:total,monthlyRepayment:+(total/M).toFixed(2),dailyRepayment:+(total/(M*30)).toFixed(2),remainingBalance:total,interestRate:10,months:M,startDate:Date.now()}});}
async function defiInsuranceLoan(b){const P=1500,R=0.1,M=b.months||12,base=b.type==='Comprehensive'?P*0.045:50,total=base+base*R*(M/12);return ok({loan:{id:'INS-'+Date.now().toString(36).toUpperCase(),type:b.type,totalAmount:total,monthlyRepayment:+(total/M).toFixed(2),dailyRepayment:+(total/(M*30)).toFixed(2),remainingBalance:total,months:M,interestRate:10,autoRenew:true,startDate:Date.now()}});}
async function iotTelemetry(){return ok({batteryTemp:28+Math.random()*8,motorTemp:42+Math.random()*15,controllerTemp:38+Math.random()*12,cycleCount:156,healthPercentage:94.2,efficiencyWhKm:38+Math.random()*10,totalEnergyConsumed:1240.8,brakeWearStatus:82,swapCount:24,ecoScore:88,lastSwapTimestamp:Date.now()-14400000});}
async function iotFirmware(){return ok({jobId:'OTA-'+Date.now(),status:'queued'});}
async function getPlatformSettings(){const r=await dbGet(T.PLATFORM,{configKey:'settings'});return ok(r||{deductionTime:'23:59',systemWeeklyFee:10,autoSettlementEnabled:true});}
async function updatePlatformSettings(b){await dbPut(T.PLATFORM,{configKey:'settings',...b});return ok({success:true});}
async function getCollection(){const r=await dbGet(T.PLATFORM,{configKey:'collection'});return ok(r||{totalCollected:0,heldInProcess:0,lastReconciliation:Date.now()});}
async function updateCollection(b){await dbPut(T.PLATFORM,{configKey:'collection',...b});return ok({success:true});}
async function getAuditLogs(){return ok((await dbScan(T.AUDIT)).sort((a,b)=>b.timestamp-a.timestamp));}
async function logAuditAction(b){const log={...b,id:'LOG-'+Date.now().toString(36).toUpperCase(),timestamp:Date.now()};await dbPut(T.AUDIT,log);return ok(log);}
async function getFinancialReport(){return ok([{Date:'2025-02-12',Gross:12400,Net:10540,Fees:1860,Carbon_Credits:42},{Date:'2025-02-13',Gross:15100,Net:12835,Fees:2265,Carbon_Credits:55},{Date:'2025-02-14',Gross:11200,Net:9520,Fees:1680,Carbon_Credits:38},{Date:'2025-02-15',Gross:18400,Net:15640,Fees:2760,Carbon_Credits:68}]);}
async function aiGenerate(b){try{return ok({text:await callGemini(b.prompt,b.responseFormat)});}catch(e){return err(e.message,500);}}
async function pushNotification(b){try{await sns.send(new PublishCommand({TopicArn:SNS_TOPIC,Message:JSON.stringify(b),Subject:b.title||'OmniRide'}));}catch{}return ok({success:true});}
exports.handler=async(event)=>{const method=event.requestContext?.http?.method||event.httpMethod||'GET';const rawPath=event.rawPath||event.path||'/';const path=rawPath.replace(/^\/(prod|dev)/,'');const segs=path.split('/').filter(Boolean);let body={};try{body=event.body?(typeof event.body==='string'?JSON.parse(event.body):event.body):{};}catch{}
console.log(method,path);
if(method==='OPTIONS')return{statusCode:200,headers:CORS,body:''};
try{
if(path==='/auth/signup')return await authSignup(body);
if(path==='/auth/signin')return await authSignin(body);
if(path==='/auth/refresh')return await authRefresh(body);
if(path==='/auth/signout')return ok({success:true});
if(path==='/users/sync')return await syncUser(body);
if(path==='/users'&&method==='GET')return await listUsers();
if(segs[0]==='users'&&segs[2]==='balance')return await updateBalance(segs[1],body);
if(segs[0]==='users'&&segs[1]&&method==='GET')return await getUser(segs[1]);
if(path==='/rides/request')return await requestRide(body);
if(path==='/rides/fleet'&&method==='GET')return await getFleet();
if(path==='/rides/fleet')return await updateFleet(body);
if(path==='/rides/pricing'&&method==='GET')return await getPricing();
if(path==='/rides/pricing')return await updatePricing(body);
if(path==='/orders'&&method==='POST')return await placeOrder(body);
if(segs[0]==='orders'&&segs[2]==='status')return await updateOrderStatus(segs[1],body);
if(path==='/errands'&&method==='POST')return await placeErrand(body);
if(path==='/errands')return ok(await dbScan(T.ERRANDS));
if(path==='/payments/history')return await paymentHistory();
if(path==='/payments/mpesa')return await mpesaTopup(body);
if(path==='/payments/stripe')return await stripePayment(body);
if(path==='/payments/bank'&&method==='POST')return await bankTransferRequest(body);
if(path==='/payments/bank/approve')return await bankTransferApprove(body);
if(path==='/payments/transfer')return await p2pTransfer(body);
if(path==='/payments/swap')return await swapPayment(body);
if(path==='/vendors')return await listVendors();
if(segs[0]==='vendors'&&segs[2]==='status')return await updateVendorStatus(segs[1],body);
if(path==='/stations'&&method==='GET')return await listStations();
if(path==='/stations'&&method==='POST')return await registerStation(body);
if(segs[0]==='stations'&&segs[2]==='status')return await updateStationStatus(segs[1],body);
if(path==='/inventory')return await listInventory();
if(segs[0]==='inventory'&&method==='PUT')return await updateInventory(body);
if(segs[0]==='inventory'&&method==='DELETE')return await deleteInventory(segs[1]);
if(path==='/blockchain/seed')return await seedBlockchain(body);
if(path==='/blockchain/ledger')return await getLedger();
if(path==='/carbon/validate')return await carbonValidate();
if(path==='/carbon/rate')return await carbonRate();
if(path==='/defi/asset-loan')return await defiAssetLoan(body);
if(path==='/defi/insurance-loan')return await defiInsuranceLoan(body);
if(path==='/iot/telemetry')return await iotTelemetry();
if(path==='/iot/firmware')return await iotFirmware();
if(path==='/platform/settings'&&method==='GET')return await getPlatformSettings();
if(path==='/platform/settings')return await updatePlatformSettings(body);
if(path==='/platform/collection'&&method==='GET')return await getCollection();
if(path==='/platform/collection')return await updateCollection(body);
if(path==='/audit/logs')return await getAuditLogs();
if(path==='/audit/log')return await logAuditAction(body);
if(path.startsWith('/reporting'))return await getFinancialReport();
if(path==='/ai/generate')return await aiGenerate(body);
if(path==='/ai/stream')return await aiGenerate({prompt:body.message,responseFormat:'text'});
if(path==='/ai/locations')return await aiGenerate({prompt:'5 locations for: '+body.query+'. JSON [{address,lat,lng}]',responseFormat:'json'});
if(path==='/ai/distance')return await aiGenerate({prompt:'Driving distance from '+body.from+' to '+body.to+'. JSON {distanceKm,durationMinutes}',responseFormat:'json'});
if(path==='/ai/task-logistics')return await aiGenerate({prompt:'Task logistics '+body.vehicleModel+' battery '+body.batteryStatus+'%. JSON {totalDistanceKm,suggestedStation,rangeConfidence,estimatedConsumptionKwh}',responseFormat:'json'});
if(path==='/ai/rider-match')return await aiGenerate({prompt:'Best rider match. JSON [{riderId,matchScore,reasoning,efficiencyGain}]',responseFormat:'json'});
if(path==='/ai/route-optimize')return await aiGenerate({prompt:'Optimize delivery route. JSON {sequence,summary,bestPractices}',responseFormat:'json'});
if(path==='/ai/business-strategy')return await aiGenerate({prompt:'Corporate EV strategy 3 bullet points.',responseFormat:'text'});
if(path==='/notifications/push')return await pushNotification(body);
return err('Not found: '+method+' '+path,404);
}catch(e){console.error(e);return err(e.message||'Internal error',500);}
};