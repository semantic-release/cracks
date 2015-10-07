import { exec } from 'child_process'
import { readFileSync, writeFileSync } from 'fs'

import { defaults } from 'lodash'
import gitRefs from 'git-refs'

export default function () {
  const callback = arguments[arguments.length - 1]

  if (typeof callback !== 'function') {
    throw new Error('No callback provied.')
  }

  const opts = defaults(arguments.length > 1 && arguments[0] || {}, {
    silent: true,
    paths: ['tests', 'package.json']
  })

  const { nextRelease } = arguments.length > 2 && arguments[1] || {}

  const type = nextRelease.type || opts.type
  if (type === 'major' || type === 'initial') return callback(null)

  exec('git fetch --tags', (error, stdout, stderr) => {
    if (error) return callback(new Error('Could not fetch tags: `${stderr}`'))
    exec('git describe --abbrev=0 --tags', (descErr, stdout, stderr) => {
      gitRefs((err, refs) => {
        if (err) return callback(new Error('Could not get refs: `${stderr}`'))
        let cohash = refs.get(descErr ? 'HEAD' : `tags/${stdout.trim()}`)
        exec(`git checkout ${cohash} ${opts.paths.join(' ')}`, (error, stdout, stderr) => {
          if (error) return callback(new Error('Could not checkout paths: `${stderr}`'))
          let pkg = JSON.parse(readFileSync('package.json').toString())
          const tmpDep = pkg.dependencies
          delete pkg.dependencies
          writeFileSync('package.json', JSON.stringify(pkg, null, 2) + '\n')
          exec('npm install', (error, stdout, stderr) => {
            if (error) return callback(new Error('Could not install dependencies: `${stderr}`'))
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
