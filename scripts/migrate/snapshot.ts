import {
  RDSClient,
  CreateDBSnapshotCommand,
  DescribeDBSnapshotsCommand,
  AddTagsToResourceCommand,
  RestoreDBInstanceFromDBSnapshotCommand,
  DescribeDBInstancesCommand,
} from "@aws-sdk/client-rds";

const POLL_INTERVAL_MS = 10_000;
const MAX_POLL_ATTEMPTS = 180; // 30 minutes max wait

interface SnapshotOptions {
  instanceId: string;
  snapshotName: string;
  region?: string;
}

function parseArgs(argv: string[]): SnapshotOptions {
  const args = argv.slice(2);

  let instanceId = "";
  let snapshotName = "";
  let region: string | undefined;

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case "--instance-id":
        instanceId = args[++i] ?? "";
        break;
      case "--snapshot-name":
        snapshotName = args[++i] ?? "";
        break;
      case "--region":
        region = args[++i];
        break;
      default:
        // positional fallback: first positional = instanceId, second = snapshotName
        if (!instanceId) {
          instanceId = args[i];
        } else if (!snapshotName) {
          snapshotName = args[i];
        }
        break;
    }
  }

  if (!instanceId || !snapshotName) {
    console.error(
      "Usage: snapshot.ts --instance-id <RDS_INSTANCE_ID> --snapshot-name <SNAPSHOT_NAME> [--region <REGION>]"
    );
    console.error(
      "   or: snapshot.ts <RDS_INSTANCE_ID> <SNAPSHOT_NAME> [--region <REGION>]"
    );
    process.exit(1);
  }

  return { instanceId, snapshotName, region };
}

async function waitForSnapshotAvailable(
  client: RDSClient,
  snapshotId: string
): Promise<string> {
  for (let attempt = 0; attempt < MAX_POLL_ATTEMPTS; attempt++) {
    const response = await client.send(
      new DescribeDBSnapshotsCommand({
        DBSnapshotIdentifier: snapshotId,
      })
    );

    const snapshot = response.DBSnapshots?.[0];
    if (!snapshot) {
      throw new Error(`Snapshot ${snapshotId} not found`);
    }

    const status = snapshot.Status;
    console.log(
      `[snapshot] Status: ${status} (attempt ${attempt + 1}/${MAX_POLL_ATTEMPTS})`
    );

    if (status === "available") {
      return snapshot.DBSnapshotArn ?? "";
    }

    if (status === "failed" || status === "error") {
      throw new Error(
        `Snapshot ${snapshotId} entered failed state: ${status}`
      );
    }

    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
  }

  throw new Error(
    `Snapshot ${snapshotId} did not become available within ${(MAX_POLL_ATTEMPTS * POLL_INTERVAL_MS) / 60_000} minutes`
  );
}

async function tagSnapshot(
  client: RDSClient,
  snapshotArn: string
): Promise<void> {
  await client.send(
    new AddTagsToResourceCommand({
      ResourceName: snapshotArn,
      Tags: [
        {
          Key: "migration-baseline",
          Value: "true",
        },
      ],
    })
  );
}

export async function createPreMigrationSnapshot(
  options: SnapshotOptions
): Promise<{ snapshotId: string; snapshotArn: string }> {
  const client = new RDSClient({
    region: options.region ?? process.env.AWS_REGION ?? "us-east-1",
  });

  console.log(
    `[snapshot] Creating snapshot "${options.snapshotName}" for RDS instance "${options.instanceId}"...`
  );

  const createResponse = await client.send(
    new CreateDBSnapshotCommand({
      DBInstanceIdentifier: options.instanceId,
      DBSnapshotIdentifier: options.snapshotName,
    })
  );

  const snapshotId =
    createResponse.DBSnapshot?.DBSnapshotIdentifier ?? options.snapshotName;
  console.log(`[snapshot] Snapshot creation initiated: ${snapshotId}`);

  console.log("[snapshot] Waiting for snapshot to become available...");
  const snapshotArn = await waitForSnapshotAvailable(client, snapshotId);

  console.log("[snapshot] Tagging snapshot with migration-baseline...");
  await tagSnapshot(client, snapshotArn);

  console.log(`[snapshot] Snapshot ${snapshotId} is available and tagged.`);
  return { snapshotId, snapshotArn };
}

interface RestoreOptions {
  instanceId: string;
  snapshotIdentifier: string;
  targetInstanceId: string;
  region?: string;
}

async function waitForInstanceAvailable(
  client: RDSClient,
  instanceId: string
): Promise<string> {
  const MAX_RESTORE_ATTEMPTS = 60; // 30 minutes at 30s intervals
  const RESTORE_POLL_INTERVAL_MS = 30_000;

  for (let attempt = 0; attempt < MAX_RESTORE_ATTEMPTS; attempt++) {
    const response = await client.send(
      new DescribeDBInstancesCommand({ DBInstanceIdentifier: instanceId })
    );
    const instance = response.DBInstances?.[0];
    if (!instance) throw new Error(`Instance ${instanceId} not found`);

    const status = instance.DBInstanceStatus;
    console.log(`[restore] Instance status: ${status} (attempt ${attempt + 1}/${MAX_RESTORE_ATTEMPTS})`);

    if (status === "available") {
      return instance.Endpoint?.Address ?? "";
    }
    if (status === "failed" || status === "incompatible-restore") {
      throw new Error(`Restore failed: instance entered status '${status}'`);
    }
    await new Promise((resolve) => setTimeout(resolve, RESTORE_POLL_INTERVAL_MS));
  }
  throw new Error(`Instance ${instanceId} did not become available within 30 minutes`);
}

export async function restoreFromSnapshot(
  options: RestoreOptions
): Promise<{ restoredInstanceId: string; endpoint: string }> {
  const client = new RDSClient({
    region: options.region ?? process.env.AWS_REGION ?? "us-east-1",
  });

  console.log(
    `[restore] Restoring snapshot "${options.snapshotIdentifier}" to new instance "${options.targetInstanceId}"...`
  );

  await client.send(
    new RestoreDBInstanceFromDBSnapshotCommand({
      DBInstanceIdentifier: options.targetInstanceId,
      DBSnapshotIdentifier: options.snapshotIdentifier,
      DBInstanceClass: "db.t3.medium",
      MultiAZ: false,
      PubliclyAccessible: false,
      AutoMinorVersionUpgrade: true,
      Tags: [
        { Key: "restored-from", Value: options.snapshotIdentifier },
        { Key: "restore-timestamp", Value: new Date().toISOString() },
      ],
    })
  );

  console.log(`[restore] Restore initiated. Waiting for instance to become available...`);
  const endpoint = await waitForInstanceAvailable(client, options.targetInstanceId);

  console.log(`[restore] Instance ${options.targetInstanceId} is available at ${endpoint}`);
  return { restoredInstanceId: options.targetInstanceId, endpoint };
}

// CLI entry point
async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const mode = args.includes("--mode") ? args[args.indexOf("--mode") + 1] : "create";

  if (mode === "restore") {
    const snapshotId = args.includes("--snapshot-id") ? args[args.indexOf("--snapshot-id") + 1] : "";
    const targetId = args.includes("--target-id") ? args[args.indexOf("--target-id") + 1] : "";
    const region = args.includes("--region") ? args[args.indexOf("--region") + 1] : undefined;
    // instanceId is the original instance (not needed for restore, but kept for compat)
    const instanceId = args.includes("--instance-id") ? args[args.indexOf("--instance-id") + 1] : "original";

    if (!snapshotId || !targetId) {
      console.error("Usage for restore: snapshot.ts --mode restore --snapshot-id <ID> --target-id <NEW_INSTANCE_ID> [--region <REGION>]");
      process.exit(1);
    }

    try {
      const result = await restoreFromSnapshot({ instanceId, snapshotIdentifier: snapshotId, targetInstanceId: targetId, region });
      console.log(`[restore] Success: ${JSON.stringify(result)}`);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`[restore] ERROR: ${message}`);
      process.exit(1);
    }
  } else {
    const options = parseArgs(process.argv);
    try {
      const result = await createPreMigrationSnapshot(options);
      console.log(`[snapshot] Success: ${JSON.stringify(result)}`);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`[snapshot] ERROR: ${message}`);
      process.exit(1);
    }
  }
}

main();
