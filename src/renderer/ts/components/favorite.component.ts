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
        let klaw = require('klaw');
        let path = require('path');
        let files = [];
        let kl = klaw(this.config.saveDir)
            .on('readable', () => {
                var item;
                while ((item = kl.read())) {}

            })
            .on('end', () => {
                files.push({
                    name: "fav1-name.aac",
                    lastUpdate: new Date(),
                    size: "1.8MB",
                    fullName: "/Users/fav1-full-name.aac"
                });
                files.sort((a, b) => {
                    if (a.lastUpdate > b.lastUpdate) {
                        return -1;
                    }
                    if (a.lastUpdate < b.lastUpdate) {
                        return 1;
                    }
                    return 0;
                });

                this.files = files;
                console.log(this.files);
            });

    };

    private onClick = (library:IFavorite) =>{
        this.play.emit({name: library.fullName, fullName: 'file://' + library.fullName, size: library.size, lastUpdate: library.lastUpdate});
    }
}
