const fs = require("fs");
const path = require("path");
const moment = require("moment");
var shell = require("shelljs");
var archiver = require("archiver");
var unzip = require("unzip");

shell.exec(
  "unzip -O gbk -d D:\\code\\myfileserver\\upload D:\\code\\myfileserver\\upload\\note.zip"
);

return;

var root = {
  children: []
};

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
// console.log(dirbuff);

var buffList = [];

function searchFile(buffList, node, fileName) {
  if (!node.isDir) {
    if (node.name.toLowerCase().indexOf(fileName.toLowerCase()) != -1) {
      buffList.push(node);
    }
    return;
  }

  node.children.forEach(item => {
    searchFile(buffList, item, fileName);
  });
}

searchFile(buffList, root.children[0], "ja");
console.log(buffList);
