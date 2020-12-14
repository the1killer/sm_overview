const express = require('express')
const path = require('path');


const app = express();
const port = 8080;

app.use('/assets',express.static('assets')); //host static assets
app.use('/img',express.static('img')); //host map imgs
app.use('/libs',express.static('libs')); //host static assets

app.get('/', (req, res) => {
//   res.send('Hello World!')
    res.sendFile(path.join(__dirname,"index.html"));
});

app.get('/map.html', (req, res) => {
    //   res.send('Hello World!')
        res.sendFile(path.join(__dirname,"map.html"));
    });

// app.get('/systems.json', (req, res) => {
//     res.sendFile(path.join(__dirname,"systems.json"));
// });

// app.get('/style.css', (req, res) => {
//     res.sendFile(path.join(__dirname,"style.css"));
// });

// app.get('/bodybg.png', (req, res) => {
//     res.sendFile(path.join(__dirname,"bodybg.png"));
// });

// app.get('/timers.js', (req, res) => {
//     res.sendFile(path.join(__dirname,"timers.js"));
// });

app.listen(port, () => {
  console.log(`Example app listening on port ${port}!`)
});