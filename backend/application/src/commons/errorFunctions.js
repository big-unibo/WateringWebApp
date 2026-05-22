const logaritmicCapped300Error = (x) => {
    const xAbs = Math.abs(x)
    return  xAbs < 300 ? -Math.log(xAbs) : -Math.log(300)  
}

const logaritmicCapped300ErrorSQLWrapper = (field) =>{
    return `CASE WHEN ${field} <= -300 THEN -LN(ABS(-300)) ELSE -LN(ABS(${field})) END`
}

const logaritmicCapped300ErrorUnit = (field) =>{
   return `('-log(|' || ${field} || '|)')`;
}

export const errorFunctions = {
    potential_error: logaritmicCapped300Error,
    linear_error: (x) => x
}

export const errorFunctionsSQLWrapper = {
    potential_error: logaritmicCapped300ErrorSQLWrapper,
    linear_error: (field) => field
}

export const errorFunctionsUnits = {
    potential_error: logaritmicCapped300ErrorUnit,
    linear_error: (field) => field
}
