import {Component, OnInit, OnDestroy, Output, EventEmitter, Input} from '@angular/core';
import {ConfigService} from '../services/config.service';
import {IConfig} from '../interfaces/config.interface';
import {ILibrary} from "../interfaces/library.interface";
//import {StateService} from "../services/state.service";
import { TaskService } from '../services/task.service';
import { IFavorite } from '../interfaces/favorite.interface';
import {RadikoService} from '../services/radiko.service';
import { THIS_EXPR } from '@angular/compiler/src/output/output_ast';

interface ITask{
    favorite: IFavorite;
    download_percentage: number;
    download_path: string;
    download_started: boolean;
}

@Component({
    selector: 'Task',
    template: `
        {{count}} <br>
        {{s}}
        {{download_path}}
        len={{files.length}}
        <button class="button is-small" type="button" (click)="onDownloadAll()">
            <span class="icon">
                <i class="fa fa-refresh" aria-hidden="true"></i>
            </span>
        </button>

        <table class="table is-striped is-narrow">
            <tbody>
                <tr *ngFor="let file of files">
                    <td> 
                    {{file.favorite.station_id}}/{{file.favorite.program.title}}/{{file.favorite.program.ft}}
                    </td>
                    <td>{{file.download_percentage}}</td>

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
                                <i class="fa fa-trash-o" aria-hidden="true"></i>
                            </span>
                        </button>
                    </td>
                </tr>
            </tbody>
        </table>
        
    `
})
export class TaskComponent implements OnInit, OnDestroy{

    @Output()
    private play:EventEmitter<ILibrary> = new EventEmitter<ILibrary>();

    private config:IConfig;
    private files:ITask[]　=　[];

    private sub;
    private s:string = "TaskComponent";
    private download_path:string = "TaskComponent";
    private count:number = 0;
    private loading = false;
    private all_downloading = false;

    ngOnInit() {
        this.config = this.configService.config.getValue();
        this.sub = this.taskService.taskStatus.subscribe(value =>{
            this.refresh();
         });
    }

    ngOnDestroy(){
        this.sub.unsubscribe();
    }

    constructor(
        private configService: ConfigService,
        private radikoService: RadikoService,
        private taskService: TaskService){}

    public refresh = () => {
        let favs = this.taskService.get_and_clear();
        favs.forEach(f => {
            var t:ITask = {
                download_started: false,
                download_percentage:0,
                download_path: "",
                favorite:f
            }
            this.files.push(t);
        });
        console.log("refresh()");
        console.log(this.files);
    };
    private onDownloadAll = () => {
        if(this.all_downloading){
            console.log("already started.")
            return;
        }
        let timer = setInterval(() =>{
            this.count += 1;
            if(this.loading) return;
            if(this.isAllCompleted()){
                clearInterval(timer);
                this.all_downloading = false;
            }else{
                for (let i = 0; i < this.files.length; i++) {     
                    let f = this.files[i];
                    if(f.download_started == false){
                        f.download_started = true;
                        console.log("count=%d", this.count);
                        this.download(f);
                        break;
                    }
                }
            }
        }, 1000);
    };

    private isAllCompleted():boolean 
    {
        for (var i = 0; i < this.files.length; i++) {     
            let f = this.files[i];
            if(f.download_percentage >= 0 
                && f.download_percentage < 100) return false;
        }
        console.log("all completed.")
        return true;
    };
    private onClick = (library:ITask) =>{
        this.download(library);
    };
    private onClickTrash = (target:ITask) =>{
        // 全てを削除。一つだけ削除したい場合は、someを使う　
        //  ref) https://qiita.com/_shimizu/items/b8eac14f399e20599818
        this.files = this.files.filter(function(v, i) {
            return (v !== target);
        });
    }

    private download = (library:ITask) =>{
        console.log("download");
        console.log(library);
        if(!this.loading) {
            this.loading = true;

            let complete = false;
            //let downloadProgress = '';
            //let downloadPath = '';
            
            let timer = setInterval(() =>{
                this.count += 1;
                if(this.isAllCompleted()){
                    clearInterval(timer);
                    this.loading = false;
                }
            }, 1000);

            this.radikoService.getTimeFree(library.favorite.station_id, library.favorite.program, this.config.saveDir, 
            (savepath) =>{
                this.download_path = savepath;
                library.download_path = savepath;
            },
            (mes) => {
                this.s = mes;
                library.download_percentage = mes;
            }, 
            // getTimeFreeにエラーコールバックを追加することはしない
            // 終了処理が局所化できなくなるため
            (complete) => {
                console.log("download completed %s", complete);
                if(complete == false){
                    this.s = "failed. " + library.favorite.program.title;
                    library.download_percentage = -1;
                }else{
                    library.download_percentage = 100;
                }
                this.loading = false;
                console.log("finished. title:%s ", library.favorite.program.title);

                complete = true;
            });
        }
    };
}
