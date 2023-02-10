import {
  HttpClient,
  HttpErrorResponse,
  HttpHeaders
} from '@angular/common/http'
import { Injectable } from '@angular/core'
import { MatSnackBar } from '@angular/material/snack-bar'
import {
  catchError,
  Observable,
  Observer,
  retry,
  Subject,
  Subscription,
  tap,
  throwError
} from 'rxjs'
import { environment } from 'src/environments/environment'
import { endpoints } from '../../common/constants'
import {
  ChangeDir_Request,
  ChangeDir_Response,
  ErrorResponse,
  FileDetails,
  FileDetail_Response,
  FileList_Response,
  MakeDirRequest,
  MakeDirResponse,
  MakeFileRequest,
  MakeFileResponse,
  MvFile_Request,
  MvFile_Response,
  RemFile_Request,
  RemFile_Response
} from '../../common/interfaces'
import {
  ErrorData,
  ErrorSnackComponent
} from '../error-snack/error-snack.component'
import { resolver, ResolverPath } from './resolver'

@Injectable({
  providedIn: 'root'
})
export class FileServerService {
  private serverUrl: string
  private rd = ''

  get remoteDirectory () {
    return this.rd
  }

  private set remoteDirectory (rd: string) {
    console.warn('rd', rd)
    this.rd = rd
  }

  private newList = new Subject<FileDetails[]>()
  private newRemoteDirectory = new Subject<string>()
  private waitingSubject = new Subject<boolean>()
  private deleteSubject = new Subject<string>()
  private selectFileSubject = new Subject<SelectFileContext | null>()
  private moveSubject = new Subject<MvFile_Response>()
  private copySubject = new Subject<MvFile_Response>()
  private newFileSubject = new Subject<FileDetails>()
  private newFolderSubject = new Subject<string>()
  private downloadFileSubject = new Subject<DownloadFile>()

  constructor (private http: HttpClient, private _snackBar: MatSnackBar) {
    this.serverUrl = environment.serverUrl
  }

  subscribeDownloadFile (obs: Partial<Observer<DownloadFile>>): Subscription {
    return this.downloadFileSubject.subscribe(obs)
  }

  subscribeFileList (obs: Partial<Observer<FileDetails[]>>): Subscription {
    return this.newList.subscribe(obs)
  }

  subscribeRemoteDirectory (obs: Partial<Observer<string>>): Subscription {
    return this.newRemoteDirectory.subscribe(obs)
  }

  subscribeWaiting (obs: Partial<Observer<boolean>>): Subscription {
    return this.waitingSubject.subscribe(obs)
  }

  subscribeDelete (obs: Partial<Observer<string>>): Subscription {
    return this.deleteSubject.subscribe(obs)
  }

  subscribeSelectFileSub (
    obs: Partial<Observer<SelectFileContext | null>>
  ): Subscription {
    return this.selectFileSubject.subscribe(obs)
  }

  subscribeModif (obs: Partial<Observer<MvFile_Response>>): Subscription {
    return this.moveSubject.subscribe(obs)
  }

  subscribeCopy (obs: Partial<Observer<MvFile_Response>>): Subscription {
    return this.copySubject.subscribe(obs)
  }

  subscribeNewFile (obs: Partial<Observer<FileDetails>>): Subscription {
    return this.newFileSubject.subscribe(obs)
  }

  subscribeNewFolderSubject (obs: Partial<Observer<string>>): Subscription {
    return this.newFolderSubject.subscribe(obs)
  }

  addNewFile (file: FileDetails): void {
    this.newFileSubject.next(file)
  }

  pwd (): void {
    console.log('click PWD')

    this.list()
  }

  /*   cd(relPath: string, remoteDirectory: string | null = null, returnList = true): void {
    this.waitingSubject.next(true)
    let newRemoteDirectory: ChangeDir_Request = {
      remoteDirectory: remoteDirectory ? remoteDirectory : this.remoteDirectory,
      newPath: relPath,
      returnList: returnList
    }

    console.log("path:", newRemoteDirectory)

    this.http.put<ChangeDir_Response>(this.serverUrl + endpoints.FS_LIST, newRemoteDirectory).pipe(
      tap((data: ChangeDir_Response) => {
        this.setRemoteDirectory(data)
      }),
      //retry(2),
      catchError((e) => this.handleError(e as HttpErrorResponse))
    ).subscribe(
      {
        next: (data: ChangeDir_Response) => {
          let files: FileDetails[] = data.files ? data.files : []
          this.newList.next(files)
        },
        error: (e: any) => {

        }
      })
  } */

  list_fix (path: string | null = null): void {
    if (path === null) {
      path = this.remoteDirectory
    }
    let resolvedPath = resolver.resolve(path)
    this.list_priv(resolvedPath)
  }

  list_rel (rel_path: string): void {
    let resolvedPath = resolver.resolve(this.remoteDirectory, rel_path)
    this.list_priv(resolvedPath)
  }

  list (
    path: string | null = null,
    remoteDirectory: string | null = null
  ): void {
    this.waitingSubject.next(true)

    if (path === null) {
      path = this.remoteDirectory
    }

    let parentDirectory = remoteDirectory
      ? remoteDirectory
      : this.remoteDirectory
    let resolvedPath = resolver.resolve(parentDirectory, path)

    this.list_priv(resolvedPath)
  }

  private list_priv (resolvedPath: ResolverPath): void {
    const url = resolvedPath.getFullUrl(this.serverUrl, endpoints.FS_LIST)

    console.log(`list url ${url}`)
    this.http
      .get<FileDetails[]>(url)
      .pipe(
        tap((data: FileDetails[]) => {
          this.setRemoteDirectory(resolvedPath.network)
        }),
        //retry(2),
        catchError(e => this.handleError(e as HttpErrorResponse))
      )
      .subscribe({
        next: (data: FileDetails[]) => {
          this.newList.next(data ?? [])
        },
        error: e => {
          console.error('get list', e)
        }
      })
  }

  private setRemoteDirectory (remoteDirectory: string | null) {
    if (remoteDirectory !== null) {
      this.remoteDirectory = remoteDirectory
      this.newRemoteDirectory.next(this.remoteDirectory)
    }
    this.waitingSubject.next(false)
  }

  isHome (): boolean {
    return this.remoteDirectory === ''
  }

  handleError (error: HttpErrorResponse): Observable<never> {
    let message = ''
    let time_sec = 10
    let errorData: ErrorData = {
      status: 0,
      statusText: ''
    }
    if (error.status === 0) {
      // A client-side or network error occurred. Handle it accordingly.
      errorData.status = 0
      errorData.statusText = error.statusText
      //errorData.message = `Connection error ${error.message}`;
      console.warn(error)
      time_sec = 60
    } else {
      // The backend returned an unsuccessful response code.
      // The response body may contain clues as to what went wrong.
      errorData.status = error.status
      errorData.statusText = error.statusText
      let srv_error: ErrorResponse = error.error
      errorData.serverCode = srv_error.error
      errorData.serverMessage = srv_error.message
    }

    /*     this._snackBar.open(message, 'Close', {
      duration: time_sec * 1000
    }) */
    this._snackBar.openFromComponent(ErrorSnackComponent, {
      duration: time_sec * 1000,
      data: errorData
    })
    this.waitingSubject.next(false)

    return throwError(() => new Error(message))
  }

  private getFileHref (resolvedPath: ResolverPath, archive = false): string {
    let endpoint = archive ? endpoints.FS_DOWNZIP : endpoints.FS_DOWNLOAD
    return resolvedPath.getFullUrl(environment.serverUrl, endpoint)
  }

  getFileNameHref (fileName: string, archive = false): string {
    let endpoint = archive ? endpoints.FS_DOWNZIP : endpoints.FS_DOWNLOAD
    const resolvedPath = resolver.resolve(this.remoteDirectory, fileName)

    return this.getFileHref(resolvedPath)
  }

  downloadFileName (fileName: string, archive = false) {
    let resolvedPath = resolver.resolve(this.remoteDirectory, fileName)
    this.downloadFilePath(resolvedPath, archive)
  }

  private getLast (filePath: string) {
    let idx = filePath.lastIndexOf('/')
    return filePath.substring(idx)
  }

  downloadFilePath (resolvedPath: ResolverPath, archive = false) {
    const href = this.getFileHref(resolvedPath, archive)

    const link = document.createElement('a')
    link.setAttribute('target', '_blank')
    link.setAttribute('href', href)
    link.setAttribute('download', this.getLast(resolvedPath.basename))
    document.body.appendChild(link)
    link.click()
    link.remove()

    this.downloadFileSubject.next({
      path: resolvedPath.network,
      archive: archive
    })
  }

  delete (fileName: string | null | undefined) {
    if (!fileName) {
      return
    }

    this.waitingSubject.next(true)
    let request: RemFile_Request = {
      parent: this.remoteDirectory,
      fileName: fileName
    }

    let resolvedPath = resolver.resolve(this.remoteDirectory, fileName)

    const url = resolvedPath.getFullUrl(this.serverUrl, endpoints.FS_REM)

    const options = {
      headers: new HttpHeaders({
        'Content-Type': 'application/json'
      }),
      body: request
    }

    this.http
      .delete(url, options)
      .pipe(
        tap(() => {
          this.setRemoteDirectory(null)
        }),
        retry(2),
        catchError(e => this.handleError(e as HttpErrorResponse))
      )
      .subscribe({
        next: () => {
          this.deleteSubject.next(fileName)
        },
        error: e => {}
      })
  }

  selectFile (fileContext: SelectFileContext | null) {
    if (fileContext) {
      fileContext.file.directory = this.remoteDirectory
    }
    this.selectFileSubject.next(fileContext)
  }

  copyPaste (copySelect: FileDetailsPlus) {
    console.log(
      `COPY ${copySelect.name} from ${copySelect.directory} to ${this.remoteDirectory}`
    )

    let request: MvFile_Request = {
      parent: copySelect.directory,
      fileName: copySelect.name,
      newParent: this.remoteDirectory
    }
    this.copy(request)
  }

  renameFile (
    fileName: string | null | undefined,
    newFileName: string | null | undefined
  ) {
    if (!(fileName && newFileName)) {
      return
    }

    let request: MvFile_Request = {
      parent: this.remoteDirectory,
      fileName: fileName,
      newFileName: newFileName
    }

    this.move(request)
  }

  cutPaste (cutSelect: FileDetailsPlus) {
    console.log(
      `CUT ${cutSelect.name} from ${cutSelect.directory} to ${this.remoteDirectory}`
    )

    let request: MvFile_Request = {
      parent: cutSelect.directory,
      fileName: cutSelect.name,
      newParent: this.remoteDirectory
    }
    this.move(request)
  }

  private move (request: MvFile_Request) {
    this.http
      .put<MvFile_Response>(this.serverUrl + endpoints.FS_MV, request)
      .pipe(
        tap((data: MvFile_Response) => {
          this.setRemoteDirectory(null)
        }),
        catchError(e => this.handleError(e as HttpErrorResponse))
      )
      .subscribe({
        next: (data: MvFile_Response) => {
          this.moveSubject.next(data)
        },
        error: e => {}
      })
  }

  private copy (request: MvFile_Request) {
    this.http
      .put<MvFile_Response>(this.serverUrl + endpoints.FS_COPY, request)
      .pipe(
        tap((data: MvFile_Response) => {
          this.setRemoteDirectory(null)
        }),
        catchError(e => this.handleError(e as HttpErrorResponse))
      )
      .subscribe({
        next: (data: MvFile_Response) => {
          this.copySubject.next(data)
        },
        error: e => {}
      })
  }

  newFolder (expectedDirectoryName: string | null | undefined) {
    if (!expectedDirectoryName) {
      return
    }

    this.waitingSubject.next(true)
    let request: MakeDirRequest = {
      recursive: false,
      overwrite: false,
      autoNaming: true
    }

    const options = {
      headers: new HttpHeaders({
        'Content-Type': 'application/json'
      })
    }

    let resolvedPath = resolver.resolve(
      this.remoteDirectory,
      expectedDirectoryName
    )
    let url = resolvedPath.getFullUrl(this.serverUrl, endpoints.FS_MKDIR)
    this.http
      .post<MakeDirResponse>(url, request, options)
      .pipe(
        tap((data: MakeDirResponse) => {
          this.setRemoteDirectory(null)
        }),
        //retry(2),
        catchError(e => this.handleError(e as HttpErrorResponse))
      )
      .subscribe({
        next: (data: MakeDirResponse) => {
          let new_dir_name = data ? data.newFileName : expectedDirectoryName

          this.newFolderSubject.next(new_dir_name)
        },
        error: e => {}
      })
  }

  newFile (
    fileName: string | null | undefined,
    fileContent: string | null | undefined
  ) {
    if (!fileName) {
      return
    }

    if (!fileContent) {
      fileContent = ''
    }

    this.waitingSubject.next(true)
    let request: MakeFileRequest = {
      parent: this.remoteDirectory,
      fileName: fileName
    }

    if (fileContent) {
      request.data = fileContent
    }

    const options = {
      headers: new HttpHeaders({
        'Content-Type': 'application/json'
      })
    }

    this.http
      .post<FileDetail_Response>(
        this.serverUrl + endpoints.FS_MKFILE,
        request,
        options
      )
      .pipe(
        tap((data: FileDetail_Response) => {
          this.setRemoteDirectory(null)
        }),
        //retry(2),
        catchError(e => this.handleError(e as HttpErrorResponse))
      )
      .subscribe({
        next: (data: FileDetail_Response) => {
          this.addNewFile(data.file)
        },
        error: e => {}
      })
  }
}

export interface FileDetailsPlus extends FileDetails {
  directory: string
}

export interface DownloadFile {
  path: string
  archive: boolean
}

export interface SelectFileContext {
  file: FileDetailsPlus
  controlID: string
}
