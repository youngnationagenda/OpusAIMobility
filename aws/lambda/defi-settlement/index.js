'use strict';
/**
 * terraai-defi-settlement Lambda  v1.0
 * ──────────────────────────────────────
 * Triggered by: EventBridge cron(59 23 * * ? *)  — 23:59 UTC daily
 *
 * Logic:
 *  1. Scan opusaimobility-users for riders with activeAssetLoan or activeInsuranceLoan
 *  2. Deduct dailyRepayment from walletBalance (conditional write — no negatives)
 *  3. Update remainingBalance on loan
 *  4. Mark loan completed if remainingBalance <= 0
 *  5. Mark 'overdue' if walletBalance < dailyRepayment
 *  6. Record transaction in opusaimobility-transactions
 *  7. SNS push notification to rider
 *
 * TICKET: TERRA-050
 */

const { DynamoDBClient }    = require('@aws-sdk/client-dynamodb');
const {
  DynamoDBDocumentClient,
  ScanCommand,
  PutCommand,
  UpdateCommand,
} = require('@aws-sdk/lib-dynamodb');

const { SNSClient, PublishCommand } = require('@aws-sdk/client-sns');

const REGION         = process.env.AWS_REGION_ENV   || 'us-east-1';
const TABLE_USERS    = 'opusaimobility-users';
const TABLE_TX       = 'opusaimobility-transactions';
const SNS_TOPIC_PUSH = process.env.SNS_TOPIC_PUSH   || 'arn:aws:sns:us-east-1:683541453923:opusaimobility-push-notifications';

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({ region: REGION }));
const sns = new SNSClient({ region: REGION });

function genId(prefix) {
  return `${prefix}-${Date.now().toString(36).toUpperCase()}`;
}

async function sendPush(userId, title, message) {
  try {
    await sns.send(new PublishCommand({
      TopicArn: SNS_TOPIC_PUSH,
      Message:  JSON.stringify({ userId, title, message, type: 'defi_deduction' }),
      Subject:  title,
    }));
  } catch (e) {
    console.warn(`[DeFi] SNS push failed for ${userId}:`, e.message);
  }
}

async function processLoan(user, loanField) {
  const loan = user.riderProfile?.[loanField];
  if (!loan || loan.remainingBalance <= 0) return null;

  const daily   = parseFloat(loan.dailyRepayment) || 0;
  const balance = parseFloat(user.walletBalance)  || 0;
  const now     = Date.now();

  if (daily <= 0) return null;

  const loanType   = loanField === 'activeAssetLoan' ? 'Asset Loan' : 'Insurance Loan';
  const overdue    = balance < daily;
  const deductAmt  = overdue ? balance : daily;
  const newBalance = overdue ? 0 : balance - daily;
  const newLoanBal = Math.max(0, loan.remainingBalance - deductAmt);
  const completed  = newLoanBal <= 0;

  console.log(`[DeFi] Processing ${loanType} for rider ${user.id}: deduct=${deductAmt} overdue=${overdue} completed=${completed}`);

  // Update user wallet + loan
  try {
    const updatedLoan = {
      ...loan,
      remainingBalance: newLoanBal,
      ...(completed ? { status: 'completed', completedAt: now } : {}),
      ...(overdue   ? { status: 'overdue'   } : { status: 'active' }),
    };

    await ddb.send(new UpdateCommand({
      TableName:                 TABLE_USERS,
      Key:                       { id: user.id },
      UpdateExpression:          `SET walletBalance = :wb, riderProfile.${loanField} = :loan`,
      ExpressionAttributeValues: { ':wb': newBalance, ':loan': updatedLoan },
    }));

    // Record transaction
    const tx = {
      id:          genId('DFI'),
      userId:      user.id,
      amount:      deductAmt,
      currency:    'USD',
      status:      overdue ? 'partial' : 'successful',
      method:      'AutoDeduct',
      gateway:     'DeFi Settlement',
      timestamp:   now,
      description: `${loanType} daily repayment${overdue ? ' (partial — overdue)' : ''}`,
      userType:    'rider',
      direction:   'out',
    };
    await ddb.send(new PutCommand({ TableName: TABLE_TX, Item: tx }));

    // Push notification to rider
    if (completed) {
      await sendPush(user.id, '🎉 Loan Fully Repaid!', `Your ${loanType} has been fully repaid. Congratulations!`);
    } else if (overdue) {
      await sendPush(user.id, '⚠️ Insufficient Wallet Balance', `Your ${loanType} repayment of $${daily.toFixed(2)} could not be fully processed. Please top up your wallet.`);
    } else {
      await sendPush(user.id, '💳 Daily Repayment Processed', `$${deductAmt.toFixed(2)} deducted for your ${loanType}. Remaining: $${newLoanBal.toFixed(2)}`);
    }

    return { userId: user.id, loanType, deducted: deductAmt, remaining: newLoanBal, overdue, completed };

  } catch (e) {
    console.error(`[DeFi] Failed to process ${loanType} for ${user.id}:`, e.message);
    return null;
  }
}

exports.handler = async (event) => {
  console.log('[DeFi Settlement] Starting daily run at', new Date().toISOString());

  let users;
  try {
    const result = await ddb.send(new ScanCommand({ TableName: TABLE_USERS }));
    users = result.Items || [];
  } catch (e) {
    console.error('[DeFi] Failed to scan users:', e.message);
    return { statusCode: 500, body: 'Scan failed' };
  }

  const ridersWithLoans = users.filter(u =>
    u.role === 'rider' &&
    u.riderProfile &&
    (u.riderProfile.activeAssetLoan || u.riderProfile.activeInsuranceLoan)
  );

  console.log(`[DeFi] Found ${ridersWithLoans.length} riders with active loans`);

  const results = await Promise.allSettled(
    ridersWithLoans.flatMap(user => [
      u => processLoan(u, 'activeAssetLoan'),
      u => processLoan(u, 'activeInsuranceLoan'),
    ].map(fn => fn(user)))
  );

  const processed = results
    .filter(r => r.status === 'fulfilled' && r.value)
    .map(r => r.value);

  const summary = {
    totalRiders:    ridersWithLoans.length,
    loansProcessed: processed.length,
    completed:      processed.filter(r => r.completed).length,
    overdue:        processed.filter(r => r.overdue).length,
    totalDeducted:  processed.reduce((s, r) => s + r.deducted, 0).toFixed(2),
    timestamp:      new Date().toISOString(),
  };

  console.log('[DeFi Settlement] Summary:', JSON.stringify(summary));
  return { statusCode: 200, body: JSON.stringify(summary) };
};
