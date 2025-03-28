const express = require('express');
const path = require('path');
const app = express();
const port = 3000;
const https = require('https');
const fs = require('fs');

const PORT = 443;
const options = {
	  key: fs.readFileSync("/etc/letsencrypt/live/ottavhq.com/privkey.pem"),
	  cert: fs.readFileSync("/etc/letsencrypt/live/ottavhq.com/fullchain.pem"),
};

app.use(express.static('public'));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

https.createServer(options, app).listen(PORT, () => {
	  console.log(`Server running at https://ottavhq.com`);
});
