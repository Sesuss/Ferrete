const bcrypt = require("bcryptjs")
let helpers ={}

helpers.regi = async (password) => {
    const salt = await bcrypt.genSalt(10)
    const FinalPassword= await bcrypt.hash(password, salt)
    return FinalPassword
}

helpers.login = async (password, savepassword) => {
    try{
        return await bcrypt.compare(password,savepassword)
    } catch(err){
        console.log(err)
    }
}



module.exports = helpers