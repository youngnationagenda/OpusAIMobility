import os,sys
OUTPUT="aws/admin-panel/index.js"
f=open(OUTPUT,"w",encoding="utf-8")
def w(s):f.write(s+"\n")
w('/**')
w(' * aimobility Admin Panel Lambda v2.0')
w(' * Serverless Node.js serving full HTML admin dashboard')
w(' */')
w("const https=require('https'),url=require('url'),qs=require('querystring');")
w("const API_BASE='https://pg4ulam66a.execute-api.us-east-1.amazonaws.com/prod/api/';")
w("const API_KEY='terraai-mobility-key-2024';")
w('const sessions={};')
w('')
w('function sid(){return Math.random().toString(36).slice(2)+Date.now().toString(36);}');
w("function getSession(c){const m=(c||'').split(';').map(x=>x.trim()).find(x=>x.startsWith('sid='));if(!m)return null;return sessions[m.slice(4)]||null;}")
w("function setCookie(id){return 'sid='+id+'; Path=/; HttpOnly; SameSite=Lax';}")
w('')
