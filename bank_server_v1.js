// extract modules
var http = require('http');
var express = require('express');
var mysql = require('mysql');
var fs = require('fs');
var multiparty = require('connect-multiparty');
var multipartyMiddleware = multiparty();

// connect with DB
var client = mysql.createConnection({
    user: 'root',
    password: 'q1w2e3r4',
    database: 'bank'
});

// make web server
var app = express();
app.use(express.static('public'));
app.use(express.bodyParser());
app.use(app.router);



app.get('/problems', function(request, response){
    client.query('select * from problems', function(error, data){
        response.send(data);
    });
});

app.post('/problem', function(request, response){
    
       var dirname = 'public/asset/images/';
    var filePath = dirname + request.files.file.name;
    fs.readFile(filePath, function(error, data){
        
           fs.writeFile(filePath, data, function(err){
               if(err) throw err;
               else response.redirect('back');
           });
    });
     
});

app.post('/upload-full-form', function (req, res) {
    
    console.log('uploaded');
    res.setHeader('Content-Type', 'text/html');

    var pictureUrl = '/path/to/default/pictures';
    var fileUploadMessage = '';
    
    // process file
    if (!req.files.file || req.files.file.size == 0) {
      fileUploadMessage = 'No file uploaded at ' + new Date().toString();
      res.send(fileUploadMessage);
    }
    else {
        var file = req.files.file;
       
        fs.unlink(file.path, function (err) {
            if (err)
                throw err;
            else
            {
                fileUploadMessage = '<b>"' + file.name + '"<b> uploaded to the server at ' + new Date().toString();
                pictureUrl = '/picture-uploads/' + file.name;

                var responseObj = {
                    fullname: req.param('fullname'),
                    gender: req.param('gender'),
                    color: req.param('color'),
                    pictureUrl: pictureUrl
                }
                res.send(JSON.stringify(responseObj));
            }             
        });
    }
});

app.get('/categories', function(request, response){
    client.query('select * from categories', function(error, data){
        response.send(data);
    });
});

app.post('/category', function(request, response){
    
    var path = request.param('path');
    var name = request.param('name');
    
    console.log('post category path,name: ' + path +','+ name);
    
    var query = 'INSERT INTO categories (path, name) VALUES(?, ?)';
    
    client.query(query, [path, name], function(error, data){
//        response.writeHead(200, {"Content-Type": "text/plain"});
    });
});


http.createServer(app).listen(52273, function(){
    console.log('Server running at http://127.0.0.1:52273');
});