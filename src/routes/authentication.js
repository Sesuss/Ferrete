const express = require("express")
const router = express.Router()
const passport = require("passport")
const pool = require("../database")
const {isLoggedIn} = require("../lib/auth")
/*
router.get("/serviflash/registro",  (req,res) =>{
    res.render("auth/registro",{layout:"mainpdf"})
})

router.post("/registro",  passport.authenticate("local.signup",{
        successRedirect: "/serviflash/servicios_pendientes",
        failureRedirect: "/serviflash/registro"
    
}))
*/


router.get("/serviflash/iniciar_sesion", (req,res) =>{
    res.render("auth/inicio",{layout:"mainpdf"})
})


router.post("/iniciar_sesion", passport.authenticate("local.signin",{
    successRedirect: "/serviflash/servicios_pendientes",
    failureRedirect: "/serviflash/iniciar_sesion"

}))


router.get("/serviflash/salir", isLoggedIn, async (req,res) =>{
    let id = req.user.IdUsuario
    await pool.query("INSERT INTO `tblmovimientos` (`IdUsuario`, `TipoMovimiento`, `Fecha`) VALUES (?, '1',current_timestamp())",[id])
    req.logOut()
    res.redirect("/serviflash/iniciar_sesion")
})

module.exports= router