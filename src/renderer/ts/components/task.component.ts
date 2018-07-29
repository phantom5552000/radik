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
}

@Component({
    selector: 'Task',
    template: `
        {{count}} <br>
        {{s}}
        {{download_path}}
        len={{files.length}}
        <button class="button is-small" type="button" (click)="onUpdate()">
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
                                <i class="fa fa-play-circle" aria-hidden="true"></i>
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
                download_percentage:0,
                download_path: "",
                favorite:f
            }
            this.files.push(t);
        });
        console.log("refresh()");
        console.log(this.files);
    };
    private onUpdate = () =>{
        this.refresh();
    };

    private isAllCompleted():boolean 
    {
        for (var i = 0; i < this.files.length; i++) {     
            let f = this.files[i];
            if(f.download_percentage < 100) return false;
        }
        return true;
    };
    private onClick = (library:ITask) =>{
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
            }, () => {
                this.loading = false;
                console.log("finished.")

                complete = true;
            });
        }
    };
}
