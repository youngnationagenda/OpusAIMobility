'use strict';
const fs = require('fs');

let code = fs.readFileSync('./backend/lambda/index.js', 'utf8');

// 1. Add GoGrab require at top
if (!code.includes('handleGoGrab')) {
  code = code.replace(
    "'use strict';\r\n",
    "'use strict';\r\n// GoGrab Legacy Integration\r\nconst{handleGoGrab}=require('./gograb-api/gograb-handler');\r\n"
  );
  console.log('require injected:', code.includes('handleGoGrab'));
}

// 2. Add gograb route
if (!code.includes("path.startsWith('/gograb')")) {
  const healthRoute = "if(path==='/health'&&method==='GET')return ok({status:'ok',timestamp:Date.now(),service:'opusaimobility-api'});";
  const gograbRoute = "if(path.startsWith('/gograb'))return await handleGoGrab(method,path,segs,body,event.queryStringParameters||{});\r\n";
  code = code.replace(healthRoute, gograbRoute + healthRoute);
  console.log('route injected:', code.includes("/gograb"));
}

fs.writeFileSync('./backend/lambda/index.js', code);
console.log('Done. Size:', code.length);
