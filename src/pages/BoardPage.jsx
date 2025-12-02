import { useEffect, useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabaseClient'
import { useAuth } from '@/context/AuthContext'
import { DndContext, useDraggable, useDroppable, DragOverlay } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, GripVertical, ArrowLeft, Trash2, Users, Loader2 } from 'lucide-react'
import { ModeToggle } from "@/components/mode-toggle"
import { toast } from "sonner"

// --- 1. ถังขยะ (Interactive Delete Zone) ---
function DeleteZone({ activeId }) {
    const { isOver, setNodeRef } = useDroppable({ id: 'trash-zone' })
    const isDragging = !!activeId

    // ใช้สี destructive (แดง) ของระบบ เพื่อให้เข้ากับทุกธีม
    const baseClasses = "fixed bottom-8 right-8 w-20 h-20 rounded-full transition-all duration-300 backdrop-blur-md z-50 flex items-center justify-center border-2 shadow-xl"

    const style = {
        opacity: isDragging ? 1 : 0,
        pointerEvents: isDragging ? 'auto' : 'none',
        transform: isOver ? 'scale(1.2) rotate(10deg)' : (isDragging ? 'scale(1) rotate(0deg)' : 'scale(0.5)'),
        backgroundColor: isOver ? 'hsl(var(--destructive))' : 'hsl(var(--background))',
        borderColor: isOver ? 'hsl(var(--destructive))' : 'hsl(var(--destructive))',
        color: isOver ? 'hsl(var(--destructive-foreground))' : 'hsl(var(--destructive))',
    }

    return (
        <div ref={setNodeRef} style={style} className={baseClasses}>
            <Trash2 size={32} className="transition-transform duration-200" />
        </div>
    )
}

// --- 2. การ์ดที่กำลังลาก (Drag Overlay) ---
function DragCardContent({ title }) {
    return (
        <div className="bg-card p-4 rounded-xl border-2 border-primary shadow-2xl w-[320px] cursor-grabbing opacity-90 rotate-3">
            <div className="flex justify-between items-start">
                <span className="font-semibold text-sm text-card-foreground">{title}</span>
                <GripVertical size={18} className="text-primary" />
            </div>
        </div>
    )
}

// --- 3. การ์ดงานปกติ (Task Card) ---
function TaskCard({ task, onStatusChange }) {
    const { attributes, listeners, setNodeRef, transform } = useDraggable({
        id: `task-${task.id}`,
        data: { taskId: task.id, title: task.title }
    })

    const style = transform ? { transform: CSS.Translate.toString(transform) } : undefined

    // Status Badge Colors (ปรับให้เข้ากับธีม)
    const getStatusColor = (status) => {
        switch (status) {
            case 'doing': return 'bg-blue-500/10 text-blue-600 border-blue-200 dark:border-blue-900';
            case 'done': return 'bg-green-500/10 text-green-600 border-green-200 dark:border-green-900';
            default: return 'bg-zinc-500/10 text-zinc-600 border-zinc-200 dark:border-zinc-800';
        }
    }

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...listeners}
            {...attributes}
            className="group relative bg-card p-4 rounded-xl border border-border shadow-sm hover:shadow-md hover:border-primary/50 transition-all duration-200 touch-none cursor-grab active:cursor-grabbing mb-3"
        >
            <div className="flex justify-between items-start gap-3 mb-3">
                <span className={`font-medium text-sm leading-relaxed ${task.status === 'done' ? 'text-muted-foreground line-through decoration-border' : 'text-card-foreground'}`}>
                    {task.title}
                </span>
                <GripVertical size={16} className="text-muted-foreground/50 group-hover:text-primary transition-colors shrink-0" />
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-border/40">
                <select
                    className={`text-[10px] font-bold uppercase px-2 py-1 rounded border outline-none cursor-pointer hover:opacity-80 transition-opacity ${getStatusColor(task.status)}`}
                    value={task.status}
                    onChange={(e) => onStatusChange(task.id, e.target.value)}
                    onPointerDown={(e) => e.stopPropagation()}
                >
                    <option value="todo">To Do</option>
                    <option value="doing">Doing</option>
                    <option value="done">Done</option>
                </select>
                <span className="text-[10px] text-muted-foreground">
                    {new Date(task.created_at).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })}
                </span>
            </div>
        </div>
    )
}

// --- 4. คอลัมน์ของ User (User Column) ---
function UserColumn({ userProfile, tasks, onStatusChange }) {
    const { setNodeRef } = useDroppable({
        id: `user-${userProfile.id}`,
        data: { userId: userProfile.id }
    })

    return (
        <div ref={setNodeRef} className="flex flex-col h-full min-w-[320px] w-[320px] shrink-0">
            {/* Column Header */}
            <div className="flex items-center gap-3 p-4 mb-2 bg-card/50 backdrop-blur-sm rounded-xl border border-border/50 sticky top-0 z-10">
                <Avatar className="h-10 w-10 border border-border shadow-sm">
                    <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs">
                        {userProfile.display_name?.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-sm text-foreground truncate">{userProfile.display_name}</h3>
                    <Badge variant="secondary" className="text-[10px] px-1.5 h-5 font-normal text-muted-foreground mt-0.5">
                        {tasks.length} งาน
                    </Badge>
                </div>
            </div>

            {/* Tasks Area */}
            <div className="flex-1 p-2 rounded-xl bg-muted/20 border-2 border-transparent border-dashed transition-colors hover:border-primary/10 overflow-y-auto scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">
                {tasks.map(task => (

                    <div
                        key={task.id}
                        className="animate-in fade-in slide-in-from-bottom-2 duration-500" // <--- เพิ่มบรรทัดนี้
                    >
                        <TaskCard task={task} onStatusChange={onStatusChange} />
                    </div>

                ))}
                {tasks.length === 0 && (
                    <div className="h-32 flex flex-col items-center justify-center text-muted-foreground/40">
                        <Users size={32} className="mb-2" />
                        <p className="text-xs font-medium">ว่างเปล่า</p>
                    </div>
                )}
            </div>
        </div>
    )
}

// --- 5. Main Component: BoardPage ---
export default function BoardPage() {
    const { teamId } = useParams()
    const { user } = useAuth()
    const navigate = useNavigate()

    const [teamName, setTeamName] = useState('')
    const [profiles, setProfiles] = useState([])
    const [tasks, setTasks] = useState([])
    const [newTask, setNewTask] = useState('')
    const [activeId, setActiveId] = useState(null)
    const [isRealtime, setIsRealtime] = useState(false)

    // หาการ์ดที่กำลังลาก (เพื่อเอาไปแสดงใน Overlay)
    const activeTask = useMemo(() => {
        if (!activeId) return null
        const id = activeId.toString().replace('task-', '')
        return tasks.find(t => t.id.toString() === id)
    }, [activeId, tasks])

    // Load Data & Subscribe Realtime
    useEffect(() => {
        if (!teamId) return

        // 1. Initial Load
        fetchData()

        // 2. Realtime Subscription (สำคัญมาก!)
        const channel = supabase
            .channel('board-updates')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'tasks', filter: `team_id=eq.${teamId}` },
                () => {
                    fetchData() // โหลดใหม่เมื่อใครก็ตามแก้ไขข้อมูล
                    setIsRealtime(true)
                    setTimeout(() => setIsRealtime(false), 2000) // เอฟเฟกต์ไฟกระพริบ
                }
            )
            .subscribe()

        return () => { supabase.removeChannel(channel) }
    }, [teamId])

    async function fetchData() {
        // ดึงชื่อทีม
        const { data: team } = await supabase.from('teams').select('name').eq('id', teamId).single()
        if (team) setTeamName(team.name)
        else navigate('/')

        // ดึง users
        const { data: profilesData } = await supabase.from('profiles').select('*')
        setProfiles(profilesData || [])

        // ดึง tasks
        const { data: tasksData } = await supabase.from('tasks').select('*').eq('team_id', teamId).order('created_at', { ascending: false })
        setTasks(tasksData || [])
    }

    async function handleAddTask(e) {
        e.preventDefault()
        if (!newTask.trim()) {
            toast.warning("กรุณาพิมพ์ชื่องานก่อนครับ")
            return
        }

        // Optimistic UI: เพิ่มเข้าหน้าจอก่อน (เพื่อให้รู้สึกเร็ว)
        const tempId = Date.now()
        const optimisticTask = { id: tempId, title: newTask, status: 'todo', assignee_id: user.id, team_id: teamId, created_at: new Date().toISOString() }
        setTasks(prev => [optimisticTask, ...prev])
        setNewTask('')

        const { error } = await supabase.from('tasks').insert([{
            title: newTask,
            status: 'todo',
            assignee_id: user.id,
            team_id: teamId
        }])

        if (error) {
            setTasks(prev => prev.filter(t => t.id !== tempId)) // ถ้าพัง ให้เอาออก
            toast.error("เพิ่มงานไม่ได้: " + error.message)
        } else {
            toast.success("เพิ่มงานสำเร็จ!")
            fetchData() // โหลดของจริงทับ
        }
    }

    async function handleStatusChange(taskId, newStatus) {
        setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t))
        await supabase.from('tasks').update({ status: newStatus }).eq('id', taskId)
    }

    async function handleDeleteTask(taskId) {
        // ลบจากหน้าจอก่อน
        setTasks(prev => prev.filter(t => t.id !== taskId))

        const { error } = await supabase.from('tasks').delete().eq('id', taskId)
        if (!error) {
            toast.success("ลบงานเรียบร้อย", { description: "งานถูกส่งลงถังขยะแล้ว" })
        } else {
            toast.error("ลบไม่ได้: " + error.message)
            fetchData() // คืนค่าถ้าลบไม่สำเร็จ
        }
    }

    const handleDragStart = (event) => setActiveId(event.active.id)

    const handleDragEnd = async (event) => {
        const { active, over } = event
        setActiveId(null)

        if (!over) return

        const taskId = active.data.current.taskId
        const targetId = over.id

        // 1. ถ้าทิ้งลงถังขยะ
        if (targetId === 'trash-zone') {
            await handleDeleteTask(taskId)
            return
        }

        // 2. ถ้า Assign ให้คนอื่น
        const targetUserId = over.data.current?.userId
        if (taskId && targetUserId) {
            setTasks(prev => prev.map(t => t.id === taskId ? { ...t, assignee_id: targetUserId } : t))
            toast.info("มอบหมายงานใหม่", { description: "งานถูกโอนไปให้เพื่อนแล้ว" })
            await supabase.from('tasks').update({ assignee_id: targetUserId }).eq('id', taskId)
        }
    }

    return (
        <div className="h-screen bg-background text-foreground flex flex-col overflow-hidden font-sans transition-colors duration-300">

            {/* Header */}
            <header className="h-16 border-b border-border flex items-center justify-between px-6 bg-background/80 backdrop-blur-md sticky top-0 z-20">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => navigate('/')} className="text-muted-foreground hover:text-foreground">
                        <ArrowLeft size={20} />
                    </Button>
                    <div>
                        <h1 className="font-bold text-lg flex items-center gap-2">
                            {teamName || 'Loading...'}
                            {isRealtime && <span className="flex h-2 w-2 rounded-full bg-green-500 animate-ping" />}
                        </h1>
                        <p className="text-xs text-muted-foreground">Workspace</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <ModeToggle />
                    <div className="hidden md:block text-right mr-2">
                        <p className="text-xs font-medium">{user?.email}</p>
                        <p className="text-[10px] text-green-500">● Online</p>
                    </div>
                    <Avatar className="h-8 w-8 border border-border">
                        <AvatarFallback className="bg-primary/10 text-primary text-xs">ME</AvatarFallback>
                    </Avatar>
                </div>
            </header>

            {/* Drag & Drop Context */}
            <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
                <DeleteZone activeId={activeId} />

                <main className="flex-1 flex flex-col p-6 overflow-hidden">
                    {/* Input Area */}
                    <div className="max-w-2xl mx-auto w-full mb-8 flex gap-3">
                        <Input
                            value={newTask}
                            onChange={e => setNewTask(e.target.value)}
                            placeholder="พิมพ์งานใหม่ที่นี่... (Enter เพื่อเพิ่ม)"
                            className="h-12 text-base bg-card shadow-sm border-border/60 focus:border-primary"
                            onKeyDown={(e) => e.key === 'Enter' && handleAddTask(e)}
                        />
                        <Button onClick={handleAddTask} className="h-12 px-6 shadow-md">
                            <Plus size={20} className="mr-2" /> เพิ่มงาน
                        </Button>
                    </div>

                    {/* Columns */}
                    <div className="flex-1 flex gap-6 overflow-x-auto pb-4 px-2 items-start">
                        {profiles.map((profile) => (
                            <UserColumn
                                key={profile.id}
                                userProfile={profile}
                                tasks={tasks.filter(t => t.assignee_id === profile.id)}
                                onStatusChange={handleStatusChange}
                            />
                        ))}
                    </div>
                </main>

                <DragOverlay>
                    {activeId ? <DragCardContent title={activeTask?.title} /> : null}
                </DragOverlay>
            </DndContext>
        </div>
    )
}