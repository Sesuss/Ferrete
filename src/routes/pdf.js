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
    let navegador=await puppeteer.launch({args:['--no-sandbox']})

    let pagina = await navegador.newPage()

    await pagina.goto(url)

    let pdf=await pagina.pdf()

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
        let idOrden = await pool.query("SELECT * FROM `tblidnotas`")
        idOrden=idOrden[0].IdOrden
        const datos = await pool.query("SELECT * FROM tblordenservicio WHERE IdOrdenServicio = ?",[idOrden])
        const cliente = await pool.query("SELECT * FROM tblclientes WHERE IdCliente = ?",[datos[0].IdCliente])
        let tecnico = await pool.query("SELECT * FROM tbltecnicos WHERE IdTecnico = ?",[datos[0].IdTecnico])
        console.log(tecnico)
        tecnico=tecnico[0].Nombre
        
        console.log(tecnico)
        const equipo = await pool.query("SELECT * FROM tblequipos WHERE IdCliente = ? AND IdEquipo = ?", [datos[0].IdCliente, datos[0].IdEquipo])
        let notas = await pool.query("SELECT * FROM tblnotas WHERE IdOrdenServicio = ?",[idOrden])
        let garantia=notas[0].Garantia
        notas = await pool.query("SELECT * FROM tbldetallenota WHERE IdNotas = ? ORDER BY `ID` ASC",[notas[0].IdNotas])
        let total=0
        for (let index = 0; index < notas.length; index++) {
            total+=notas[index].Importe
            
            if (notas[index].Importe==0 || notas[index].Importe ==datos[0].CostoServicio ) {
                notas[index].Importe=""
            }
        }
        if (total==0) {
            
        }else{
            datos[0].CostoServicio=total
        }
        const cantidad = numeroALetras(datos[0].CostoServicio, {
            plural: "PESOS",
            singular: "PESO",
            centPlural: "CENTAVOS",
            centSingular: "CENTAVO"
          });
          datos[0].CostoServicio = Intl.NumberFormat('en-EU', {style: 'currency',currency: 'MXN', minimumFractionDigits: 2}).format(datos[0].CostoServicio);
          for (let index = 0; index < 12; index++) {
                let num=notas.length
                if (num<11) {
                    notas.push({
                        Cantidad:"",
                        Descripcion:"",
                        Importe:""
                    })
                }
              
          }
        res.render("nota.hbs",{ layout:"mainpdf",datos,cliente,tecnico,equipo,cantidad,notas,garantia})
    },
    
    async despdf(req,res){
        const pdf = await crearpdf("http://localhost:4000/verpdf")
        res.contentType("application/pdf")
        res.send(pdf)

    }

}