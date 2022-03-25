const express = require("express")
const router = express.Router()
const passport = require("passport")
const pool = require("../database")
const {isLoggedIn} = require("../lib/auth")
/*
router.get("/ferreteria/registro",  (req,res) =>{
    res.render("auth/registro",{layout:"mainpdf"})
})

router.post("/registro",  passport.authenticate("local.signup",{
        successRedirect: "/ferreteria/servicios_pendientes",
        failureRedirect: "/ferreteria/registro"
    
}))
*/

router.get("/ferreteria/iniciar_sesion", (req,res) =>{
    res.render("auth/inicio",{layout:"mainpdf"})
})


router.post("/iniciar_sesion", passport.authenticate("local.signin",{
    successRedirect: "/ferreteria/servicios_pendientes",
    failureRedirect: "/ferreteria/iniciar_sesion"

}))


router.get("/ferreteria/salir", isLoggedIn, async (req,res) =>{
    let id = req.user.IdUsuario
  //  await pool.query("INSERT INTO `tblmovimientos` (`IdUsuario`, `TipoMovimiento`, `Fecha`) VALUES (?, '1',current_timestamp())",[id])
    req.logOut()
    res.redirect("/ferreteria/iniciar_sesion")
})

module.exports= router