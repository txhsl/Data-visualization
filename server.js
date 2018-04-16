var MongoClient = require("mongodb").MongoClient;
var url = "mongodb://112.74.207.160:27017/";

var express = require('express');
var app = express();
var bodyParse = require('body-parser')
var cookieParser = require('cookie-parser') ;

app.use(cookieParser()) ;
app.use(bodyParse.urlencoded({extended:false})) ;
app.use(express.static("public"));

app.get('/nodes', function (req,res) {
    
    var link = req.query.link;
    var node = req.query.node;

    console.log("Known node: " + node.id);
    console.log('Another node of ' + link.source + " requested!");

    var whereStr = null;
    if (link.source == node.id) {
      whereStr = { "id": link.target, "group": 5 };
    }
    else {
      var group = 0;
      switch (link.type){
        case "act":
          group = 1;
          break;
        case "direct":
          group = 2;
          break;
        case "produce":
          group = 3;
          break;
        case "write":
          group = 4;
          break;
        default:
          group = 5;
          break;
      }
      whereStr = { "id": link.source , "group": group };
    }

    console.log(whereStr);
    
    MongoClient.connect(url, function(err, db) {
      if (err) throw err;
      var dbo = db.db("movie");
      dbo.collection("nodes").find(whereStr).toArray(function(err, result) { // 返回集合中所有数据
        if (err) throw err;            
        db.close();
          if (result.length < 1) {//数据缺失，补充
            console.log("Leak " + whereStr.id + "!");
            var leak = [{ "_id": "leak", "id": whereStr.id, "name": whereStr.id , "group": group }]
            res.send(leak);
          }
          else {
            console.log(result)
            res.send(result);
          }
      });
    });
});

app.get('/links', function (req,res) {
    
  var node = req.query.node;
  console.log('More links of ' + node.id + " requested!");

  MongoClient.connect(url, function(err, db) {
    if (err) throw err;
    var dbo = db.db("movie");

    var whereStr = null;
    if (node.group == 5) {
      whereStr = { "target": node.id, "source": {$ne: ""} };
    }
    else {
      var type = "";
      console.log(node.group);
      switch(node.group){
        case "1":
          type = "act";
          break;
        case "2":
          type = "direct";
          break;
        case "3":
          type = "produce";
          break;
        case "4":
          type = "write";
          break;
        default:
          break;
      }
      whereStr = { "source": node.id, "target": {$ne: ""}, "type": type};
    }

    console.log(whereStr);
    dbo.collection("links"). find(whereStr).toArray(function(err, result) { // 返回集合中所有数据
        if (err) throw err;
        db.close();

        res.send(result);
    });
  });
}) ;

// 监听3000端口
var server=app.listen(3000) ;

//Check MongoDB on server
MongoClient.connect(url, function(err, db) {
    if (err) throw err;
    console.log("Database checked!");
    db.close();
  });