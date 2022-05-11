const puppeteer = require("puppeteer")
const pool = require("../database")


async function crearimagen(url){

    let navegador=await puppeteer.launch({args:['--no-sandbox']})

    let pagina = await navegador.newPage()

    await pagina.goto(url)

    await pagina.screenshot({path:"i.jpg", fullPage: true })

    navegador.close()

    return
}

async function crearpdf(url){
    let navegador=await puppeteer.launch({
        args:['--no-sandbox'],
      // headless: false,
        defaultViewport: {
            width: 100,
            height: 100
          }
        //slowMo: 1000
    })

    let pagina = await navegador.newPage()

    await pagina.goto(url)

    let pdf=await pagina.pdf()

    navegador.close()

    return pdf
}

async function crearticket(url){
    let navegador=await puppeteer.launch({
        args:['--no-sandbox'],
      // headless: false,
        defaultViewport: {
            width: 100,
            height: 100
          }
        //slowMo: 1000
    })

    let pagina = await navegador.newPage()

    await pagina.goto(url)

    let pdf=await pagina.pdf({ width:165 })

    navegador.close()

    return pdf
}


var numeroALetras = (function() {
   
    function Unidades(num) {

        switch (num) {
            case 1:
                return 'UN';
            case 2:
                return 'DOS';
            case 3:
                return 'TRES';
            case 4:
                return 'CUATRO';
            case 5:
                return 'CINCO';
            case 6:
                return 'SEIS';
            case 7:
                return 'SIETE';
            case 8:
                return 'OCHO';
            case 9:
                return 'NUEVE';
        }

        return '';
    } //Unidades()

    function Decenas(num) {

        let decena = Math.floor(num / 10);
        let unidad = num - (decena * 10);

        switch (decena) {
            case 1:
                switch (unidad) {
                    case 0:
                        return 'DIEZ';
                    case 1:
                        return 'ONCE';
                    case 2:
                        return 'DOCE';
                    case 3:
                        return 'TRECE';
                    case 4:
                        return 'CATORCE';
                    case 5:
                        return 'QUINCE';
                    default:
                        return 'DIECI' + Unidades(unidad);
                }
            case 2:
                switch (unidad) {
                    case 0:
                        return 'VEINTE';
                    default:
                        return 'VEINTI' + Unidades(unidad);
                }
            case 3:
                return DecenasY('TREINTA', unidad);
            case 4:
                return DecenasY('CUARENTA', unidad);
            case 5:
                return DecenasY('CINCUENTA', unidad);
            case 6:
                return DecenasY('SESENTA', unidad);
            case 7:
                return DecenasY('SETENTA', unidad);
            case 8:
                return DecenasY('OCHENTA', unidad);
            case 9:
                return DecenasY('NOVENTA', unidad);
            case 0:
                return Unidades(unidad);
        }
    } //Unidades()

    function DecenasY(strSin, numUnidades) {
        if (numUnidades > 0)
            return strSin + ' Y ' + Unidades(numUnidades)

        return strSin;
    } //DecenasY()

    function Centenas(num) {
        let centenas = Math.floor(num / 100);
        let decenas = num - (centenas * 100);

        switch (centenas) {
            case 1:
                if (decenas > 0)
                    return 'CIENTO ' + Decenas(decenas);
                return 'CIEN';
            case 2:
                return 'DOSCIENTOS ' + Decenas(decenas);
            case 3:
                return 'TRESCIENTOS ' + Decenas(decenas);
            case 4:
                return 'CUATROCIENTOS ' + Decenas(decenas);
            case 5:
                return 'QUINIENTOS ' + Decenas(decenas);
            case 6:
                return 'SEISCIENTOS ' + Decenas(decenas);
            case 7:
                return 'SETECIENTOS ' + Decenas(decenas);
            case 8:
                return 'OCHOCIENTOS ' + Decenas(decenas);
            case 9:
                return 'NOVECIENTOS ' + Decenas(decenas);
        }

        return Decenas(decenas);
    } //Centenas()

    function Seccion(num, divisor, strSingular, strPlural) {
        let cientos = Math.floor(num / divisor)
        let resto = num - (cientos * divisor)

        let letras = '';

        if (cientos > 0)
            if (cientos > 1)
                letras = Centenas(cientos) + ' ' + strPlural;
            else
                letras = strSingular;

        if (resto > 0)
            letras += '';

        return letras;
    } //Seccion()

    function Miles(num) {
        let divisor = 1000;
        let cientos = Math.floor(num / divisor)
        let resto = num - (cientos * divisor)

        let strMiles = Seccion(num, divisor, 'MIL', 'MIL');
        let strCentenas = Centenas(resto);

        if (strMiles == '')
            return strCentenas;

        return strMiles + ' ' + strCentenas;
    } //Miles()

    function Millones(num) {
        let divisor = 1000000;
        let cientos = Math.floor(num / divisor)
        let resto = num - (cientos * divisor)

        let strMillones = Seccion(num, divisor, 'UN MILLON DE', 'MILLONES DE');
        let strMiles = Miles(resto);

        if (strMillones == '')
            return strMiles;

        return strMillones + ' ' + strMiles;
    } //Millones()

    return function NumeroALetras(num, currency) {
        currency = currency || {};
        let data = {
            numero: num,
            enteros: Math.floor(num),
            centavos: (((Math.round(num * 100)) - (Math.floor(num) * 100))),
            letrasCentavos: '',
            letrasMonedaPlural: currency.plural || 'PESOS CHILENOS', //'PESOS', 'Dólares', 'Bolívares', 'etcs'
            letrasMonedaSingular: currency.singular || 'PESO CHILENO', //'PESO', 'Dólar', 'Bolivar', 'etc'
            letrasMonedaCentavoPlural: currency.centPlural || 'CHIQUI PESOS CHILENOS',
            letrasMonedaCentavoSingular: currency.centSingular || 'CHIQUI PESO CHILENO'
        };

        if (data.centavos > 0) {
            data.letrasCentavos = 'CON ' + (function() {
                if (data.centavos == 1)
                    return Millones(data.centavos) + ' ' + data.letrasMonedaCentavoSingular;
                else
                    return Millones(data.centavos) + ' ' + data.letrasMonedaCentavoPlural;
            })();
        };

        if (data.enteros == 0)
            return 'CERO ' + data.letrasMonedaPlural + ' ' + data.letrasCentavos;
        if (data.enteros == 1)
            return Millones(data.enteros) + ' ' + data.letrasMonedaSingular + ' ' + data.letrasCentavos;
        else
            return Millones(data.enteros) + ' ' + data.letrasMonedaPlural + ' ' + data.letrasCentavos;
    };

})();

module.exports={


    async img(req,res){
        let idOrden = await pool.query("SELECT * FROM `tblidnotas`")
        idOrden=idOrden[0].IdOrden
        const datos = await pool.query("SELECT * FROM tblordenservicio WHERE IdOrdenServicio = ?",[idOrden])
        const cliente = await pool.query("SELECT * FROM tblclientes WHERE IdCliente = ?",[datos[0].IdCliente])
        const tecnico =await pool.query("SELECT * FROM tbltecnicos WHERE IdTecnico = ?",[datos[0].IdTecnico])
        const equipo =await pool.query("SELECT * FROM tblequipos WHERE IdCliente = ? AND IdEquipo = ?", [datos[0].IdCliente, datos[0].IdEquipo])

        if(datos[0].Realizado==128){
            datos[0].Realizado="Cotizado"
        }else if(datos[0].Realizado==255){
            datos[0].Realizado="Realizado"
        }else{
            datos[0].Realizado="Abierto"
        }
        const garantia = await pool.query("SELECT substring(FechaGarantia,1,10)AS FechaGarantia FROM tblordenservicio WHERE IdOrdenServicio = ?",[idOrden])
        
        console.log(garantia[0].FechaGarantia)
        if (garantia[0].FechaGarantia =="2021-12-31") {
            res.render("factura_garantia.hbs",{ layout:"mainpdf",datos,cliente,tecnico,equipo})
            
        }else{

            res.render("factura.hbs",{ layout:"mainpdf",datos,cliente,tecnico,equipo})
        }

    },

    
    async desimg(req,res){
        await crearimagen("http://localhost:4000/ver")
        let idOrden = await pool.query("SELECT * FROM `tblidnotas`")
        idOrden=idOrden[0].IdOrden
        let datos = await pool.query("SELECT * FROM tblordenservicio WHERE IdOrdenServicio = ?",[idOrden])
        const cliente = await pool.query("SELECT * FROM tblclientes WHERE IdCliente = ?",[datos[0].IdCliente])
        //res.type("png")
        //res.set('content-type', 'image/png')
        //res.send(pdf)
        filename=cliente[0].Nombre+".jpg"
        res.download('i.jpg', filename)
        
    },
 

    async pdf(req,res){
        const {id} = req.params
        let Venta = await pool.query("SELECT * FROM tblventas WHERE IdVenta = ?",[id])
        let productos = await pool.query("SELECT tbldetalleventa.*,tblproductos.Descripcion FROM tbldetalleventa,tblproductos WHERE tbldetalleventa.IdVenta = ? AND tblproductos.IdProducto = tbldetalleventa.IdProducto",[id])
        let Cambio = Venta[0].Efectivo-Venta[0].Total
        Cambio=Cambio.toFixed(2)
        Venta[0].Total=Venta[0].Total.toFixed(2)
        for (let index = 0; index < productos.length; index++) {
            productos[index].Importe=productos[index].Importe.toFixed(2)
            productos[index].Cantidad=productos[index].Cantidad.toFixed(2)
            
        }
        res.render("nota.hbs",{ layout:"mainpdf",Venta,productos,Cambio,id})
    },
    
    async despdf(req,res){
        const {id} = req.params
        const pdf = await crearticket("http://localhost:3832/verpdf"+id)
        res.contentType("application/pdf")
        res.send(pdf)

    },
    
    async reporte_minimo(req,res){
        let productos = await pool.query("SELECT * FROM tblproductos,tblproveedores WHERE Existencias < StockMinimo AND tblproveedores.IdProveedor = tblproductos.IdProveedor")
        res.render("reporte_minimo.hbs",{ layout:"mainpdf",productos})
    },
    
    async despdf_reporte_minimo(req,res){
        const pdf = await crearpdf("http://localhost:3832/rep_mi")
        res.contentType("application/pdf")
        res.send(pdf)

    },

    async reporte_ganancias(req,res){
      let reporte = await pool.query("SELECT * FROM tblreportes")
      let desde=reporte[0].Desde
      let hasta=reporte[0].Hasta
        desde=desde+" 00:00:00"
        hasta=hasta+" 23:59:59"
        let array=[]
        let extra=0
        let total=0
        let ventas = await pool.query("SELECT * FROM tblventas WHERE FechaVenta < ? AND FechaVenta > ?",[hasta,desde])
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
        res.render("reporte_ganancias.hbs",{ layout:"mainpdf",array,total})
    },
    
    async despdf_reporte_ganancias(req,res){
        let {desde,hasta}=req.body
        await pool.query("UPDATE tblreportes SET Desde = ?, Hasta = ? WHERE IdReporte = 1",[desde,hasta])
        const pdf = await crearpdf("http://localhost:3832/rep_gan")
        res.contentType("application/pdf")
        res.send(pdf)

    },

    async reporte_ventas(req,res){
      let reporte = await pool.query("SELECT * FROM tblreportes")
      let desde=reporte[0].Desde
      let hasta=reporte[0].Hasta
        desde=desde+" 00:00:00"
        hasta=hasta+" 23:59:59"
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
    let ventas = await pool.query("SELECT * FROM tblventas WHERE FechaVenta < ? AND FechaVenta > ? AND VentaCerrada > 0 AND IdVendedor = 'Ventas' AND Metodo = 0 ORDER BY FechaVenta DESC ",[hasta,desde])
    let Tventas = await pool.query("SELECT * FROM tblventas WHERE FechaVenta < ? AND FechaVenta > ? AND VentaCerrada > 0 AND IdVendedor = 'Ventas' AND Metodo = 1 ORDER BY FechaVenta DESC ",[hasta,desde])
    total=suma(ventas)    
    to=suma(Tventas)    
    let ventas2 = await pool.query("SELECT * FROM tblventas WHERE FechaVenta < ? AND FechaVenta > ? AND VentaCerrada > 0 AND IdVendedor = 'Ventas2' AND Metodo = 0 ORDER BY FechaVenta DESC ",[hasta,desde])
    let Tventas2 = await pool.query("SELECT * FROM tblventas WHERE FechaVenta < ? AND FechaVenta > ? AND VentaCerrada > 0 AND IdVendedor = 'Ventas2' AND Metodo = 1 ORDER BY FechaVenta DESC ",[hasta,desde])
    total2=suma(ventas2)    
    to2=suma(Tventas2)    
    let ventas3 = await pool.query("SELECT * FROM tblventas WHERE FechaVenta < ? AND FechaVenta > ? AND VentaCerrada > 0 AND IdVendedor = 'Ventas3' AND Metodo = 0 ORDER BY FechaVenta DESC ",[hasta,desde])
    let Tventas3 = await pool.query("SELECT * FROM tblventas WHERE FechaVenta < ? AND FechaVenta > ? AND VentaCerrada > 0 AND IdVendedor = 'Ventas3' AND Metodo = 1 ORDER BY FechaVenta DESC ",[hasta,desde])
    total3=suma(ventas3)    
    to3=suma(Tventas3)    
    let Gerencia = await pool.query("SELECT * FROM tblventas WHERE FechaVenta < ? AND FechaVenta > ? AND VentaCerrada > 0 AND IdVendedor = 'Gerencia' AND Metodo = 0 ORDER BY FechaVenta DESC ",[hasta,desde])
    let TGerencia = await pool.query("SELECT * FROM tblventas WHERE FechaVenta < ? AND FechaVenta > ? AND VentaCerrada > 0 AND IdVendedor = 'Gerencia' AND Metodo = 1 ORDER BY FechaVenta DESC ",[hasta,desde])
    total4=suma(Gerencia)    
    to4=suma(TGerencia)    
    let Gerencia2 = await pool.query("SELECT * FROM tblventas WHERE FechaVenta < ? AND FechaVenta > ? AND VentaCerrada > 0 AND IdVendedor = 'Gerencia2' AND Metodo = 0 ORDER BY FechaVenta DESC ",[hasta,desde])
    let TGerencia2 = await pool.query("SELECT * FROM tblventas WHERE FechaVenta < ? AND FechaVenta > ? AND VentaCerrada > 0 AND IdVendedor = 'Gerencia2' AND Metodo = 1 ORDER BY FechaVenta DESC ",[hasta,desde])
    total5=suma(Gerencia2)  
    to5=suma(TGerencia2) 
    
    res.render("reporte_ventas.hbs",{ layout:"mainpdf",ventas,ventas2,ventas3,Gerencia,Gerencia2,total,total2,total3,total4,total5,Tventas,Tventas2,Tventas3,TGerencia,TGerencia2,to,to2,to3,to4,to5})

    },
    
    async despdf_reporte_ventas(req,res){
        let {desde,hasta}=req.body
        await pool.query("UPDATE tblreportes SET Desde = ?, Hasta = ? WHERE IdReporte = 1",[desde,hasta])
        const pdf = await crearpdf("http://localhost:3832/rep_ven")
        res.contentType("application/pdf")
        res.send(pdf)

    },

    async reporte_facturas(req,res){
     let productos= await pool.query("SELECT * FROM tblreportes, tbldetallefactura, tblproductos, tblproveedores WHERE tbldetallefactura.IdFactura = tblreportes.Id AND tblproductos.IdProducto = tbldetallefactura.IdProducto AND tblproveedores.IdProveedor = tblproductos.IdProveedor")
        let id=await pool.query("SELECT Id FROM tblreportes")
        id=id[0].Id
     res.render("reporte_facturas.hbs",{ layout:"mainpdf",productos,id})

    },
    
    async despdf_reporte_facturas(req,res){
        let {id}=req.params
        await pool.query("UPDATE tblreportes SET Id = ? WHERE IdReporte = 1",[id])
        const pdf = await crearpdf("http://localhost:3832/rep_fac")
        res.contentType("application/pdf")
        res.send(pdf)

    }

}