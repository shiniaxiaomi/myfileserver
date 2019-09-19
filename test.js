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
