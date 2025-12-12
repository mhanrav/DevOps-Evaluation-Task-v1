const express = require('express');
const app = express();
const port = process.env.PORT || 3000;


app.get('/', (req, res) => {
res.json({ message: `Hi from ${process.env.ENV || 'local'} this is an updated on 12122025` });
});


app.get('/health', (req, res) => res.sendStatus(200));


if (require.main === module) {
app.listen(port, () => console.log(`App listening on port ${port}`));
}


module.exports = app;