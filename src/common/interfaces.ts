export enum FileType {
  File,
  Directory,
  Other
}

export interface FileDetails {
  name: string
  size?: number
  ftype: FileType
  mtime?: string
}

export interface FileDetailsEnhanced extends FileDetails {
  parentDirectory: string
  birthtime?: string
}

export interface FS_Response {
  message: string
  suplemental?: string
}

export interface FileList_Response extends FS_Response {
  parent: string
  files?: FileDetails[]
}

export interface FileDetail_Response extends FS_Response {
  file: FileDetailsEnhanced
}

export interface ChangeDir_Request {
  remoteDirectory: string
  newPath: string
  returnList?: boolean
}

export interface ChangeDir_Response extends FileList_Response {}

export interface MakeDirRequest {
  overwrite?: boolean
  autoNaming?: boolean
  recursive?: boolean
}

export interface MakeFileRequest {
  parent: string
  fileName: string
  data?: string
}

export interface MakeDirResponse {
  newFileName: string
}

export interface MakeFileResponse extends FS_Response {
  fileName: string
}

export interface RemFile_Request {
  parent: string
  fileName: string
  recursive?: boolean
  force?: boolean
}

export interface RemFile_Response extends FS_Response {
  file: string
  parent: string
}

export interface MvFile_Request {
  parent: string
  newParent?: string
  fileName: string
  newFileName?: string
  overwrite?: boolean
  autoNaming?: boolean
}

export interface MvFile_Response extends FS_Response {
  parent: string
  oldFileName: string
  newFileName: string
  oldParent?: string
}

export interface FileUpload_Info {
  fileName: string
  size: number
}

export interface FileUpload_Response extends FS_Response {
  parent: string
  files: FileUpload_Info[]
}

export interface ErrorResponse {
  code: number
  error: string
  message: string
}
