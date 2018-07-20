import {Injectable} from '@angular/core';
import { Subject } from 'rxjs/Subject';
import {IFavorite} from "../interfaces/favorite.interface";

//import {BehaviorSubject} from 'rxjs/BehaviorSubject';

@Injectable()
export class TaskService {

  constructor() { }

  private fifo = require('fifo')()
 
  private toParentDataSource = new Subject<string>();
  private toChildDataSource = new Subject<string>();

  // Observable streams
  public toParentData$= this.toParentDataSource.asObservable();
  public toChildData$= this.toChildDataSource.asObservable();

  // Service message commands
  sendMsgToParent(msg: string) {
    this.toParentDataSource.next(msg);
  }

  sendMsgToChild(msg: string) {
    this.toChildDataSource.next(msg);
  }
  push(target: IFavorite){
      console.log(target);
      this.fifo.push(target)
  }
  get(){
    this.fifo.pop();
  }
}