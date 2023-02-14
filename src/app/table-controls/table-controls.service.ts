import { Injectable } from '@angular/core'
import { Subject } from 'rxjs'

@Injectable({
  providedIn: 'root'
})
export class TableControlsService {
  // Observable string sources
  private sortOrderSource = new Subject<SortOrderValue>()
  private filterOutHiddenSource = new Subject<boolean>()
  private filterSource = new Subject<string>()

  sortOrder$ = this.sortOrderSource.asObservable()
  filterOutHidden$ = this.filterOutHiddenSource.asObservable()
  filter$ = this.filterSource.asObservable()

  sortOrder (sortOrder: SortOrderValue) {
    console.log('call sortOrder', sortOrder)
    this.sortOrderSource.next(sortOrder)
  }

  filterOutHidden (yesNo: boolean) {
    this.filterOutHiddenSource.next(yesNo)
  }

  applyFilter (filter: string) {
    this.filterSource.next(filter)
  }
}

export enum SortOrderValue {
  DEFAULT = 'default',
  MIXED = 'mixed',
  FILE_FIRST = 'fileFirst'
}
