// extract modules
var http = require('http');
var express = require('express');
var mysql = require('mysql');
var fs = require('fs');
var path = require('path');
var os = require('os');


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
    
    var question = request.param('question');
    var answer = request.param('answer');
    var explanation = request.param('explanation');
    var stringWithCategories = request.param('categories');
    var categories = [];
    var hasQuestionImage = false;
    var hasExplanationImage = false;
    var stringWithExamples = request.param('examples');
    var insertId = {};
    
    var tempId = '';
    for(var i=0; i<stringWithCategories.length; i++){
        if(stringWithCategories.charAt(i) == '/'){
            categories.push(tempId);
            tempId = '';
        }else{
            tempId = tempId.concat(stringWithCategories.charAt(i));
        }
    }
    
    console.log(JSON.parse(JSON.stringify(request.files)));
    
    // case for problem/explanation with image
    if(request.files.questionAttached){
        hasQuestionImage = true;
        console.log('QUESTION IMAGE CONTAINED');
    }
    
    if(request.files.explanationAttached){
        hasExplanationImage = true;
        console.log('EXPLANATION IMAGE CONTAINED');
    }
    
    var hasImage = hasQuestionImage || hasExplanationImage;
    if(!hasImage){
        console.log('IMAGE NOT CONTAINED');
    }
    
    
    
    // insert problem to db
    if(question && answer){
        
        client.query('INSERT INTO problems (question, answer, explanation, hasQImage, hasExplnImage, examples) VALUES(?, ?, ?, ?, ?, ?)', [question, answer, explanation, hasQuestionImage, hasExplanationImage, stringWithExamples], function(error, info){
            
            if(error){
                console.log('INSERT PROBLEM http post request : insert problem error with problem');    
                throw error;
                
            }else{
                
                insertId = info.insertId;    
                console.log('INSERT PROBLEM http post request : insert problem complete with id :'+insertId);

                var pclinkQuery = 'INSERT INTO pcLinks (pid, cid) VALUES ';
                for(i=0; i<categories.length; i++){
                    if(i != 0){
                        pclinkQuery += ',';
                    }
                    var cid = categories[i];
                    pclinkQuery += '('+insertId+','+cid+')';
                }

                client.query(pclinkQuery, [insertId, cid], function(cateError){
                    if(cateError){
                        console.log('INSERT PROBLEM http post request : insert problem_category_link error with ('+insertId+', '+cid+')');
                        throw cateError;
                    }else{
                        console.log('INSERT PROBLEM http post request : insert problem_category_link complete');
                    }                

                    if(hasImage){
                        
                        var filePaths = [];
                        var newImageFilePaths = [];
                        var defaultPath = 'public/asset/images/';
                        
                        if(hasQuestionImage){
                            
                            if(request.files.questionAttached.length){
                                for(var i=0; i<request.files.questionAttached.length; i++){
                                    var attachedFilePath = request.files.questionAttached[i].path;
                                    filePaths.push(attachedFilePath);
                                    newImageFilePaths.push( defaultPath + 'question_image_' + insertId + '_' + i + path.extname(attachedFilePath));
                                }                                
                            }else{
                                var attachedFilePath = request.files.questionAttached.path;
                                filePaths.push(attachedFilePath);
                                newImageFilePaths.push( defaultPath + 'question_image_' + insertId + '_' + i + path.extname(attachedFilePath));
                            }
                        }

                        if(hasExplanationImage){
                            
                            if(request.files.explanationAttached.length){
                                for(var i=0; i<request.files.explanationAttached.length; i++){
                                    var attachedFilePath = request.files.explanationAttached[i].path;
                                    filePaths.push(attachedFilePath);
                                    newImageFilePaths.push( defaultPath + 'question_image_' + insertId + '_' + i + path.extname(attachedFilePath));
                                }                                
                            }else{
                                var attachedFilePath = request.files.explanationAttached.path;
                                filePaths.push(attachedFilePath);
                                newImageFilePaths.push( defaultPath + 'explanation_image_' + insertId + '_' + i + path.extname(attachedFilePath));
                            }
                        }
                        
                        
                        var index = 0;
                        for(var i=0; i<filePaths.length; i++){
//                            (function(i){
                            var oldPath = '';
                            var newPath = '';
                            oldPath = filePaths[i];
                            newPath = newImageFilePaths[i];
                            
                            fs.readFile(oldPath, function(err, data){
                                
                                if(err){
                                    response.statusCode = 400;
                                    console.log('INSERT PROBLEM http post request : file read error ' + oldPath);
                                    throw err;
                                }else{                                
                                    console.log('INSERT PROBLEM http post request : file read complete ' + oldPath);
                                    fs.writeFile(newPath, data, 'binary', function(saveError){
                                    
                                        if(saveError){ 
                                            response.statusCode = 400;
                                            console.log('INSERT PROBLEM http post request : saving image error');
                                            throw saveError;

                                        }else{

                                            client.query('INSERT INTO problemImages (name, pid) VALUES(?, ?)', [newPath, insertId], function(imageQueryError, imageQueryInfo){
                                                if(imageQueryError){
                                                    response.statusCode = 400;
                                                    console.log('INSERT PROBLEM http post request : image query error');
                                                    throw imageQueryError;
                                                }else{
                                                    console.log('INSERT PROBLEM http post request : image upload complete');
                                                    index++;
                                                    if(index == filePaths.length-1){
                                                        response.send('OK');
                                                    }
                                                }
                                            });
                                        }
                                    });     
                                }   
                            });                            
//                            })(i);
                        }
                        
                        
                    } else {
                        console.log('INSERT PROBLEM http post request : insert problem with only category complete');
                        response.redirect('back');  
                    }
                });                
            }
            
        });        
    }else{
        console.log('INSERT PROBLEM http post request : parameter missing');
        response.statusCode = 400;
    }
    
});

app.get('/categories', function(request, response){
    client.query('select * from categories', function(error, data){
        response.send(data);
    });
});

app.post('/category', function(request, response){
    
    var categoryPath = request.param('path');  
    var name = request.param('name');
    var parentId = request.param('parentId');
    var parentRelativePath = request.param('parentRelativePath');
    
    console.log('post category path,name: ' + categoryPath +','+ name +', parentId : '+ parentId + ' re_path : '+parentRelativePath);
    var insertCategoryOrder = 0;
    
    
    client.query('select * from categories where path = ?', [categoryPath], function(error, results){

        insertCategoryOrder = results.length;
        var relativePath = parentRelativePath + insertCategoryOrder.toString() + '/';

        if(error){
            response.statusCode = 400;
            console.log('INSERT CATEGORY http post request : count parent path error');
            throw saveError;
        }else{
            
            console.log('INSERT CATEGORY http post request : count parent path complete');
            client.query('INSERT INTO categories (name, path, relativePath) VALUES(?, ?, ?)', [name, categoryPath, relativePath], function(insertError, insertInfo){
                if(insertError){
                    response.statusCode = 400;
                    console.log('INSERT CATEGORY http post request : insert category error');
                    throw insertError;
                }else{
                    console.log('INSERT CATEGORY http post request : insert category complete');
                    response.send('OK');
                }
            });
        }
    });
});

app.del('/category/:cid', function(request, response){
        
    var cid = Number(request.param('cid'));
    
    
    client.query('SELECT * FROM categories WHERE cid='+cid, function(error, results){
        
        if(error){
            response.statusCode = 400;
            console.log('DELETE CATEGORY http post request : select category error');
            throw error;
        
        }else{
            console.log('DELETE CATEGORY http post request : select category complete');

            var deletingCategoryPath = results[0].path;
            deletingCategoryPath = deletingCategoryPath + cid.toString() + '/';
            
            client.query('DELETE FROM categories WHERE path LIKE "%'+deletingCategoryPath+'%"', function(error2){
                
                if(error2){
                    response.statusCode = 400;
                    console.log('DELETE CATEGORY http post request : select children categories error');
                    throw error2;
                
                }else{
                
                    client.query('DELETE FROM categories WHERE cid=?', [cid], function(err, data){
                        
                        if(err){
                            response.statusCode = 400;
                            console.log('DELETE CATEGORY http post request : delete category error');
                            throw err;
                            
                        }else{
                            console.log('DELETE CATEGORY http post request : delete category complete');
                            response.send('OK');   
                        }
                    });
                }
            });        
        }
    });
    
    

});



// check server running
http.createServer(app).listen(8080, function(){
    
    var ifaces = os.networkInterfaces();

    Object.keys(ifaces).forEach(function (ifname) {
        var alias = 0;

        ifaces[ifname].forEach(function (iface) {
            if ('IPv4' !== iface.family || iface.internal !== false) {
                  // skip over internal (i.e. 127.0.0.1) and non-ipv4 addresses
                return;
            }

            if (alias >= 1) {
                // this single interface has multiple ipv4 addresses
                console.log(ifname + ':' + alias, iface.address);
            } else {
                // this interface has only one ipv4 adress
                console.log(ifname, iface.address);
            }
        });
    });
    console.log('Server running');
});