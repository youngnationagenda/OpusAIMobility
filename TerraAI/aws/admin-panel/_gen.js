const fs=require("fs");
const F="aws/admin-panel/index.js";
fs.writeFileSync(F,Buffer.from(""));
const W=s=>fs.appendFileSync(F,Buffer.from(s+"\n"));
W('// aimobility Admin Panel Lambda v2.0 - API Gateway + Lambda');
W('const https=require("https"),url=require("url"),qs=require("querystring");');
W('const API_BASE="https://pg4ulam66a.execute-api.us-east-1.amazonaws.com/prod/api/";');
W('const API_KEY="terraai-mobility-key-2024";');
W('const sessions={};');
