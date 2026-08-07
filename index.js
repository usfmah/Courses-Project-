const express = require ('express');

const app = express();

const router = require('./routes/routes')

app.use(express.json())


app.use('/api/courses', router)




app.listen(3000, () => {
    console.log('listen on port 3000')
})