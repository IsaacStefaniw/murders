const http=require('http'),fs=require('fs'),path=require('path');
const root=process.env.WEBDIST; const types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.ico':'image/x-icon','.json':'application/json','.svg':'image/svg+xml','.ttf':'font/ttf','.woff2':'font/woff2'};
http.createServer((req,res)=>{let p=path.join(root,decodeURIComponent(req.url.split('?')[0]));
 if(!fs.existsSync(p)||fs.statSync(p).isDirectory()) p=path.join(root,'index.html');
 res.writeHead(200,{'content-type':types[path.extname(p)]||'application/octet-stream'}); fs.createReadStream(p).pipe(res);}).listen(8787,'127.0.0.1');
