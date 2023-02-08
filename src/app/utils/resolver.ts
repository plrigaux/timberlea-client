//import { env } from 'process';

export const HOME = ''
export const PATH_UP = '..'
const HOME_DIR = 'HOME'
const TEMP_DIR = 'TEMP'
const SEPARATOR = '/'
const copyIndiceRE = /(.*)\s\((\d+)\)/

interface FilePathConfig {
  label: string
  path: string
}

let isRoot = (key: string): boolean => {
  return key === '' || key === SEPARATOR
}

export class ResolverPath {
  private dirFiles: string[]
  private pathServer: string | null = null
  private pathNetwork: string | null = null

  constructor (dirFiles: string[]) {
    if (dirFiles.length === 0) {
      this.dirFiles = []
    } else {
      this.dirFiles = dirFiles
    }
  }

  get key () {
    return this.dirFiles.length === 0 ? '' : this.dirFiles[0]
  }

  getFileName (): string {
    let lh = this.dirFiles.length
    return lh > 0 ? this.dirFiles[lh - 1] : ''
  }

  /**
   *  returns the last portion of a path
   */
  get basename (): string {
    return this.getFileName()
  }

  get basenameNoExt (): string {
    let fn = this.getFileName()
    let idx = fn.lastIndexOf('.')
    if (idx >= 0) {
      return fn.slice(0, idx)
    }
    return fn
  }

  get basenameNoExtNoIndice (): [string, number] {
    let fn = this.basenameNoExt

    const match = fn.match(copyIndiceRE)
    if (match) {
      return [match[1], Number(match[2])]
    }

    return [fn, 0]
  }

  get ext () {
    let fn = this.getFileName()
    let idx = fn.lastIndexOf('.')
    if (idx >= 0) {
      return fn.slice(idx + 1)
    }
    return ''
  }

  get dirnameNetwork () {
    return this.dirFiles.slice(0, -1).join(SEPARATOR)
  }

  get network () {
    if (!this.pathNetwork) {
      this.pathNetwork = this.dirFiles.join(SEPARATOR)
    }
    return this.pathNetwork
  }

  add (...extention: string[]): ResolverPath | never {
    if (this.isHomeRoot()) {
      return resolver.resolve(HOME, ...extention)
    }

    return resolver.resolve(null, ...this.dirFiles, ...extention)
  }

  replaceFile (...extention: string[]): ResolverPath | never {
    if (this.isHomeRoot()) {
      return resolver.resolve(HOME, ...extention)
    }

    let array = [...this.dirFiles.slice(0, -1), ...extention]
    return new ResolverPath(array)
  }

  getFullUrl (server: string, endpoint: string): string {
    let url = server + endpoint;

    for (let elem of this.dirFiles) {
      url += SEPARATOR
      url += encodeURIComponent(elem)
    }

    return url
  }

  isHomeRoot () {
    return this.dirFiles.length === 0
  }
}

export const HOME_ResolverPath = new ResolverPath([])

export namespace resolver {
  let rootKeys: string[]

  export let resolve = (
    pathToResolve: string | null | undefined,
    ...dirs: string[]
  ): ResolverPath | never => {
    console.log('resolve', pathToResolve, dirs)
    if (pathToResolve === null || pathToResolve === undefined) {
      pathToResolve = HOME
    }

    let array: string[] = pathToResolve.split(SEPARATOR)
    dirs.forEach(s => {
      let splited: string[] = s.split(SEPARATOR)
      array.push(...splited)
    })

    let array2 = []
    for (let i = 0; i < array.length; ++i) {
      let s = array[i]
      if (s === '') {
      } else if (s === PATH_UP) {
        array2.pop()
      } else {
        array2.push(s)
      }
    }

    if (array2.length === 0) {
      return HOME_ResolverPath
    }

    let key = array2[0]

    let resolverPath = new ResolverPath(array2)

    console.warn(resolverPath)
    return resolverPath
  }

  export let root = (): string[] => {
    return rootKeys
  }
}
