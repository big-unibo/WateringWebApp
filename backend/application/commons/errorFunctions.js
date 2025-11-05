const logaritmicCapped300Error = (x) => {
    const xAbs = Math.abs(x)
    return  xAbs < 300 ? Math.log(xAbs) : Math.log(300)  
}

const logaritmicCapped300ErrorSQLWrapper = (field) =>{
    return `CASE WHEN ${field} > -300 THEN LN(ABS(${field})) ELSE LN(ABS(-300)) END`
}

export const errorFunctions = {
    potential_error: logaritmicCapped300Error
}

export const errorFunctionsSQLWrapper = {
    potential_error: logaritmicCapped300ErrorSQLWrapper
}
