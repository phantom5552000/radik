import {Injectable} from '@angular/core';
import {Subject} from 'rxjs/Subject';
import {IFavorite} from "../interfaces/favorite.interface";

//import {BehaviorSubject} from 'rxjs/BehaviorSubject';

@Injectable()
export class TaskService {

constructor() { }
    private programs: IFavorite[] = [];
    push(target: IFavorite){
      console.log(target);
      this.programs.push(target)
    }
    get():IFavorite[]{
        var f:IFavorite =
        {
            station_id: "xxx01",
            station_name: "xxx02",
            program:{
                ft: "",  to: "",  img: "", info: "",
                pfm: "", title: "xxx03", tsInNg: 0, tsOutNg: 1,
                downloadable: false
            }
      
        }
        return this.programs;
    //return this.fifo.pop();
  }
}