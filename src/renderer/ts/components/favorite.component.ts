import {Component, OnInit, OnDestroy, Output, EventEmitter, Input} from '@angular/core';
import {ConfigService} from '../services/config.service';
import {IConfig} from '../interfaces/config.interface';
import {IFavorite} from "../interfaces/favorite.interface";
import {StateService} from "../services/state.service";
import {Utility} from "../utility";
import {RadikoService} from '../services/radiko.service';
import {IStation, IRegion} from '../interfaces/station.interface';
import { parseString } from 'xml2js';
import { TaskService } from '../services/task.service';

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
                        <button class="button is-small" type="button" (click)="onClickRefresh(fav)">
                            <span class="icon">
                                <i class="fa fa-refresh" aria-hidden="true"></i>
                            </span>
                        </button>
                    </td>
                    <td class="has-text-right">
                        <button class="button is-small" type="button" (click)="onClickDownload(fav)">
                            <span class="icon">
                                <i class="fa fa-download" aria-hidden="true"></i>
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
                        <label class="label">ステーション検索(全件、後優先)</label>
                        <div class="field has-addons">
                            <p class="control">
                                <input class="input" type="text" name="station2.id" [(ngModel)]="station2.id">
                            </p>
                            <p class="control">
                                <button class="button" type="button" (click)="onClickSearchSt()">
                                <span class="icon is-small">
                                    <i class="fa fa-search"></i>
                                </span>
                                </button>
                            </p>
                        </div>
                    </div>
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

export class FavoriteComponent implements OnInit, OnDestroy{
    @Input()
    private station:IStation;
    private station2:IStation;

    @Output()
    private changeStatus:EventEmitter<boolean> = new EventEmitter<boolean>();

    @Output()
    private play:EventEmitter<IFavorite> = new EventEmitter<IFavorite>();


    private regions:IRegion[] = [];
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
    private exec = require('child_process').exec;
    private sprintf = require("sprintf-js").sprintf;

    //private favorite_file_path = "";
    
    ngOnInit() {
        this.sub = this.stateService.isDownloading.subscribe(value =>{
           if(!value){
               this.config = this.configService.config.getValue();
               this.refresh();
           }
        });
        this.station2 =  {
            asciiName: "", href: "", id: "ラジオ日本", logo: "", name: "",
        };        
        //this.station.id = "FM-FUJI";
        this.station =  {
            asciiName: "", href: "", id: "FM-FUJI", logo: "", name: "",
        };        
        this.keyword = "Rockadom";
        this.found_program = { // naka 初期化はもっと良い方法があるはず
            station_id: "",
            station_name: "",
            program:{
                ft: "",  to: "",  img: "", info: "",
                pfm: "", title: "", tsInNg: 0, tsOutNg: 1,
                downloadable: false
            },
        };
    }

    ngOnDestroy(){
        this.sub.unsubscribe();
    }

    constructor(
        private taskService: TaskService,
        private stateService: StateService,
        private radikoService: RadikoService,
        private configService: ConfigService){}

    public refresh = () => {
        //console.log("favorites_file_path: '%s'", this.favorite_file_path);
        let favorite_file_path = this.config.saveDir + "/favorites.json";
        console.log("favorite_file_path: ", favorite_file_path);

        this.jsonfile.readFile(favorite_file_path, {
            encoding: 'utf-8', reviver: null, throws: true
        }, (err, data) => {
            if(err){
                console.log("readFile err=%s", err);
            }else{
                this.favorites = data;
            }
        });
    };



    private onClickTrash = (target:IFavorite) =>{
        // 全てを削除。一つだけ削除したい場合は、someを使う　
        //  ref) https://qiita.com/_shimizu/items/b8eac14f399e20599818
        this.favorites = this.favorites.filter(function(v, i) {
            return (v !== target);
        });
        this.writeFile();
    }
    private onClickDownload = (target:IFavorite) =>{
        console.log("onClick('%s')", target.program.title);
        console.log(target);
        this.taskService.push(target);
        
/*
        if(!this.loading) {
            this.loading = true;

            this.stateService.isDownloading.next(true);

            this.changeStatus.emit(true);

            let complete = false;
            let downloadProgress = '';
            let downloadPath = '';
            
            let timer = setInterval(() =>{
                if(complete){
                    clearInterval(timer);
                    this.stateService.isDownloading.next(false);
                }
                this.stateService.downloadProgress.next(downloadProgress);
                this.stateService.downloadPath.next(downloadPath);
                
            }, 1000);

            let path = require('path');
            
            //var final_dest = "/Users/isamunakagawa/Google ドライブ/01-radiko/01-mac/01-el/"
            //var filename_tmp  = path.join(this.config.saveDir, target.station_id, target.program.ft.substr(0, 8), target.program.title + ".aac");
            //var filename_part = path.join(final_dest, target.program.ft.substr(0,8) + "-"  +target.program.title + ".aac");
                                          
            //console.log("filename tmp:  "+ filename_tmp)                
            //console.log("filename part: "+ filename_part) 

            this.radikoService.getTimeFree(target.station_id, target.program, this.config.saveDir, 
            (savepath) =>{
                downloadPath = savepath;
            },
            (mes) => {
                downloadProgress = mes;
            }, () => {
                this.loading = false;
                console.log("finished.")

                complete = true;
                //var cmd = this.sprintf("mv '%1$s' '%2$s'", filename_tmp, filename_part);
                ////console.log(cmd);
                //var exec_cmd = this.exec(cmd);      
                //exec_cmd.on('exit', () => {
                //    Utility.list_files_console(final_dest);
                //});
            });
        }
        */
    }

    private onClickSearchSt = () =>{
        console.log("onClickSearchSt(%s)", this.station2.id);
        
        this.searchProgramSt(this.station2.id, (found)　=> {
            console.log("searchProgramSt()");
            console.log(found);
            this.station.id = found; // アロー関数なので、thisが見える
        });
        
    };
    private onClickSearch = () =>{
        console.log("onClickSearch(%s)", this.keyword);
        this.searchProgram(this.station.id, this.keyword, (found)　=> {
            console.log("searchProgram()");
            console.log(found);
            this.found_program = found; // アロー関数なので、thisが見える
        });
    };
    private writeFile = () =>{
        let favorite_file_path = this.config.saveDir + "/favorites.json";
        console.log("writeFile path=%s", favorite_file_path);
        
        this.jsonfile.writeFile(favorite_file_path, this.favorites, {
            encoding: 'utf-8', replacer: null, spaces: '    '
        },  (err) => {
            if(err){
                console.log("writeFile err=%s", err);
            }else{
                console.log("'%s' has been updated.", favorite_file_path);
            }
        });
    };
    private onClickRefresh = (target:IFavorite) =>{
        // favorite list のスタート時刻を更新する
        console.log("onClickRefresh('%s')", target.program.title);
        this.searchProgram(target.station_id, target.program.title, (found) => {
            console.log("searchProgram()");
            console.log(found);
            
            target = found;
            this.favorites.forEach( function( value, index, array ) {
                if(value.station_id == target.station_id
                && value.program.title == target.program.title){
                    array[index] = found;
                }
            });
            this.writeFile();
        });
    }
    private onClickPlus = () =>{
        console.log("onClickPlus(%s)", this.found_program.program.title);
        let save = Utility.copy<IFavorite>(this.found_program);
        
        this.favorites.push(save);
        this.writeFile();
    }
    private searchProgramSt = (keyword, callback) =>{
        this.radikoService.checkLogin().subscribe(res =>{
            this.radikoService.getStations().subscribe(res => {
                parseString(res.text(), (err, result) => {
                    this.regions = [];
                    result.region.stations.forEach(s1 => {
                        let region: IRegion = {regionId: s1.$.region_id, regionName: s1.$.region_name, stations: []};
                        s1.station.forEach(s2 => {
                            let station = {
                                asciiName: s2.ascii_name[0],
                                href: s2.href[0],
                                id: s2.id[0],
                                logo: s2.logo[0]._,
                                name: s2.name[0],
                            };
                            region.stations.push(station);
                            if (station.name.toUpperCase().indexOf(keyword.toUpperCase()) != -1){
                                console.log(station);
                                callback(station.id);
                                // breakは使えない
                            }
    
                        });
                        this.regions.push(region);
                    });

                });
            });
        }, res => {
            this.radikoService.getAreaId().subscribe(areaId => {
                this.radikoService.getStations(areaId).subscribe(res => {
                    parseString(res.text(), (err, result) => {
                        this.regions = [];

                        let region: IRegion = {
                            regionId: result.stations.$.area_id,
                            regionName: result.stations.$.area_name,
                            stations: []
                        };
                        result.stations.station.forEach(s => {
                            let station = {
                                asciiName: s.ascii_name[0],
                                href: s.href[0],
                                id: s.id[0],
                                logo: s.logo[0]._,
                                name: s.name[0],
                            };

                            region.stations.push(station);

                        });
                        this.regions.push(region);
                    });
                });
            });
        });
    }
    private searchProgram = (station_id, keyword, callback) =>{
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
        this.radikoService.getPrograms(station_id).subscribe(res => {
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
                            found.station_id = station_id;
                            found.station_name = ""; 
                            //console.log("found p ", p);
                        }
                    });
                });
                callback(found);
            });
        });
    }
}

