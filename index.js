const express = require('express')
const app = express()

app.get('/ping', (req, res) => {
    res.json({
        message: 'pong'
    })
})

app.listen(process.env.PORT || 8080)
