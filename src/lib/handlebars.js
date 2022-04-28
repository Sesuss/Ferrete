const moment = require("moment")

moment.locale("es")

const helpers ={}


helpers.momentD= (timestamp)=>{ 
  
    let fecha= moment(timestamp).format("dddd LL");
     return fecha
 }
helpers.momentC= (timestamp)=>{ 
  
    let fecha= moment(timestamp).format("LLLL");
     return fecha
 }
helpers.momentRe= ()=>{ 
  
    let fecha= moment().format("LLLL");
     return fecha
 }
helpers.momentH= (timestamp)=>{ 
  
    let fecha= moment(timestamp).format("YYYY-MM-DD hh:mm");
     return fecha
 }
helpers.moment= (timestamp)=>{ 
  
   let fecha= moment(timestamp).format("yyyy-MM-DD");
    return fecha
}
helpers.resta= (id)=>{ 
  
  id=id-1
    return id
}

module.exports=helpers