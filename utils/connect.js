var mysql = require("mysql");
var conn = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'dbgenshin'
});

conn.connect();
module.exports=conn;