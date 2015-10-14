var asArray = require('as-array')
var minimist = require('minimist')

var omit = require('ramda/src/omit')
var pipe = require('ramda/src/pipe')
var map = require('ramda/src/map')
var tail = require('ramda/src/tail')
var flatten = require('ramda/src/flatten')
var forEach = require('ramda/src/forEach')
var path = require('ramda/src/path')
var not = require('ramda/src/not')
var prop = require('ramda/src/prop')
var curryN = require('ramda/src/curryN')
var flip = require('ramda/src/flip')
var apply = require('ramda/src/apply')
var contains = require('ramda/src/contains')
var head = require('ramda/src/head')
var or = require('ramda/src/or')
var filter = require('ramda/src/filter')
var keys = require('ramda/src/keys')
var is = require('ramda/src/is')
var contains = require('ramda/src/contains')

var typeAsArray = pipe(prop('type'), asArray)
var getAlias = path(['value', 'alias'])
var valueDoesNotHaveAlias = pipe(getAlias, not)
var isCommand = pipe(typeAsArray, contains('command'))
var isFlag = pipe(typeAsArray, contains('flag'))

var applyFunctions = curryN(4, function applyFunctions (data, flags, tree, context) {

  var computedArgs = is(Function, context.args)
    ? context.args(data, flags, tree)
    : context.args;

  var args = asArray(computedArgs).concat({
    data: data,
    flags: flags,
    options: context.options,
    tree: tree
  })

  return pipe(
    path(['value', 'handler']),
    map(flip(apply)(args))
  )(context)
})

var containsAlias =	 function containsAlias (data, def) {

  return pipe(
    getAlias,
    flip(or)([]),
    contains(head(data))
  )(def)
}

var matchAlias = curryN(2, function matchAlias (data, def) {

  return or(valueDoesNotHaveAlias(def), containsAlias(data, def))
})

function getCommands (data) {

  return pipe(
  	prop('command'),
    filter(matchAlias(data))
  )
}

function getFlags (flags) {

  var matchFlagAliases = pipe(
    keys,
    matchAlias
  )

  return pipe(
    prop('flag'),
    filter(matchFlagAliases(flags)) // TODO: need to format flags input
  )
}

function normalizeTree (raw) {

	var tree = {}

	forEach(branch => {

		var meta = {}

		if (path(['value', 'meta'])(branch)) {

			forEach(m => {

				meta[m.type] = meta[m.type] || []
				meta[m.type].push(m)
			})(branch.value.meta)

			branch.value.meta = meta
		}

		tree[branch.type] = tree[branch.type] || []
		tree[branch.type].push(branch)
	})(flatten(raw))

	return tree
}

module.exports = function run (argv) {

	var input = minimist(argv)
	var data = input._
	var flags = omit('_')(input)

	var tree = normalizeTree(tail(arguments))
	var runner = applyFunctions(data)(flags)(tree)
	var runCommands = pipe(
		getCommands(data),
		map(runner)
	)

	var runFlags = pipe(
		getFlags(flags, tree),
		map(runner)
	)

	runFlags(tree)
	runCommands(tree)
}
