const express = require("express")
const morgan =require("morgan")
const hbs= require("express-handlebars")
const exphbs = require("express-handlebars")
const path= require("path")
const passport = require("passport")
const favicon = require('serve-favicon')
const flash = require("connect-flash")
const session = require("express-session")
const MySQLStore = require("express-mysql-session")


const app = express()
require("./lib/passport")

const database = {

    host:"127.0.0.1",
    user: "root",
    port:"3306",
    password: "",
    database: "ferrete"
  
  
  }

app.set ("port", process.env.PORT || 2022)
app.set("views",path.join(__dirname,"views"))
app.engine(".hbs",exphbs({
    defaultLayout:"main",
    layoutsDir: path.join(app.get("views"), "layouts"),
    partialsDir: path.join(app.get("views"),"partials"),
    extname:".hbs",
    helpers: require("./lib/handlebars")
}))
app.set("view engine",".hbs")

app.use(session({
    secret:"abcdefg",
    resave: false,
    saveUninitialized: false,
    store: new MySQLStore(database)
}))
app.use(morgan("dev"))
app.use(express.urlencoded({extended: false}))
app.use(express.json())
app.use(flash())
app.use(passport.initialize())
app.use(passport.session())
app.use(favicon(path.join(__dirname, 'public', 'src.png')))



app.use((req,res,next)=>{
    app.locals.success = req.flash("success")
    app.locals.user = req.user
    next()
})

app.use( require("./routes"))
app.use( require("./routes/authentication"))


app.use(express.static(path.join(__dirname, "public")))


app.listen(app.get("port"), () =>{
    console.log("Server on port ",app.get("port"))
})
