const router = require("express").Router();
const { body } = require("express-validator");
var database = require("./utils/database");
var dbConnect = require("./utils/connect");
const multer = require("multer");

const {
    index,
    homePage,
    register,
    registerPage,
    login,
    loginPage,
    changeProfile,
} = require("./controllers/userController");



const upload = multer({storage:multer.memoryStorage()});

const ifNotLoggedin = (req, res, next) => {
    if(!req.session.userID){
        return res.redirect('/index');
    }
    next();
}

const ifLoggedin = (req,res,next) => {
    if(req.session.userID){
        return res.redirect('/index');
    }
    next();
}
router.get('/index',  index);

router.get('/', ifNotLoggedin, homePage);
router.get('/', ifLoggedin, homePage);

router.get("/login", ifLoggedin, loginPage);
router.post("/login",
ifLoggedin,
    [
        body("_email", "Invalid email address")
            .notEmpty()
            .escape()
            .trim()
            .isEmail(),
        body("_password", "The Password must be of minimum 4 characters length")
            .notEmpty()
            .trim()
            .isLength({ min: 4 }),
    ],
    login
);

router.get("/signup", ifLoggedin, registerPage);
router.post(
    "/signup",
    ifLoggedin,
    [
        body("_name", "The name must be of minimum 3 characters length")
            .notEmpty()
            .escape()
            .trim()
            .isLength({ min: 3 }),
        body("_email", "Invalid email address")
            .notEmpty()
            .escape()
            .trim()
            .isEmail(),
        body("_phone", "Phone number must be of 10 characters length")
            .notEmpty()
            .escape()
            .trim()
            .isLength({ min: 10, max: 10 }),   
        body("_password", "The Password must be of minimum 4 characters length")
            .notEmpty()
            .trim()
            .isLength({ min: 4 }),
    ],
    register
); 

//logout
router.get('/logout', (req, res, next) => {
    req.session.destroy((err) => {
        next(err);
    });
    res.redirect('/login');
});

//update user
router.get('/update', ifNotLoggedin , changeProfile);
router.post('/update', ifNotLoggedin,  [
    body("_name", "The name must be of minimum 3 characters length")
    .notEmpty()
    .escape()
    .trim()
    .isLength({ min: 3 }),
    body("_phone", "Phone number must be of 10 characters length")
    .notEmpty()
    .escape()
    .trim()
    .isLength({ min: 10, max: 10 }),
], changeProfile

);

//home
router.get('/home', function(req, res, next)
{
    res.render('./user-views/home', { title: 'Home' });
})
//Item
router.get('/item', function(req, res, next) {
    res.render('item', { title: 'Item' });
});


router.get('/get_data', function(request, response, next){

    var draw = request.query.draw;

    var start = request.query.start;

    var length = request.query.length;

    var order_data = request.query.order;

    if(typeof order_data == 'undefined')
    {
        var column_name = 'items.id';

        var column_sort_order = 'desc';
    }
    else
    {
        var column_index = request.query.order[0]['column'];

        var column_name = request.query.columns[column_index]['data'];

        var column_sort_order = request.query.order[0]['dir'];
    }

    //search data

    var search_value = request.query.search['value'];

    var search_query = `
     AND (name LIKE '%${search_value}%' 
      OR description LIKE '%${search_value}%' 
      OR weapon_level LIKE '%${search_value}%' 
     )
    `;

    //Total number of records without filtering

    database.query("SELECT COUNT(*) AS Total FROM items", function(error, data){

        var total_records = data[0].Total;

        //Total number of records with filtering

        database.query(`SELECT COUNT(*) AS Total FROM items WHERE 1 ${search_query}`, function(error, data){

            var total_records_with_filter = data[0].Total;

            var query = `
            SELECT * FROM items 
            WHERE 1 ${search_query} 
            ORDER BY ${column_name} ${column_sort_order} 
            LIMIT ${start}, ${length}
            `;

            var data_arr = [];

            database.query(query, function(error, data){

                data.forEach(function(row){
                    data_arr.push({
                        'id' : row.id,
                        'name' : row.name,
                        'description' : row.description,
                        'weapon_level' : row.weapon_level
                    });
                });

                var output = {
                    'draw' : draw,
                    'iTotalRecords' : total_records,
                    'iTotalDisplayRecords' : total_records_with_filter,
                    'aaData' : data_arr
                };

                response.json(output);

            });

        });

    });

});


//thêm item

router.post('/updateitem',upload.single('itemimage'), function(req, res){
    image=req.file.buffer.toString('base64');
    database.query(`INSERT INTO items (name, description, weapon_level, atk_item, hp_item, itemimage) VALUES ('${req.body.name}','${req.body.description}','${req.body.weapon_level}','${req.body.atk_item}','${req.body.hp_item}','${image}')`,function(err){
        if (err) throw err;
        res.redirect("/updateitem")
        console.log;
    })
})
//table item
router.get('/updateitem',ifNotLoggedin,function(req, res, next){
    dbConnect.query("SELECT * FROM items",function(err,data){
        if (err) throw err;
        res.render('updateitem', {data:data});

    });
});

//xóa item
router.get('/delete/:id',function(req,res){
    dbConnect.query(`DELETE FROM items WHERE id =${req.params.id}`, function(err){
        if (err) throw err;
        res.redirect("/updateitem");
        
    })
});

router.get("/edititem/:id",function(req,res){
    dbConnect.query(`SELECT * FROM items WHERE id=${req.params.id}`,function(err,data){
        if (err) throw err;
        res.render("edititem",{data:data});
    })
});

//sửa item
router.post('/edititem/:id',upload.single('itemimage'),function(req,res){
    image=req.file.buffer.toString('base64');
    dbConnect.query(`UPDATE items SET name='${req.body.name}', description='${req.body.description}', weapon_level='${req.body.weapon_level}', atk_item='${req.body.atk_item}', hp_item='${req.body.hp_item}', itemimage='${image}' WHERE id=${req.params.id}` ,function(err){
        if (err) throw err;
        res.redirect("/updateitem");
    })
})


//table vũ khí
router.get('/updateweapon',ifNotLoggedin,function(req, res, next){
    dbConnect.query("SELECT * FROM weapons",function(err,data){
        if (err) throw err;
        res.render('updateweapon', {data:data});

    });
});

//thêm vũ khí
router.post('/updateweapon',upload.single('weaponimage'), function(req, res){
    image=req.file.buffer.toString('base64');
    database.query(`INSERT INTO weapons (name, description, atk_weapon, hp_weapon, weaponimage) VALUES ('${req.body.name}','${req.body.description}','${req.body.atk_weapon}','${req.body.hp_weapon}','${image}')`,function(err){
        if (err) throw err;
        res.redirect("/updateweapon")
    })
})

//xóa vũ khí
router.get('/deleteweapon/:id_weapons',function(req,res){
    dbConnect.query(`DELETE FROM weapons WHERE id_weapons =${req.params.id_weapons}`, function(err){
        if (err) throw err;
        res.redirect("/updateweapon");
        
    })
});

router.get("/editweapon/:id",function(req,res){
    dbConnect.query(`SELECT * FROM weapons WHERE id_weapons=${req.params.id}`,function(err,data){
        if (err) throw err;
        res.render("editweapon",{data:data});
    })
});
//sửa vũ khí
router.post('/editweapon/:id_weapon',upload.single('weaponimage'),function(req,res){
    image=req.file.buffer.toString('base64');
    dbConnect.query(`UPDATE weapons SET name='${req.body.name}', description='${req.body.description}', atk_weapon='${req.body.atk_weapon}', hp_weapon='${req.body.hp_weapon}', weaponimage='${image}' WHERE id_weapons=${req.params.id_weapon}` ,function(err){
        if (err) throw err;
        res.redirect("/updateweapon");
    })
})



router.get('/tableduyet',ifNotLoggedin,function(req,res){
    dbConnect.query("SELECT * FROM `items`", function(err,data1){
         dbConnect.query("SELECT * FROM `weapons`",function(err,data2){
            dbConnect.query("SELECT * FROM nhanvat2",function(err,data){
                res.render('tableduyet',{
                    data1:data,
                    items:data1, 
                    weapons:data2});
            })
         })
 });
});




//duyệt
router.get('/duyet/:id_nhanvat',function(req,res){
    dbConnect.query("SELECT * FROM `items`", function(err,data1){
         dbConnect.query("SELECT * FROM `weapons`",function(err,data2){
            dbConnect.query(`SELECT * FROM nhanvat2 WHERE id_nhanvat = ${req.params.id_nhanvat}`,function(err,data3){
                res.render('duyet',{
                    items:data1, 
                    weapons:data2,
                    nhanvat:data3});
     })
    })
 });
});
router.post('/duyet/:id_nhanvat',function(req,res){
    database.query(`INSERT INTO nhanvat (name, id_items, id_weapons, image_nhanvat) VALUES ('${req.body.name}','${req.body.id_items}','${req.body.id_weapons}','${req.body.image}')`,(err)=>{
        database.query(`DELETE FROM nhanvat2 WHERE id_nhanvat =${req.params.id_nhanvat}`,function(err){

        })
        if(err) throw err;
            res.redirect('/nhanvatadmin');
    })
});

router.get('/deletenhanvat2/:id_nhanvat',function(req,res){
    database.query(`DELETE FROM nhanvat2 WHERE id_nhanvat =${req.params.id_nhanvat}`,function(err){
        if(err) throw err;
            res.redirect('back');
    })
})

//table nhân vật


//delete nhân vật
router.get('/deletenhanvat/:id_nhanvat',function(req,res){
    dbConnect.query(`DELETE FROM nhanvat WHERE id_nhanvat =${req.params.id_nhanvat}`, function(err){
        if (err) throw err;
        res.redirect("back");
        
    })
});
//sửa nhân vật
router.get('/editnhanvat/:id_nhanvat',function(req,res){
    dbConnect.query("SELECT * FROM `items`", function(err,data1){
         dbConnect.query("SELECT * FROM `weapons`",function(err,data2){
            dbConnect.query(`SELECT * FROM nhanvat WHERE id_nhanvat = ${req.params.id_nhanvat}`,function(err,data3){
                res.render('editnhanvat',{
                    items:data1, 
                    weapons:data2,
                    nhanvat:data3});
     })
    })
 });
});

router.post('/editnhanvat/:id_nhanvat',upload.single('nhanvatimage'),function(req,res){
    image = req.file.buffer.toString('base64')
    name1 = req.body.name
    id_items = req.body.id_items
    id_weapons = req.body.id_weapons
    
    database.query(`UPDATE nhanvat SET name=?, id_items=?, id_weapons=?, image_nhanvat=? WHERE id_nhanvat=${req.params.id_nhanvat}`,[name1,id_items,id_weapons,image],function(err){
        if(err) throw err;
        res.redirect("/tablenhanvat");
    })
});

//table nhân vật user
router.get('/nhanvatadmin',ifNotLoggedin,function(req,res){
    dbConnect.query("SELECT * FROM items", function(err,data1){
         dbConnect.query("SELECT * FROM weapons",function(err,data2){
            dbConnect.query("SELECT * FROM nhanvat",function(err,data){
                res.render('nhanvatadmin',{
                    data1:data,
                    items:data1, 
                    weapons:data2});
            })
         })
 });
});
router.get('/nhanvatadmin',ifNotLoggedin,function(req, res, next){
    dbConnect.query("SELECT * FROM nhanvat",function(err,data1){
        if (err) throw err;
        res.render('nhanvatadmin', {data1:data1});

    });
});

//info nhân vật
router.get('/infonhanvatadmin/:id_nhanvat',ifNotLoggedin,function(req,res){
    dbConnect.query("SELECT * FROM items", function(err,data){
         dbConnect.query("SELECT * FROM weapons",function(err,data1){
            dbConnect.query(`SELECT * FROM nhanvat WHERE id_nhanvat = ${req.params.id_nhanvat}`,function(err,data2){
                dbConnect.query(`SELECT * FROM review WHERE id_nhanvat = ${req.params.id_nhanvat}`,function(err,data3){
                    res.render("infonhanvatadmin",{
                        items:data,
                        weapons:data1,
                        nhanvat:data2,
                        review:data3
                    })
                })
            })
         })
    });
});

//thêm bình luận

router.post('/infonhanvat/:id_nhanvat',function(req,res){
    dbConnect.query(`INSERT INTO review (id_nhanvat, reviewer, reviewtext) VALUES ('${req.params.id_nhanvat}','${req.body.reviewer}','${req.body.reviewtext}')`,function(err){
        if (err) throw err;
        res.redirect('back');
    })
})

//xoá bình luận

router.get('/deletereview/:id_review',function(req,res){
    dbConnect.query(`DELETE FROM review WHERE id_review =${req.params.id_review}`, function(err){
        if (err) throw err;
        res.redirect('back');

    })
});

//Userpage
//table vukhi user
router.get('/vukhi',function(req, res, next){
    dbConnect.query("SELECT * FROM weapons",function(err,data){
        if (err) throw err;
        res.render('./user-views/vukhi', {data:data});

    });
});

//table trangbi user
router.get('/trangbi',function(req, res, next){
    dbConnect.query("SELECT * FROM items",function(err,data){
        if (err) throw err;
        res.render('./user-views/trangbi', {data:data});

    });
});

//table nhân vật user
router.get('/tablenhanvat',function(req,res){
    dbConnect.query("SELECT * FROM items", function(err,data1){
         dbConnect.query("SELECT * FROM weapons",function(err,data2){
            dbConnect.query("SELECT * FROM nhanvat",function(err,data){
                res.render('./user-views/tablenhanvat',{
                    data1:data,
                    items:data1, 
                    weapons:data2});
            })
         })
 });
});
router.get('/tablenhanvat',function(req, res, next){
    dbConnect.query("SELECT * FROM nhanvat",function(err,data1){
        if (err) throw err;
        res.render('./user-views/tablenhanvat', {data1:data1});

    });
});
//thêm nhân vật
router.post('/tablenhanvat',upload.single('nhanvatimage'),(req, res)=>{
    image = req.file.buffer.toString('base64')
    name1 = req.body.name
    id_items = req.body.id_items
    id_weapons = req.body.id_weapons
    q = "INSERT INTO nhanvat2 VALUES (NULL,?,?,?,?)"
    database.query(q,[name1,id_items,id_weapons,image],(err,rows,fields)=>{
        if(err) throw err;
        res.redirect('back');
    })
});
//info nhân vật user
router.get('/infonhanvat/:id_nhanvat',function(req,res){
    dbConnect.query("SELECT * FROM items", function(err,data){
         dbConnect.query("SELECT * FROM weapons",function(err,data1){
            dbConnect.query(`SELECT * FROM nhanvat WHERE id_nhanvat = ${req.params.id_nhanvat}`,function(err,data2){
                dbConnect.query(`SELECT * FROM review WHERE id_nhanvat = ${req.params.id_nhanvat}`,function(err,data3){
                    res.render("user-views/infonhanvat",{
                        items:data,
                        weapons:data1,
                        nhanvat:data2,
                        review:data3
                    })
                })
            })
         })
    });
});

module.exports = router;