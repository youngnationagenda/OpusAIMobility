/**
 * GoGrab → OpusAIMobility DynamoDB Table Provisioner
 *
 * Creates all 23 DynamoDB tables migrated from gograb MySQL schema.
 * Run: node provision-tables.js
 */

'use strict';
const { DynamoDBClient, CreateTableCommand, DescribeTableCommand, waitUntilTableExists } = require('@aws-sdk/client-dynamodb');
const tables = require('./gograb-dynamodb-tables.json');
// sync-config appended below

const client = new DynamoDBClient({ region: process.env.AWS_REGION || 'us-east-1' });

async function tableExists(name) {
  try {
    await client.send(new DescribeTableCommand({ TableName: name }));
    return true;
  } catch (e) {
    if (e.name === 'ResourceNotFoundException') return false;
    throw e;
  }
}

async function provision() {
  console.log(`\n🗄️  GoGrab DynamoDB Table Provisioner`);
  console.log(`📋 Tables to provision: ${tables.length}\n`);

  let created = 0, skipped = 0, failed = 0;

  for (const table of tables) {
    const name = table.TableName;
    try {
      const exists = await tableExists(name);
      if (exists) {
        console.log(`  ⏭️  SKIP  ${name} (already exists)`);
        skipped++;
        continue;
      }

      await client.send(new CreateTableCommand(table));
      console.log(`  ✅ CREATE ${name}`);

      // Wait for table to become ACTIVE
      await waitUntilTableExists(
        { client, maxWaitTime: 60, minDelay: 2 },
        { TableName: name }
      );
      console.log(`       → ACTIVE`);
      created++;
    } catch (e) {
      console.error(`  ❌ FAIL  ${name}: ${e.message}`);
      failed++;
    }
  }

  console.log(`\n✅ Created: ${created}  ⏭️  Skipped: ${skipped}  ❌ Failed: ${failed}`);
}

provision().catch(console.error);
