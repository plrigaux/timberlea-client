import { Component } from '@angular/core'

@Component({
  selector: 'app-table-controls',
  templateUrl: './table-controls.component.html',
  styleUrls: ['./table-controls.component.scss']
})
export class TableControlsComponent {
  applyFilter (event: Event) {
    let filterValue = (event.target as HTMLInputElement).value
    filterValue = filterValue.trim() // Remove whitespace

    console.log(filterValue)
  }

  foods: Food[] = [
    { value: 'default', viewValue: 'Default' },
    { value: 'mixed', viewValue: 'Mixed' },
    { value: 'fileFirst', viewValue: 'File First' }
  ]
}

interface Food {
  value: string
  viewValue: string
}
