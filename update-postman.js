const fs = require('fs');

const CONSUMER_KEY    = 'vIM22PqF28VwSlqpVVDsl6iY7Jx0scfYxS2LuP6PbwGoWd7K';
const CONSUMER_SECRET = 'gZX7LcSxyXTHbL5GXq4qy0pZKHvaSJ4BumGMAMYLnlem2bra8vo4agvq5xuiYvE5';
const BASIC_AUTH      = 'dklNMjJQcUYyOFZ3U2xxcFZWRHNsNmlZN0p4MHNjZll4UzJMdVA2UGJ3R29XZDdLOmdaWDdMY1N4eVhUSGJMNUdYcTRxeTBwWktIdmFTSjRCdW1HTUFNWUxubGVtMmJyYTh2bzRhZ3ZxNXh1aVl2RTU=';
const PASSKEY         = 'bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919';
const SHORTCODE       = '174379';
const TEST_PHONE      = '254708374149';
const CALLBACK_URL    = 'https://0wv2nyk3je.execute-api.us-east-1.amazonaws.com/prod/payments/mpesa/callback';

const file = 'Safaricom APIs.postman_collection.json';
let col = JSON.parse(fs.readFileSync(file, 'utf8'));

// 1. Update collection name + description
col.info.name = 'Safaricom APIs — OpusAIMobility (Sandbox)';
col.info.description =
  '# OpusAIMobility — Safaricom Daraja API\n\n' +
  'App: OpusAIMobility | Env: Sandbox | Updated: 2026-07-09\n\n' +
  '## Credentials\n' +
  '- Consumer Key: ' + CONSUMER_KEY + '\n' +
  '- Consumer Secret: ' + CONSUMER_SECRET + '\n' +
  '- Basic Auth Header: ' + BASIC_AUTH + '\n' +
  '- Passkey: ' + PASSKEY + '\n' +
  '- ShortCode: ' + SHORTCODE + '\n' +
  '- Test Phone: ' + TEST_PHONE + '\n' +
  '- Initiator: testapi / Safaricom123!!\n' +
  '- PartyA: 600977 | PartyB: 600000\n\n' +
  '## Workflow\n' +
  '1. Run "Generate OAuth Access Token" → copy token into {{access_token}}\n' +
  '2. Run "Initiate STK Push" → phone ' + TEST_PHONE + ' gets M-Pesa prompt\n' +
  '3. Daraja POSTs result to: ' + CALLBACK_URL;

// 2. Update collection variables
col.variable = [
  { key: 'consumer_key',    value: CONSUMER_KEY,    type: 'string' },
  { key: 'consumer_secret', value: CONSUMER_SECRET, type: 'string' },
  { key: 'basic_auth',      value: BASIC_AUTH,      type: 'string' },
  { key: 'access_token',    value: '',              type: 'string' },
  { key: 'shortcode',       value: SHORTCODE,       type: 'string' },
  { key: 'passkey',         value: PASSKEY,         type: 'string' },
  { key: 'test_phone',      value: TEST_PHONE,      type: 'string' },
  { key: 'callback_url',    value: CALLBACK_URL,    type: 'string' },
  { key: 'initiator_name',  value: 'testapi',       type: 'string' },
  { key: 'initiator_pass',  value: 'Safaricom123!!',type: 'string' },
  { key: 'party_a',         value: '600977',        type: 'string' },
  { key: 'party_b',         value: '600000',        type: 'string' },
];

// 3. Walk all items and wire credentials into auth + body
function patchItems(items) {
  for (const item of items) {
    if (item.item) { patchItems(item.item); continue; }
    const req = item.request;
    if (!req) continue;

    // Fix Basic Auth requests (OAuth token endpoints)
    if (req.auth?.type === 'basic') {
      req.auth.basic = [
        { key: 'username', value: '{{consumer_key}}',    type: 'string' },
        { key: 'password', value: '{{consumer_secret}}', type: 'string' },
        { key: 'showPassword', value: false, type: 'boolean' },
      ];
      // Add pre-request script to auto-capture token
      item.event = item.event || [];
      const hasTest = item.event.find(e => e.listen === 'test');
      if (!hasTest) {
        item.event.push({
          listen: 'test',
          script: {
            type: 'text/javascript',
            exec: [
              'const res = pm.response.json();',
              'if (res.access_token) {',
              '  pm.collectionVariables.set("access_token", res.access_token);',
              '  console.log("✅ access_token captured:", res.access_token.slice(0,20) + "...");',
              '}',
            ],
          },
        });
      }
    }

    // Fix Bearer token requests — use {{access_token}}
    if (req.auth?.type === 'bearer') {
      req.auth.bearer = [{ key: 'token', value: '{{access_token}}', type: 'string' }];
    }

    // Fix STK Push body
    if (item.name === 'Initiate a Lipa na M-Pesa Online Payment' && req.body?.raw) {
      req.body.raw = JSON.stringify({
        BusinessShortCode: '{{shortcode}}',
        Password:          '{{mpesa_password}}',
        Timestamp:         '{{mpesa_timestamp}}',
        TransactionType:   'CustomerPayBillOnline',
        Amount:            1,
        PartyA:            '{{test_phone}}',
        PartyB:            '{{shortcode}}',
        PhoneNumber:       '{{test_phone}}',
        CallBackURL:       '{{callback_url}}',
        AccountReference:  'OpusAIMobility',
        TransactionDesc:   'OpusAIMobility Wallet Top-up',
      }, null, 2);
      // Add pre-request script to compute password + timestamp
      item.event = item.event || [];
      item.event = item.event.filter(e => e.listen !== 'prerequest');
      item.event.push({
        listen: 'prerequest',
        script: {
          type: 'text/javascript',
          exec: [
            'const shortcode = pm.collectionVariables.get("shortcode");',
            'const passkey   = pm.collectionVariables.get("passkey");',
            'const now        = new Date();',
            'const ts         = now.toISOString().replace(/[^0-9]/g,"").slice(0,14);',
            'const password   = btoa(shortcode + passkey + ts);',
            'pm.collectionVariables.set("mpesa_timestamp", ts);',
            'pm.collectionVariables.set("mpesa_password",  password);',
            'console.log("Timestamp:", ts);',
          ],
        },
      });
    }

    // Fix C2B Register URL with real callback
    if (item.name === 'Register C2B Confirmation and Validation URLs' && req.body?.raw) {
      req.body.raw = JSON.stringify({
        ShortCode:       '{{shortcode}}',
        ResponseType:    'Completed',
        ConfirmationURL: CALLBACK_URL,
        ValidationURL:   CALLBACK_URL + '/validate',
      }, null, 2);
    }

    // Fix B2B body with real initiator
    if (item.name === 'Make a B2B Payment Request' && req.body?.raw) {
      req.body.raw = JSON.stringify({
        Initiator:              '{{initiator_name}}',
        SecurityCredential:     '{{initiator_pass}}',
        CommandID:              'BusinessPayBill',
        SenderIdentifierType:   '4',
        RecieverIdentifierType: '4',
        Amount:                 '',
        PartyA:                 '{{party_a}}',
        PartyB:                 '{{party_b}}',
        AccountReference:       'OpusAIMobility',
        Remarks:                'B2B Transfer',
        QueueTimeOutURL:        CALLBACK_URL + '/timeout',
        ResultURL:              CALLBACK_URL + '/result',
      }, null, 2);
    }

    // Fix B2C body with real initiator
    if ((item.name === 'Make a B2C Payment Request' || item.name === 'Make a B2Pochi Payment Request') && req.body?.raw) {
      const body = {
        InitiatorName:      '{{initiator_name}}',
        SecurityCredential: '{{initiator_pass}}',
        CommandID:          'BusinessPayment',
        Amount:             '',
        PartyA:             '{{party_a}}',
        PartyB:             '{{test_phone}}',
        Remarks:            'B2C Payment',
        QueueTimeOutURL:    CALLBACK_URL + '/timeout',
        ResultURL:          CALLBACK_URL + '/result',
        Occasion:           'OpusAIMobility',
      };
      if (item.name === 'Make a B2Pochi Payment Request') body.OriginatorConversationID = '{{$guid}}';
      req.body.raw = JSON.stringify(body, null, 2);
    }

    // Fix hardcoded Authorization headers → use variable
    if (req.header) {
      req.header = req.header.map(h => {
        if (h.key === 'Authorization' && h.value === 'Bearer <Access-Token>') {
          return { ...h, value: 'Bearer {{access_token}}' };
        }
        return h;
      });
    }
  }
}

patchItems(col.item);

// 4. Add {{passkey}} and {{shortcode}} collection variables (already added above)
col.variable.push(
  { key: 'mpesa_timestamp', value: '', type: 'string' },
  { key: 'mpesa_password',  value: '', type: 'string' },
);

fs.writeFileSync(file, JSON.stringify(col, null, 2), 'utf8');
console.log('✅ Postman collection updated:', file);
console.log('   Variables set:', col.variable.length);
console.log('   Collection name:', col.info.name);
