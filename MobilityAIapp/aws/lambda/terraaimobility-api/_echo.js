// Temporarily inject echo endpoint into index.js to see raw event
// Run: node _echo.js  — patches index.js, deploy, test, revert
const fs = require('fs');
let code = fs.readFileSync('aws/lambda/api/index.js', 'utf8');

const ECHO_ROUTE = `    case 'echo': case 'debug': {
      // Returns exact raw event for debugging
      return response(200, { code:'200', msg: {
        rawPath: event.rawPath,
        httpMethod: event.httpMethod || (event.requestContext&&event.requestContext.http&&event.requestContext.http.method),
        headers: event.headers,
        body: event.body,
        isBase64Encoded: event.isBase64Encoded,
        queryStringParameters: event.queryStringParameters,
        parsedBody: body,
      }});
    }`;

// Inject before the 'health' case
if (!code.includes("case 'echo'")) {
  code = code.replace(
    "    case 'health': case 'ping':",
    ECHO_ROUTE + "\n    case 'health': case 'ping':"
  );
  // Also pass event to handleRoute
  code = code.replace(
    'async function handleRoute(path, body) {',
    'async function handleRoute(path, body, event) {'
  );
  code = code.replace(
    'try { return await handleRoute(getPath(event), getBody(event)); }',
    'try { return await handleRoute(getPath(event), getBody(event), event); }'
  );
  fs.writeFileSync('aws/lambda/api/index.js', Buffer.from(code));
  process.stdout.write('✅ Echo endpoint injected\n');
} else {
  process.stdout.write('ℹ️  Echo endpoint already present\n');
}
