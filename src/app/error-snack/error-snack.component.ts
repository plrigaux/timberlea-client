import { Component, Inject } from '@angular/core'
import {
  MatSnackBar,
  MatSnackBarRef,
  MAT_SNACK_BAR_DATA
} from '@angular/material/snack-bar'

@Component({
  selector: 'app-error-snack',
  templateUrl: './error-snack.component.html',
  styleUrls: ['./error-snack.component.scss']
})
export class ErrorSnackComponent {
  constructor (
    @Inject(MatSnackBarRef) public snackBarRef: MatSnackBarRef<MatSnackBar>,
    @Inject(MAT_SNACK_BAR_DATA) public data: ErrorData
  ) {}
}

export interface ErrorData {
  status: number
  statusText: string
  serverCode?: String
  serverMessage?: string
}
