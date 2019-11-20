const fs = require('fs');

const express = require('express');

const server = express();

server.get('/', async (req, res) => {
});

const port = 8000;
server.listen(port, () => console.log('listening on port ' + port));
