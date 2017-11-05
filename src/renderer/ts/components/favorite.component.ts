import {Component, OnInit, OnDestroy, Output, EventEmitter, Input} from '@angular/core';
import {ConfigService} from '../services/config.service';
import {IConfig} from '../interfaces/config.interface';
import {IFavorite} from "../interfaces/favorite.interface";
import {StateService} from "../services/state.service";
import {Utility} from "../utility";
import {RadikoService} from '../services/radiko.service';
import {IStation, IRegion} from '../interfaces/station.interface';
import {IProgram} from '../interfaces/program.interface';
import { parseString } from 'xml2js';

@Component({
    selector: 'Favorite',
    template: `
        <table class="table is-striped is-narrow">
            <tbody>
                <tr *ngFor="let fav of favorites">
                    <td>{{fav.station_name}}</td>
                    <td>{{fav.station_id}}</td>
                    <td>{{fav.program.title}}</td>
                    <td>{{fav.program.ft}}</td>
                    <td class="has-text-right">
                        <button class="button is-small" type="button" (click)="onClickDownload(fav)">
                            <span class="icon">
                                <i class="fa fa-download" aria-hidden="true"></i>
                            </span>
                        </button>
                    </td>
                    <td class="has-text-right">
                        <button class="button is-small" type="button" (click)="onClickRefresh(fav)">
                            <span class="icon">
                                <i class="fa fa-refresh" aria-hidden="true"></i>
                            </span>
                        </button>
                    </td>
                    <td class="has-text-right">
                    <button class="button is-small" type="button" (click)="onClickTrash(fav)">
                        <span class="icon">
                            <i class="fa fa-trash-o" aria-hidden="true"></i>
                        </span>
                    </button>
                </td>
            </tr>
            </tbody>
        </table>
        <form (ngSubmit)="onSubmit()">
            <div class="message">
                <div class="message-body">
                    <div class="field ">
                        <label class="label">検索</label>
                        <div class="field has-addons">
                            <p class="control">
                                <input class="input" type="text" name="station.id" [(ngModel)]="station.id">
                            </p>
                            <p class="control">
                                <input class="input" type="text" name="keyword" [(ngModel)]="keyword">
                            </p>
                            <p class="control">
                                <button class="button" type="button" (click)="onClickSearch()">
                                <span class="icon is-small">
                                    <i class="fa fa-search"></i>
                                </span>
                                </button>
                            </p>
                        </div>
                    </div>
                    <div class="field ">
                        <label class="label">追加</label>
                        <div class="field has-addons">
                            <p class="control">
                                <input class="input" type="text" name="found_program.station_id" [(ngModel)]="found_program.station_id">
                            </p>
                            <p class="control">
                                <input class="input" type="text" name="found_program.program.title" [(ngModel)]="found_program.program.title">
                            </p>
                            <p class="control">
                                <input class="input" type="text" name="found_program.program.ft" [(ngModel)]="found_program.program.ft">
                            </p>
                            <p class="control">
                                <button class="button" type="button" (click)="onClickPlus()">
                                <span class="icon is-small">
                                    <i class="fa fa-plus"></i>
                                </span>
                                </button>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </form>　    
`
})
//<input class="input" type="text" name="found_program.station_id" [(ngModel)]=>"found_program.station_id">


//  *ngIf="selectedProgram.downloadable">
export class FavoriteComponent implements OnInit, OnDestroy{
    @Input()
    private station:IStation;

    @Output()
    private changeStatus:EventEmitter<boolean> = new EventEmitter<boolean>();

    @Output()
    private play:EventEmitter<IFavorite> = new EventEmitter<IFavorite>();

    private loading = false;
    
    private config:IConfig;
    private favorites: IFavorite[] = [];
    private keyword: String;
    private program: String;
    private sub;
    //private programs = {};
    //private dates:number[] = [];
    private found_program: IFavorite;
    private fs = require('fs');
    private jsonfile = require('jsonfile');
    private favorite_file_path = "./favorites.json";
    
    ngOnInit() {
        this.sub = this.stateService.isDownloading.subscribe(value =>{
           if(!value){
               this.config = this.configService.config.getValue();
               this.refresh();
           }
        });
        //this.station.id = "FM-FUJI";
        this.station =  {
            asciiName: "",
            href: "",
            id: "FM-FUJI",
            logo: "",
            name: "",
        };        
        this.keyword = "Rockadom";
        this.found_program = { // naka 初期化はもっと良い方法があるはず
            station_id: "",
            station_name: "",
            program:{
                ft: "",
                to: "",
                img: "",
                info: "",
                pfm: "",
                title: "",
                tsInNg: 0,
                tsOutNg: 1,
                downloadable: false
            },
        };
    }

    ngOnDestroy(){
        this.sub.unsubscribe();
    }

    constructor(
        private stateService: StateService,
        private radikoService: RadikoService,
        private configService: ConfigService){}

    public refresh = () => {
        console.log("favorites_file_path: '%s'", this.favorite_file_path);
        this.favorites = this.jsonfile.readFileSync(this.favorite_file_path, {
            encoding: 'utf-8', 
            reviver: null, 
            throws: true
        });
        /* // 本当は非同期で実装したいが、以下では動作しない
        var favorites =[];
        this.jsonfile.readFile(this.favorite_file_path, {
            encoding: 'utf-8', reviver: null, throws: true
        }, function (err, data) {
            if(err){
                console.log("readFile err=%s", err);
            }else{
                favorites = data;
                //console.log("read file %s", this.favorite_file_path);
                //本当はここでthis.favoritesを参照したいが、ここではthis==undefined
            }
        });
        this.favorites = favorites;
        console.log(this.favorites);
        */
    };
    
    private onClickRefresh = (target:IFavorite) =>{
        console.log("onClickRefresh('%s')", target.program.title);
        // favorite list のスタート時刻を更新する
        this.writeFile();
        //this.play.emit({name: library.fullName, fullName: 'file://' + library.fullName, size: library.size, lastUpdate: library.lastUpdate});
    }
    

    private onClickTrash = (target:IFavorite) =>{
        // 全てを削除。一つだけ削除したい場合は、someを使う　
        //  ref) https://qiita.com/_shimizu/items/b8eac14f399e20599818
        this.favorites = this.favorites.filter(function(v, i) {
            return (v !== target);
        });
        this.writeFile();
        //this.play.emit({name: library.fullName, fullName: 'file://' + library.fullName, size: library.size, lastUpdate: library.lastUpdate});
    }
    private onClickDownload = (target:IFavorite) =>{
        console.log("onClick('%s')", target.program.title);
        console.log(target);
        
        if(!this.loading) {
            this.loading = true;

            this.stateService.isDownloading.next(true);

            this.changeStatus.emit(true);

            let complete = false;
            let downloadProgress = '';

            let timer = setInterval(() =>{
                if(complete){
                    clearInterval(timer);
                    this.stateService.isDownloading.next(false);
                }
                this.stateService.downloadProgress.next(downloadProgress);

            }, 1000);

            let path = require('path');
            
            var final_dest = "/Users/isamunakagawa/Google ドライブ/01-radiko/01-mac/01-el"
            var filename_tmp  = path.join(this.config.saveDir, target.station_id, target.program.ft.substr(0, 8), target.program.title + ".aac");
            var filename_part = path.join(final_dest, target.program.ft.substr(0,8) + "-"  +target.program.title + ".aac");
                                          
            console.log("filename tmp:  "+ filename_tmp)                
            console.log("filename part: "+ filename_part) 


            this.radikoService.getTimeFree(target.station_id, target.program, this.config.saveDir, (mes) => {
                downloadProgress = mes;

            }, () => {
                this.loading = false;
                console.log("finished.")

                complete = true;
                
                var exec = require('child_process').exec;
                var sprintf = require("sprintf-js").sprintf, vsprintf = require("sprintf-js").vsprintf
                var cmd = sprintf("mv '%1$s' '%2$s'", filename_tmp, filename_part);
                console.log(cmd);
                var exec_cmd = exec(cmd);      
                exec_cmd.on('exit', function(){
                    exec('ls -tl "' + final_dest + '"', 
                    function(err, stdout, stderr){
                        // some process 
                        console.log(stdout);    
                    });
                    console.log("file '%s' created.", filename_part);
                });
                
                
            });
        }
    

        /** */
        //this.play.emit({name: library.fullName, fullName: 'file://' + library.fullName, size: library.size, lastUpdate: library.lastUpdate});
    }

    /**
     * 録音パス選択
     */
    private onClickSearch = () =>{
        console.log("onClickSearch(%s)", this.keyword);
        var f = this.found_program;
        this.searchProgram(this.keyword, this, function(fc, found){
            console.log("searchProgram()");
            console.log(found);
            fc.found_program = found;
        });
        //this.found_program = f;
        /*
        let dialog = require('electron').remote.dialog;
        dialog.showOpenDialog(null, {
            properties: ['openDirectory']
        }, (dir) => {
            this.config.saveDir = dir[0];
            //this.chRef.detectChanges();
        });
        */
    };
    private writeFile = () =>{
        this.jsonfile.writeFile(this.favorite_file_path, this.favorites, {
            encoding: 'utf-8', replacer: null, spaces: '    '
        }, function (err) {
            if(err){
                console.log("writeFile err=%s", err);
            }else{
                console.log("'%s' has been written.", this.favorite_file_path);
            }
        });
    };
    private onClickPlus = () =>{
        console.log("onClickPlus(%s)", this.found_program.program.title);
        let save = Utility.copy<IFavorite>(this.found_program);
        
        this.favorites.push(save);
        this.writeFile();
    }

        /*
        let dialog = require('electron').remote.dialog;
        dialog.showOpenDialog(null, {
            properties: ['openDirectory']
        }, (dir) => {
            this.config.saveDir = dir[0];
            //this.chRef.detectChanges();
        });
        */
    
    /**
     * 設定保存
     *//*
    private onSubmit = () => {

        let save = Utility.copy<IConfig>(this.config);
        localStorage.setItem('config', JSON.stringify(save));
        this.configService.config.next(save);
    };
*/
    private searchProgram = (keyword, fc, callback) =>{
        // コールバックでfound_programを返すよう、変更

        var found = { // naka 初期化はもっと良い方法があるはず
            station_id: "",
            station_name: "",
            program:{
                ft: "",
                to: "",
                img: "",
                info: "",
                pfm: "",
                title: "",
                tsInNg: 0,
                tsOutNg: 1,
                downloadable: false
            },
        };

        console.log("Entered searchProgram");
        this.radikoService.getPrograms(this.station.id).subscribe(res => {
            parseString(res.text(), (err, result) => {
                let now = new Date();
                let now_date = parseInt(now.getFullYear() +  ('00' + (now.getMonth() + 1)).substr(-2, 2) + ('00' + now.getDate()).substr(-2, 2) + ('00' + now.getHours()).substr(-2, 2) + ('00' + now.getMinutes()).substr(-2, 2) + '00', 10);

                result.radiko.stations[0].station[0].progs.forEach(progs => {
                    
                    let date =progs.prog[0].$.ft.substr(0, 8);
                    //this.dates.push(date);
                    progs.prog.forEach(prog => {
                        let p = 
                        {
                            ft: prog.$.ft, to: prog.$.to,
                            img: prog.img[0],     info: prog.info[0],
                            pfm: prog.pfm[0],     title: prog.title[0],
                            tsInNg: prog.ts_in_ng[0],
                            tsOutNg: prog.ts_out_ng[0],
                            downloadable: parseInt(prog.$.to, 10) < now_date
                        };
                        //console.log("t %s %s", prog.title[0], keyword);
                        if (prog.title[0].toUpperCase().indexOf(keyword.toUpperCase()) != -1
                            && p.downloadable == true){
                            found.program = p
                            found.station_id = this.station.id;
                            found.station_name = ""; 
                            //console.log("found p ", p);
                        }
                    });
                });
                //programs["5"]["20171027"][0].title="ON THE WIND"
                callback(fc, found);
                //console.log("favorite");
            });
        });
    }
}

