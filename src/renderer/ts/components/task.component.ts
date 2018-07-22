import {Component, OnInit, OnDestroy, Output, EventEmitter, Input} from '@angular/core';
import {ConfigService} from '../services/config.service';
import {IConfig} from '../interfaces/config.interface';
import {ILibrary} from "../interfaces/library.interface";
import {StateService} from "../services/state.service";
import { TaskService } from '../services/task.service';
import { IFavorite } from '../interfaces/favorite.interface';

/*
                    <td>{{file.station_name}}</td>
                    <td>{{file.program.title}}</td>


*/
@Component({
    selector: 'Task',
    template: `
        {{s}}
        あああ
        {{count}}
        {{files[0].station_id}}    
        <table class="table is-striped is-narrow">
            <tbody>
                {{count}}
                {{files[0].station_id}}    
                <tr *ngFor="let file of files">
                    <td>{{file.station_id}}</td>
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
    private count:number = 0;

    ngOnInit() {
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
        private stateService: StateService,
        private configService: ConfigService,
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
  
        this.files.push(this.taskService.get());
        this.count += 1;

    };

    private onClick = (library:ILibrary) =>{
    //    this.play.emit({name: library.fullName, fullName: 'file://' + library.fullName, size: library.size, lastUpdate: library.lastUpdate});
    }
}
