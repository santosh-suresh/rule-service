const send = require('send-data/json')
const jsonBody = require('body/json')
const RRule = require('rrule-alt')
const RRuleSet = require('rrule-alt').RRuleSet
const moment = require('moment-timezone')
const flatten = require('lodash/flatten')

module.exports = {
  findOccurence
}

function findOccurence (req, res, opts, cb) {
  jsonBody(req, res, opts, function (err, entity) {
    if (err) return cb(err)
    const {rules, startDate, endDate, targetTz} = entity
    const dates = findOcurrencesBetween(rules, startDate, endDate, targetTz)
    return send(req, res, {body: dates, statusCode: 200}, cb)
  })
}

function findOcurrencesBetween (rules = [], startDate, endDate, targetTz = 'Etc/UTC') {
  const parsedRules = rules.map((rule) => {
    const startTimeInTz = moment.utc(`${rule.start_time}Z`)
    const endTimeInTz = moment.utc(`${rule.end_time}Z`)
    const duration = (endTimeInTz - startTimeInTz)
    const startTime = startTimeInTz.format('HH:mm:ssZ')
    const dtStart = startTimeInTz.format('YYYYMMDDTHHmmss')
    const ruleset = new RRuleSet()

    const rrule = `${rule.rrule};DTSTART=${dtStart}Z`
    const option = RRule.parseString(rrule)
    ruleset.rrule(new RRule(option))

    rule.exception_dates.forEach((exception) => {
      const newDate = `${exception}T${startTime}`
      const exceptionDate = moment.utc(newDate).toDate()
      ruleset.exdate(exceptionDate)
    })
    return {rule: ruleset, tz: rule.time_zone, duration}
  })

  const dates = parsedRules.map(function (rrule) {
    const startDateTz = moment.tz(startDate, rrule.tz)
    const endDateTz = moment.tz(endDate, rrule.tz)
    const dates = rrule.rule.between(startDateTz.toDate(), endDateTz.toDate(), true)
    return dates.map((date) => {
      const start = moment.tz(date, targetTz).format()
      const end = moment.tz(date, targetTz).add(rrule.duration, 'milliseconds').format()
      return [start, end]
    })
  })
  return flatten(dates)
}
