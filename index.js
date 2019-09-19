var express = require("express"); //导入express模块
var app = express(); //获取app对象
const path = require("path");
const fs = require("fs");
const moment = require('moment');
moment.locale('zh-cn');


var resourceDir=__dirname;//resourceDir必须指定为绝对路径


//启动server并监听再80端口
var server = app.listen(80, function() {
    console.log("应用实例启动成功!");
});

//当'/'请求时返回首页
app.get("/", function(req, res) {
    res.sendFile(path.join(resourceDir, "index.html"))
});

//获取文件夹数据
app.get("/getDirData",function(req, res) {
    var targetdir=undefined;
    if(req.query.dirName=="homeDir"){
        targetdir=resourceDir;
    }else{
        targetdir=path.join(resourceDir,req.query.dirName);
    }

    //读取文件目录,返回数据
    var dir=fs.readdirSync(targetdir);
    var dataArr=[];
    dir.map(item=>{
        var stat=fs.statSync(path.join(targetdir,item));
        dataArr.push({
            fileName: item,
            updateTime: moment(stat.mtime).format('YYYY-MM-DD HH:mm:ss'),//格式化时间
            size: handleSize(stat.size),
            isDir: stat.isDirectory()
        })
    })
    res.send({dirData:dataArr})
})

//获取文件
app.get("/getFile",function(req, res) {
    res.sendFile(path.join(resourceDir,req.query.fileName))
})


//重命名文件或文件夹
//移动文件
//删除文件
//上传文件
//上传文件夹
//搜索文件或文件夹

//处理文件的大小
function handleSize(size){
    var KB=1024;
    var MB=1024*1024;
    var GB=1024*1024*1024;
    var TB=1024*1024*1024*1024;

    if(Math.floor(size/TB)>0){
        return (size/TB).toFixed(2)+"TB";
    }else if(Math.floor(size/GB)>0){
        return (size/GB).toFixed(2)+"GB";
    }else if(Math.floor(size/MB)>0){
        return (size/MB).toFixed(2)+"MB";
    }else if(Math.floor(size/KB)>0){
        return (size/KB).toFixed(2)+"KB";
    }else{
        return size+"B";
    }
}
