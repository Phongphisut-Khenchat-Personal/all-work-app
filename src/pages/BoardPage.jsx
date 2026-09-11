import { useEffect, useState, useMemo, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabaseClient'
import { useAuth } from '@/context/AuthContext'
import { DndContext, useDraggable, useDroppable, DragOverlay, useSensor, useSensors, PointerSensor } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Plus, GripVertical, ArrowLeft, Trash2, Settings, Calendar as CalendarIcon, Search, LogOut, User, Loader2, MoreHorizontal, Pencil, Check } from 'lucide-react'
import { ModeToggle } from "@/components/mode-toggle"
import { toast } from "sonner"
import { TaskDetailModal } from "@/components/TaskDetailModal"
import { TeamSettingsModal } from "@/components/TeamSettingsModal"
import { ProfileSettingsModal } from "@/components/ProfileSettingsModal"
import { getInitials, DEFAULT_BOARD_COLUMNS } from '@/lib/utils'

function DeleteZone({ activeId }) {
    const { isOver, setNodeRef } = useDroppable({ id: 'trash-zone' })
    const isDragging = !!activeId
    const style = {
        opacity: isDragging ? 1 : 0,
        pointerEvents: isDragging ? 'auto' : 'none',
        transform: isOver ? 'scale(1.2) rotate(10deg)' : (isDragging ? 'scale(1) rotate(0deg)' : 'scale(0.5)'),
        backgroundColor: isOver ? 'hsl(var(--destructive))' : 'hsl(var(--background))',
        borderColor: 'hsl(var(--destructive))',
        color: isOver ? 'hsl(var(--destructive-foreground))' : 'hsl(var(--destructive))',
    }

    return (
        <div ref={setNodeRef} style={style} className="fixed bottom-8 right-8 w-20 h-20 rounded-full transition-all duration-300 backdrop-blur-md z-50 flex items-center justify-center border-2 shadow-xl">
            <Trash2 size={32} />
        </div>
    )
}

function TaskCard({ task, members, onClick }) {
    const { attributes, listeners, setNodeRef, transform } = useDraggable({
        id: `task-${task.id}`,
        data: { taskId: task.id, title: task.title, columnId: task.column_id },
    })
    const style = transform ? { transform: CSS.Translate.toString(transform) } : undefined
    const owner = members.find(m => m.id === (task.assignee_id || task.created_by))
    const priorityColors = {
        low: "bg-blue-500",
        medium: "bg-yellow-500",
        high: "bg-red-500",
    }

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...listeners}
            {...attributes}
            onClick={onClick}
            className="group relative bg-card p-4 rounded-xl border border-border shadow-sm hover:shadow-md hover:border-primary/50 transition-all duration-200 touch-none cursor-grab active:cursor-grabbing mb-3"
        >
            <div className={`absolute top-4 left-0 w-1 h-8 rounded-r-full ${priorityColors[task.priority || 'medium']}`} />
            <div className="flex justify-between items-start gap-3 mb-3 pl-2">
                <span className="font-medium text-sm leading-relaxed text-card-foreground">
                    {task.title}
                </span>
                <GripVertical size={16} className="text-muted-foreground/50 group-hover:text-primary transition-colors shrink-0" />
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-border/40 pl-2">
                <div className="flex items-center gap-2 min-w-0">
                    {task.due_date && (
                        <span className={`text-[10px] flex items-center gap-1 ${new Date(task.due_date) < new Date() ? 'text-destructive font-bold' : 'text-muted-foreground'}`}>
                            <CalendarIcon size={10} />
                            {new Date(task.due_date).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })}
                        </span>
                    )}
                    <span className="text-[10px] text-muted-foreground truncate">
                        {owner?.display_name || owner?.email || 'ทีม'}
                    </span>
                </div>
                <Avatar className="h-6 w-6 border border-border">
                    <AvatarFallback className="bg-primary/10 text-primary text-[9px] font-bold">
                        {owner ? getInitials(owner.display_name, owner.email) : '?'}
                    </AvatarFallback>
                </Avatar>
            </div>
        </div>
    )
}

function BoardColumn({ column, tasks, members, onTaskClick, onAddTask, onRename, onAskDelete, adding }) {
    const { setNodeRef, isOver } = useDroppable({
        id: `column-${column.id}`,
        data: { columnId: column.id },
    })
    const [draft, setDraft] = useState('')
    const [editing, setEditing] = useState(false)
    const [name, setName] = useState(column.name)

    const startEdit = () => {
        setName(column.name)
        setEditing(true)
    }

    const saveName = () => {
        const next = name.trim()
        setEditing(false)
        if (!next || next === column.name) {
            setName(column.name)
            return
        }
        onRename(column.id, next)
    }

    const submitTask = (e) => {
        e.preventDefault()
        if (!draft.trim()) return
        onAddTask(column.id, draft.trim())
        setDraft('')
    }

    return (
        <div className="flex flex-col h-full min-w-[280px] w-[320px] max-w-full shrink-0">
            <div className="flex items-center gap-2 p-3 mb-2 bg-card/50 backdrop-blur-sm rounded-xl border border-border/50">
                {editing ? (
                    <div className="flex items-center gap-1 flex-1 min-w-0">
                        <Input
                            autoFocus
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') saveName()
                                if (e.key === 'Escape') {
                                    setName(column.name)
                                    setEditing(false)
                                }
                            }}
                            className="h-8 text-sm"
                        />
                        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={saveName}>
                            <Check size={14} />
                        </Button>
                    </div>
                ) : (
                    <button type="button" className="flex-1 text-left min-w-0" onDoubleClick={startEdit}>
                        <h3 className="font-bold text-sm text-foreground truncate">{column.name}</h3>
                        <p className="text-[10px] text-muted-foreground">ดับเบิลคลิกเพื่อเปลี่ยนชื่อ</p>
                    </button>
                )}
                <Badge variant="secondary" className="text-[10px] px-1.5 h-5 font-normal text-muted-foreground">
                    {tasks.length}
                </Badge>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                            <MoreHorizontal size={16} />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={startEdit}>
                            <Pencil className="mr-2 h-4 w-4" /> เปลี่ยนชื่อกระดาน
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => onAskDelete(column)}>
                            <Trash2 className="mr-2 h-4 w-4" /> ลบกระดาน...
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            <div
                ref={setNodeRef}
                className={`flex-1 p-2 rounded-xl bg-muted/20 border-2 border-dashed transition-colors overflow-y-auto min-h-[160px] ${isOver ? 'border-primary/40 bg-primary/5' : 'border-transparent'}`}
            >
                {tasks.map(task => (
                    <TaskCard
                        key={task.id}
                        task={task}
                        members={members}
                        onClick={() => onTaskClick(task)}
                    />
                ))}
                {tasks.length === 0 && (
                    <div className="h-24 flex items-center justify-center text-muted-foreground/40 text-xs">
                        ยังไม่มีงาน — พิมพ์ด้านล่างหรือลากมาที่นี่
                    </div>
                )}
            </div>

            <form onSubmit={submitTask} className="mt-2 flex gap-2">
                <Input
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    placeholder="งานของฉัน..."
                    className="h-9 text-sm bg-card"
                />
                <Button type="submit" size="sm" className="h-9" disabled={adding || !draft.trim()}>
                    <Plus size={16} />
                </Button>
            </form>
        </div>
    )
}

export default function BoardPage() {
    const { teamId } = useParams()
    const { user, profile, signOut } = useAuth()
    const navigate = useNavigate()

    const [teamName, setTeamName] = useState('')
    const [myRole, setMyRole] = useState(null)
    const [profiles, setProfiles] = useState([])
    const [columns, setColumns] = useState([])
    const [tasks, setTasks] = useState([])
    const [searchQuery, setSearchQuery] = useState('')
    const [assigneeFilter, setAssigneeFilter] = useState('all')
    const [showMobileSearch, setShowMobileSearch] = useState(false)
    const [activeId, setActiveId] = useState(null)
    const [isRealtime, setIsRealtime] = useState(false)
    const [accessState, setAccessState] = useState('loading')
    const [adding, setAdding] = useState(false)
    const [newColumnName, setNewColumnName] = useState('')
    const [addingColumn, setAddingColumn] = useState(false)

    const [selectedTask, setSelectedTask] = useState(null)
    const [isTaskModalOpen, setIsTaskModalOpen] = useState(false)
    const [isTeamSettingsOpen, setIsTeamSettingsOpen] = useState(false)
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false)
    const [taskToDelete, setTaskToDelete] = useState(null)
    const [columnToDelete, setColumnToDelete] = useState(null)
    const [moveToColumnId, setMoveToColumnId] = useState('')
    const [confirmColumnName, setConfirmColumnName] = useState('')

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: { distance: 8 },
        })
    )

    const activeTask = useMemo(() => {
        if (!activeId) return null
        const id = activeId.toString().replace('task-', '')
        return tasks.find(t => t.id.toString() === id)
    }, [activeId, tasks])

    const filteredTasks = tasks.filter(task => {
        const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase())
        const matchesAssignee =
            assigneeFilter === 'all' ||
            (assigneeFilter === 'unassigned' && !task.assignee_id) ||
            task.assignee_id === assigneeFilter
        return matchesSearch && matchesAssignee
    })

    const otherColumns = columns.filter(c => c.id !== columnToDelete?.id)
    const canConfirmDeleteColumn =
        !!columnToDelete &&
        confirmColumnName.trim() === columnToDelete.name.trim() &&
        (columnToDelete.taskCount === 0 || !!moveToColumnId)

    const fetchData = useCallback(async () => {
        const { data: membership, error: memberError } = await supabase
            .from('team_members')
            .select('role')
            .eq('team_id', teamId)
            .eq('user_id', user.id)
            .maybeSingle()

        if (memberError || !membership) {
            setAccessState('denied')
            toast.error('คุณไม่ใช่สมาชิกของทีมนี้')
            navigate('/')
            return
        }

        setMyRole(membership.role)

        const { data: team, error: teamError } = await supabase
            .from('teams')
            .select('name')
            .eq('id', teamId)
            .maybeSingle()

        if (teamError || !team) {
            setAccessState('denied')
            navigate('/')
            return
        }
        setTeamName(team.name)

        const { data: members, error: membersError } = await supabase
            .from('team_members')
            .select('role, profiles:user_id (*)')
            .eq('team_id', teamId)

        if (membersError) {
            toast.error('โหลดสมาชิกไม่สำเร็จ: ' + membersError.message)
        }
        setProfiles(members?.map(m => m.profiles).filter(Boolean) || [])

        let { data: columnData, error: columnError } = await supabase
            .from('board_columns')
            .select('*')
            .eq('team_id', teamId)
            .order('position')

        if (columnError) {
            toast.error('โหลดกระดานไม่สำเร็จ: ' + columnError.message, {
                description: 'ลองรันไฟล์ supabase/schema.sql ใน SQL Editor',
            })
            setColumns([])
        } else if (!columnData?.length) {
            const seed = DEFAULT_BOARD_COLUMNS.map(col => ({ ...col, team_id: Number(teamId) }))
            const { data: seeded, error: seedError } = await supabase.from('board_columns').insert(seed).select()
            if (seedError) {
                toast.error('สร้างกระดานเริ่มต้นไม่สำเร็จ: ' + seedError.message)
                columnData = []
            } else {
                columnData = seeded
            }
        }
        setColumns(columnData || [])

        const { data: tasksData, error: tasksError } = await supabase
            .from('tasks')
            .select('*')
            .eq('team_id', teamId)
            .order('created_at', { ascending: false })

        if (tasksError) {
            toast.error('โหลดงานไม่สำเร็จ: ' + tasksError.message)
            setTasks([])
        } else {
            setTasks(tasksData || [])
        }

        setAccessState('ok')
    }, [teamId, user.id, navigate])

    useEffect(() => {
        if (!teamId || !user) return
        // eslint-disable-next-line react-hooks/set-state-in-effect -- load board data when the team changes
        fetchData()
        const channel = supabase
            .channel(`board-updates-${teamId}`)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks', filter: `team_id=eq.${teamId}` },
                () => { fetchData(); setIsRealtime(true); setTimeout(() => setIsRealtime(false), 2000) })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'team_members', filter: `team_id=eq.${teamId}` },
                () => { fetchData() })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'board_columns', filter: `team_id=eq.${teamId}` },
                () => { fetchData() })
            .subscribe()
        return () => { supabase.removeChannel(channel) }
    }, [teamId, user, fetchData])

    async function handleAddTask(columnId, title) {
        setAdding(true)
        const { data, error } = await supabase
            .from('tasks')
            .insert([{
                title,
                column_id: columnId,
                assignee_id: user.id,
                created_by: user.id,
                team_id: teamId,
                priority: 'medium',
                status: 'todo',
            }])
            .select()
            .single()
        setAdding(false)

        if (error) {
            toast.error("เพิ่มงานไม่ได้: " + error.message)
        } else {
            setTasks(prev => [data, ...prev.filter(t => t.id !== data.id)])
            toast.success("เพิ่มงานสำเร็จ!")
        }
    }

    async function handleMoveTask(taskId, columnId) {
        const previous = tasks.find(t => t.id === taskId)
        setTasks(prev => prev.map(t => t.id === taskId ? { ...t, column_id: columnId } : t))
        const { error } = await supabase.from('tasks').update({ column_id: columnId }).eq('id', taskId)
        if (error) {
            setTasks(prev => prev.map(t => t.id === taskId ? previous : t))
            toast.error("ย้ายงานไม่สำเร็จ: " + error.message)
        }
    }

    async function handleDeleteTask(taskId) {
        const previous = tasks
        setTasks(prev => prev.filter(t => t.id !== taskId))
        const { error } = await supabase.from('tasks').delete().eq('id', taskId)
        if (!error) {
            toast.success("ลบงานเรียบร้อย")
        } else {
            toast.error("ลบไม่ได้: " + error.message)
            setTasks(previous)
        }
    }

    async function handleRenameColumn(columnId, name) {
        const previous = columns
        setColumns(prev => prev.map(c => c.id === columnId ? { ...c, name } : c))
        const { error } = await supabase.from('board_columns').update({ name }).eq('id', columnId)
        if (error) {
            setColumns(previous)
            toast.error("เปลี่ยนชื่อไม่สำเร็จ: " + error.message)
        }
    }

    async function handleAddColumn(e) {
        e.preventDefault()
        const name = newColumnName.trim()
        if (!name) return
        setAddingColumn(true)
        const nextPos = (columns[columns.length - 1]?.position ?? -1) + 1
        const { data, error } = await supabase
            .from('board_columns')
            .insert([{ team_id: Number(teamId), name, position: nextPos }])
            .select()
            .single()
        setAddingColumn(false)
        if (error) {
            toast.error("เพิ่มกระดานไม่สำเร็จ: " + error.message)
            return
        }
        setColumns(prev => [...prev, data])
        setNewColumnName('')
        toast.success(`เพิ่มกระดาน “${name}” แล้ว`)
    }

    async function handleDeleteColumn() {
        if (!canConfirmDeleteColumn) return
        const targetId = columnToDelete.id
        const taskIds = tasks.filter(t => t.column_id === targetId).map(t => t.id)

        if (taskIds.length && moveToColumnId) {
            const { error: moveError } = await supabase
                .from('tasks')
                .update({ column_id: Number(moveToColumnId) })
                .in('id', taskIds)
            if (moveError) {
                toast.error("ย้ายงานก่อนลบไม่สำเร็จ: " + moveError.message)
                return
            }
        }

        const { error } = await supabase.from('board_columns').delete().eq('id', targetId)
        if (error) {
            toast.error("ลบกระดานไม่สำเร็จ: " + error.message)
            return
        }
        toast.success(`ลบกระดาน “${columnToDelete.name}” แล้ว`)
        setColumnToDelete(null)
        setConfirmColumnName('')
        setMoveToColumnId('')
        fetchData()
    }

    const handleDragStart = (event) => setActiveId(event.active.id)

    const handleDragEnd = async (event) => {
        const { active, over } = event
        setActiveId(null)
        if (!over) return

        const taskId = active.data.current.taskId
        if (over.id === 'trash-zone') {
            setTaskToDelete(taskId)
            return
        }

        const columnId = over.data.current?.columnId
        const current = tasks.find(t => t.id === taskId)
        if (taskId && columnId && current && current.column_id !== columnId) {
            await handleMoveTask(taskId, columnId)
        }
    }

    const handleSettingsChanged = (action) => {
        if (action === 'left') {
            navigate('/')
            return
        }
        fetchData()
    }

    const taskPendingDelete = tasks.find(t => t.id === taskToDelete)
    const taskPendingOwner = profiles.find(p => p.id === (taskPendingDelete?.assignee_id || taskPendingDelete?.created_by))

    if (accessState === 'loading') {
        return (
            <div className="h-screen flex items-center justify-center bg-background">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }

    return (
        <div className="h-screen bg-background text-foreground flex flex-col overflow-hidden font-sans transition-colors duration-300">
            <header className="h-16 border-b border-border flex items-center justify-between px-3 sm:px-6 bg-background/80 backdrop-blur-md sticky top-0 z-20 gap-2">
                <div className="flex items-center gap-2 sm:gap-4 min-w-0">
                    <Button variant="ghost" size="icon" onClick={() => navigate('/')} className="text-muted-foreground hover:text-foreground shrink-0">
                        <ArrowLeft size={20} />
                    </Button>
                    <div className="min-w-0">
                        <h1 className="font-bold text-base sm:text-lg flex items-center gap-2 truncate">
                            {teamName || 'Loading...'}
                            {isRealtime && <span className="flex h-2 w-2 rounded-full bg-green-500 animate-ping shrink-0" />}
                        </h1>
                        <p className="text-xs text-muted-foreground truncate">บอร์ดงานทีม · {myRole === 'owner' ? 'เจ้าของทีม' : 'สมาชิก'}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <div className={`relative ${showMobileSearch ? 'block' : 'hidden'} md:block w-40 sm:w-48 lg:w-64`}>
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="ค้นหางาน..."
                            className="h-9 pl-9 bg-muted/50 border-transparent focus:bg-background transition-all"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setShowMobileSearch(v => !v)}>
                        <Search size={16} />
                    </Button>
                    <div className="hidden sm:block w-36">
                        <Select value={assigneeFilter} onValueChange={setAssigneeFilter}>
                            <SelectTrigger className="h-9 bg-muted/50 border-transparent">
                                <SelectValue placeholder="ผู้รับผิดชอบ" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">ทุกคน</SelectItem>
                                <SelectItem value="unassigned">ยังไม่มอบหมาย</SelectItem>
                                {profiles.map(p => (
                                    <SelectItem key={p.id} value={p.id}>{p.display_name || p.email}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <Button variant="outline" size="icon" onClick={() => setIsTeamSettingsOpen(true)} className="shrink-0" title="สมาชิกในทีม">
                        <Settings size={16} />
                    </Button>
                    <ModeToggle />
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Avatar className="h-8 w-8 border border-border cursor-pointer hover:scale-105 transition-transform">
                                <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                                    {getInitials(profile?.display_name, user?.email)}
                                </AvatarFallback>
                            </Avatar>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>
                                บัญชีของฉัน ({profile?.display_name || user?.email})
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => setIsProfileModalOpen(true)}>
                                <User className="mr-2 h-4 w-4" /> ข้อมูลส่วนตัว
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={signOut} className="text-destructive focus:text-destructive">
                                <LogOut className="mr-2 h-4 w-4" /> ออกจากระบบ
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </header>

            <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
                <DeleteZone activeId={activeId} />

                <main className="flex-1 flex flex-col p-4 sm:p-6 overflow-hidden">
                    <div className="sm:hidden mb-4">
                        <Select value={assigneeFilter} onValueChange={setAssigneeFilter}>
                            <SelectTrigger>
                                <SelectValue placeholder="กรองผู้รับผิดชอบ" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">ทุกคน</SelectItem>
                                <SelectItem value="unassigned">ยังไม่มอบหมาย</SelectItem>
                                {profiles.map(p => (
                                    <SelectItem key={p.id} value={p.id}>{p.display_name || p.email}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex-1 flex gap-4 sm:gap-6 overflow-x-auto pb-4 px-1 items-stretch">
                        {columns.map((column) => (
                            <BoardColumn
                                key={column.id}
                                column={column}
                                members={profiles}
                                adding={adding}
                                tasks={filteredTasks.filter(t => t.column_id === column.id)}
                                onTaskClick={(task) => { setSelectedTask(task); setIsTaskModalOpen(true) }}
                                onAddTask={handleAddTask}
                                onRename={handleRenameColumn}
                                onAskDelete={(col) => {
                                    if (columns.length <= 1) {
                                        toast.error('ต้องเหลืออย่างน้อย 1 กระดาน')
                                        return
                                    }
                                    const taskCount = tasks.filter(t => t.column_id === col.id).length
                                    setColumnToDelete({ ...col, taskCount })
                                    setConfirmColumnName('')
                                    setMoveToColumnId(String(columns.find(c => c.id !== col.id)?.id || ''))
                                }}
                            />
                        ))}

                        <form onSubmit={handleAddColumn} className="min-w-[260px] w-[280px] shrink-0 h-fit p-4 rounded-xl border-2 border-dashed border-border/70 bg-muted/10 space-y-3">
                            <p className="text-sm font-semibold">เพิ่มกระดาน</p>
                            <p className="text-xs text-muted-foreground">เช่น Review, Blocked หรือรอทดสอบ</p>
                            <Input
                                value={newColumnName}
                                onChange={(e) => setNewColumnName(e.target.value)}
                                placeholder="ชื่อกระดานใหม่"
                                className="bg-card"
                            />
                            <Button type="submit" variant="outline" className="w-full" disabled={addingColumn || !newColumnName.trim()}>
                                {addingColumn ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                                เพิ่มกระดาน
                            </Button>
                        </form>
                    </div>
                </main>

                <DragOverlay>
                    {activeId ? (
                        <div className="bg-card p-4 rounded-xl border-2 border-primary shadow-2xl w-[320px] cursor-grabbing opacity-90 rotate-3">
                            <span className="font-semibold text-sm">{activeTask?.title}</span>
                        </div>
                    ) : null}
                </DragOverlay>
            </DndContext>

            <AlertDialog open={taskToDelete != null} onOpenChange={(open) => !open && setTaskToDelete(null)}>
                <AlertDialogContent className="bg-card border-border">
                    <AlertDialogHeader>
                        <AlertDialogTitle>ลบงานนี้?</AlertDialogTitle>
                        <AlertDialogDescription>
                            จะลบ <span className="font-semibold text-foreground">“{taskPendingDelete?.title}”</span>
                            {taskPendingOwner ? ` ของ ${taskPendingOwner.display_name || taskPendingOwner.email}` : ''} ถาวร เพื่อนช่วยลบได้ถ้าเจ้าของลืม
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>ไม่ลบ</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-destructive hover:bg-destructive/90"
                            onClick={() => {
                                handleDeleteTask(taskToDelete)
                                setTaskToDelete(null)
                            }}
                        >
                            ลบงาน
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <AlertDialog open={!!columnToDelete} onOpenChange={(open) => { if (!open) { setColumnToDelete(null); setConfirmColumnName('') } }}>
                <AlertDialogContent className="bg-card border-border">
                    <AlertDialogHeader>
                        <AlertDialogTitle>ลบกระดาน “{columnToDelete?.name}”?</AlertDialogTitle>
                        <AlertDialogDescription>
                            กู้คืนไม่ได้ {columnToDelete?.taskCount ? `มีงาน ${columnToDelete.taskCount} รายการ ต้องย้ายไปกระดานอื่นก่อน` : 'กระดานนี้ว่างอยู่'}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    {columnToDelete?.taskCount > 0 && (
                        <div className="space-y-2">
                            <Label>ย้ายงานไปที่</Label>
                            <Select value={moveToColumnId} onValueChange={setMoveToColumnId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="เลือกกระดาน" />
                                </SelectTrigger>
                                <SelectContent>
                                    {otherColumns.map(col => (
                                        <SelectItem key={col.id} value={String(col.id)}>{col.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}
                    <div className="space-y-2 py-2">
                        <Label htmlFor="confirm-column">พิมพ์ชื่อกระดาน <span className="font-semibold text-foreground">{columnToDelete?.name}</span> เพื่อยืนยัน</Label>
                        <Input
                            id="confirm-column"
                            value={confirmColumnName}
                            onChange={(e) => setConfirmColumnName(e.target.value)}
                            placeholder={columnToDelete?.name}
                            autoComplete="off"
                        />
                    </div>
                    <AlertDialogFooter>
                        <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
                        <AlertDialogAction
                            disabled={!canConfirmDeleteColumn}
                            onClick={handleDeleteColumn}
                            className="bg-destructive hover:bg-destructive/90 disabled:opacity-50"
                        >
                            ลบกระดาน
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <TaskDetailModal
                task={selectedTask}
                isOpen={isTaskModalOpen}
                onClose={() => setIsTaskModalOpen(false)}
                onUpdate={fetchData}
                members={profiles}
                columns={columns}
            />

            <TeamSettingsModal
                teamId={teamId}
                isOpen={isTeamSettingsOpen}
                onClose={() => setIsTeamSettingsOpen(false)}
                isOwner={myRole === 'owner'}
                currentUserId={user.id}
                onChanged={handleSettingsChanged}
            />

            <ProfileSettingsModal
                isOpen={isProfileModalOpen}
                onClose={() => setIsProfileModalOpen(false)}
            />
        </div>
    )
}
