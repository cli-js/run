var test = require('tessed').namespace('run')
var run = require('.')
var flag = require('@cli/flag')
var command = require('@cli/command')
var alias = require('@cli/alias')
var handler = require('@cli/handler')
var app = require('@cli/app')

test('run commands and flags', function (t) {

  t.plan(7)

  var c = command(
    alias('test'),
    handler(function (context) {

    t.deepEqual(context.data, ['test'], 'command data context')
    t.deepEqual(context.flags, {t: 'value'}, 'flag context')
    t.deepEqual(context.options, {key: 'value'}, 'options context')
    })
  )

  var f = flag(
    alias('-t', '--test'),
    handler(function (value, context) {

      t.equal(value, value, 'flag value')
      t.deepEqual(context.data, ['test'], 'command data context')
      t.deepEqual(context.flags, {t: 'value'}, 'flag context')
      t.deepEqual(context.options, {flag: 'options'}, 'options context')
    })
  )

  var cli = app(
    c({key: 'value'}),
    f({flag: 'options'})
  )

  run(['test', '-t', 'value'], cli())
})

test('runs command-flags', function (t) {

  var results = []

  var globalFlag = flag(
    alias('--f1'),
    handler(function () {

      results.push('global flag')
    })
  )
  var commandFlag = flag(
    alias('--f2'),
    handler(function () {

      results.push('command flag')
    })
  )

  var testCommand = command(
    alias('test'),
    handler(function () {

      results.push('command')
    }),
    commandFlag()
  )

  var cli = app(
    testCommand(),
    globalFlag()
  )

  run(['test', '--f2', '--f1'], cli())

  t.deepEqual(results, [
    'global flag',
    'command flag',
    'command'
  ], 'order of execution')

  results = []

  run(['test', '--f1', '--f2'], cli())

  t.deepEqual(results, [
    'global flag',
    'command flag',
    'command'
  ], 'order of execution is the same no matter the input order')
})
