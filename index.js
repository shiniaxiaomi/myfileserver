var express = require("express"); //导入express模块
var app = express(); //获取app对象
const path = require("path");
const fs = require("fs");
const moment = require('moment');
var shell=require('shelljs');
moment.locale('zh-cn');

//资源文件的根目录对象
var root={
    isDir:true,
    children:[],
    relativePath:"/",
    size:0
};

//指定资源文件路径
var resourceDir=path.join(__dirname,"./upload");//resourceDir必须指定为绝对路径

var multer = require('multer');//引入multer
//文件存储的配置
// 使用硬盘存储模式设置存放接收到的文件的路径以及文件名
var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        // 接收到文件后输出的保存路径（若不存在则需要创建）
        cb(null, path.join(resourceDir,req.body.dirName)); //要确保这个文件夹路径是自己创建的
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname);  
    }
});
var upload = multer({
    limits:{
        files:100, //100个文件
        fileSize: 10*1024*1024*1024 //10GB
    },
    storage:storage
});//设置上传文件存储地址

createFolder(resourceDir);//不存在则创建资源文件夹

//启动server并监听再80端口
var server = app.listen(80, function() {
    console.log("应用实例启动成功!");
});

//当'/'请求时返回首页
app.get("/", function(req, res) {
    res.sendFile(path.join(__dirname, "index.html"))
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
        var size=0;
        if(stat.isDirectory()){
            var obj={size:0};
            computeDirSize(obj,path.join(targetdir,item))
            size=handleSize(obj.size);
        }else{
            size=handleSize(stat.size);
        }
        dataArr.push({
            fileName: item,
            updateTime: moment(stat.mtime).format('YYYY-MM-DD HH:mm:ss'),//格式化时间
            size: size,
            isDir: stat.isDirectory()
        })
    })
    res.send({dirData:dataArr})
})

//获取文件
app.get("/getFile",function(req, res) {
    res.set({
        'Content-Type': 'application/octet-stream',//告诉浏览器这是一个二进制文件
        'Content-Disposition': 'attachment; filename=' + encodeURI(req.query.fileName),//告诉浏览器这是一个需要下载的文件
    })
    res.sendFile(path.join(resourceDir,req.query.fileName))
})

//上传文件
app.post("/upload",upload.any(),function(req, res){
    res.sendStatus(200);
})

//创建文件夹
app.get("/mkDir",function(req, res){
    createFolder(path.join(resourceDir,req.query.dirName));
    res.json({code:1})
})

//删除文件
app.get("/deleteFile",function(req, res){
    shell.rm('-rf', path.join(resourceDir,req.query.filePath));//强制删除目录或文件
    res.json({code:1})
})  

//重命名文件或文件夹
//移动文件


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

// 递归创建文件夹
function createFolder(folder){
    try{
        // 测试 path 指定的文件或目录的用户权限,我们用来检测文件是否存在
        // 如果文件路径不存在将会抛出错误"no such file or directory"
        fs.accessSync(folder); 
    }catch(e){
        // 文件夹不存在，以同步的方式创建文件目录。
        fs.mkdirSync(folder,{recursive:true});
    }  
};

//计算目录的大小,并返回目录对象
function computeDirSize(obj,dirPath){
    var stat=fs.statSync(dirPath);
    if(!stat.isDirectory()){
        obj.children.push({
            isDir:false,
            children:undefined,
            size:stat.size,
            relativePath:dirPath
        });
        return stat.size;
    }
    var files=fs.readdirSync(dirPath);
    var buffSize=0;
    files.forEach(item=>{
        var childrenObj={
            isDir:true,
            children:[],
            size:0,
            relativePath:path.join(obj.relativePath,item)
        }
        obj.children.push(childrenObj)
        var buff2=computeDirSize(childrenObj,path.join(dirPath,item))
        childrenObj.size=buff2;
        buffSize+=buff2;
    })
    obj.size=buffSize;
    return buffSize;
}