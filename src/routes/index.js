const express = require("express")
const router = express.Router()
const pool = require("../database")
const pdfc =require("../routes/pdf")
var moment = require('moment');
const {isLoggedIn, isAdmin} = require("../lib/auth");
const { LastMonthInstance } = require("twilio/lib/rest/api/v2010/account/usage/record/lastMonth");



const log = console.log

//Principal
router.get("/", isLoggedIn,  (req, res) => { 
    res.redirect("/ferreteria/servicios_pendientes")  
})



//Agregar get

router.get("/serviflash/agregar_registro", isLoggedIn, async (req, res)=>{
    let cliente= await pool.query("SELECT IdCliente, Nombre, DirColonia, DirCalle, DirNum from tblclientes WHERE Nombre <>' ' ORDER BY Nombre ASC")
    let num=await pool.query("SELECT max(IdCliente) as num FROM tblclientes;")
    num=num[0].num+1
    res.render("layouts/agregar_registro",{cliente, num})
})

router.get("/serviflash/agregar_registro:id/", isLoggedIn, async (req, res) => {
    const { id } = req.params
    const equipo = await pool.query("SELECT * FROM tblequipos WHERE IdCliente = ?", [id])
    let cliente= await pool.query("SELECT * from tblclientes WHERE IdCliente = ?",[id])
    let clientes= await pool.query("SELECT IdCliente, Nombre from tblclientes WHERE Nombre <>' ' ORDER BY Nombre ASC")
    let num=await pool.query("SELECT max(IdOrdenServicio) as num FROM tblordenservicio;")
    num=num[0].num+1
    let idcliente=cliente[0].IdCliente
    let nombre=cliente[0].Nombre
    res.render("layouts/agregar_registro_completo", { equipo, cliente, clientes, nombre, num, idcliente })
})

router.get("/serviflash/notas:id/", isLoggedIn, async (req, res) =>{

    const { id } = req.params
    let notass = await pool.query("SELECT * FROM tblnotas WHERE IdOrdenServicio = ?",[id])
    const orden = await pool.query("SELECT * FROM tblordenservicio WHERE IdOrdenServicio = ?",[id])
    if (notass[0] == undefined) {

        res.render("layouts/agregar_nota",{id, orden})
        return
        
    } else{

        if (notass[0].NotaCerrada == 1) {
            
                let notas = await pool.query("SELECT * FROM tbldetallenota WHERE IdNotas = ? ORDER BY `ID` ASC",[notass[0].IdNotas])
                let aa =5050
                res.render("layouts/solo_notas",{notas, id, aa,orden})
                return
            
        } else{
            let IdCliente=notass[0].IdCliente
            let notas = await pool.query("SELECT * FROM tbldetallenota WHERE IdNotas = ? ORDER BY `ID` ASC",[notass[0].IdNotas])
            if (notas[0] == undefined) {
                let IdN= notass[0].IdNotas
                res.render("layouts/ver_notas",{notas, id, orden, IdN, IdCliente})
            } else{
                let IdN= notas[0].IdNotas
                res.render("layouts/ver_notas",{notas, id, orden, IdN, IdCliente})

            }
            return
        }
    }



}) 





//Agregar post
router.post("/agregar_nota_n", isLoggedIn, async (req, res) =>{
    let {IdOrdenServicio, FechaNota, Garantia, IdCliente,NotaCerrada,Cantidad,Descripcion,PrecioUnitario,Importe} = req.body
    let id = req.user.IdUsuario
    await pool.query("INSERT INTO `tblmovimientos` (`IdUsuario`, `TipoMovimiento`, `IdOrdenServicio`,`Fecha`) VALUES (?, '10', ?,current_timestamp())",[id,IdOrdenServicio])
    const aa = await pool.query("SELECT MAX(`IdNotas`) AS id FROM tblnotas")
    let IdNotas = aa[0].id + 1
    let Total = Importe
    const nota={IdNotas, IdOrdenServicio, FechaNota, Garantia, IdCliente,NotaCerrada, Total}
    await pool.query("INSERT INTO tblnotas SET ?", [nota])
    const concepto={IdNotas, Cantidad,Descripcion,PrecioUnitario,Importe}
    await pool.query("INSERT INTO tbldetallenota SET ?", [concepto])
    res.redirect("/serviflash/notas"+IdOrdenServicio)
})

router.post("/cerrar_nota", isLoggedIn, async (req, res) =>{
    let {Id} = req.body
    let idu = req.user.IdUsuario
    await pool.query("INSERT INTO `tblmovimientos` (`IdUsuario`, `TipoMovimiento`, `IdOrdenServicio`,`Fecha`) VALUES (?, '11', ?,current_timestamp())",[idu,Id])
    await pool.query("UPDATE tblnotas SET NotaCerrada = 1 WHERE IdOrdenServicio=?", [Id])
    res.redirect("/serviflash/notas"+Id)
})


router.post("/agregar_nota", isLoggedIn, async (req, res) =>{
    let {IdNotas,Cantidad,Descripcion,PrecioUnitario,Importe, Id} = req.body
    const nota={IdNotas,Cantidad,Descripcion,PrecioUnitario,Importe}
    await pool.query("INSERT INTO tbldetallenota SET ?", [nota])

    const not = await pool.query("SELECT Total FROM tblnotas WHERE IdOrdenServicio = ?", [Id])
    let total=parseInt(not[0].Total,10)+parseInt(Importe,10)
    await pool.query("UPDATE tblnotas SET Total = ? WHERE IdOrdenServicio=?", [total,Id])
    res.redirect("/serviflash/notas"+Id)
})

router.post("/agregar_registro", isLoggedIn, async (req, res) => {
    let { IdOrdenServicio, IdCliente, IdEquipo, Falla, FechaSolicitud,FechaVisita, Realizado, FechaRealizacion, Observaciones, Presupuesto, CostoServicio, Hora, IdTecnico, MedioDeInformacion } = req.body
    let id = req.user.IdUsuario
    await pool.query("INSERT INTO `tblmovimientos` (`IdUsuario`, `TipoMovimiento`, `IdOrdenServicio`,`Fecha`) VALUES (?, '6', ?,current_timestamp())",[id,IdOrdenServicio])
    if (FechaRealizacion=="") {
        FechaRealizacion=null
    }
    if (CostoServicio=="") {
        CostoServicio=null
    }
    const newarticulo = { IdOrdenServicio, IdCliente, IdEquipo, Falla, FechaSolicitud, FechaVisita, Realizado, FechaRealizacion, Observaciones, Presupuesto, CostoServicio, Hora, IdTecnico, MedioDeInformacion }
    await pool.query("INSERT INTO tblordenservicio SET ?", [newarticulo])
    res.redirect("/serviflash/ver_cliente"+IdCliente+"/")

})

router.post("/agregar_equipo", isLoggedIn, async (req, res) => {
    let { IdCliente, IdEquipo, Categoria, Tipo, Marca, Color, Modelo } = req.body
    let id = req.user.IdUsuario
    await pool.query("INSERT INTO `tblmovimientos` (`IdUsuario`, `TipoMovimiento`, `IdCliente`, `IdEquipo`,`Fecha`) VALUES (?, '4', ?, ?, current_timestamp())",[id,IdCliente,IdEquipo])
    const newequipo = { IdCliente, IdEquipo, Categoria, Tipo, Marca, Color, Modelo }
    await pool.query("INSERT INTO tblequipos SET ?", [newequipo])
    res.redirect("/serviflash/agregar_registro"+IdCliente+"/")

})

router.post("/ver_cliente/agregare", isLoggedIn, async (req, res) => {
    let { IdCliente, IdEquipo, Categoria, Tipo, Marca, Color, Modelo } = req.body
    let id = req.user.IdUsuario
    await pool.query("INSERT INTO `tblmovimientos` ( `IdUsuario`, `TipoMovimiento`, `IdCliente`, `IdEquipo`, `Fecha`) VALUES (?, '4', ?, ?, current_timestamp())",[id,IdCliente,IdEquipo])
    const newequipo = { IdCliente, IdEquipo, Categoria, Tipo, Marca, Color, Modelo }
    await pool.query("INSERT INTO tblequipos SET ?", [newequipo])
    res.redirect("/serviflash/ver_cliente"+IdCliente+"/")

})
router.post("/editar_cliente", isLoggedIn, async (req, res) => {
    let { IdCliente, Nombre, DirColonia, DirCalle, DirNum, DirEntre, Telefono, RFC, Municipio, CP} = req.body
    let id = req.user.IdUsuario
    await pool.query("INSERT INTO `tblmovimientos` (`IdUsuario`, `TipoMovimiento`, `IdCliente`, `Fecha`) VALUES (?, '3', ?, current_timestamp())",[id,IdCliente])
    const newcliente = { IdCliente, Nombre, DirColonia, DirCalle, DirNum, DirEntre, Telefono, RFC, Municipio, CP}
    await pool.query("UPDATE tblclientes SET ? WHERE IdCliente=?", [newcliente, IdCliente])
    res.redirect("/serviflash/ver_cliente"+IdCliente+"/")

})

router.post("/editar_registro", isLoggedIn, async (req, res) => {
    let { IdOrdenServicio, IdCliente, IdEquipo, Falla, FechaSolicitud, FechaVisita, Realizado, FechaRealizacion, Observaciones, Presupuesto, CostoServicio, Hora, IdTecnico, MedioDeInformacion } = req.body
    let id = req.user.IdUsuario
    await pool.query("INSERT INTO `tblmovimientos` (`IdUsuario`, `TipoMovimiento`, `IdOrdenServicio`,`Fecha`) VALUES (?, '7', ?, current_timestamp())",[id,IdOrdenServicio])
    if (IdTecnico=="JOSE MARIA CARDENAS ANZAR") {
        IdTecnico=1
    }else if (IdTecnico=="JOSE LUIS ZAMORA") {
        IdTecnico=2
    }else if (IdTecnico=="JOSE MANUEL ALVAREZ") {
        IdTecnico=3
    }else if (IdTecnico=="ALEJO FAJARDO") {
        IdTecnico=4
    }else if (IdTecnico=="ULISES MENDOZA") {
        IdTecnico=5
    }else if (IdTecnico=="FERNANDO GARCIA") {
        IdTecnico=6
    }else if (IdTecnico=="MOISES RICARDO BENITEZ") {
        IdTecnico=7
    }else if (IdTecnico=="RICARDO ANTONIO PEREZ DUEÑAS") {
        IdTecnico=8
    }else if (IdTecnico=="JOSE ARMANDO PEREZ CRUZ") {
        IdTecnico=9
    }else if (IdTecnico=="ESTEBAN PEREZ CRUZ") {
        IdTecnico=10
    }else if (IdTecnico=="ALBERTO CARLOS SERRANO") {
        IdTecnico=11
    }
    if (FechaRealizacion=="") {
        FechaRealizacion=null
    }
    if (CostoServicio=="") {
        CostoServicio=0
    }
    const cerrado = await pool.query("SELECT * FROM `tblnotas` WHERE IdOrdenServicio = ?",[IdOrdenServicio])
    if (cerrado.length==0) {
        const neworden = { IdOrdenServicio, IdCliente, IdEquipo, Falla, FechaSolicitud, FechaVisita, Realizado, FechaRealizacion, Observaciones, Presupuesto, CostoServicio, Hora, IdTecnico, MedioDeInformacion }
        await pool.query("UPDATE tblordenservicio SET ? WHERE IdOrdenServicio = ?", [neworden,IdOrdenServicio])
    }else {
        if (cerrado[0].NotaCerrada==1){
        const neworden = { IdOrdenServicio, IdCliente, IdEquipo, Falla, FechaSolicitud, FechaVisita, Realizado, FechaRealizacion, Observaciones, Presupuesto, Hora, IdTecnico, MedioDeInformacion }
        await pool.query("UPDATE tblordenservicio SET ? WHERE IdOrdenServicio = ?", [neworden,IdOrdenServicio])
        }else if (cerrado[0].NotaCerrada==0) {
            const neworden = { IdOrdenServicio, IdCliente, IdEquipo, Falla, FechaSolicitud, FechaVisita, Realizado, FechaRealizacion, Observaciones, Presupuesto, CostoServicio, Hora, IdTecnico, MedioDeInformacion }
        await pool.query("UPDATE tblordenservicio SET ? WHERE IdOrdenServicio = ?", [neworden,IdOrdenServicio])
        }
    } 

    res.redirect("/serviflash/ver_cliente"+IdCliente+"/")

})

router.post("/editar_equipo", isLoggedIn, async (req, res) => {
    let { IdCliente, IdEquipo, Categoria, Tipo, Marca, Color, Modelo} = req.body
    let id = req.user.IdUsuario
    await pool.query("INSERT INTO `tblmovimientos` (`IdUsuario`, `TipoMovimiento`, `IdCliente`, `IdEquipo`, `Fecha`) VALUES (?, '5', ?, ?, current_timestamp())",[id,IdCliente,IdEquipo])
    const newequipo = { IdCliente,IdEquipo, Categoria, Tipo, Marca, Color, Modelo}
    await pool.query("UPDATE tblequipos SET ? WHERE IdCliente=? AND IdEquipo=?", [newequipo, IdCliente, IdEquipo])
    res.redirect("/serviflash/ver_cliente"+IdCliente+"/")

})
router.post("/abrir_nota", isLoggedIn, async (req, res) => {
    let {folio} = req.body
    await pool.query("UPDATE tblnotas SET NotaCerrada = 0 WHERE IdOrdenServicio = ?", [folio])
    res.redirect("/serviflash/reportes")

})

router.post("/agregar_cliente", isLoggedIn, async (req, res) => {
    let { IdCliente, Nombre, DirColonia, DirCalle, DirNum, DirEntre, Telefono, RFC, Municipio, CP} = req.body
    let id = req.user.IdUsuario
    await pool.query("INSERT INTO `tblmovimientos` (`IdUsuario`, `TipoMovimiento`, `IdCliente`,`Fecha`) VALUES (?, '2', ?, current_timestamp())",[id,IdCliente])
    const newcliente = { IdCliente, Nombre, DirColonia, DirCalle, DirNum, DirEntre, Telefono, RFC, Municipio, CP}
    await pool.query("INSERT INTO tblclientes SET ?", [newcliente])
    
    res.redirect("/serviflash/agregar_registro")

})

router.post("/cliente_agregar", isLoggedIn, async (req, res) => {
    let { IdCliente, Nombre, DirColonia, DirCalle, DirNum, DirEntre, Telefono, RFC, Municipio, CP} = req.body
    let id = req.user.IdUsuario
    await pool.query("INSERT INTO `tblmovimientos` (`IdUsuario`, `TipoMovimiento`, `IdCliente`, `Fecha`) VALUES (?, '2', ?, current_timestamp())",[id,IdCliente])
    const newcliente = { IdCliente, Nombre, DirColonia, DirCalle, DirNum, DirEntre, Telefono, RFC, Municipio, CP}
    await pool.query("INSERT INTO tblclientes SET ?", [newcliente])
    res.redirect("/serviflash/clientes")

})


router.post("/agregar_garantia", isLoggedIn, async (req, res) => {
    let { IdOrdenServicio, FechaGarantia, IdCliente} = req.body
    if (FechaGarantia=="") {
        FechaGarantia=null
    }
    await pool.query("UPDATE tblordenservicio SET FechaGarantia = ? WHERE IdOrdenServicio = ?", [FechaGarantia,IdOrdenServicio])
    res.redirect("/serviflash/ver_cliente"+IdCliente+"/")

})


//Ver contenido
router.get("/serviflash/clientes", isLoggedIn, async (req, res) => {
    const clientes = await pool.query("SELECT * FROM tblclientes")
    let num=await pool.query("SELECT max(IdCliente) as num FROM tblclientes;")
    num=num[0].num+1
    res.render("layouts/verclientes", { clientes, num })
})


router.get("/ferreteria/servicios_pendientes", isLoggedIn, async (req, res) => {
/*
    let cliente = []
    let clientep = []
    let clienteg = []
    const garantia = await pool.query("SELECT * FROM `tblordenservicio` WHERE `FechaGarantia`<>'null' ORDER BY `FechaVisita` DESC")
    for (let index = 0; index < garantia.length; index++) {
        let Nclienteg = await pool.query("SELECT * FROM tblclientes WHERE `IdCliente`= ?",[garantia[index].IdCliente])
        clienteg.push({
            IdOrden:garantia[index].IdOrdenServicio,
            IdCliente:garantia[index].IdCliente,
            Nombre:Nclienteg[0].Nombre,
            Calle:Nclienteg[0].DirCalle,
            Colonia:Nclienteg[0].DirColonia,
            FechaVisita:garantia[index].FechaVisita,
            FechaGarantiaNew:garantia[index].FechaGarantiaNew,
            Hora:garantia[index].HoraGarantia
        })
    }

    const proceso = await pool.query("SELECT * FROM `tblordenservicio` WHERE `Realizado`='100' ORDER BY `FechaRealizacion` DESC")
    for (let index = 0; index < proceso.length; index++) {
        let Nclienteg = await pool.query("SELECT * FROM tblclientes WHERE `IdCliente`= ?",[proceso[index].IdCliente])
        clientep.push({
            IdOrden:proceso[index].IdOrdenServicio,
            IdCliente:proceso[index].IdCliente,
            Nombre:Nclienteg[0].Nombre,
            Calle:Nclienteg[0].DirCalle,
            Colonia:Nclienteg[0].DirColonia,
            FechaVisita:proceso[index].FechaVisita,
            FechaRealizacion:proceso[index].FechaRealizacion,
            Hora:proceso[index].Hora
        })
    }
    const pendientes = await pool.query("SELECT * FROM `tblordenservicio` WHERE realizado =0 AND `FechaVisita`<>'00000-00-00 00:00:00' ORDER BY `FechaVisita` DESC")
    for (let index = 0; index < pendientes.length; index++) {
        let Ncliente = await pool.query("SELECT * FROM tblclientes WHERE `IdCliente`= ?",[pendientes[index].IdCliente])
        cliente.push({
            IdOrden:pendientes[index].IdOrdenServicio,
            IdCliente:pendientes[index].IdCliente,
            Nombre:Ncliente[0].Nombre,
            Calle:Ncliente[0].DirCalle,
            Colonia:Ncliente[0].DirColonia,
            FechaVisita:pendientes[index].FechaVisita,
            Hora:pendientes[index].Hora
        })
    }
    const horain = await pool.query("SELECT `FechaVisita`,`Presupuesto`,substring(Hora,1,5)AS HoraP FROM `tblordenservicio` WHERE realizado =0 AND`FechaVisita`<>'00000-00-00 00:00:00' ORDER BY `FechaVisita` DESC;")
    const horafi = await pool.query("SELECT `FechaVisita`,`Presupuesto`,substring(Hora,9,11)AS HoraF FROM `tblordenservicio` WHERE realizado =0 AND`FechaVisita`<>'00000-00-00 00:00:00' ORDER BY `FechaVisita` DESC;")
    for (let index = 0; index < pendientes.length; index++) {
    horaI=horain[index].HoraP
    horaF=horafi[index].HoraF
if (horaI=="01:00") {
    horain[index].HoraP="13:00"
}else if (horaI=="02:00") {
    horain[index].HoraP="14:00"
}else if (horaI=="03:00") {
    horain[index].HoraP="15:00"
}else if (horaI=="04:00") {
    horain[index].HoraP="16:00"
}else if (horaI=="05:00") {
    horain[index].HoraP="17:00"
}else if (horaI=="06:00") {
    horain[index].HoraP="18:00"
}else if (horaI=="07:00") {
    horain[index].HoraP="19:00"
}  

if (horaF=="01:00") {
    horafi[index].HoraF="13:00"
}else if (horaF=="02:00") {
    horafi[index].HoraF="14:00"
}else if (horaF=="03:00") {
    horafi[index].HoraF="15:00"
}else if (horaF=="04:00") {
    horafi[index].HoraF="16:00"
}else if (horaF=="05:00") {
    horafi[index].HoraF="17:00"
}else if (horaF=="06:00") {
    horafi[index].HoraF="18:00"
}else if (horaF=="07:00") {
    horafi[index].HoraF="19:00"
}else if (horaF=="01:30") {
    horafi[index].HoraF="13:30"
}else if (horaF=="02:30") {
    horafi[index].HoraF="14:30"
}else if (horaF=="03:30") {
    horafi[index].HoraF="15:30"
}else if (horaF=="04:30") {
    horafi[index].HoraF="16:30"
}else if (horaF=="05:30") {
    horafi[index].HoraF="17:30"
}else if (horaF=="06:30") {
    horafi[index].HoraF="18:30"
}else if (horaF=="07:30") {
    horafi[index].HoraF="19:30"
}else if (horaF=="08:00") {
    horafi[index].HoraF="20:00"
}else if (horaF=="08:30") {
    horafi[index].HoraF="20:30"
}  
//log( horain[index].HoraP+"-"+horafi[index].HoraF)
    }

    var hoy = new Date(),
    hora = hoy.getHours() + ':' + hoy.getMinutes(),
    format = 'hh:mm';
    let array = []
    for (let index = 0; index < pendientes.length; index++) {

var b=horaI=horain[index].HoraP
var c=horaF=horafi[index].HoraF

var time = moment(hora,format),
  ATime = moment(b, format),
  DTime = moment(c, format);

if (time.isBetween(ATime, DTime)) {
  //console.log('is between    '+ATime+ DTime)
  array.push({
    ahora:"si"
  })

} else {
  //console.log('is not between    '+ATime+ DTime)
  array.push({
    ahora:"no"
  })
}



    }
    res.render("layouts/servicios_pendientes", {pendientes, array, garantia, cliente, clienteg, clientep})
    */
   res.redirect("/ferreteria/punto")
})


//---------------------------------------------PRODUCTOS---------------------------------------------------------------------
router.get("/ferreteria/agregar_producto", isLoggedIn, async (req, res) => {
    let id = await pool.query("SELECT IdProducto FROM `tblproductos` order by `IdProducto` desc LIMIT 1;")
    if(id[0]==undefined){
        id=1
    }else{
    id=id[0].IdProducto+1}
    let productos=await pool.query("SELECT tblproductos.* , tblproveedores.* FROM tblproductos,tblproveedores WHERE tblproveedores.IdProveedor=tblproductos.IdProveedor")
    let proveedor = await pool.query("SELECT * FROM tblproveedores") 
    res.render("layouts/agregar_producto",{id,productos,proveedor})
})

router.get("/ferreteria/ver_producto:id/", isLoggedIn, async (req, res) => {
    const { id } = req.params
   let producto = await pool.query("SELECT * FROM tblproductos,tblproveedores WHERE tblproductos.IdProducto = ? AND tblproveedores.IdProveedor = tblproductos.IdProveedor",[id])
   let proveedor = await pool.query("SELECT * FROM tblproveedores")
   let limit = await pool.query("SELECT IdProducto FROM `tblproductos` order by `IdProducto` desc LIMIT 1;")
   let ant=producto[0].IdProducto-1
   let des=producto[0].IdProducto+1
   if(ant==0){
       ant=1
   }
   if(des == limit[0].IdProducto+1){
       des=limit[0].IdProducto
   }
   if (producto[0].Espejo == 1) {
       let aa=1
       res.render("layouts/producto_completo", { ant,des,producto,id,proveedor,aa })
   } else{
       res.render("layouts/producto_completo", { ant,des,producto,id,proveedor })
   }
})
router.get("/ferreteria/ver__producto:id/", isLoggedIn, async (req, res) => {
    const { id } = req.params
   let producto = await pool.query("SELECT * FROM tblproductos,tblproveedores WHERE tblproductos.IdProducto = ? AND tblproveedores.IdProveedor = tblproductos.IdProveedor",[id])
   let proveedor = await pool.query("SELECT * FROM tblproveedores")
   let limit = await pool.query("SELECT IdProducto FROM `tblproductos` order by `IdProducto` desc LIMIT 1;")
   let extra=1
   let ant=producto[0].IdProducto-1
   let des=producto[0].IdProducto+1
   if(ant==0){
       ant=1
   }
   if(des == limit[0].IdProducto+1){
       des=limit[0].IdProducto
   }
   if (producto[0].Espejo == 1) {
       let aa=1
       res.render("layouts/producto_completo", { ant,des,producto,id,proveedor,extra,aa })
   } else{
       res.render("layouts/producto_completo", { ant,des,producto,id,proveedor,extra })
   }
})


router.get("/ferreteria/agregar_granel:id/", isLoggedIn, async (req, res) => {
    const { id } = req.params
   let producto = await pool.query("SELECT * FROM tblproductos WHERE IdProducto = ?",[id])
  await pool.query("UPDATE tblproductos SET Existencias = Existencias + ? WHERE IdProducto = ? ",[producto[0].ValorEspejo,producto[0].IdEspejo])
  await pool.query("UPDATE tblproductos SET Existencias = Existencias - 1  WHERE IdProducto = ? ",[id])
    res.redirect("/ferreteria/ver_producto"+id)
})

router.post("/agregar_producto", isLoggedIn, async (req, res) => {
    let {IdProducto,IdProveedor,Categoria,Descripcion,PrecioVenta,PrecioCompra,CodeBar,CodeTruper,CodeProducto,Existencias,StockMinimo,Marca,Presentacion} = req.body
    if (PrecioCompra=="") {
        PrecioCompra=0
    }
    let aaa=1
    let producto = await pool.query("SELECT * FROM tblproductos WHERE Descripcion = ?",[Descripcion])
    if (producto[0] != undefined) {
        res.redirect("/ferreteria/ver__producto"+producto[0].IdProducto)
    } else{
        if (CodeBar == "" || CodeBar == null ) { 
            if (CodeTruper == "" || CodeTruper == null ) { 
                const newproducto = {IdProveedor,Categoria,Descripcion,PrecioVenta,PrecioCompra,CodeBar,CodeTruper,CodeProducto,Existencias,StockMinimo,Marca,Presentacion}
                await pool.query("INSERT INTO tblproductos SET ? ",[newproducto])
                res.redirect("/ferreteria/agregar_producto")
            } else{
                producto = await pool.query("SELECT * FROM tblproductos WHERE CodeTruper = ?",[CodeTruper])
            if (producto[0] != undefined) {
                res.redirect("/ferreteria/ver__producto"+producto[0].IdProducto)
            }
            }
        } else{
            producto = await pool.query("SELECT * FROM tblproductos WHERE CodeBar = ?",[CodeBar])
            log(producto)
            if (producto[0] != undefined) {
                res.redirect("/ferreteria/ver__producto"+producto[0].IdProducto)
            }else{
                if (CodeTruper == "" || CodeTruper == null ) { 
                    const newproducto = {IdProveedor,Categoria,Descripcion,PrecioVenta,PrecioCompra,CodeBar,CodeTruper,CodeProducto,Existencias,StockMinimo,Marca,Presentacion}
                    await pool.query("INSERT INTO tblproductos SET ? ",[newproducto])
                    res.redirect("/ferreteria/agregar_producto")
                } else{
                    producto = await pool.query("SELECT * FROM tblproductos WHERE CodeTruper = ?",[CodeTruper])
                if (producto[0] != undefined) {
                    res.redirect("/ferreteria/ver__producto"+producto[0].IdProducto)
                } else{
                    const newproducto = {IdProveedor,Categoria,Descripcion,PrecioVenta,PrecioCompra,CodeBar,CodeTruper,CodeProducto,Existencias,StockMinimo,Marca,Presentacion}
                    await pool.query("INSERT INTO tblproductos SET ? ",[newproducto])
                    res.redirect("/ferreteria/agregar_producto")
                }
                }
            }
        }
    }
    
})
router.post("/editar_producto", isLoggedIn, async (req, res) => {
    let {IdProducto,IdProveedor,Categoria,Descripcion,PrecioVenta,PrecioCompra,CodeBar,CodeTruper,CodeProducto,Existencias,StockMinimo,Marca,Presentacion} = req.body
    if(PrecioCompra == ""||PrecioCompra==null){
        PrecioCompra=0
    }
    const newproducto = {IdProveedor,Categoria,Descripcion,PrecioVenta,PrecioCompra,CodeBar,CodeTruper,CodeProducto,Existencias,StockMinimo,Marca,Presentacion}
    await pool.query("UPDATE tblproductos SET ? WHERE IdProducto = ?",[newproducto,IdProducto])
    res.redirect("/ferreteria/ver_producto"+IdProducto)
    
})

router.post("/buscar_por_barra", isLoggedIn, async (req, res) => {
    const {CodeBar,CodeTruper,CodeProducto, IdProducto} = req.body
    if(CodeBar != ""){
        let code = await pool.query("SELECT * FROM tblproductos WHERE CodeBar = ?",[CodeBar])
        if(code[0] == undefined){
            res.redirect("/ferreteria/agregar_producto")
        } else {
            res.redirect("/ferreteria/ver_producto"+code[0].IdProducto)
        }
        
    } else if(CodeTruper != ""){
        let code = await pool.query("SELECT * FROM tblproductos WHERE CodeTruper = ?",[CodeTruper])
        if(code[0] == undefined){
            res.redirect("/ferreteria/agregar_producto")
        } else {
            res.redirect("/ferreteria/ver_producto"+code[0].IdProducto)
        }
        
    } else if(CodeProducto != ""){
        let code = await pool.query("SELECT * FROM tblproductos WHERE CodeProducto = ?",[CodeProducto])
        if(code[0] == undefined){
            res.redirect("/ferreteria/agregar_producto")
        } else {
            res.redirect("/ferreteria/ver_producto"+code[0].IdProducto)
        }
        
    } else if(IdProducto != ""){
            res.redirect("/ferreteria/ver_producto"+IdProducto)
        
    }else{

    res.redirect("/ferreteria/agregar_producto")
    }
})

//---------------------------------------------Punto De Venta---------------------------------------------------------------------
router.get("/ferreteria/punto", isLoggedIn, async (req, res) => {
    let producto = await pool.query("SELECT * FROM tblproductos WHERE Existencias > 0")
    let ventas = await pool.query("SELECT * FROM tblventas WHERE VentaCerrada = 0")
    if (ventas.length != 0) {
        let aa=1
        res.render("layouts/punto_venta",{producto,aa})
    }else{

        res.render("layouts/punto_venta",{producto})
    }
    
})

router.get("/ferreteria/ventas_abiertas", isLoggedIn, async (req, res) => {
    let ventas = await pool.query("SELECT * FROM tblventas WHERE VentaCerrada = 0")

    res.render("layouts/ventas_abiertas",{ventas})
})

router.get("/ferreteria/devoluciones", isLoggedIn, async (req, res) => {
    let id = await pool.query("SELECT * FROM tblventas WHERE VentaCerrada = 1 order by `IdVenta` desc LIMIT 1;")
if(id[0] != undefined){

    id=id[0].IdVenta
}else{
    id=0
}
    res.render("layouts/devoluciones",{id})
})

router.get("/devolucion:id/", isLoggedIn, async (req, res) => {
    const { id } = req.params
    let user = req.user
    let ventas = await pool.query("SELECT * FROM tblventas WHERE IdVenta = ?",[id])
    if(ventas[0].VentaCerrada == 1){
    let productos = await pool.query("SELECT * FROM tbldetalleventa WHERE IdVenta = ?",[id])
    for (let index = 0; index < productos.length; index++) {
       await pool.query("UPDATE tblproductos SET Existencias = Existencias + ? WHERE IdProducto = ?",[productos[index].Cantidad,productos[index].IdProducto])
        
    }
    await pool.query("UPDATE tblventas SET VentaCerrada = 2 WHERE IdVenta = ?",[id])
    await pool.query("INSERT INTO tbldevoluciones SET Vendedor = ?, IdVenta = ?",[user.Nombre,id])
    res.redirect("/ferreteria/punto")
}else{
    res.redirect("/ferreteria/reportes")
    }

})


router.get("/ferreteria/punto_de_venta:id/", isLoggedIn, async (req, res) => {
    let {id} = req.params
    let venta = await pool.query("SELECT * FROM tblventas WHERE IdVenta = ?",[id])
    if(venta[0].VentaCerrada == 1){
        res.redirect("/ferreteria/punto")
    }else{

        let producto = await pool.query("SELECT * FROM tblproductos WHERE Existencias > 0")
        let productos = await pool.query("SELECT tbldetalleventa.*,tblproductos.Descripcion FROM tbldetalleventa,tblproductos WHERE tbldetalleventa.IdVenta = ? AND tblproductos.IdProducto = tbldetalleventa.IdProducto",[id])
        
        let Total=0
        for (let index = 0; index < productos.length; index++) {
            Total+=productos[index].Importe
            productos[index].Importe=productos[index].Importe.toFixed(2)
            productos[index].Cantidad=productos[index].Cantidad.toFixed(2)
            
        }
        Total=Total.toFixed(2)
        res.render("layouts/punto_venta_v",{producto,productos,id,Total})
    }
        
    })
    
router.get("/eliminar:id/producto:idP/", isLoggedIn, async (req, res) => {
    let {id,idP} = req.params
    let producto = await pool.query("SELECT * FROM tbldetalleventa WHERE IdVenta = ? AND IdProducto = ? ",[id,idP])
    await pool.query("UPDATE tblproductos SET Existencias = Existencias+? WHERE IdProducto = ? ",[producto[0].Cantidad,idP])
    await pool.query("DELETE FROM tbldetalleventa WHERE IdVenta = ? AND IdProducto = ? ",[id,idP])
    res.redirect("/ferreteria/punto_de_venta"+id)
    
})

router.post("/agregar_carrito", isLoggedIn, async (req, res) => {
    const {IdProducto, Cantidad, Precio} = req.body
    let Importe=Cantidad*Precio
    let carrito = await pool.query("INSERT INTO tblventas (`IdVendedor`, `IdCliente`, `Total`) VALUES (NULL, NULL, NULL)")
    await pool.query("INSERT INTO tbldetalleventa SET IdVenta = ?, IdProducto = ?, Cantidad = ?, Precio = ?, Importe = ?",[carrito.insertId,IdProducto, Cantidad, Precio,Importe])
    await pool.query("UPDATE tblproductos SET Existencias = Existencias-? WHERE IdProducto = ?",[Cantidad,IdProducto])
    res.redirect("/ferreteria/punto_de_venta"+carrito.insertId)
    
})

router.post("/ferreteria/cerrar_venta", isLoggedIn, async (req, res) => {
    const {IdVenta, Cantidad, Total, Metodo} = req.body
    let user = req.user
   let Cambio=Cantidad-Total
   Cambio=Cambio.toFixed(2)
   await pool.query("UPDATE tblventas SET VentaCerrada = 1, Total = ?, Efectivo = ?, IdVendedor = ?, Metodo = ? WHERE IdVenta = ?",[Total,Cantidad,user.Nombre,Metodo,IdVenta])
   res.render("layouts/post_venta",{Total,Cambio,IdVenta, layout:"mainpdf"})
  
})

router.post("/agregar_al_carrito", isLoggedIn, async (req, res) => {
    let {IdProducto, IdVenta, Cantidad, Precio} = req.body
    let Importe=Cantidad*Precio
    let CantidadOld=Cantidad
    let productos = await pool.query("SELECT * FROM tbldetalleventa WHERE IdVenta = ? AND IdProducto = ?",[IdVenta,IdProducto])
    if (productos.length != 0) {
        productos[0].Cantidad=parseFloat(productos[0].Cantidad,10)
        Cantidad=parseFloat(Cantidad,10)
        Cantidad+=+productos[0].Cantidad
        Importe=productos[0].Precio*Cantidad
        await pool.query("UPDATE tbldetalleventa SET Cantidad = ?, Importe = ? WHERE IdProducto = ? AND IdVenta = ?",[Cantidad, Importe,IdProducto,IdVenta])
        await pool.query("UPDATE tblproductos SET Existencias = Existencias-? WHERE IdProducto = ?",[CantidadOld,IdProducto])
    }else{
        await pool.query("INSERT INTO tbldetalleventa SET IdVenta = ?, IdProducto = ?, Cantidad = ?, Precio = ?, Importe = ?",[IdVenta,IdProducto, Cantidad, Precio,Importe])
        await pool.query("UPDATE tblproductos SET Existencias = Existencias-? WHERE IdProducto = ?",[CantidadOld,IdProducto])
    }
    res.redirect("/ferreteria/punto_de_venta"+IdVenta)
    
})

router.get("/pdf:id",  pdfc.despdf)

router.get("/verpdf:id",  pdfc.pdf)


//---------------------------------------------REPORTES---------------------------------------------------------------------

router.post("/ferreteria/reporte_cortes", isLoggedIn, isAdmin, async (req, res) => {
    let {desde,hasta}=req.body
    desde=desde+" 00:00:00"
    hasta=hasta+" 23:59:59"
    let ventas = await pool.query("SELECT * FROM tblcortecaja WHERE FechaCorte < ? AND FechaCorte > ? AND IdCorte > 1",[hasta,desde])
    res.render("layouts/reporte_cortes",{ventas})
    
})
router.post("/ferreteria/reporte_retiros", isLoggedIn, isAdmin, async (req, res) => {
    let {desde,hasta}=req.body
    desde=desde+" 00:00:00"
    hasta=hasta+" 23:59:59"
    let ventas = await pool.query("SELECT * FROM tblretiros WHERE FechaRetiro < ? AND FechaRetiro > ?",[hasta,desde])
    res.render("layouts/reporte_retiros",{ventas})
    
})

router.get("/ferreteria/reporte_minimo", isLoggedIn, isAdmin, async (req, res) => {
    let productos = await pool.query("SELECT * FROM tblproductos,tblproveedores WHERE Existencias < StockMinimo AND tblproveedores.IdProveedor = tblproductos.IdProveedor")
    res.render("layouts/reporte_minimo",{productos})
    
})

router.get("/reporte_minimo",  pdfc.despdf_reporte_minimo)

router.get("/rep_mi",  pdfc.reporte_minimo)


router.post("/ferreteria/reporte_ganancias", isLoggedIn, isAdmin, async (req, res) => {
    let {desde,hasta}=req.body
    let des=desde
    let has=hasta
    desde=desde+" 00:00:00"
    hasta=hasta+" 23:59:59"
    let array=[]
    let extra=0
    let total=0
    let ventas = await pool.query("SELECT * FROM tblventas WHERE FechaVenta < ? AND FechaVenta > ? AND VentaCerrada = 1",[hasta,desde])
    for (let index1 = 0; index1 < ventas.length; index1++) {
        total=total+ventas[index1].Total
        let ven = await pool.query("SELECT * FROM tbldetalleventa,tblproductos WHERE tbldetalleventa.IdVenta = ? AND tblproductos.IdProducto = tbldetalleventa.IdProducto",[ventas[index1].IdVenta])
        for (let index2 = 0; index2 < ven.length; index2++) {
            for (let index3 = 0; index3 < array.length; index3++) {
                if (ven[index2].IdProducto==array[index3].IdProducto) {
                    array[index3].Cantidad=array[index3].Cantidad+ven[index2].Cantidad
                    array[index3].Importe=array[index3].Importe+ven[index2].Importe
                    extra=1
                }
            }
            if (extra==0) {
                array.push({
                    IdProducto:ven[index2].IdProducto,
                    Descripcion:ven[index2].Descripcion,
                    Cantidad:ven[index2].Cantidad,
                    Precio:ven[index2].Precio,
                    Importe:ven[index2].Importe
                })
            }else{
                extra=0
            }
        }
    }
    res.render("layouts/reporte_ganancias",{array,total,des,has})
    
})
router.post("/reporte_ganancias",  pdfc.despdf_reporte_ganancias)

router.get("/rep_gan",  pdfc.reporte_ganancias)

router.post("/ferreteria/reporte_devoluciones", isLoggedIn, isAdmin, async (req, res) => {
    let {desde,hasta}=req.body
    let des=desde
    let has=hasta
    desde=desde+" 00:00:00"
    hasta=hasta+" 23:59:59"
    let ventas = await pool.query("SELECT * FROM tbldevoluciones,tblventas WHERE tbldevoluciones.Fecha < ? AND tbldevoluciones.Fecha > ? AND tblventas.VentaCerrada = 2 AND tblventas.IdVenta = tbldevoluciones.IdVenta",[hasta,desde])
    res.render("layouts/reporte_devoluciones",{ventas})
    
})

router.post("/ferreteria/reporte_facturas", isLoggedIn, isAdmin, async (req, res) => {
    let {desde,hasta}=req.body
    let des=desde
    let has=hasta
    desde=desde+" 00:00:00"
    hasta=hasta+" 23:59:59"
    let ventas = await pool.query("SELECT * FROM tblfacturas,tblproveedores WHERE FechaFactura < ? AND FechaFactura > ? AND FacturaCerrada = 1 AND tblproveedores.IdProveedor = tblfacturas.Proveedor ORDER BY FechaFactura DESC",[hasta,desde])
    res.render("layouts/reporte_facturas",{ventas})
    
})

router.get("/reporte_facturas:id",  pdfc.despdf_reporte_facturas)

router.get("/rep_fac",  pdfc.reporte_facturas)

router.post("/ferreteria/reporte_ventas", isLoggedIn, isAdmin, async (req, res) => {
    let {desde,hasta}=req.body
    let des=desde
    let has=hasta
    desde=desde+" 00:00:00"
    hasta=hasta+" 23:59:59"
    let total=0
    let total2=0
    let total3=0
    let total4=0
    let total5=0
    let to=0
    let to2=0
    let to3=0
    let to4=0
    let to5=0
    function suma(ventas){
        let tol=0
        for (let index = 0; index < ventas.length; index++) {
            tol=tol+ventas[index].Total
            
        }
        return tol
    }
    let ventas = await pool.query("SELECT * FROM tblventas WHERE FechaVenta < ? AND FechaVenta > ? AND IdVendedor = 'Ventas' AND Metodo = 0 AND VentaCerrada = 1 ORDER BY FechaVenta DESC ",[hasta,desde])
    let Tventas = await pool.query("SELECT * FROM tblventas WHERE FechaVenta < ? AND FechaVenta > ?  AND IdVendedor = 'Ventas' AND Metodo = 1 AND VentaCerrada = 1 ORDER BY FechaVenta DESC ",[hasta,desde])
    total=suma(ventas)    
    to=suma(Tventas)    
    let ventas2 = await pool.query("SELECT * FROM tblventas WHERE FechaVenta < ? AND FechaVenta > ?  AND IdVendedor = 'Ventas2' AND Metodo = 0 AND VentaCerrada = 1 ORDER BY FechaVenta DESC ",[hasta,desde])
    let Tventas2 = await pool.query("SELECT * FROM tblventas WHERE FechaVenta < ? AND FechaVenta > ?  AND IdVendedor = 'Ventas2' AND Metodo = 1 AND VentaCerrada = 1 ORDER BY FechaVenta DESC ",[hasta,desde])
    total2=suma(ventas2)    
    to2=suma(Tventas2)    
    let ventas3 = await pool.query("SELECT * FROM tblventas WHERE FechaVenta < ? AND FechaVenta > ?  AND IdVendedor = 'Ventas3' AND Metodo = 0 AND VentaCerrada = 1 ORDER BY FechaVenta DESC ",[hasta,desde])
    let Tventas3 = await pool.query("SELECT * FROM tblventas WHERE FechaVenta < ? AND FechaVenta > ?  AND IdVendedor = 'Ventas3' AND Metodo = 1 AND VentaCerrada = 1 ORDER BY FechaVenta DESC ",[hasta,desde])
    total3=suma(ventas3)    
    to3=suma(Tventas3)    
    let Gerencia = await pool.query("SELECT * FROM tblventas WHERE FechaVenta < ? AND FechaVenta > ?  AND IdVendedor = 'Gerencia' AND Metodo = 0 AND VentaCerrada = 1 ORDER BY FechaVenta DESC ",[hasta,desde])
    let TGerencia = await pool.query("SELECT * FROM tblventas WHERE FechaVenta < ? AND FechaVenta > ?  AND IdVendedor = 'Gerencia' AND Metodo = 1 AND VentaCerrada = 1 ORDER BY FechaVenta DESC ",[hasta,desde])
    total4=suma(Gerencia)    
    to4=suma(TGerencia)    
    let Gerencia2 = await pool.query("SELECT * FROM tblventas WHERE FechaVenta < ? AND FechaVenta > ?  AND IdVendedor = 'Gerencia2' AND Metodo = 0 AND VentaCerrada = 1 ORDER BY FechaVenta DESC ",[hasta,desde])
    let TGerencia2 = await pool.query("SELECT * FROM tblventas WHERE FechaVenta < ? AND FechaVenta > ?  AND IdVendedor = 'Gerencia2' AND Metodo = 1 AND VentaCerrada = 1 ORDER BY FechaVenta DESC ",[hasta,desde])
    total5=suma(Gerencia2)  
    to5=suma(TGerencia2) 
    
    res.render("layouts/reporte_ventas",{ventas,ventas2,ventas3,Gerencia,Gerencia2,total,total2,total3,total4,total5,des,has,Tventas,Tventas2,Tventas3,TGerencia,TGerencia2,to,to2,to3,to4,to5})
    
})

router.post("/reporte_ventas",  pdfc.despdf_reporte_ventas)

router.get("/rep_ven",  pdfc.reporte_ventas)











//---------------------------------------------ADMINISTRADOR---------------------------------------------------------------------
router.get("/ferreteria/reportes", isLoggedIn, isAdmin, async (req, res) => {
    let productos = await pool.query("SELECT * FROM tblproductos,tblproveedores WHERE Existencias < StockMinimo AND tblproveedores.IdProveedor = tblproductos.IdProveedor")
    let id = await pool.query("SELECT * FROM tblventas order by `IdVenta` desc LIMIT 1;")
if(id[0] != undefined){

    id=id[0].IdVenta
}else{
    id=0
}

    res.render("layouts/reporte",{productos,id})

    
})

router.get("/agregar_factura", isLoggedIn, isAdmin, async (req, res) => {  
    let user=req.user
    let fatura=await pool.query("INSERT INTO tblfacturas SET IdUsuario = ?",[user.Nombre])
    log(fatura)
    res.redirect("/ferreteria/factura"+fatura.insertId)
})

router.get("/ferreteria/factura:id", isLoggedIn, isAdmin, async (req, res) => {  
    let {id}=req.params
    let fatura=await pool.query("SELECT * FROM tblfacturas WHERE IdFactura = ?",[id])
    if (fatura[0].FacturaCerrada == 0) {
        let productos=await pool.query("SELECT tbldetallefactura.*, tblproductos.Descripcion, tblproductos.PrecioCompra AS PrecioOld FROM tbldetallefactura,tblproductos WHERE tbldetallefactura.IdFactura = ? AND tblproductos.IdProducto = tbldetallefactura.IdProducto",[id])
        let producto=await pool.query("SELECT * FROM tblproductos")
        let proveedor=await pool.query("SELECT * FROM tblproveedores")
        res.render("layouts/factura",{id,productos,producto,proveedor})
    } else{
        res.redirect("/ferreteria/reportes")
    }
})
router.get("/eliminar_factura:id", isLoggedIn, isAdmin, async (req, res) => {  
    let {id}=req.params
    let producto = await pool.query("SELECT * FROM tbldetallefactura WHERE Id = ?",[id])
    await pool.query("DELETE FROM tbldetallefactura WHERE Id = ?",[id])
    res.redirect("/ferreteria/factura"+producto[0].IdFactura)
})

router.post("/agregar_a_factura", isLoggedIn, isAdmin, async (req, res) => {  
   let {IdProducto,Cantidad,PrecioCompra,IdFactura} = req.body 
   let factura={IdProducto,Cantidad,PrecioCompra,IdFactura}
   let producto = await pool.query("SELECT * FROM tbldetallefactura WHERE IdFactura = ? AND IdProducto = ?",[IdFactura,IdProducto])
   if (producto[0] == undefined) {
        await pool.query("INSERT INTO tbldetallefactura SET ?",[factura])
    } else{
        await pool.query("UPDATE tbldetallefactura SET Cantidad = Cantidad + ?, PrecioCompra = ?",[Cantidad,PrecioCompra])
   }

   res.redirect("/ferreteria/factura"+IdFactura)
})

router.post("/ferreteria/cerrar_factura", isLoggedIn, isAdmin, async (req, res) => {  
   let {FechaOriginal,FolioFactura,Proveedor,Total,IdFactura} = req.body 
    let venta={FechaOriginal,FolioFactura,Proveedor,Total,}
    let productos = await pool.query("SELECT * FROM tbldetallefactura WHERE IdFactura = ?",[IdFactura])
for (let index = 0; index < productos.length; index++) {
    await pool.query("UPDATE tblproductos SET Existencias = Existencias + ?, PrecioCompra = ? WHERE IdProducto = ?",[productos[index].Cantidad,productos[index].PrecioCompra,productos[index].IdProducto])
}
  await pool.query("UPDATE tblfacturas SET ?, FacturaCerrada = 1 WHERE IdFactura = ?",[venta,IdFactura])
   res.redirect("/ferreteria/reportes")
})

router.post("/ferreteria/retiro_dinero", isLoggedIn, isAdmin, async (req, res) => {  
   let {Retiro,Descripcion} = req.body 
   let user=req.user
   await pool.query("INSERT INTO tblretiros SET Usuario = ?, Retiro = ?, Descripcion = ?",[user.Nombre,Retiro,Descripcion])
   res.redirect("/ferreteria/reportes")
})

router.post("/ferreteria/cerrar_corte_caja", isLoggedIn, isAdmin, async (req, res) => {  
   let {SiguienteCaja,TotalEfectivo,TotalTarjeta,DineroCaja,TotalRetiros,TotalNeto,IdVenta,IdRetiroMax} = req.body 
   let Usuario=req.user.Nombre
   let caja ={SiguienteCaja,TotalEfectivo,TotalTarjeta,DineroCaja,TotalRetiros,TotalNeto,IdVenta,IdRetiroMax,Usuario}
   await pool.query("INSERT INTO tblcortecaja SET ? ",[caja])
   res.redirect("/ferreteria/reportes")
})

router.get("/ferreteria/corte_de_caja", isLoggedIn, isAdmin, async (req, res) => {  
  let corte = await pool.query("SELECT * FROM tblcortecaja order by `IdCorte` desc LIMIT 1;")
  let total=0
  let total2=0
  let total3=0
  let total4=0
  let total5=0

  function suma(ventas){
    let tol=0
    for (let index = 0; index < ventas.length; index++) {
        tol=tol+ventas[index].Total
        
    }
    return tol
    }
  function sumaR(ventas){
    let tol=0
    for (let index = 0; index < ventas.length; index++) {
        tol=tol+ventas[index].Retiro
        
    }
    return tol
    }
   let ventas = await pool.query("SELECT * FROM tblventas WHERE IdVenta > ? AND Metodo = 0 AND VentaCerrada = 1",[corte[0].IdVenta])
   let ventasT = await pool.query("SELECT * FROM tblventas WHERE IdVenta > ? AND Metodo = 1 AND VentaCerrada = 1",[corte[0].IdVenta])
   total=suma(ventas)    
   total2=suma(ventasT) 
   if (ventas[ventas.length-1]==undefined) {
       ventas=0
    } else {
        ventas=ventas[ventas.length-1].IdVenta
    }
   if (ventasT[ventasT.length-1]==undefined) {
       ventasT=0
   } else {
       ventasT=ventasT[ventasT.length-1].IdVenta
   }
    if(ventas>ventasT){
        total5=ventas
    } else{
        total5=ventasT
    }
   let retiros = await pool.query("SELECT * FROM tblretiros WHERE IdRetiro > ? ",[corte[0].IdRetiroMax])
   total3=sumaR(retiros)  
   if (retiros[retiros.length-1]==undefined) {
       retiros=corte[0].IdRetiroMax
}else{
       retiros=retiros[retiros.length-1].IdRetiro

   }
   total4=total+corte[0].SiguienteCaja-total3
   total4=total4.toFixed(2)
   total=total.toFixed(2)
   total2=total2.toFixed(2)
     res.render("layouts/cierre_caja",{total,total2,total3,total4,total5,corte,retiros})
})


router.post("/ferreteria/reporte_ventas", isLoggedIn, isAdmin, async (req, res) => {
    let {desde,hasta}=req.body
    let des=desde
    let has=hasta
    desde=desde+" 00:00:00"
    hasta=hasta+" 23:59:59"
    let total=0
    let total2=0
    let total3=0
    let total4=0
    let total5=0
    let to=0
    let to2=0
    let to3=0
    let to4=0
    let to5=0
    function suma(ventas){
        let tol=0
        for (let index = 0; index < ventas.length; index++) {
            tol=tol+ventas[index].Total
            
        }
        return tol
    }
    let ventas = await pool.query("SELECT * FROM tblventas WHERE FechaVenta < ? AND FechaVenta > ? AND IdVendedor = 'Ventas' AND Metodo = 0 AND VentaCerrada = 1 ORDER BY FechaVenta DESC ",[hasta,desde])
    let Tventas = await pool.query("SELECT * FROM tblventas WHERE FechaVenta < ? AND FechaVenta > ?  AND IdVendedor = 'Ventas' AND Metodo = 1 AND VentaCerrada = 1 ORDER BY FechaVenta DESC ",[hasta,desde])
    total=suma(ventas)    
    to=suma(Tventas)    
    let ventas2 = await pool.query("SELECT * FROM tblventas WHERE FechaVenta < ? AND FechaVenta > ?  AND IdVendedor = 'Ventas2' AND Metodo = 0 AND VentaCerrada = 1 ORDER BY FechaVenta DESC ",[hasta,desde])
    let Tventas2 = await pool.query("SELECT * FROM tblventas WHERE FechaVenta < ? AND FechaVenta > ?  AND IdVendedor = 'Ventas2' AND Metodo = 1 AND VentaCerrada = 1 ORDER BY FechaVenta DESC ",[hasta,desde])
    total2=suma(ventas2)    
    to2=suma(Tventas2)    
    let ventas3 = await pool.query("SELECT * FROM tblventas WHERE FechaVenta < ? AND FechaVenta > ?  AND IdVendedor = 'Ventas3' AND Metodo = 0 AND VentaCerrada = 1 ORDER BY FechaVenta DESC ",[hasta,desde])
    let Tventas3 = await pool.query("SELECT * FROM tblventas WHERE FechaVenta < ? AND FechaVenta > ?  AND IdVendedor = 'Ventas3' AND Metodo = 1 AND VentaCerrada = 1 ORDER BY FechaVenta DESC ",[hasta,desde])
    total3=suma(ventas3)    
    to3=suma(Tventas3)    
    let Gerencia = await pool.query("SELECT * FROM tblventas WHERE FechaVenta < ? AND FechaVenta > ?  AND IdVendedor = 'Gerencia' AND Metodo = 0 AND VentaCerrada = 1 ORDER BY FechaVenta DESC ",[hasta,desde])
    let TGerencia = await pool.query("SELECT * FROM tblventas WHERE FechaVenta < ? AND FechaVenta > ?  AND IdVendedor = 'Gerencia' AND Metodo = 1 AND VentaCerrada = 1 ORDER BY FechaVenta DESC ",[hasta,desde])
    total4=suma(Gerencia)    
    to4=suma(TGerencia)    
    let Gerencia2 = await pool.query("SELECT * FROM tblventas WHERE FechaVenta < ? AND FechaVenta > ?  AND IdVendedor = 'Gerencia2' AND Metodo = 0 AND VentaCerrada = 1 ORDER BY FechaVenta DESC ",[hasta,desde])
    let TGerencia2 = await pool.query("SELECT * FROM tblventas WHERE FechaVenta < ? AND FechaVenta > ?  AND IdVendedor = 'Gerencia2' AND Metodo = 1 AND VentaCerrada = 1 ORDER BY FechaVenta DESC ",[hasta,desde])
    total5=suma(Gerencia2)  
    to5=suma(TGerencia2) 
    
    res.render("layouts/reporte_ventas",{ventas,ventas2,ventas3,Gerencia,Gerencia2,total,total2,total3,total4,total5,des,has,Tventas,Tventas2,Tventas3,TGerencia,TGerencia2,to,to2,to3,to4,to5})
    
})


//---------------------------------------------PROVEEDORES---------------------------------------------------------------------

router.get("/ferreteria/agregar_proveedor", isLoggedIn, async (req, res) => {
    let id = await pool.query("SELECT IdProveedor FROM `tblproveedores` order by `IdProveedor` desc LIMIT 1;")
    if(id[0]==undefined){
        id=1
    }else{
    id=id[0].IdProveedor+1}
    let proveedor=await pool.query("SELECT * FROM tblproveedores")
    res.render("layouts/agregar_proveedor",{id,proveedor})
    
})
router.post("/agregar_proveedor", isLoggedIn, async (req, res) => {
    const {IdProveedor,Nombre,Telefono} = req.body
    const newproveedor = {Nombre,Telefono}
    await pool.query("INSERT INTO tblproveedores SET ? ",[newproveedor])
    res.redirect("/ferreteria/agregar_proveedor")
    
})

router.get("/ferreteria/ver_proveedor:id/", isLoggedIn, async (req, res) => {
    const { id } = req.params
   let proveedor = await pool.query("SELECT * FROM tblproveedores WHERE IdProveedor = ?",[id]) 
   res.render("layouts/proveedor_completo", { id,proveedor })
})

router.post("/editar_proveedor", isLoggedIn, async (req, res) => {
    const {IdProveedor,Nombre,Telefono} = req.body
    const newproveedor = {Nombre,Telefono}
    await pool.query("UPDATE tblproveedores SET ? WHERE IdProveedor = ?",[newproveedor,IdProveedor])
    res.redirect("/ferreteria/agregar_proveedor")
    
})





router.get("/aaaa", isLoggedIn, async (req, res) => {
  
   res.render("layouts/ticket",{ layout:"mainpdf"})
})














router.get("/serviflash/ver_cliente:id/", isLoggedIn, async (req, res) => {
    const { id } = req.params
    const equipo = await pool.query("SELECT * FROM tblequipos WHERE IdCliente = ?", [id])
    let cliente= await pool.query("SELECT * from tblclientes WHERE IdCliente = ?",[id])
    const orden = await pool.query("SELECT * FROM tblordenservicio WHERE IdCliente = ? ORDER BY IdOrdenServicio DESC",[id])
    for (let index = 0; index < orden.length; index++) {
        if (orden[index].Realizado==0) {
            orden[index].Realizado="No"
        }else if (orden[index].Realizado==128) {
            orden[index].Realizado="Cotizacion"
        }else if (orden[index].Realizado==100) {
            orden[index].Realizado="En Proceso"
        }else{
            orden[index].Realizado="Si"
        }
        
    }
    for (let index = 0; index < orden.length; index++) {
        if (orden[index].IdTecnico==1) {
            orden[index].IdTecnico="JOSE MARIA CARDENAS ANZAR"
        }else if (orden[index].IdTecnico==2) {
            orden[index].IdTecnico="JOSE LUIS ZAMORA"
        }else if (orden[index].IdTecnico==3) {
            orden[index].IdTecnico="JOSE MANUEL ALVAREZ"
        }else if(orden[index].IdTecnico==4){
            orden[index].IdTecnico="ALEJO FAJARDO"
        }else if (orden[index].IdTecnico==5) {
            orden[index].IdTecnico="ULISES MENDOZA"
        }else if (orden[index].IdTecnico==6) {
            orden[index].IdTecnico="FERNANDO GARCIA"
        }else if (orden[index].IdTecnico==7) {
            orden[index].IdTecnico="MOISES RICARDO BENITEZ"
        }else if (orden[index].IdTecnico==8) {
            orden[index].IdTecnico="RICARDO ANTONIO PEREZ DUEÑAS"
        }else if (orden[index].IdTecnico==9) {
            orden[index].IdTecnico="JOSE ARMANDO PEREZ CRUZ"
        }else if (orden[index].IdTecnico==10) {
            orden[index].IdTecnico="ESTEBAN PEREZ CRUZ"
        }else if (orden[index].IdTecnico==11) {
            orden[index].IdTecnico="ALBERTO CARLOS SERRANO"
        }else{orden[index].IdTecnico=""}
    }
    res.render("layouts/cliente_completo", { equipo, cliente, orden ,id })
})




router.get("/serviflash/eliminar_nota:id/", isLoggedIn, async (req, res) => {
    let {id} = req.params
    console.log(id)
    let Orden = await pool.query("SELECT * FROM `tbldetallenota` WHERE `ID` = ?",[id])
    log(Orden[0])
    await pool.query("DELETE FROM `tbldetallenota` WHERE `ID` = ?",[id])
    let IdOrden = await pool.query("SELECT * FROM `tblnotas` WHERE IdNotas = ?",[Orden[0].IdNotas])

    res.redirect("/serviflash/notas"+IdOrden[0].IdOrdenServicio+"/")

    
})

router.post("/serviflash/activar_desactivar", isLoggedIn, isAdmin, async (req, res) => {
        let {Activa}=req.body
        await pool.query("UPDATE tblusuarios SET Activa = ? WHERE IdUsuario = 13",[Activa])
        res.redirect("/serviflash/reportes")
    
})

router.post("/editar_garantia", isLoggedIn, async (req, res) => {
        let {IdOrdenServicio, FechaGarantia, FechaGarantiaNew, HoraGarantia, NotasGarantia}=req.body
        let garantia = {FechaGarantia, FechaGarantiaNew, HoraGarantia, NotasGarantia}
        let idu = req.user.IdUsuario
        await pool.query("INSERT INTO `tblmovimientos` (`IdUsuario`, `TipoMovimiento`, `IdOrdenServicio`, `Fecha`) VALUES (?, '12', ?, current_timestamp())",[idu,IdOrdenServicio])
        await pool.query("UPDATE tblordenservicio SET ? WHERE IdOrdenServicio = ?",[garantia,IdOrdenServicio])
        res.redirect("/ver_garantia"+IdOrdenServicio+"/")
    
})

router.post("/serviflash/ver_movimientos", isLoggedIn, isAdmin, async (req, res) => {
    let {desde, hasta} =req.body
    desde=desde+" 00:00:00"
    hasta=hasta+" 23:59:59"
        let movimiento = await pool.query("SELECT * FROM `tblmovimientos` WHERE DATE(`Fecha`)>= ?  AND DATE(`Fecha`)<= ?  AND IdUsuario <> '15';", [desde,hasta])
        log(movimiento)
        for (let index = 0; index < movimiento.length; index++) {
            


            if (movimiento[index].IdUsuario==16) {
                movimiento[index].IdUsuario="CLAUDIA NATALY RODRIGUEZ GRACIANO"

            } else if (movimiento[index].IdUsuario==17) {
                movimiento[index].IdUsuario="LAURA KARINA ACUÑA MEJÍA"

            }else if (movimiento[index].IdUsuario==18) {
                movimiento[index].IdUsuario="ALEJO FAJARDO GÓMEZ"
            }

            if (movimiento[index].TipoMovimiento==0) {
                movimiento[index].TipoMovimiento="Inicio de sesion"
            } else if (movimiento[index].TipoMovimiento==1) {
                movimiento[index].TipoMovimiento="Cerro sesion"
            } else if (movimiento[index].TipoMovimiento==2) {
                movimiento[index].TipoMovimiento="Agrego usuario"
            } else if (movimiento[index].TipoMovimiento==3) {
                movimiento[index].TipoMovimiento="Edito usuario"
            } else if (movimiento[index].TipoMovimiento==4) {
                movimiento[index].TipoMovimiento="Agrego equipo"
            } else if (movimiento[index].TipoMovimiento==5) {
                movimiento[index].TipoMovimiento="Edito usuario"
            } else if (movimiento[index].TipoMovimiento==6) {
                movimiento[index].TipoMovimiento="Agrego orden"
            } else if (movimiento[index].TipoMovimiento==7) {
                movimiento[index].TipoMovimiento="Edito orden"
            } else if (movimiento[index].TipoMovimiento==8) {
                movimiento[index].TipoMovimiento="Creo PDF"
            } else if (movimiento[index].TipoMovimiento==9) {
                movimiento[index].TipoMovimiento="Creo IMG"
            } else if (movimiento[index].TipoMovimiento==10) {
                movimiento[index].TipoMovimiento="Agrego nota"
            } else if (movimiento[index].TipoMovimiento==11) {
                movimiento[index].TipoMovimiento="Cerro nota"
            } else if (movimiento[index].TipoMovimiento==12) {
                movimiento[index].TipoMovimiento="Modifico Garantia"
            } else if (movimiento[index].TipoMovimiento==13) {
                movimiento[index].TipoMovimiento="Cerro Garantia"
            }
        
            if (movimiento[index].IdOrdenServicio==0) {
                movimiento[index].IdOrdenServicio=""
            }
            if (movimiento[index].IdCliente==0) {
                movimiento[index].IdCliente=""
            }
            if (movimiento[index].IdEquipo==0) {
                movimiento[index].IdEquipo=""
            }

            
        }
        log(movimiento)
        res.render("layouts/reporte_movimiento",{movimiento})
    
})

router.post("/serviflash/ver_reporte", isLoggedIn, isAdmin, async (req, res) => {
    let {desde, hasta} =req.body
     let ordenes = await pool.query("SELECT substring(FechaRealizacion,1,10)AS fecha, CostoServicio, IdTecnico FROM tblordenservicio WHERE Realizado = 255")
     let tec4=0,
     tec8=0,
     tec11=0,
     tec4n=0,
     tec8n=0,
     tec11n=0,
     a=0,
     total=0,
     format="yyyy-MM-DD"
     for (let index = 0; index < ordenes.length; index++) {


        var fecha = moment(ordenes[index].fecha,format),
        ATime = moment(desde, format),
        DTime = moment(hasta, format);

        if (fecha.isBetween(ATime, DTime)) {
        a=a+1
        total+=ordenes[index].CostoServicio
        if (ordenes[index].IdTecnico==4) {
            tec4n+=+1
            tec4+=ordenes[index].CostoServicio
        } else if (ordenes[index].IdTecnico==8) {
            tec8n+=+1
            tec8+=ordenes[index].CostoServicio
        }else if (ordenes[index].IdTecnico==11) {
            tec11n+=+1
            tec11+=ordenes[index].CostoServicio
        }

        }
        }
        total = Intl.NumberFormat('en-EU', {style: 'currency',currency: 'MXN', minimumFractionDigits: 2}).format(total);
        tec4 = Intl.NumberFormat('en-EU', {style: 'currency',currency: 'MXN', minimumFractionDigits: 2}).format(tec4);
        tec8 = Intl.NumberFormat('en-EU', {style: 'currency',currency: 'MXN', minimumFractionDigits: 2}).format(tec8);
        tec11 = Intl.NumberFormat('en-EU', {style: 'currency',currency: 'MXN', minimumFractionDigits: 2}).format(tec11);
    res.render("layouts/reporte_tecnico",{total,tec4,tec8,tec11,tec4n,tec8n,tec11n})
})



router.post("/serviflash/reporte_medio", isLoggedIn, isAdmin, async (req, res) => {
     let {desde, hasta} =req.body
     let ordenes = await pool.query("SELECT substring(FechaRealizacion,1,10)AS fecha, MedioDeInformacion FROM tblordenservicio WHERE Realizado = 255")
     let medios = {Revista:0,Cliente:0,Recomendacion:0,Tarjeta:0}
     format="yyyy-MM-DD"
     for (let index = 0; index < ordenes.length; index++) {


        var fecha = moment(ordenes[index].fecha,format),
        ATime = moment(desde, format),
        DTime = moment(hasta, format);

        if (fecha.isBetween(ATime, DTime)) {
            if (ordenes[index].MedioDeInformacion=="revista/anuncio") {
                medios.Revista++  
            }else if (ordenes[index].MedioDeInformacion=="cliente") {
                medios.Cliente++
            }else if (ordenes[index].MedioDeInformacion=="recomendacion") {
                medios.Recomendacion++
            }else if (ordenes[index].MedioDeInformacion=="tarjeta") {
                medios.Tarjeta++
            }
            

        }
        }
        let total = medios.Tarjeta+medios.Recomendacion+medios.Cliente+medios.Revista
    res.render("layouts/reporte_medio",{medios,total})
})


//PDF-Notas
router.get("/descargar",  pdfc.desimg)

router.get("/ver",  pdfc.img)










router.get("/ver_nota/:id", isLoggedIn, async (req,res) =>{
const {id}=req.params
let idu = req.user.IdUsuario
    await pool.query("INSERT INTO `tblmovimientos` (`IdUsuario`, `TipoMovimiento`, `IdOrdenServicio`,`Fecha`) VALUES (?, '9', ?, current_timestamp())",[idu,id])
await pool.query("UPDATE tblidnotas SET IdOrden = ? WHERE IdNota = 1",[id])
res.redirect("/descargar")
})


router.get("/ver_garantia:id/", isLoggedIn, async (req,res) =>{
const {id}=req.params
const orden = await pool.query("SELECT * , substring(FechaGarantia,1,10)AS fecha FROM tblordenservicio WHERE IdOrdenServicio = ?",[id])
    res.render("layouts/garantia",{orden})
})

router.get("/cerrar_garantia:id/", isLoggedIn, async (req,res) =>{
const {id}=req.params
let idu = req.user.IdUsuario
    await pool.query("INSERT INTO `tblmovimientos` (`IdUsuario`, `TipoMovimiento`, `IdOrdenServicio`, `Fecha`) VALUES (?, '13', ?, current_timestamp())",[idu,id])
await pool.query("UPDATE `tblordenservicio` SET `FechaGarantia` = null WHERE IdOrdenServicio = ?",[id])
const cliente = await pool.query("SELECT `IdCliente` FROM `tblordenservicio` WHERE `IdOrdenServicio` = ?",[id])
res.redirect("/serviflash/ver_cliente"+cliente[0].IdCliente+"/")
})

router.get("/ver_pdf:id/", isLoggedIn, async (req,res) =>{
const {id}=req.params
let idu = req.user.IdUsuario
    await pool.query("INSERT INTO `tblmovimientos` (`IdUsuario`, `TipoMovimiento`, `IdOrdenServicio`, `Fecha`) VALUES (?, '8', ?, current_timestamp())",[idu,id])
await pool.query("UPDATE tblidnotas SET IdOrden = ? WHERE IdNota = 1",[id])
res.redirect("/pdf")
})














/*



router.get("/aa", isLoggedIn, async (req,res) =>{
    const fecha=await pool.query("SELECT * FROM tblordenservicio")
    for (let index = 0; index < fecha.length ; index++) {
        await pool.query("UPDATE tblordenservicio SET FechaVisita = ? WHERE IdOrdenServicio = ?",[fecha[index].FechaRealizacion,fecha[index].IdOrdenServicio])

    }
   
    res.send("Listoooo")
    })


    
router.get("/bb", isLoggedIn, async (req,res) =>{
        await pool.query("UPDATE tblordenservicio SET FechaGarantia = 'null' WHERE FechaGarantia <> 'null'")
    res.send("Listoooo")
    })




    router.get("/mayus", isLoggedIn, async (req,res) =>{
        const datos=await pool.query("SELECT * FROM tblordenservicio")

        for (let index = 0; index < datos.length ; index++) {
            datos[index].Falla=datos[index].Falla.toUpperCase()
            await pool.query("UPDATE tblordenservicio SET Falla = ? WHERE IdOrdenServicio = ?",[datos[index].Falla,datos[index].IdOrdenServicio])
            if (datos[index].Observaciones==null) {
                
            }else{
            datos[index].Observaciones=datos[index].Observaciones.toUpperCase()
            await pool.query("UPDATE tblordenservicio SET Observaciones = ? WHERE IdOrdenServicio = ?",[datos[index].Observaciones,datos[index].IdOrdenServicio])}

        }
   
    res.send("Listoooo")
    })


    router.get("/mayust", isLoggedIn, async (req,res) =>{
        const datos=await pool.query("SELECT * FROM tbltecnicos")

        for (let index = 0; index < datos.length ; index++) {
            if (datos[index].Direccion==null) {
                
            }else{
            datos[index].Direccion=datos[index].Direccion.toUpperCase()
            await pool.query("UPDATE tbltecnicos SET Direccion = ? WHERE IdTecnico = ?",[datos[index].Direccion,datos[index].IdTecnico])}
            

        }
   
    res.send("Listoooo")
    })

    router.get("/mayuse", isLoggedIn, async (req,res) =>{
        const datos=await pool.query("SELECT * FROM tblequipos")
        for (let index = 0; index < datos.length ; index++) {
            if (datos[index].Marca==null) {
                
            }else{
            datos[index].Marca=datos[index].Marca.toUpperCase()
            await pool.query("UPDATE tblequipos SET Marca = ? WHERE IdCliente = ? AND IdEquipo = ?",[datos[index].Marca,datos[index].IdCliente,datos[index].IdEquipo])}
            

            if (datos[index].Color==null) {
                
            }else{
            datos[index].Color=datos[index].Color.toUpperCase()
            await pool.query("UPDATE tblequipos SET Color = ? WHERE IdCliente = ? AND IdEquipo = ?",[datos[index].Color,datos[index].IdCliente,datos[index].IdEquipo])}


            if (datos[index].Modelo==null) {
                
            }else{
            datos[index].Modelo=datos[index].Modelo.toUpperCase()
            await pool.query("UPDATE tblequipos SET Modelo = ? WHERE IdCliente = ? AND IdEquipo = ?",[datos[index].Modelo,datos[index].IdCliente,datos[index].IdEquipo])}

        }
   
    res.send("Listoooo")
    })



    router.get("/mayusc", isLoggedIn, async (req,res) =>{
        const datos=await pool.query("SELECT * FROM tblclientes")

        for (let index = 0; index < datos.length ; index++) {
            if (datos[index].Nombre==null) {
                
            }else{
            datos[index].Nombre=datos[index].Nombre.toUpperCase()
            await pool.query("UPDATE tblclientes SET Nombre = ? WHERE IdCliente = ?",[datos[index].Nombre,datos[index].IdCliente])}

            if (datos[index].DirColonia==null) {
                
            }else{
            datos[index].DirColonia=datos[index].DirColonia.toUpperCase()
            await pool.query("UPDATE tblclientes SET DirColonia = ? WHERE IdCliente = ?",[datos[index].DirColonia,datos[index].IdCliente])}

            if (datos[index].DirCalle==null) {
                
            }else{
            datos[index].DirCalle=datos[index].DirCalle.toUpperCase()
            await pool.query("UPDATE tblclientes SET DirCalle = ? WHERE IdCliente = ?",[datos[index].DirCalle,datos[index].IdCliente])}

            if (datos[index].DirEntre==null) {
                
            }else{
            datos[index].DirEntre=datos[index].DirEntre.toUpperCase()
            await pool.query("UPDATE tblclientes SET DirEntre = ? WHERE IdCliente = ?",[datos[index].DirEntre,datos[index].IdCliente])}

            if (datos[index].Municipio==null) {
                
            }else{
            datos[index].Municipio=datos[index].Municipio.toUpperCase()
            await pool.query("UPDATE tblclientes SET Municipio = ? WHERE IdCliente = ?",[datos[index].Municipio,datos[index].IdCliente])}

            if (datos[index].RFC==null) {
                
            }else{
            datos[index].RFC=datos[index].RFC.toUpperCase()
            await pool.query("UPDATE tblclientes SET RFC = ? WHERE IdCliente = ?",[datos[index].RFC,datos[index].IdCliente])}
            

        }
   
    res.send("Listoooo")
    })



    router.get("/mayuscn", isLoggedIn, async (req,res) =>{
        const datos=await pool.query("SELECT * FROM tblclientes")

        for (let index = 0; index < datos.length ; index++) {
            if (datos[index].DirNum==null) {
                
            }else{
            datos[index].DirNum=datos[index].DirNum.toUpperCase()
            await pool.query("UPDATE tblclientes SET DirNum = ? WHERE IdCliente = ?",[datos[index].DirNum,datos[index].IdCliente])}
            

        }
        res.send("Listoooo")
    })

    router.get("/notacerrada", isLoggedIn, async (req,res) =>{
        
            await pool.query("UPDATE tblnotas SET NotaCerrada = '1' WHERE NotaCerrada = '0'")
        
        res.send("Listoooo")
    })

    router.get("/cant", isLoggedIn, async (req,res) =>{
       await pool.query("UPDATE tbldetallenota SET Cantidad = 1 WHERE Cantidad = 0")
        res.send("Listoooo")
    })



    */
//Exportar
module.exports = router