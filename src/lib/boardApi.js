import { supabase } from '@/lib/supabaseClient'
import { DEFAULT_BOARD_COLUMNS } from '@/lib/utils'

const extraColumnsKey = (teamId) => `allwork-extra-columns-${teamId}`
const labelsKey = (teamId) => `allwork-col-labels-${teamId}`
const BOARD_MARK_RE = /^<!--allwork-board:([\s\S]*?)-->\n?/
const DEFAULT_STATUS_IDS = new Set(['todo', 'doing', 'done'])

export const STATUS_COLUMNS = DEFAULT_BOARD_COLUMNS.map((col) => ({
  id: col.name === 'To Do' ? 'todo' : col.name === 'Doing' ? 'doing' : 'done',
  name: col.name,
  position: col.position,
}))

export function isDefaultStatusColumn(id) {
  return DEFAULT_STATUS_IDS.has(String(id))
}

export function stripBoardMark(description = '') {
  return String(description || '').replace(BOARD_MARK_RE, '')
}

export function applyBoardMark(description = '', columnName) {
  const body = stripBoardMark(description)
  return `<!--allwork-board:${columnName}-->${body ? `\n${body}` : ''}`
}

export function parseBoardMark(description = '') {
  const match = String(description || '').match(BOARD_MARK_RE)
  return match ? match[1] : null
}

export function taskBoardKey(task) {
  if (task?.column_id != null && task.column_id !== '') return task.column_id
  const marked = parseBoardMark(task?.description)
  if (marked) return marked
  return task?.status || 'todo'
}

export function statusPayloadForColumn(column, currentDescription = '') {
  if (isDefaultStatusColumn(column.id)) {
    return {
      status: String(column.id),
      description: stripBoardMark(currentDescription),
    }
  }
  return {
    status: 'todo',
    description: applyBoardMark(currentDescription, column.name || column.id),
  }
}

export function keysMatch(a, b) {
  return String(a) === String(b)
}

export async function detectBoardColumnsTable() {
  const { error } = await supabase.from('board_columns').select('id').limit(1)
  return !error
}

export async function ensureTeamMembership(userId) {
  const { data: mine } = await supabase
    .from('team_members')
    .select('team_id')
    .eq('user_id', userId)

  if (mine?.length) return mine

  const { data: assigned } = await supabase
    .from('tasks')
    .select('team_id')
    .eq('assignee_id', userId)

  const ids = [...new Set((assigned || []).map((row) => row.team_id).filter(Boolean))]
  if (!ids.length) return []

  await supabase.from('team_members').insert(
    ids.map((team_id) => ({ team_id, user_id: userId, role: 'member' }))
  )

  const { data: next } = await supabase
    .from('team_members')
    .select('team_id')
    .eq('user_id', userId)
  return next || []
}

export async function createTeamWithOwner(name, userId) {
  const { data, error } = await supabase.from('teams').insert([{ name }]).select().single()
  if (error) return { error }

  const { error: memberError } = await supabase
    .from('team_members')
    .insert([{ team_id: data.id, user_id: userId, role: 'owner' }])

  if (memberError && !String(memberError.message).toLowerCase().includes('duplicate')) {
    // Trigger may have already added the owner.
    if (!String(memberError.code || '').includes('23505')) {
      console.warn('team_members insert:', memberError.message)
    }
  }

  const hasColumns = await detectBoardColumnsTable()
  if (hasColumns) {
    const { data: existingCols } = await supabase
      .from('board_columns')
      .select('id')
      .eq('team_id', data.id)
      .limit(1)
    if (!existingCols?.length) {
      await supabase.from('board_columns').insert(
        DEFAULT_BOARD_COLUMNS.map((col) => ({ ...col, team_id: data.id }))
      )
    }
  }

  return { data, error: null }
}

export async function deleteTeam(teamId) {
  const id = Number(teamId)

  const { error: tasksError } = await supabase.from('tasks').delete().eq('team_id', id)
  if (tasksError) return { error: tasksError }

  if (await detectBoardColumnsTable()) {
    const { error: colsError } = await supabase.from('board_columns').delete().eq('team_id', id)
    if (colsError) return { error: colsError }
  }

  const { error: membersError } = await supabase.from('team_members').delete().eq('team_id', id)
  if (membersError) return { error: membersError }

  try {
    localStorage.removeItem(extraColumnsKey(teamId))
    localStorage.removeItem(labelsKey(teamId))
  } catch {
    // ignore storage errors
  }

  return supabase.from('teams').delete().eq('id', id)
}

export async function loadColumns(teamId, tasks = []) {
  const hasTable = await detectBoardColumnsTable()
  if (hasTable) {
    let { data, error } = await supabase
      .from('board_columns')
      .select('*')
      .eq('team_id', teamId)
      .order('position')

    if (!error && !data?.length) {
      const seed = DEFAULT_BOARD_COLUMNS.map((col) => ({ ...col, team_id: Number(teamId) }))
      const seeded = await supabase.from('board_columns').insert(seed).select()
      data = seeded.data || []
    }

    if (!error) return { mode: 'db', columns: data || [] }
  }

  let labels = {}
  try {
    labels = JSON.parse(localStorage.getItem(labelsKey(teamId)) || '{}')
  } catch {
    labels = {}
  }
  const known = new Map(STATUS_COLUMNS.map((col) => [String(col.id), {
    ...col,
    name: labels[col.id] || col.name,
  }]))
  for (const task of tasks) {
    const key = String(taskBoardKey(task))
    if (!known.has(key)) {
      known.set(key, { id: key, name: key, position: known.size })
    }
  }

  try {
    const extra = JSON.parse(localStorage.getItem(extraColumnsKey(teamId)) || '[]')
    extra.forEach((name, index) => {
      const id = String(name)
      if (!known.has(id)) {
        known.set(id, { id, name, position: 100 + index })
      }
    })
  } catch {
    // ignore broken local cache
  }

  return {
    mode: 'status',
    columns: [...known.values()].sort((a, b) => a.position - b.position),
  }
}

export async function addColumn(teamId, name, mode, existing) {
  if (mode === 'db') {
    const nextPos = (existing[existing.length - 1]?.position ?? -1) + 1
    return supabase
      .from('board_columns')
      .insert([{ team_id: Number(teamId), name, position: nextPos }])
      .select()
      .single()
  }

  const extras = JSON.parse(localStorage.getItem(extraColumnsKey(teamId)) || '[]')
  if (!extras.includes(name)) {
    extras.push(name)
    localStorage.setItem(extraColumnsKey(teamId), JSON.stringify(extras))
  }
  return { data: { id: name, name, position: existing.length }, error: null }
}

export async function renameColumn(column, name, mode, teamId, tasks = []) {
  if (mode === 'db') {
    return supabase.from('board_columns').update({ name }).eq('id', column.id)
  }

  const extras = JSON.parse(localStorage.getItem(extraColumnsKey(teamId)) || '[]')
  localStorage.setItem(
    extraColumnsKey(teamId),
    JSON.stringify(
      extras
        .map((item) => (item === column.name || item === String(column.id) ? name : item))
        .filter((item, index, arr) => arr.indexOf(item) === index)
    )
  )

  if (isDefaultStatusColumn(column.id)) {
    let labels = {}
    try {
      labels = JSON.parse(localStorage.getItem(labelsKey(teamId)) || '{}')
    } catch {
      labels = {}
    }
    labels[column.id] = name
    localStorage.setItem(labelsKey(teamId), JSON.stringify(labels))
    return { error: null }
  }

  const toUpdate = tasks.filter((task) => String(taskBoardKey(task)) === String(column.id))
  for (const task of toUpdate) {
    const { error } = await supabase
      .from('tasks')
      .update(statusPayloadForColumn({ id: name, name }, task.description))
      .eq('id', task.id)
    if (error) return { error }
  }
  return { error: null }
}

export async function moveTasksToColumn(taskIds, target, mode, tasks = []) {
  if (!taskIds.length) return { error: null }
  if (mode === 'db') {
    return supabase.from('tasks').update({ column_id: Number(target.id) }).in('id', taskIds)
  }
  const byId = new Map(tasks.map((task) => [task.id, task]))
  for (const id of taskIds) {
    const task = byId.get(id)
    const { error } = await supabase
      .from('tasks')
      .update(statusPayloadForColumn(target, task?.description))
      .eq('id', id)
    if (error) return { error }
  }
  return { error: null }
}

export async function deleteColumnRecord(column, mode, teamId) {
  if (mode === 'db') {
    return supabase.from('board_columns').delete().eq('id', column.id)
  }
  const extras = JSON.parse(localStorage.getItem(extraColumnsKey(teamId)) || '[]')
  localStorage.setItem(
    extraColumnsKey(teamId),
    JSON.stringify(extras.filter((item) => item !== column.name && item !== column.id))
  )
  return { error: null }
}

export async function insertTask({ title, teamId, userId, column, mode }) {
  const row = {
    title,
    team_id: teamId,
    assignee_id: userId,
    priority: 'medium',
    ...(mode === 'db'
      ? { status: 'todo', column_id: Number(column.id), created_by: userId }
      : statusPayloadForColumn(column, '')),
  }
  return supabase.from('tasks').insert([row]).select().single()
}

export async function moveTask(taskId, column, mode, task) {
  if (mode === 'db') {
    return supabase.from('tasks').update({ column_id: Number(column.id) }).eq('id', taskId)
  }
  return supabase.from('tasks').update(statusPayloadForColumn(column, task?.description)).eq('id', taskId)
}

export async function leaveTeam(teamId, userId) {
  const { error } = await supabase.rpc('leave_team', { p_team_id: Number(teamId) })
  if (!error) return { error: null }
  const missingFn = error.code === 'PGRST202' || /schema cache|Could not find the function/i.test(error.message)
  if (!missingFn) return { error }
  return supabase.from('team_members').delete().eq('team_id', teamId).eq('user_id', userId)
}

export async function inviteMember(teamId, email) {
  const { error } = await supabase.rpc('invite_member_by_email', {
    p_team_id: Number(teamId),
    p_email: email.trim(),
  })
  if (!error) return { error: null }
  const missingFn = error.code === 'PGRST202' || /schema cache|Could not find the function/i.test(error.message)
  if (!missingFn) return { error }

  const { data: profile, error: lookupError } = await supabase
    .from('profiles')
    .select('id')
    .eq('email', email.trim())
    .maybeSingle()

  if (lookupError) return { error: lookupError }
  if (!profile) return { error: { message: 'ไม่พบผู้ใช้นี้ในระบบ เพื่อนต้องสมัครสมาชิกก่อน' } }

  const { error: addError } = await supabase.from('team_members').insert([{
    team_id: Number(teamId),
    user_id: profile.id,
    role: 'member',
  }])
  return { error: addError }
}
