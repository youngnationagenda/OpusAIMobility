'use strict';
const {DynamoDBClient}=require('@aws-sdk/client-dynamodb');
const {DynamoDBDocumentClient,ScanCommand,PutCommand}=require('@aws-sdk/lib-dynamodb');
const ddb=DynamoDBDocumentClient.from(new DynamoDBClient({region:process.env.AWS_REGION||'us-east-1'}));
async function sync(){
  const now=new Date().toISOString();
  const put=async(key,items)=>{await ddb.send(new PutCommand({TableName:'aimobility-config',Item:{configKey:key,items,updated:now}}));console.log('  ',key,'->',items.length,'items');};
  const rt=await ddb.send(new ScanCommand({TableName:'gograb-ride-types'}));
  await put('ride_types',(rt.Items||[]).map(r=>({id:String(r.id||''),name:r.name||'',description:r.description||'',passenger_capacity:String(r.passengerCapacity||4),base_fare:String(r.baseFare||2),cost_per_minute:String(r.costPerMinute||0.25),cost_per_distance:String(r.costPerDistance||1.5),distance_unit:r.distanceUnit||'km',image:r.image||''})));
  const fc=await ddb.send(new ScanCommand({TableName:'gograb-food-categories'}));
  await put('food_categories',(fc.Items||[]).map(r=>({id:String(r.id||''),title:r.name||r.title||'',image:r.image||'',icon:r.icon||''})));
  const gt=await ddb.send(new ScanCommand({TableName:'gograb-good-types'}));
  await put('good_types',(gt.Items||[]).map(r=>({id:String(r.id||''),name:r.name||''})));
  const ps=await ddb.send(new ScanCommand({TableName:'gograb-package-sizes'}));
  await put('package_sizes',(ps.Items||[]).map(r=>({id:String(r.id||''),title:r.title||r.name||'',description:r.description||'',price:String(r.price||0),image:r.image||''})));
  const sc=await ddb.send(new ScanCommand({TableName:'gograb-service-charges'}));
  await put('service_charges',(sc.Items||[]).map(r=>({id:String(r.id||''),name:r.name||'',value:String(r.value||0),type:r.type||'percentage'})));
  const ct=await ddb.send(new ScanCommand({TableName:'gograb-app-config',FilterExpression:'configType = :t',ExpressionAttributeValues:{':t':'country'}}));
  const countries=(ct.Items||[]).map(r=>({id:String(r.id||''),name:r.name||r.country||'',code:String(r.phoneCode||r.countryCode||r.code||''),iso:r.iso||'',iso_code:r.iso||'',currency_symbol:r.currencySymbol||r.currency_symbol||'KSh',currency_code:r.currencyCode||r.currency_code||'KES',active:1,default:(r.name==='Kenya'||r.country==='Kenya')?1:0}));
  if(countries.length>0) await put('countries',countries);
  else await put('countries',[{id:'1',name:'Kenya',code:'+254',iso:'KE',iso_code:'KE',currency_symbol:'KSh',currency_code:'KES',active:1,default:1},{id:'2',name:'Uganda',code:'+256',iso:'UG',iso_code:'UG',currency_symbol:'USh',currency_code:'UGX',active:1,default:0},{id:'3',name:'Tanzania',code:'+255',iso:'TZ',iso_code:'TZ',currency_symbol:'TSh',currency_code:'TZS',active:1,default:0},{id:'226',name:'United States',code:'+1',iso:'US',iso_code:'US',currency_symbol:'USD',currency_code:'USD',active:1,default:0}]);
  const sl=await ddb.send(new ScanCommand({TableName:'gograb-app-config',FilterExpression:'configType = :t',ExpressionAttributeValues:{':t':'app_slider'}}));
  const sliders=(sl.Items||[]).map(r=>({id:String(r.id||''),image:r.image||'',url:r.url||'',active:1}));
  await put('sliders',sliders.length>0?sliders:[{id:'1',image:'',url:'https://opusaimobility.yna.co.ke',active:1}]);
  await put('coupons',[{id:'1',coupon_code:'WELCOME20',discount:'20',limit_users:'100',expiry_date:'2027-12-31'},{id:'2',coupon_code:'RIDE10',discount:'10',limit_users:'500',expiry_date:'2027-12-31'},{id:'3',coupon_code:'FOOD15',discount:'15',limit_users:'200',expiry_date:'2027-12-31'}]);
  await put('report_reasons',[{id:'1',title:'Rude driver'},{id:'2',title:'Wrong route taken'},{id:'3',title:'Vehicle was unclean'},{id:'4',title:'Driver was late'},{id:'5',title:'Safety concern'},{id:'6',title:'Incorrect fare charged'}]);
  const rs=await ddb.send(new ScanCommand({TableName:'gograb-restaurants'}));
  let rCount=0; for(const r of (rs.Items||[])){if(!r.restaurantId&&r.id){const item={restaurantId:String(r.id),id:String(r.id),name:r.name||'',image:r.image||'',lat:String(r.lat||''),long:String(r.long||''),delivery_fee:String(r.deliveryFee||2),delivery_min_time:'20',delivery_max_time:'40',min_order_price:'10',rating:'4.0',is_open:true,created:now}; await ddb.send(new PutCommand({TableName:'aimobility-restaurants',Item:item})).catch(()=>{}); rCount++;}}
  console.log('  restaurants->aimobility-restaurants:',rCount);
  console.log('Sync complete.');
}
sync().catch(e=>{console.error('Sync failed:',e.message);process.exit(1);});