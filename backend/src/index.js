const express = require('express');
const app = express();

app.use(express.json());

app.use('/items', require('./routes/items'));
app.use('/categories', require('./routes/categories'));
app.use('/brands', require('./routes/brands'));
app.use('/users', require('./routes/users'));

app.listen(3000, () => console.log("Server running on port 3000"));