const path = require('path')
const express = require('express')
const mongoose = require('mongoose')
const dotenv = require('dotenv')
const morgan = require('morgan')
const exphbs = require('express-handlebars')
const methodOverride = require('method-override')
const passport = require('passport')
const session = require('express-session')
const MongoStore = require('connect-mongo')
const connectDB = require('./config/db')

// LOAD CONFIG
dotenv.config({ path: './config/config.env' }) //for global variables

// PASSPORT CONFIG
require('./config/passport')(passport)

// CONNECT DB
connectDB()

// INITIALIZE APP
const app = express()

// BODY PARSER
app.use(express.urlencoded({ extended: false }))
app.use(express.json())

// METHOD OVERRIDE
app.use(methodOverride(function (req, res) {
    if(req.body && typeof req.body === 'object' && '_method' in req.body) {
        // look in urlencoded POST bodies and delete it
        var method = req.body._method
        delete req.body._method
        return method
    }
}))

// FOR LOGIN
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'))
}

// HANDLEBARS HELPERS
const { formatDate, stripTags, truncate, editIcon, select } = require('./helpers/hbs')

// HANDLEBARS
// can use handlesbars with .hbs shortcut
app.engine('.hbs', exphbs({
    helpers: {
        formatDate,
        stripTags,
        truncate,
        editIcon,
        select
    }, defaultLayout: 'main', extname: '.hbs'
}));
app.set('view engine', '.hbs');

// SESSIONS MIDDLEWARE
app.use(session({
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ mongoUrl: process.env.MONGO_URI })
}))

// PASSPORT MIDDLEWARE
app.use(passport.initialize())
app.use(passport.session())

// SET GLOBAL VARIABLES
app.use(function (req, res, next) {
    res.locals.user = req.user || null
    next()
})

// STATIC FOLDER
app.use(express.static(path.join(__dirname, 'assets')))

// ROUTES
app.use('/', require('./routes/index'))
app.use('/auth', require('./routes/auth'))
app.use('/stories', require('./routes/stories'))

// process.env is used to access variables stored in config file, if not available, runs of 5000
const PORT = process.env.PORT || 5000

app.listen(PORT, console.log(`Server running in ${process.env.NODE_ENV} mode on port http://localhost:${PORT}`))


