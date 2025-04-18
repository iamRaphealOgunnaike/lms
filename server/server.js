import express from 'express'
import cors from  'cors'
import 'dotenv/config'

// initialize express
const app = express()

// middlewares
app.use(cors())

// Routes
app.get('/', (req, res) => res.send('API Working'))

// Port
const PORT  = process.env.PORT || 5000

app.listen(PORT, ()=>{
    console.log(`Server is running on port ${PORT}`)
})