/**
 * seed-config.js — One-time script to populate aimobility-config DynamoDB table.
 *
 * Usage: node seed-config.js
 * Requires AWS credentials in environment (or ~/.aws/credentials).
 */
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({ region: process.env.AWS_REGION || 'us-east-1' });
const ddb = DynamoDBDocumentClient.from(client);
const TABLE = 'aimobility-config';

const configs = {
  countries: [
    { id:'1',name:'Kenya',code:'+254',iso:'KE',iso_code:'KE',currency_symbol:'KSh',currency_code:'KES' },
    { id:'226',name:'United States',code:'+1',iso:'US',iso_code:'US',currency_symbol:'$',currency_code:'USD' },
  ],
  ride_types: [
    { id:'1',name:'aimobility X',description:'Affordable rides',passenger_capacity:'4',base_fare:'2.00',cost_per_minute:'0.25',cost_per_distance:'1.50',distance_unit:'km',image:'' },
    { id:'2',name:'aimobility XL',description:'Group rides',passenger_capacity:'6',base_fare:'3.50',cost_per_minute:'0.35',cost_per_distance:'2.00',distance_unit:'km',image:'' },
    { id:'3',name:'aimobility Comfort',description:'Premium rides',passenger_capacity:'4',base_fare:'5.00',cost_per_minute:'0.45',cost_per_distance:'2.50',distance_unit:'km',image:'' },
  ],
  food_categories: [
    { id:'1',title:'Burgers',image:'',icon:'' },
    { id:'2',title:'Pizza',image:'',icon:'' },
    { id:'3',title:'Sushi',image:'',icon:'' },
  ],
  good_types: [
    { id:'1',name:'Electronics' },
    { id:'2',name:'Clothing' },
    { id:'3',name:'Documents' },
    { id:'4',name:'Food' },
  ],
  package_sizes: [
    { id:'1',title:'Small',description:'Up to 5kg',price:'5.00',image:'' },
    { id:'2',title:'Medium',description:'5-15kg',price:'10.00',image:'' },
    { id:'3',title:'Large',description:'15-30kg',price:'20.00',image:'' },
  ],
  service_charges: [
    { id:'1',name:'Food Service Fee',value:'10',type:'percentage' },
    { id:'2',name:'Ride Service Fee',value:'15',type:'percentage' },
    { id:'3',name:'Parcel Service Fee',value:'5',type:'percentage' },
  ],
  report_reasons: [
    { id:'1',title:'Rude driver' },
    { id:'2',title:'Wrong route taken' },
    { id:'3',title:'Vehicle was unclean' },
  ],
  coupons: [
    { id:'1',coupon_code:'WELCOME20',discount:'20',limit_users:'100',expiry_date:'2026-12-31' },
    { id:'2',coupon_code:'RIDE10',discount:'10',limit_users:'500',expiry_date:'2026-12-31' },
  ],
  sliders: [
    { id:'1',image:'',url:'https://aimobility.app/promo/1' },
  ],
};

async function seed() {
  for (const [key, items] of Object.entries(configs)) {
    console.log(`Seeding ${key} (${items.length} items)...`);
    await ddb.send(new PutCommand({
      TableName: TABLE,
      Item: { configKey: key, items, updated: new Date().toISOString() },
    }));
  }
  console.log('Done! All config seeded to', TABLE);
}

seed().catch(e => { console.error('Seed failed:', e); process.exit(1); });
