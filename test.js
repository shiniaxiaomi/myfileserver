const fs = require("fs");
const path = require("path");

var root={
    isDir:true,
    children:[],
    relativePath:"/",
    size:0
};

var obj={size:0}
var buff={size:0}
function computeDirSize(obj,dirPath){
    var stat=fs.statSync(dirPath);
    if(!stat.isDirectory()){
        obj.children.push({
            isDir:false,
            children:undefined,
            size:stat.size,
            relativePath:dirPath
        });
        // buff.size+=stat.size;
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

computeDirSize(root,"F:\\code\\myfileserver\\upload");
console.log(root)