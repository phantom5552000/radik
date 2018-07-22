import {Component, OnInit, OnDestroy, Output, EventEmitter, Input} from '@angular/core';
import {ConfigService} from '../services/config.service';
import {IConfig} from '../interfaces/config.interface';
import {ILibrary} from "../interfaces/library.interface";
//import {StateService} from "../services/state.service";
import { TaskService } from '../services/task.service';
import { IFavorite } from '../interfaces/favorite.interface';
import {RadikoService} from '../services/radiko.service';

/*
                    <td>{{file.station_name}}</td>
                    <td>{{file.program.title}}</td>


*/
@Component({
    selector: 'Task',
    template: `
        {{s}}
        path
        {{download_path}}
        あああ
        {{count}}
        len={{files.length}}
        
        <table class="table is-striped is-narrow">
            <tbody>
                <tr *ngFor="let file of files">
                    <td>{{file.station_id}}</td>
                    <td>{{file.station_name}}</td>
                    <td>{{file.program.title}}</td>
                    <td>{{file.program.ft}}</td>

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
    private files: IFavorite[]　=　[];

    private sub;
    private s:string = "TaskComponent";
    private download_path:string = "TaskComponent";
    private count:number = 0;
    private loading = false;

    ngOnInit() {
        this.config = this.configService.config.getValue();

        /*
        this.sub = this.stateService.isDownloading.subscribe(value =>{
           if(!value){
               this.config = this.configService.config.getValue();
               this.refresh();
           }
        });
        */
        this.refresh();
    }

    ngOnDestroy(){
        this.sub.unsubscribe();
    }

    constructor(
//        private stateService: StateService,
        private configService: ConfigService,
        private radikoService: RadikoService,
        private taskService: TaskService){}

    public refresh = () => {
        let f:IFavorite =
        {
            station_id: "xxx01",
            station_name: "xxx02",
            program:{
              ft: "",  to: "",  img: "", info: "",
              pfm: "", title: "xxx03", tsInNg: 0, tsOutNg: 1,
              downloadable: false,
            }
        };
  
        this.files = this.taskService.get();
        let timer = setInterval(() =>{
            this.count += 1;
            if(this.count%3==0){
                clearInterval(timer);
            }
        }, 300);

    };

    private onClick = (library:IFavorite) =>{
        if(!this.loading) {
            this.loading = true;

            let complete = false;
            let downloadProgress = '';
            let downloadPath = '';
            
            let timer = setInterval(() =>{
                if(complete){
                    clearInterval(timer);
                }
                
            }, 1000);


            this.radikoService.getTimeFree(library.station_id, library.program, this.config.saveDir, 
            (savepath) =>{
                this.download_path = savepath;
            },
            (mes) => {
                this.s = mes;
            }, () => {
                this.loading = false;
                console.log("finished.")

                complete = true;
            });
        }
    };

}
