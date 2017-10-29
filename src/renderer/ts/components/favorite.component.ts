import {Component, OnInit, OnDestroy, Output, EventEmitter, Input} from '@angular/core';
import {ConfigService} from '../services/config.service';
import {IConfig} from '../interfaces/config.interface';
import {IFavorite} from "../interfaces/favorite.interface";
import {StateService} from "../services/state.service";
 

@Component({
    selector: 'Favorite',
    template: `
        <table class="table is-striped is-narrow">
            <tbody>
                <tr *ngFor="let file of files">
                    <td>aaa</td>
                    <td>{{file.name}}</td>
                    <td class="datetime">{{file.lastUpdate | date:'yyyy/MM/dd HH:mm:ss'}}</td>
                    <td>{{file.size}}</td>
                    <td class="has-text-right">
                        <button class="button is-small" type="button" (click)="onClick(file)">
                            <span class="icon">
                                <i class="fa fa-play-circle" aria-hidden="true"></i>
                            </span>
                        </button>
                    </td>
                </tr>
            </tbody>
        </table>
        
    `
})
export class FavoriteComponent implements OnInit, OnDestroy{

    @Output()
    private play:EventEmitter<IFavorite> = new EventEmitter<IFavorite>();

    private config:IConfig;
    private files: IFavorite[] = [];

    private sub;

    ngOnInit() {
        this.sub = this.stateService.isDownloading.subscribe(value =>{
           if(!value){
               this.config = this.configService.config.getValue();
               this.refresh();
           }
        });

    }

    ngOnDestroy(){
        this.sub.unsubscribe();
    }

    constructor(
        private stateService: StateService,
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
                            name: data[i].name,
                            lastUpdate: data[i].lastUpdate,
                            size: data[i].size,
                            fullName: data[i].fullName
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

    private onClick = (library:IFavorite) =>{
        this.play.emit({name: library.fullName, fullName: 'file://' + library.fullName, size: library.size, lastUpdate: library.lastUpdate});
    }
}
