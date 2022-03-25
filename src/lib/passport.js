const passport = require("passport")
const LocalStrategy= require("passport-local").Strategy
const pool = require("../database")
const helpers = require("../lib/helpers")

passport.use("local.signin", new LocalStrategy({
    usernameField: "email",
    passwordField: "password",
    passReqToCallback: true
}, async(req, username,password, done)=>{
    const user = await pool.query("SELECT * FROM tblusuarios WHERE Email = ? AND Activa = 'SI' ",[username])
    if (user.length > 0) {
        const pass = await helpers.login(password, user[0].Contrasena)
        if (pass) {
           /* await pool.query("INSERT INTO `tblmovimientos` (`IdUsuario`, `TipoMovimiento`, `Fecha`) VALUES (?, '0', current_timestamp())",[user[0].IdUsuario])
            let fecha=new Date()
            let mes=fecha.getMonth()+1
            let dia=fecha.getDate()
            if (mes < 10) {
                mes="0"+mes
            }
            if (dia < 10) {
                dia="0"+dia
            }
            fecha=fecha.getFullYear()+"-"+mes+"-"+dia
            fecha=fecha+" 00:00:00"
            console.log(fecha)
            await pool.query("UPDATE tblordenservicio SET Realizado = 255 WHERE Realizado = 100 AND FechaRealizacion < ?",[fecha])
            */
            done(null, user[0])
        }else{
            done(null, false)
        }
    } else{
        done(null, false )
    }
}))





passport.use("local.signup", new LocalStrategy({
    usernameField: "nombre",
    passwordField: "password",
    passReqToCallback: true

}, async(req, username, password, done)=>{
    const {email} = req.body
     const user = {
        Nombre:username,
        Contrasena:password,
        Email: email
    }
    
    user.Contrasena = await helpers.regi(password)
    const result = await pool.query("INSERT INTO tblusuarios SET ?", [user])
    user.IdUsuario= result.insertId
    return done(null, user)

}))



passport.serializeUser((user,done)=>{

    done(null, user.IdUsuario)
})

passport.deserializeUser(async (id, done) =>{
    const rows = await pool.query("SELECT * FROM tblusuarios WHERE IdUsuario = ?", [id])
    done(null,rows[0])
})