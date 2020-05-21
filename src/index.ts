import { createServer } from 'http';

const server = createServer((req, res) => {
    console.log(req.url);
    res.statusCode = 201;
    res.write('success!');
    res.end();
});

server.listen(3000, () => console.log('server started'));