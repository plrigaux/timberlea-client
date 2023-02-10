import { Injectable } from '@angular/core'
import { HttpClient } from '@angular/common/http'
import { Observable } from 'rxjs'
import { environment } from 'src/environments/environment'
import { endpoints } from '../../common/constants'
import { resolver } from '../utils/resolver'
import { FileServerService } from '../utils/file-server.service'
@Injectable({
  providedIn: 'root'
})
export class FileUploadService {
  // API url
  baseApiUrl = environment.serverUrl + endpoints.FS_UPLOAD

  constructor (
    private http: HttpClient,
    private fileServerService: FileServerService
  ) {}

  // Returns an observable
  upload (file: File): Observable<any> {
    // Create form data
    const formData = new FormData()

    // Store form name as "file" with file data
    formData.append('file', file, file.name)

    // Make http post request over api
    // with formData as req

    let resolvedPath = resolver.resolve(this.fileServerService.remoteDirectory)

    let url = resolvedPath.getFullUrl(
      environment.serverUrl,
      endpoints.FS_UPLOAD
    )

    return this.http.post(url, formData)
  }
}
