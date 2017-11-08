const crypto = require('crypto');
export class Utility{

    /**
     * オプジェクトをコピーする
     * @param src
     * @returns {T}
     */
    public static copy<T>(src:T){
        //let res = {};
        //for(let key in src){
        //    res.[key] = src[key];
        //}
        //let res = Object.assign({}, src); 
        let res = JSON.parse(JSON.stringify(src))
        return res as T;
    };

    /**
     * 暗号化
     * @param src
     * @returns {string}
     */
    public static encrypt = (src) =>{
        try {
            let cipher = crypto.createCipher('aes-256-cbc', 'cryptKey');
            return cipher.update(src, 'utf-8', 'base64') + cipher.final('base64');
        } catch(e) {
            console.log(e);
            return '';
        }
    };

    /**
     * 復号化
     * @param src
     * @returns {string}
     */
    public static decrypt = (src) =>{
        try {
            var decipher = crypto.createDecipher('aes-256-cbc', 'cryptKey');

            return decipher.update(src, 'base64', 'utf8') + decipher.final('utf8');
        } catch(e){
            console.log(e);
            return '';
        }
    };


    /**
     * 時間(秒)を取得
     * @param from
     * @param to
     * @returns {number}
     */
    public static getDuration = (from:string, to:string) => {
        let d1 = new Date(parseInt(from.substr(0, 4), 10), parseInt(from.substr(4, 2), 10) -1, parseInt(from.substr(6, 2), 10), parseInt(from.substr(8, 2), 10), parseInt(from.substr(10, 2), 10));
        let d2 = new Date(parseInt(to.substr(0, 4), 10), parseInt(to.substr(4, 2), 10) -1, parseInt(to.substr(6, 2), 10), parseInt(to.substr(8, 2), 10), parseInt(to.substr(10, 2), 10));
        let duration = Math.round((d2.getTime() - d1.getTime()) / 1000);
        return duration;
    };

    public static list_files(target, callback)
    {
        var fs = require('fs');
        fs.readdir(target, function(err, files){
            if (err) throw err;
            var fileList = [];
            files.filter(function(file){
                var full_path = target + file;
                return fs.statSync(full_path).isFile() 
            }).forEach(function (file) {
                var full_path = target + file;
                var fss = fs.statSync(full_path);
                fileList.push([full_path, fss.ctime, fss.size]);
            });
            callback(fileList);
        });
    };
    
    
    public static list_files_console(folder)
    {
        var path = require('path');

        let dateFormat = {
            fmt : {
            "yyyy": function(date) { return date.getFullYear() + ''; },
            "MM": function(date) { return ('0' + (date.getMonth() + 1)).slice(-2); },
            "dd": function(date) { return ('0' + date.getDate()).slice(-2); },
            "hh": function(date) { return ('0' + date.getHours()).slice(-2); },
            "mm": function(date) { return ('0' + date.getMinutes()).slice(-2); },
            "ss": function(date) { return ('0' + date.getSeconds()).slice(-2); }
            },
            format:(date, format) => {
                var result = format;
                for (var key in dateFormat.fmt)
                    result = result.replace(key, dateFormat.fmt[key](date));
                return result;
            }
        };

        this.list_files(folder, (file_list) => {
            var sprintf = require("sprintf-js").sprintf;
            for(var i=0; i < file_list.length; i++){
                let f = file_list[i];
                console.log(sprintf("%s %10d %s ", dateFormat.format(f[1], 'yyyy/MM/dd hh:mm:ss'), f[2], f[0]));
            }
        });
    }
}