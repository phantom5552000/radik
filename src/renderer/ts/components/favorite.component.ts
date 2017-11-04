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
                <tr *ngFor="let file of files">
                    <td>{{file.station_name}}</td>
                    <td>{{file.program.title}}</td>
                    <td>{{file.program.ft}}</td>
                    <td class="has-text-right">
                        <button class="button is-small" type="button" (click)="onClick(file)">
                            <span class="icon">
                                <i class="fa fa-download" aria-hidden="true"></i>
                            </span>
                        </button>
                    </td>
                    <td class="has-text-right">
                        <button class="button is-small" type="button" (click)="onClickTrash(file)">
                            <span class="icon">
                                <i class="fa fa-refresh" aria-hidden="true"></i>
                            </span>
                        </button>
                    </td>
                    <td class="has-text-right">
                    <button class="button is-small" type="button" (click)="onClickTrash(file)">
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
    private play:EventEmitter<IFavorite> = new EventEmitter<IFavorite>();

    private config:IConfig;
    private files: IFavorite[] = [];
    private keyword: String;
    private program: String;
    private sub;
    //private programs = {};
    //private dates:number[] = [];
    private found_program: IFavorite;
    
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
        // naka
        var fs = require('fs');
        var jsonfile = require('jsonfile');
        var favorite_file_path = "./favorites.json";
        //let favorites = [];
        let favorites: IFavorite[] = [];
        
        console.log("favorites_file_path: '%s'", favorite_file_path);
        fs.access(favorite_file_path, function (err) {
            if (err){
                console.log("'%s' does not exist.", favorite_file_path);
                var data = [
                    { name: "Rockadam(dummy).aac", lastUpdate: new Date(), size:"1.8MB", fullName:"DummyFullName.aac" },
                  ];
                jsonfile.writeFile(favorite_file_path, data, {
                    encoding: 'utf-8', replacer: null, spaces: '    '
                    }, 
                    function (err) {
                        if(err){
                            console.log("writeFile err=%s", err);
                        }else{
                            console.log("'%s' has been written.", favorite_file_path);
                        }
                    });
                }
            });
        jsonfile.readFile(favorite_file_path, {
                encoding: 'utf-8', reviver: null, throws: true
            }, function (err, data) {
                if(err){
                    console.log("readFile err=%s", err);
                }else{
                    console.log("read file %s", favorite_file_path);
                    //console.log(this);
                    //console.log(this.files);
                    for(var i=0; i<data.length; i++){
                        favorites.push({
                            station_id: null,
                            station_name: null,
                            program: null
                        });
                    }
                    console.log("favorites_list num=%d", favorites.length);
                    console.log(favorites);
                    //本当はここでthis.filesを参照したいが、ここではthis==undefined
                }
            });
            this.files = favorites;
            console.log(this.files);

        };

    private onClickTrash = (target:IFavorite) =>{
        // 全てを削除。一つだけ削除したい場合は、someを使う　
        //  ref) https://qiita.com/_shimizu/items/b8eac14f399e20599818
        this.files = this.files.filter(function(v, i) {
            return (v !== target);
        });
        //this.play.emit({name: library.fullName, fullName: 'file://' + library.fullName, size: library.size, lastUpdate: library.lastUpdate});
    }
    private onClick = (target:IFavorite) =>{
        console.log("onClick(target='%s'", target.program.title);
        //this.play.emit({name: library.fullName, fullName: 'file://' + library.fullName, size: library.size, lastUpdate: library.lastUpdate});
    }
    private onClickDownload = () =>{
        console.log("on click");
    }
    /**
     * 録音パス選択
     */
    private onClickSearch = () =>{
        console.log("onClickSearch(%s)", this.keyword);

        this.searchProgram(this.keyword);
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

    private onClickPlus = () =>{
        console.log("onClickPlus(%s)", this.program);
        this.files.push(this.files[0]);
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
    /**
     * 設定保存
     *//*
    private onSubmit = () => {

        let save = Utility.copy<IConfig>(this.config);
        localStorage.setItem('config', JSON.stringify(save));
        this.configService.config.next(save);
    };
*/
    private searchProgram = (keyword) =>{
        console.log("Entered searchProgram");
        this.radikoService.getPrograms(this.station.id).subscribe(res => {
            parseString(res.text(), (err, result) => {
                let programs = {};
                //this.programs = {};
                //this.dates = [];

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
                        if (prog.title[0].toUpperCase() == keyword.toUpperCase()
                            && p.downloadable == true){
                            this.found_program.program.ft = p.ft;
                            this.found_program.program.to = p.to;
                            this.found_program.program.img  = p.img;
                            this.found_program.program.info = p.info;
                            this.found_program.program.pfm = p.pfm;
                            this.found_program.program.title = p.title;
                            this.found_program.program.tsInNg = p.tsInNg;
                            this.found_program.program.tsOutNg = p.tsOutNg;
                            this.found_program.station_id = this.station.id;
                            this.found_program.station_name = ""; 
                            
                            console.log("found ", p);
                        }
                    });
                    //this.programs = programs;
                });
                //programs["5"]["20171027"][0].title="ON THE WIND"

                console.log("favorite");
                console.log(programs);
            });
        });
    }
}

