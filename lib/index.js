import {exec, spawn} from 'child_process'
import {readFileSync, writeFileSync} from 'fs'
import gitRefs from 'git-refs'

export default function (opts, callback) {
  if (typeof opts === 'function') {
    [opts, callback] = [null, opts]
  }
  opts = opts || {}
  opts.paths = opts.paths || ['tests', 'package.json']
  exec('git fetch --tags', function (error, stdout, stderr) {
    if (error) return callback('could not fetch tags')
    exec('git describe --abbrev=0 --tags', function (descErr, stdout, stderr) {
      gitRefs((err, refs) => {
        if (err) return callback('could not get refs')
        let cohash = refs.get(descErr ? 'HEAD' : `tags/${stdout.trim()}`)
        exec(`git checkout ${cohash} ${opts.paths.join(' ')}`, function (error, stdout, stderr) {
          if (error) return callback('could not checkout paths')
          let pkg = JSON.parse(readFileSync('package.json').toString())
          const tmpDep = pkg.dependencies
          delete pkg.dependencies
          writeFileSync('package.json', JSON.stringify(pkg, null, 2) + '\n')
          exec('npm install', function (error, stdout, stderr) {
            if (error) return callback('could not install dependencies')
            pkg.dependencies = tmpDep
            writeFileSync('package.json', JSON.stringify(pkg, null, 2) + '\n')
            const npmTest = exec('npm test', function (error, stdout, stderr) {
              exec('git stash', () => {
                callback(null, !!error)
              })
            })
            if (!opts.silent) {
              npmTest.stdout.pipe(process.stdout)
              npmTest.stderr.pipe(process.stderr)
            }
          })
        })
      })
    })
  })
}
