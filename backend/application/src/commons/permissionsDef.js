export const RAW_PERMISSIONS = {
    CREATE_ORGANIZATION: { 
        table: 'organizations', 
        permit: 'create' 
    },

    // DISABLE_FIELD: { 
    //     table: 'fields', 
    //     permit: 'disable', 
    //     idKey: 'fieldId' 
    // },

    // DISABLE_SENSOR_STRICT: [
    //     { table: 'devices', permit: 'update', idKey: 'deviceId' },
    //     { table: 'fields', permit: 'update', idKey: 'fieldId' }
    // ],

};