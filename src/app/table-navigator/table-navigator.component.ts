import { LiveAnnouncer } from '@angular/cdk/a11y'
import { Overlay, OverlayRef } from '@angular/cdk/overlay'
import { TemplatePortal } from '@angular/cdk/portal'
import {
  AfterViewInit,
  Component,
  OnDestroy,
  OnInit,
  TemplateRef,
  ViewChild,
  ViewContainerRef
} from '@angular/core'
import { MatDialog } from '@angular/material/dialog'
import { MatMenuTrigger } from '@angular/material/menu'
import { MatSort, Sort } from '@angular/material/sort'
import { MatTable, MatTableDataSource } from '@angular/material/table'
import { filter, fromEvent, Subscription, take } from 'rxjs'
import { endpoints } from '../../common/constants'
import { FileDetails, FileType, MvFile_Response } from '../../common/interfaces'
import { FileDialogBoxComponent } from '../file-dialog-box/file-dialog-box.component'
import {
  ImageInfo,
  ImageViewerComponent
} from '../image-viewer/image-viewer.component'
import {
  FileDetailsPlus,
  FileServerService,
  SelectFileContext
} from '../utils/file-server.service'

@Component({
  selector: 'app-table-navigator',
  templateUrl: './table-navigator.component.html',
  styleUrls: ['./table-navigator.component.scss']
})
export class TableNavigatorComponent
  implements OnInit, AfterViewInit, OnDestroy
{
  @ViewChild(MatSort) sort!: MatSort
  @ViewChild(MatTable) table!: MatTable<any>

  displayedColumns: string[] = ['type', 'name', 'size', 'dateModif']

  dateFormat: Intl.DateTimeFormat
  timeFormat: Intl.DateTimeFormat
  isLoadingResults: boolean = false
  dataSource: MatTableDataSource<FileDetails>
  private subscriptions: Subscription[] = []
  private waitCount = 0

  constructor (
    private fileServerService: FileServerService,
    private _liveAnnouncer: LiveAnnouncer,
    private _dialog: MatDialog,
    public overlay: Overlay,
    public viewContainerRef: ViewContainerRef
  ) {
    this.dataSource = new MatTableDataSource([] as FileDetails[])

    let dateOptions: Intl.DateTimeFormatOptions = {
      day: 'numeric',
      month: 'numeric',
      year: 'numeric'
    }
    let timeOptions: Intl.DateTimeFormatOptions = {
      hourCycle: 'h24',
      hour: 'numeric',
      minute: '2-digit'
    }

    this.dateFormat = Intl.DateTimeFormat('default', dateOptions)
    this.timeFormat = Intl.DateTimeFormat('default', timeOptions)
  }

  ngOnInit (): void {
    this.subscriptions.push(
      this.fileServerService.subscribeFileList({
        next: (filelist: FileDetails[]) => {
          this.updateDataSource(filelist)
        }
      })
    )

    this.subscriptions.push(
      this.fileServerService.subscribeWaiting({
        next: (wait: boolean) => {
          this.isLoadingResults = wait
          if (wait) {
            this.waitCount++
          } else {
            this.waitCount--
          }
          console.log('wait spinner: ', wait, this.waitCount)
        }
      })
    )

    this.subscriptions.push(
      this.fileServerService.subscribeDelete({
        next: (fileName: string) => {
          console.log('delete file', fileName)
          const index = this.dataSource.data.findIndex(
            element => element.name == fileName
          )

          console.log('delete file', fileName, index)
          if (index > -1) {
            console.log('delete file', this.dataSource.data.length)
            this.dataSource.data.splice(index, 1)

            let remoteFiles = this.dataSource.data
            this.updateDataSource2(remoteFiles)
          }
        }
      })
    )

    this.subscriptions.push(
      this.fileServerService.subscribeModif({
        next: (data: MvFile_Response) => {
          this.manageMoveOrCopy(data, endpoints.FS_MV)
        }
      })
    )

    this.subscriptions.push(
      this.fileServerService.subscribeCopy({
        next: (data: MvFile_Response) => {
          this.manageMoveOrCopy(data, endpoints.FS_COPY)
        }
      })
    )

    this.subscriptions.push(
      this.fileServerService.subscribeNewFile({
        next: (data: FileDetails) => {
          console.log('f upload', data)

          let remoteFiles = this.dataSource.data
          remoteFiles.push(data)

          this.updateDataSource2(remoteFiles)
        }
      })
    )

    this.subscriptions.push(
      this.fileServerService.subscribeNewFolderSubject({
        next: (newDirName: string) => {
          let newDir: FileDetails = {
            name: newDirName,
            ftype: FileType.Directory
          }

          let remoteFiles = this.dataSource.data
          remoteFiles.push(newDir)
          this.updateDataSource2(remoteFiles)
        }
      })
    )

    this.list()
  }

  ngAfterViewInit () {}

  ngOnDestroy () {
    this.subscriptions.forEach(s => s.unsubscribe())
    this.subscriptions = []
  }

  list () {
    this.fileServerService.list()
  }

  private updateDataSource (filelist: FileDetails[]) {
    let remoteFiles: FileDetails[]
    remoteFiles = filelist

    this.updateDataSource2(remoteFiles)
  }

  private updateDataSource2 (filelist: FileDetails[]) {
    console.log('updateDataSource2', filelist)
    this.dataSource = new MatTableDataSource(filelist)
    this.dataSource.sort = this.sort
    this.dataSource.filterPredicate = (data: FileDetails, filter: string) => {
      return data.name.trim().toLowerCase().indexOf(filter) !== -1
    }
    this.table.renderRows()
    this.isLoadingResults = false
  }

  /** Announce the change in sort state for assistive technology. */
  announceSortChange (sortState: Sort) {
    // This example uses English messages. If your application supports
    // multiple language, you would internationalize these strings.
    // Furthermore, you can customize the message to add additional
    // details about the values being sorted.
    if (sortState.direction) {
      this._liveAnnouncer.announce(`Sorted ${sortState.direction}ending`)
    } else {
      this._liveAnnouncer.announce('Sorting cleared')
    }
  }

  highlightRow (row: any) {
    console.log(row)
  }

  displayType (e: FileDetails): string {
    return FileType[e.ftype]
  }

  displayDateModified (e: FileDetails): string {
    try {
      if (e.mtime) {
        let date = new Date(e.mtime)
        return this.dateFormat.format(date) + ' ' + this.timeFormat.format(date)
      }
    } catch (e) {
      console.warn(e)
    }
    return ''
  }

  displayTypeIcon (e: FileDetails): string {
    switch (e.ftype) {
      case FileType.Directory:
        return 'folder'
    }
    return 'text_snippet'
  }

  fileNameCSS (e: FileDetails): string {
    let cssClass = 'file'
    if (e.ftype == FileType.Directory) {
      cssClass = 'directory'
    }
    return cssClass
  }

  setCdPath (param: FileDetails) {
    if (param.ftype == FileType.Directory) {
      //this.cdPath = param.name
    } else if (param.ftype == FileType.File) {
      //this.fileName = param.name
    }
  }

  elementClick (element: FileDetails) {
    if (element.ftype == FileType.Directory) {
      this.fileServerService.list_rel(element.name)
    } else if (element.ftype == FileType.File) {
      this.downloadFileName(element.name)
    }
  }

  downloadFileName (fileName: string) {
    if (fileName.match(ImageViewerComponent.imageRE)) {
      console.log('is image', fileName)

      let imageInfo: ImageInfo = {
        fileName: fileName,
        list: this.dataSource.data
      }

      const dialog = this._dialog.open(ImageViewerComponent, {
        width: '98%',
        height: '98%',
        disableClose: false,
        data: imageInfo
      })
    } else {
      this.fileServerService.downloadFileName(fileName)
    }
  }

  displaySize (param: FileDetails): string {
    let size = ''
    if (param.ftype == FileType.File && param.size) {
      size = this.humanFileSize(param.size, true)
    }
    return size
  }

  private humanFileSize (bytes: number, si = false, dp = 1) {
    const thresh = si ? 1000 : 1024

    if (Math.abs(bytes) < thresh) {
      return bytes + ' B'
    }

    const units = si
      ? ['kB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
      : ['KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB']

    let u = -1

    const r = 10 ** dp

    do {
      bytes /= thresh
      ++u
    } while (
      Math.round(Math.abs(bytes) * r) / r >= thresh &&
      u < units.length - 1
    )

    return bytes.toFixed(dp) + ' ' + units[u]
  }

  openDialog (element: FileDetails) {
    console.log('Action clicked', element)
    const dialog = this._dialog.open(FileDialogBoxComponent, {
      width: '250px',
      // Can be closed only by clicking the close button
      disableClose: false,
      data: element
    })
  }

  selectedRowIndex: string | null = null
  selectedRowIndex2: string | null = null

  onLongPressRow (row: FileDetails) {
    console.log('onLongPress', row)
    this.selectedRowIndex2 = row.name
  }

  onClickRow (row: FileDetails) {
    console.log('onLongClick', row)
    if (this.selectedRowIndex != row.name) {
      this.fileServerService.selectFile(null)
      this.selectedRowIndex = null
    }
    this.selectedRowIndex2 = null
  }

  onLongPressingRow (fileDetails: FileDetails) {
    console.log('onLongPressing', fileDetails)

    this.selectedRowIndex = fileDetails.name

    let fileSelectContext: SelectFileContext = {
      file: fileDetails as FileDetailsPlus,
      controlID: 'bottom'
    }
    this.fileServerService.selectFile(fileSelectContext)
  }

  applyFilter (event: Event) {
    let filterValue = (event.target as HTMLInputElement).value
    filterValue = filterValue.trim() // Remove whitespace
    filterValue = filterValue.toLowerCase() // MatTableDataSource defaults to lowercase matches
    this.dataSource.filter = filterValue
  }

  private manageMoveOrCopy (data: MvFile_Response, action: string) {
    let fdIndex = -1
    if (action === endpoints.FS_MV) {
      fdIndex = this.dataSource.data.findIndex(
        fd => fd.name === data.oldFileName
      )
    }

    if (fdIndex >= 0) {
      let fd = this.dataSource.data[fdIndex]
      fd.name = data.newFileName
    } else {
      let remoteFiles = this.dataSource.data
      remoteFiles.push({
        name: data.newFileName,
        ftype: FileType.File
      })

      this.updateDataSource2(remoteFiles)
    }

    if (this.selectedRowIndex == data.oldFileName) {
      this.selectedRowIndex = data.newFileName
    }

    if (this.selectedRowIndex2 == data.oldFileName) {
      this.selectedRowIndex2 = data.newFileName
    }
  }

  contextMenuPosition = { x: '0px', y: '0px' }

  onContextMenu (event: MouseEvent, fileDetails: FileDetails) {
    event.preventDefault()
    this.rightClickMenuPositionX = event.clientX
    this.rightClickMenuPositionY = event.clientY

    this.selectedRowIndex = fileDetails.name

    // we open the menu
    this.matMenuTrigger.openMenu()

    let fileSelectContext: SelectFileContext = {
      file: fileDetails as FileDetailsPlus,
      controlID: 'context'
    }

    setTimeout(() => {
      this.fileServerService.selectFile(fileSelectContext)
    }, 100)
  }

  @ViewChild(MatMenuTrigger, { static: true }) matMenuTrigger!: MatMenuTrigger
  rightClickMenuPositionX = 0
  rightClickMenuPositionY = 0

  getRightClickMenuStyle (): object {
    return {
      left: `${this.rightClickMenuPositionX}px`,
      top: `${this.rightClickMenuPositionY}px`
    }
  }
}
