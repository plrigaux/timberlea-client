import { Component } from '@angular/core'
import { SortOrderValue, TableControlsService } from './table-controls.service'

@Component({
  selector: 'app-table-controls',
  templateUrl: './table-controls.component.html',
  styleUrls: ['./table-controls.component.scss']
})
export class TableControlsComponent {
  constructor (private tableControlService: TableControlsService) {}

  applyFilter (event: Event) {
    let filterValue = (event.target as HTMLInputElement).value
    filterValue = filterValue.trim() // Remove whitespace

    this.tableControlService.applyFilter(filterValue)
  }

  sortOrders: SortOrder[] = [
    { value: SortOrderValue.DEFAULT, viewValue: 'Default' },
    { value: SortOrderValue.MIXED, viewValue: 'Mixed' },
    { value: SortOrderValue.FILE_FIRST, viewValue: 'File First' }
  ]

  private _selectedSortOrder: SortOrderValue = SortOrderValue.DEFAULT

  setSelectedSortOrder (sortOrder: SortOrderValue) {
    this._selectedSortOrder = sortOrder
    this.tableControlService.sortOrder(this._selectedSortOrder)
  }

  get selectedSortOrder () {
    return this._selectedSortOrder
  }
}

interface SortOrder {
  value: SortOrderValue
  viewValue: string
}
