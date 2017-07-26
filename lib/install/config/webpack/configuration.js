// Common configuration for webpacker loaded from config/webpacker.yml

const { basename, dirname, join, relative, resolve } = require('path')
const { env } = require('process')
const { safeLoad } = require('js-yaml')
const { readFileSync } = require('fs')
const { sync } = require('glob')
const extname = require('path-complete-extname')

const configPath = resolve('config', 'webpacker.yml')
const loadersDir = join(__dirname, 'loaders')
const settings = safeLoad(readFileSync(configPath), 'utf8')[env.NODE_ENV]

function removeOuterSlashes(string) {
  return string.replace(/^\/*/, '').replace(/\/*$/, '')
}

function formatPublicPath(host = '', path = '') {
  let formattedHost = removeOuterSlashes(host)
  if (formattedHost && !/^http/i.test(formattedHost)) {
    formattedHost = `//${formattedHost}`
  }
  const formattedPath = removeOuterSlashes(path)
  return `${formattedHost}/${formattedPath}/`
}

function calculateEntries() {
  const basePath = join(settings.source_path, settings.source_entry_path || '')

  let packPaths
  if (settings.source_entry_path) {
    const extensionGlob = `**/*{${settings.extensions.join(',')}}*`
    packPaths = sync(join(basePath, extensionGlob))
  } else {
    packPaths = settings.source_entry_paths.reduce((paths, entryPath) => {
      const extensionGlob = `{${settings.extensions.join(',')}}*`
      const fullPath = join(settings.source_path, `${entryPath}${extensionGlob}`)
      return paths.concat(sync(fullPath))
    }, [])
  }

  return packPaths.reduce((entries, entry) => {
    const localEntries = entries
    const namespace = relative(join(basePath), dirname(entry))
    localEntries[join(namespace, basename(entry, extname(entry)))] = [resolve(entry)]
    return localEntries
  }, {})
}

const output = {
  path: resolve('public', settings.public_output_path),
  publicPath: formatPublicPath(env.ASSET_HOST, settings.public_output_path)
}

let resolvedModules = [
  resolve(settings.source_path),
  'node_modules'
]

if (settings.resolved_paths && Array.isArray(settings.resolved_paths)) {
  resolvedModules = resolvedModules.concat(settings.resolved_paths)
}

module.exports = {
  entries: calculateEntries(),
  settings,
  resolvedModules,
  env,
  loadersDir,
  output
}
