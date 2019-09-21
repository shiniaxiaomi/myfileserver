var express = require("express"); //导入express模块
var app = express(); //获取app对象
const path = require("path");
const fs = require("fs");
const moment = require("moment");
var shell = require("shelljs");
moment.locale("zh-cn");

//资源文件的根目录对象
var root = undefined;

//指定资源文件路径
var resourceDir = path.join(__dirname, "./upload"); //resourceDir必须指定为绝对路径

var multer = require("multer"); //引入multer
//文件存储的配置
// 使用硬盘存储模式设置存放接收到的文件的路径以及文件名
var storage = multer.diskStorage({
  destination: function(req, file, cb) {
    // 接收到文件后输出的保存路径（若不存在则需要创建）
    cb(null, path.join(resourceDir, req.body.dirName)); //要确保这个文件夹路径是自己创建的
  },
  filename: function(req, file, cb) {
    cb(null, file.originalname);
  }
});
var upload = multer({
  limits: {
    files: 100, //100个文件
    fileSize: 10 * 1024 * 1024 * 1024 //10GB
  },
  storage: storage
}); //设置上传文件存储地址

createFolder(resourceDir); //不存在则创建资源文件夹

//启动server并监听再80端口
var server = app.listen(80, function() {
  console.log("应用实例启动成功!");
});

//当'/'请求时返回首页
app.get("/", function(req, res) {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.get("/rename", function(req, res) {
  var srcPath = path.join(resourceDir, req.query.relativePath);
  var backPath = computerBackDir(srcPath);
  var targetpath = path.join(backPath, req.query.fileName);

  shell.mv(srcPath, targetpath); //当当前目录移动,即重命名
  refreshResourceDirObj();
  res.json({ code: 1 });
});

//获取文件夹数据
app.get("/getDirData", function(req, res) {
  //实现懒加载
  if (root == undefined) {
    root = getResourceDirObj();
  }

  var list = [];
  var files = getDirDataByUrl(
    [root],
    path.join(resourceDir, req.query.dirName)
  );
  files.forEach(item => {
    list.push({
      name: item.name,
      updateTime: item.updateTime,
      isDir: item.isDir,
      size: handleSize(item.size),
      parentPath: item.parentNode.relativePath,
      relativePath: item.relativePath
    });
  });
  res.send({ dirData: list });
});

//获取文件
app.get("/getFile", function(req, res) {
  res.set({
    "Content-Type": "application/octet-stream", //告诉浏览器这是一个二进制文件
    "Content-Disposition":
      "attachment; filename=" + encodeURI(req.query.fileName) //告诉浏览器这是一个需要下载的文件
  });
  res.sendFile(path.join(resourceDir, req.query.fileName));
});

//上传文件
app.post("/upload", upload.any(), function(req, res) {
  refreshResourceDirObj();
  res.sendStatus(200);
});

//创建文件夹
app.get("/mkDir", function(req, res) {
  createFolder(path.join(resourceDir, req.query.dirName));
  refreshResourceDirObj();
  res.json({ code: 1 });
});

//删除文件
app.get("/deleteFile", function(req, res) {
  shell.rm("-rf", path.join(resourceDir, req.query.filePath)); //强制删除目录或文件
  refreshResourceDirObj();
  res.json({ code: 1 });
});

//重命名文件或文件夹
//移动文件

//上传文件夹
//搜索文件或文件夹

//处理文件的大小
function handleSize(size) {
  var KB = 1024;
  var MB = 1024 * 1024;
  var GB = 1024 * 1024 * 1024;
  var TB = 1024 * 1024 * 1024 * 1024;

  if (Math.floor(size / TB) > 0) {
    return (size / TB).toFixed(2) + "TB";
  } else if (Math.floor(size / GB) > 0) {
    return (size / GB).toFixed(2) + "GB";
  } else if (Math.floor(size / MB) > 0) {
    return (size / MB).toFixed(2) + "MB";
  } else if (Math.floor(size / KB) > 0) {
    return (size / KB).toFixed(2) + "KB";
  } else {
    return size + "B";
  }
}

// 递归创建文件夹
function createFolder(folder) {
  try {
    // 测试 path 指定的文件或目录的用户权限,我们用来检测文件是否存在
    // 如果文件路径不存在将会抛出错误"no such file or directory"
    fs.accessSync(folder);
  } catch (e) {
    // 文件夹不存在，以同步的方式创建文件目录。
    fs.mkdirSync(folder, { recursive: true });
  }
}

//使用广度优先遍历查询
function getDirDataByUrl(stack, url) {
  while (stack.length != 0) {
    var buff = stack.shift();
    if (buff.absolutePath == url) {
      return buff.isDir == true ? buff.children : [buff];
    } else {
      if (buff.isDir) {
        buff.children.forEach(item => {
          stack.push(item);
        });
      }
    }
  }
}

//重新刷新资源文件目录的对象
function refreshResourceDirObj() {
  root = getResourceDirObj();
}

//获取资源文件目录的对象
function getResourceDirObj() {
  var buff = {
    children: []
  };
  computeDirSize(buff, resourceDir, "/", "upload");
  return buff.children[0];
}

//计算文件夹的大小
//filePath是要计算的文件夹路径,name是该文件夹的名称,obj是计算后生成的对应的文件夹的对象
function computeDirSize(obj, basePath, relativePath, name) {
  var stat = fs.statSync(path.join(basePath, relativePath));
  //是文件
  if (!stat.isDirectory()) {
    obj.children.push({
      name: name,
      updateTime: moment(stat.mtime).format("YYYY-MM-DD HH:mm:ss"), //格式化时间
      isDir: false,
      children: undefined,
      size: stat.size,
      absolutePath: path.join(basePath, relativePath),
      relativePath: relativePath,
      parentNode: obj
    });
    return stat.size;
  }

  //是文件夹
  var dirItem = {
    name: name,
    updateTime: moment(stat.mtime).format("YYYY-MM-DD HH:mm:ss"), //格式化时间
    isDir: true,
    children: [],
    size: undefined,
    absolutePath: path.join(basePath, relativePath),
    relativePath: relativePath,
    parentNode: obj
  };
  obj.children.push(dirItem);
  var files = fs.readdirSync(dirItem.absolutePath);
  var buff = 0;
  files.forEach(item => {
    buff += computeDirSize(
      dirItem,
      basePath,
      path.join(relativePath, item),
      item
    );
  });
  dirItem.size = buff;
  return buff;
}

//根据当前目录计算上一级目录
function computerBackDir(currentDir) {
  if (currentDir == "\\") {
    return "\\";
  }
  var i = undefined;
  for (i = currentDir.length - 1; i >= 0; i--) {
    if (currentDir[i] == "\\") {
      i++;
      break;
    }
  }
  return currentDir.substring(0, i);
}
