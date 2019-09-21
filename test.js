const fs = require("fs");
const path = require("path");
const moment = require("moment");
var shell = require("shelljs");
var archiver = require("archiver");
var unzip = require("unzip");

fs.createReadStream(
  "D:\\code\\myfileserver\\upload\\ceshi\\Untitled-1.zip"
).pipe(unzip.Extract({ path: "D:\\code\\myfileserver\\upload\\ceshi\\" }));
return;

var root = {
  children: []
};

// var obj = { size: 0 };
// var buff = { size: 0 };

// //计算文件夹或文件的大小
//obj是path对应的文件,name是obj的文件名
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
      relativePath: relativePath
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
    relativePath: relativePath
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

computeDirSize(root, "F:\\code\\myfileserver\\upload", "/", "upload");
// console.log(root);

var dirbuff = {};
//获取资源目录的目录树
function getDirTree(node, buffNode) {
  if (!node.isDir) {
    return;
  }

  //当没有children数组时,创建children数组
  if (buffNode.children == undefined) {
    buffNode.children = [];
  }

  var buffChildren = {
    value: node.relativePath,
    label: node.name
  };
  buffNode.children.push(buffChildren);
  node.children.forEach(item => {
    getDirTree(item, buffChildren);
  });
}

getDirTree(root.children[0], dirbuff);
console.log(dirbuff);

// root = root.children[0];
// var files = getDirDataByUrl(root, "/");
// console.log(files);

// function getDirDataByUrl(root, relativePath) {
//   if (root.relativePath == relativePath) {
//     if (root.children == undefined) {
//       return [root];
//     } else {
//       return root.children;
//     }
//   }
//   //如果是文件,则直接返回[]
//   if (root.children == undefined) {
//     return [];
//   }
//   root.children.forEach(item => {
//     return getDirDataByUrl(item, relativePath);
//   });
// }
