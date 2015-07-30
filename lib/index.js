import { exec } from 'child_process'
import { readFileSync, writeFileSync } from 'fs'
import gitRefs from 'git-refs'

export default (opts, callback) => {
  if (typeof opts === 'function') {
    [opts, callback] = [null, opts]
  }
  opts = opts || {}
  opts.paths = opts.paths || ['tests', 'package.json']
  if (opts.type === 'major') return callback(null, true)
  exec('git fetch --tags', (error, stdout, stderr) => {
    if (error) return callback(new Error('Could not fetch tags.'))
    exec('git describe --abbrev=0 --tags', (descErr, stdout, stderr) => {
      gitRefs((err, refs) => {
        if (err) return callback(new Error('Could not get refs.'))
        let cohash = refs.get(descErr ? 'HEAD' : `tags/${stdout.trim()}`)
        exec(`git checkout ${cohash} ${opts.paths.join(' ')}`, (error, stdout, stderr) => {
          if (error) return callback(new Error('Could not checkout paths.'))
          let pkg = JSON.parse(readFileSync('package.json').toString())
          const tmpDep = pkg.dependencies
          delete pkg.dependencies
          writeFileSync('package.json', JSON.stringify(pkg, null, 2) + '\n')
          exec('npm install', (error, stdout, stderr) => {
            if (error) return callback(new Error('Could not install dependencies.'))
            pkg.dependencies = tmpDep
            writeFileSync('package.json', JSON.stringify(pkg, null, 2) + '\n')
            const npmTest = exec('npm test', (error, stdout, stderr) => {
              exec('git stash', () => {
                // Ignoring `git stash errors

                if (error) {
                  if (opts.silent) {
                    // When things go wrong we log no matter what
                    console.error(stdout)
                    console.error(stderr)
                  }
                  return callback(new Error('Old tests failed. Breaking Change detected.'))
                }

                // Congratulations. No Breaking Change!
                callback(null)
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
