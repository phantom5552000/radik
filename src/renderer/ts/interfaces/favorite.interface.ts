import {IProgram} from '../interfaces/program.interface';
import {IStation, IRegion} from '../interfaces/station.interface';

export interface IFavorite{
    //name: string;
    //lastUpdate:Date;
    //size:string;
    //fullName:string;
    station_id: string;
    station_name: string;
    program: IProgram;
}
