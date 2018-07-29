import {Injectable} from '@angular/core';
import {IFavorite} from "../interfaces/favorite.interface";
import {BehaviorSubject} from 'rxjs/BehaviorSubject';

@Injectable()
export class TaskService {
    public taskStatus:BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
    constructor() {}
    private programs: IFavorite[] = [];
    push(target: IFavorite){
        //console.log(target);
        this.programs.push(target)
        this.taskStatus.next(true);
    }
    get_and_clear():IFavorite[]{
        let programs = this.programs;
        this.programs = [];
        return programs;
    }
}