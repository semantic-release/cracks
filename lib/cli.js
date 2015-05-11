import minimist from 'minimist'
import uniq from 'lodash/array/uniq'
import cracks from './'
import pkg from '../package.json'

const help = `
  Usage:
    crack <options>
  Options:
    -p, --paths  <paths>  Overwrite checkout paths
    -s, --silent          Suppress 'npm test' output
    -v, --version         Output the current version
    -h, --help            Output this help info
`

export default function (argv) {
  const args = minimist(argv, {
    string: ['paths'],
    booleans: ['silent', 'help', 'version'],
    alias: {
      p: 'paths',
      s: 'silent',
      h: 'help',
      v: 'version'
    }
  })
  if (args.help) return console.log(help)
  if (args.version) return console.log(pkg.version)
  cracks({
    paths: args.paths ? uniq(args.paths.split(/ *, */)) : null,
    silent: !!args.silent
  }, (err, bc) => {
    if (err) return console.error(err)
    if (!bc) return console.log('no breaking change detected')
    console.log('breaking change detected')
    process.exit(1)
  })
}
