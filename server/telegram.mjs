/**
 * Telegram bot assistant for Reset PWA.
 * Activated when TELEGRAM_BOT_TOKEN env var is set.
 *
 * Commands:
 *   /today        — get today's entry summary
 *   /checkin e m f  — set energy, mood, focus (1-10 each)
 *   /set field:value ... — set specific fields
 *   /stats        — 7-day summary
 *   /missed       — list missing days
 *   /help         — command list
 *
 * Examples:
 *   /checkin 7 8 6
 *   /set energy:7 mood:8 focus:6 deep:90 workout:yes
 *   /set mj:yes craving:4
 */

import { createServer } from 'node:http'

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN
const API = `https://api.telegram.org/bot${BOT_TOKEN}`
const POLL_INTERVAL_MS = 3000

let lastUpdateId = 0
let db = null

export function startTelegramBot(database) {
  if (!BOT_TOKEN) return
  db = database
  console.log('Telegram bot starting (long-polling)...')
  pollUpdates()
}

async function apiCall(method, body = {}) {
  const res = await fetch(`${API}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  return res.json()
}

async function sendMessage(chatId, text) {
  await apiCall('sendMessage', { chat_id: chatId, text, parse_mode: 'HTML' })
}

async function pollUpdates() {
  while (true) {
    try {
      const data = await apiCall('getUpdates', {
        offset: lastUpdateId + 1,
        timeout: 25,
        allowed_updates: ['message'],
      })

      if (data.ok && data.result.length > 0) {
        for (const update of data.result) {
          lastUpdateId = update.update_id
          if (update.message?.text) {
            await handleMessage(update.message).catch(console.error)
          }
        }
      }
    } catch {
      await sleep(POLL_INTERVAL_MS)
    }
  }
}

async function handleMessage(message) {
  const chatId = message.chat.id
  const text = (message.text ?? '').trim()
  const [cmd, ...args] = text.split(/\s+/)

  switch (cmd.toLowerCase()) {
    case '/start':
    case '/help':
      await sendMessage(chatId, helpText())
      break

    case '/today':
      await handleToday(chatId)
      break

    case '/checkin':
      await handleCheckin(chatId, args)
      break

    case '/set':
      await handleSet(chatId, args)
      break

    case '/stats':
      await handleStats(chatId)
      break

    case '/missed':
      await handleMissed(chatId)
      break

    default:
      await sendMessage(chatId, 'Невідома команда. /help — список команд.')
  }
}

function todayKey() {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function getOrCreateTodayEntry() {
  const date = todayKey()
  const existing = db.getEntry(date)
  if (existing) return existing

  const now = new Date().toISOString()
  return {
    version: 1,
    date,
    energy: 5,
    mood: 5,
    focus: 5,
    deepWork: 0,
    workout: false,
    webcam: false,
    mj: false,
    alcohol: false,
    nicotineBefore12: false,
    craving: 0,
    sleep: 0,
    stress: 0,
    notes: '',
    createdAt: now,
    updatedAt: now,
  }
}

async function handleToday(chatId) {
  const entry = db.getEntry(todayKey())
  if (!entry) {
    await sendMessage(chatId, `📋 <b>${todayKey()}</b>\nЗапис ще не створено. /checkin або /set для швидкого чекіну.`)
    return
  }

  const level = computeLevel(entry)
  const lines = [
    `📋 <b>${entry.date}</b>  level: <b>${level.toFixed(1)}</b>`,
    ``,
    `⚡ Енергія: ${entry.energy}  😊 Настрій: ${entry.mood}  🎯 Фокус: ${entry.focus}`,
    `💼 Deep work: ${entry.deepWork} хв`,
    entry.sleep ? `🌙 Сон: ${entry.sleep}г` : null,
    entry.stress ? `😰 Стрес: ${entry.stress}/10` : null,
    entry.craving ? `🔥 Потяг: ${entry.craving}/10` : null,
    ``,
    entry.workout ? '✅ Тренування' : null,
    entry.webcam ? '🔴 Вебкам (критично)' : null,
    entry.mj ? '⚠️ MJ' : null,
    entry.alcohol ? '⚠️ Алкоголь' : null,
    entry.nicotineBefore12 ? '🚬 Нікотин до 12' : null,
    entry.notes ? `\n💬 ${entry.notes}` : null,
  ]

  await sendMessage(chatId, lines.filter(Boolean).join('\n'))
}

async function handleCheckin(chatId, args) {
  const [energyStr, moodStr, focusStr] = args
  const energy = clamp(parseInt(energyStr ?? ''), 1, 10)
  const mood = clamp(parseInt(moodStr ?? ''), 1, 10)
  const focus = clamp(parseInt(focusStr ?? ''), 1, 10)

  if (isNaN(energy) || isNaN(mood) || isNaN(focus)) {
    await sendMessage(chatId, 'Формат: /checkin [енергія 1-10] [настрій 1-10] [фокус 1-10]\nПриклад: /checkin 7 8 6')
    return
  }

  const entry = { ...getOrCreateTodayEntry(), energy, mood, focus, updatedAt: new Date().toISOString() }
  db.saveEntry(entry)
  const level = computeLevel(entry)
  await sendMessage(chatId, `✅ Збережено\nРівень: <b>${level.toFixed(1)}</b>  E:${energy} M:${mood} F:${focus}\n\nДодай деталі: /set deep:90 workout:yes`)
}

async function handleSet(chatId, args) {
  if (!args.length) {
    await sendMessage(chatId, setHelpText())
    return
  }

  const entry = getOrCreateTodayEntry()
  const patch = {}

  for (const arg of args) {
    const colonIdx = arg.indexOf(':')
    if (colonIdx < 0) continue
    const key = arg.slice(0, colonIdx).toLowerCase()
    const val = arg.slice(colonIdx + 1)

    switch (key) {
      case 'energy': patch.energy = clamp(parseInt(val), 1, 10); break
      case 'mood': patch.mood = clamp(parseInt(val), 1, 10); break
      case 'focus': patch.focus = clamp(parseInt(val), 1, 10); break
      case 'deep':
      case 'deepwork': patch.deepWork = Math.max(0, parseInt(val) || 0); break
      case 'craving': patch.craving = clamp(parseInt(val), 0, 10); break
      case 'sleep': patch.sleep = clamp(parseInt(val), 0, 14); break
      case 'stress': patch.stress = clamp(parseInt(val), 0, 10); break
      case 'workout': patch.workout = isTruthy(val); break
      case 'webcam': patch.webcam = isTruthy(val); break
      case 'mj': patch.mj = isTruthy(val); break
      case 'alcohol': patch.alcohol = isTruthy(val); break
      case 'nicotine': patch.nicotineBefore12 = isTruthy(val); break
      case 'notes': patch.notes = val; break
    }
  }

  if (!Object.keys(patch).length) {
    await sendMessage(chatId, `Нічого не розпізнано. ${setHelpText()}`)
    return
  }

  const updated = { ...entry, ...patch, updatedAt: new Date().toISOString() }
  db.saveEntry(updated)
  const level = computeLevel(updated)
  const changed = Object.keys(patch).join(', ')
  await sendMessage(chatId, `✅ Оновлено: ${changed}\nРівень: <b>${level.toFixed(1)}</b>\n/today — переглянути весь запис`)
}

async function handleStats(chatId) {
  const entries = db.listEntries({})
  if (entries.length < 3) {
    await sendMessage(chatId, 'Недостатньо даних (потрібно хоча б 3 записи).')
    return
  }

  const last7 = entries.slice(0, 7)
  const avg = (arr) => arr.reduce((s, v) => s + v, 0) / arr.length

  const avgLevel = avg(last7.map(computeLevel))
  const avgEnergy = avg(last7.map((e) => e.energy))
  const avgDeepWork = avg(last7.map((e) => e.deepWork))
  const avgCraving = avg(last7.map((e) => e.craving))
  const redDays = last7.filter((e) => e.webcam).length
  const yellowDays = last7.filter((e) => !e.webcam && (e.mj || e.alcohol)).length

  const lines = [
    `📊 <b>7 днів</b>`,
    ``,
    `Рівень: <b>${avgLevel.toFixed(1)}</b>  Енергія: ${avgEnergy.toFixed(1)}`,
    `Deep work: ${Math.round(avgDeepWork)} хв/день`,
    `Craving: ${avgCraving.toFixed(1)}`,
    redDays ? `🔴 Червоних: ${redDays}` : null,
    yellowDays ? `🟡 Жовтих: ${yellowDays}` : null,
    `\nЗаписано: ${last7.length}/7 днів`,
  ]

  await sendMessage(chatId, lines.filter(Boolean).join('\n'))
}

async function handleMissed(chatId) {
  const today = todayKey()
  const entries = db.listEntries({})
  const entryDates = new Set(entries.map((e) => e.date))

  const missed = []
  for (let i = 1; i <= 30; i++) {
    const d = shiftDate(today, -i)
    if (!entryDates.has(d)) missed.push(d)
  }

  if (!missed.length) {
    await sendMessage(chatId, '✅ Жодного пропущеного дня за останні 30 днів!')
    return
  }

  const list = missed.slice(0, 10).join('\n')
  const extra = missed.length > 10 ? `\n...ще ${missed.length - 10}` : ''
  await sendMessage(chatId, `📅 Пропущені дні (${missed.length}):\n\n${list}${extra}\n\nВикористай /set щоб заповнити конкретну дату.`)
}

function computeLevel(entry) {
  const deepWorkBonus = Math.min(2, (entry.deepWork / 60) * 0.5)
  let score = 10
  if (entry.webcam) score -= 6
  if (entry.mj) score -= 2
  if (entry.alcohol) score -= 2
  if (entry.workout) score += 1
  score += deepWorkBonus
  return Math.max(0, Math.min(10, Math.round(score * 10) / 10))
}

function clamp(n, min, max) {
  if (isNaN(n)) return min
  return Math.max(min, Math.min(max, n))
}

function isTruthy(val) {
  return ['yes', 'true', '1', 'так', 'y', '+'].includes(val.toLowerCase())
}

function shiftDate(dateKey, offset) {
  const dayMs = 24 * 60 * 60 * 1000
  const base = new Date(`${dateKey}T12:00:00`)
  base.setTime(base.getTime() + offset * dayMs)
  const d = base
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function helpText() {
  return [
    '🤖 <b>Reset Assistant</b>',
    '',
    '/today — запис за сьогодні',
    '/checkin 7 8 6 — енергія, настрій, фокус',
    '/set field:value — окремі поля',
    '/stats — тижнева статистика',
    '/missed — пропущені дні',
    '',
    'Поля для /set:',
    'energy mood focus deep craving sleep stress',
    'workout mj alcohol webcam nicotine notes',
    'Значення так/ні: yes/no або 1/0',
  ].join('\n')
}

function setHelpText() {
  return 'Формат: /set energy:7 mood:8 deep:90 workout:yes sleep:7'
}
