import {
  HttpClient,
  HttpErrorResponse,
  HttpEvent,
  HttpEventType,
  HttpHeaders
} from '@angular/common/http'
import { Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core'
import { catchError, finalize, map, Observable, Subscription, tap } from 'rxjs'
import { endpoints, uploadFile } from '../../common/constants'
import { ErrorResponse, FileDetails, FileType } from '../../common/interfaces'
import { environment } from '../../environments/environment'
import { FileServerService } from '../utils/file-server.service'
import { resolver } from '../utils/resolver'

@Component({
  selector: 'app-file-upload',
  templateUrl: './file-upload.component.html',
  styleUrls: ['./file-upload.component.scss']
})
export class FileUploadComponent implements OnInit {
  ngOnInit (): void {}

  @Input()
  requiredFileType!: string

  fileName = ''
  uploadProgress: number | null = null
  uploadSub: Subscription | null = null

  constructor (
    private http: HttpClient,
    private fileServerService: FileServerService
  ) {}

  onFileSelected (event: any) {
    const files: FileList = event.target.files

    //console.warn(files)

    Array.from(files).forEach(file => {
      this.uploadFile(file)
    })
  }

  private uploadFile (file: File) {
    console.warn('upload', file)
    this.fileName = file.name
    const formData = new FormData()
    formData.append('filename', this.fileName)
    formData.append(this.fileName, file) //File needs to be last

    let resolvedPath = resolver.resolve(this.fileServerService.remoteDirectory)

    let url = resolvedPath.getFullUrl(
      environment.serverUrl,
      endpoints.FS_UPLOAD
    )

    const upload$ = this.http
      .post<never>(url, formData, {
        headers: new HttpHeaders({
          //'Content-Disposition': `form-data; name="fieldName"; filename="${this.fileName}"`
          //'Content-Disposition': `attachment; filename="${this.fileName}"`
        }),
        reportProgress: true,
        observe: 'events',
        responseType: 'json'
      })
      .pipe(
        map(event => this.getEventMessage(event, file)),
        tap(message => this.showProgress(message)),
        finalize(() => this.reset()),
        /*         tap({
          next: () => console.log('[next] Called'),
          error: () => console.log('[error] Not called'),
          complete: () => console.log('[tap complete] Not called')
        }), */
        catchError(e => this.handleError(e as HttpErrorResponse))
      )
      .subscribe({
        next: () => {
          //this.on_OK_response(file)
        },
        complete: () => {
          this.on_OK_response(file)
        }
      })
  }
  private showProgress (message: string) {
    console.log('showProgress', message)
  }
  private getEventMessage (event: HttpEvent<any>, file: File) {
    switch (event.type) {
      case HttpEventType.Sent:
        return `Uploading file "${file.name}" of size ${file.size}.`

      case HttpEventType.UploadProgress:
        // Compute and show the % done:
        this.uploadProgress = event.total
          ? Math.round((100 * event.loaded) / event.total)
          : 0
        return `File "${file.name}" is ${this.uploadProgress}% uploaded.`

      case HttpEventType.Response:
        return `File "${file.name}" was completely uploaded!`

      default:
        return `File "${file.name}" surprising upload event: ${event.type}.`
    }
  }

  handleError (error: HttpErrorResponse): Observable<never> {
    console.warn('UPLOD ERR', error)
    return this.fileServerService.handleError(error as HttpErrorResponse)
  }

  cancelUpload () {
    this.reset()
  }

  private reset (file: File | null = null) {
    if (this.uploadSub) {
      this.uploadSub.unsubscribe()
    }

    this.uploadProgress = null
    this.uploadSub = null
  }

  on_OK_response (file: File) {
    file.lastModified
    let fileDetails: FileDetails = {
      name: file.name,
      ftype: FileType.File,
      size: file.size,
      mtime: new Date(file.lastModified).toISOString()
    }

    this.fileServerService.addNewFile(fileDetails)
    //this.fileName = ''
  }
}
