import { useEffect, useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabaseClient'
import { useAuth } from '@/context/AuthContext'
import { DndContext, useDraggable, useDroppable, DragOverlay, useSensor, useSensors, PointerSensor } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Plus, GripVertical, ArrowLeft, Trash2, Users, Settings, Calendar as CalendarIcon, Search, LogOut, User, CheckCircle2 } from 'lucide-react'
import { ModeToggle } from "@/components/mode-toggle"
import { toast } from "sonner" 
import { TaskDetailModal } from "@/components/TaskDetailModal"
import { TeamSettingsModal } from "@/components/TeamSettingsModal"
import { ProfileSettingsModal } from "@/components/ProfileSettingsModal"

// --- 1. ถังขยะ (Interactive Delete Zone) ---
function DeleteZone({ activeId }) {
    const { isOver, setNodeRef } = useDroppable({ id: 'trash-zone' })
    const isDragging = !!activeId

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
function TaskCard({ task, onStatusChange, onClick }) {
    const { attributes, listeners, setNodeRef, transform } = useDraggable({ 
        id: `task-${task.id}`, 
        data: { taskId: task.id, title: task.title } 
    })
    
    const style = transform ? { transform: CSS.Translate.toString(transform) } : undefined
    
    const getStatusColor = (status) => {
        switch(status) {
            case 'doing': return 'bg-blue-500/10 text-blue-600 border-blue-200 dark:border-blue-900';
            case 'done': return 'bg-green-500/10 text-green-600 border-green-200 dark:border-green-900';
            default: return 'bg-zinc-500/10 text-zinc-600 border-zinc-200 dark:border-zinc-800';
        }
    }

    const priorityColors = {
        low: "bg-blue-500",
        medium: "bg-yellow-500",
        high: "bg-red-500"
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
                <span className={`font-medium text-sm leading-relaxed ${task.status === 'done' ? 'text-muted-foreground line-through decoration-border' : 'text-card-foreground'}`}>
                    {task.title}
                </span>
                <GripVertical size={16} className="text-muted-foreground/50 group-hover:text-primary transition-colors shrink-0" />
            </div>
            
            <div className="flex items-center justify-between pt-2 border-t border-border/40 pl-2">
                <div className="flex items-center gap-2">
                    {task.due_date && (
                        <span className={`text-[10px] flex items-center gap-1 ${new Date(task.due_date) < new Date() && task.status !== 'done' ? 'text-destructive font-bold' : 'text-muted-foreground'}`}>
                            <CalendarIcon size={10} />
                            {new Date(task.due_date).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })}
                        </span>
                    )}
                </div>

                <select 
                    className={`text-[10px] font-bold uppercase px-2 py-1 rounded border outline-none cursor-pointer hover:opacity-80 transition-opacity ${getStatusColor(task.status)}`}
                    value={task.status} 
                    onChange={(e) => onStatusChange(task.id, e.target.value)} 
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={(e) => e.stopPropagation()} 
                >
                    <option value="todo">To Do</option>
                    <option value="doing">Doing</option>
                    <option value="done">Done</option>
                </select>
            </div>
        </div>
    )
}

// --- 4. คอลัมน์ของ User (User Column) ---
function UserColumn({ userProfile, tasks, onStatusChange, onTaskClick }) {
    const { setNodeRef } = useDroppable({ 
        id: `user-${userProfile.id}`, 
        data: { userId: userProfile.id } 
    })
    
    return (
        <div ref={setNodeRef} className="flex flex-col h-full min-w-[320px] w-[320px] shrink-0">
            <div className="flex items-center gap-3 p-4 mb-2 bg-card/50 backdrop-blur-sm rounded-xl border border-border/50 sticky top-0 z-10">
                <Avatar className="h-10 w-10 border border-border shadow-sm">
                    <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs">
                        {userProfile.display_name?.substring(0,2).toUpperCase()}
                    </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-sm text-foreground truncate">{userProfile.display_name}</h3>
                    {userProfile.position && (
                        <p className="text-[10px] text-muted-foreground truncate flex items-center gap-1">
                            <CheckCircle2 size={10} className="text-green-500"/> {userProfile.position}
                        </p>
                    )}
                    <Badge variant="secondary" className="text-[10px] px-1.5 h-5 font-normal text-muted-foreground mt-1">
                        {tasks.length} งาน
                    </Badge>
                </div>
            </div>

            <div className="flex-1 p-2 rounded-xl bg-muted/20 border-2 border-transparent border-dashed transition-colors hover:border-primary/10 overflow-y-auto scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">
                {tasks.map(task => (
                    <div key={task.id} className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                        <TaskCard 
                            task={task} 
                            onStatusChange={onStatusChange} 
                            onClick={() => onTaskClick(task)} 
                        />
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
    const { user, signOut } = useAuth()
    const navigate = useNavigate()
    
    const [teamName, setTeamName] = useState('')
    const [profiles, setProfiles] = useState([])
    const [tasks, setTasks] = useState([])
    const [newTask, setNewTask] = useState('')
    const [searchQuery, setSearchQuery] = useState('')
    const [activeId, setActiveId] = useState(null)
    const [isRealtime, setIsRealtime] = useState(false)
    const [myProfile, setMyProfile] = useState(null) 

    // State สำหรับ Modals
    const [selectedTask, setSelectedTask] = useState(null)
    const [isTaskModalOpen, setIsTaskModalOpen] = useState(false)
    const [isTeamSettingsOpen, setIsTeamSettingsOpen] = useState(false)
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false) 

    // 🟢 2. เพิ่ม Sensors (ต้องลากเกิน 8px ถึงจะนับ)
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        })
    )

    const activeTask = useMemo(() => {
        if (!activeId) return null
        const id = activeId.toString().replace('task-', '')
        return tasks.find(t => t.id.toString() === id)
    }, [activeId, tasks])

    const filteredTasks = tasks.filter(task => 
        task.title.toLowerCase().includes(searchQuery.toLowerCase())
    )

    // ดึงข้อมูลโปรไฟล์ตัวเอง
    useEffect(() => {
        async function fetchMyProfile() {
            if (!user) return
            const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
            setMyProfile(data)
        }
        fetchMyProfile()
    }, [user])

    // Load Data & Subscribe Realtime
    useEffect(() => { 
        if (!teamId) return
        fetchData() 
        const channel = supabase.channel('board-updates')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks', filter: `team_id=eq.${teamId}` }, 
                () => { fetchData(); setIsRealtime(true); setTimeout(() => setIsRealtime(false), 2000) })
            .subscribe()
        return () => { supabase.removeChannel(channel) }
    }, [teamId])

    async function fetchData() {
        const { data: team } = await supabase.from('teams').select('name').eq('id', teamId).single()
        if (team) setTeamName(team.name)
        else navigate('/')

        // 1. ดึงสมาชิกในทีมจาก team_members
        const { data: members } = await supabase
            .from('team_members')
            .select(`profiles:user_id (*)`)
            .eq('team_id', teamId)
        
        let validProfiles = members?.map(m => m.profiles).filter(Boolean) || []

        // Auto-fix: ถ้าทีมไม่มีสมาชิกเลย ให้เพิ่มตัวเองเข้าไป
        if (validProfiles.length === 0 && user) {
             const { data: me } = await supabase.from('profiles').select('*').eq('id', user.id).single()
             if (me) {
                 validProfiles = [me]
                 await supabase.from('team_members').insert([{ team_id: teamId, user_id: user.id, role: 'owner' }])
             }
        }

        setProfiles(validProfiles)
        
        // 2. ดึง Tasks
        const { data: tasksData } = await supabase.from('tasks').select('*').eq('team_id', teamId).order('created_at', { ascending: false })
        setTasks(tasksData || [])
    }

    async function handleAddTask(e) {
        e.preventDefault()
        if (!newTask.trim()) {
            toast.warning("กรุณาพิมพ์ชื่องานก่อนครับ")
            return
        }
        
        const { data: profile } = await supabase.from('profiles').select('id').eq('id', user.id).single()
        if (!profile) {
            await supabase.from('profiles').insert([
                { id: user.id, email: user.email, display_name: user.email.split('@')[0] }
            ])
        }
        
        const tempId = Date.now()
        const optimisticTask = { id: tempId, title: newTask, status: 'todo', assignee_id: user.id, team_id: teamId, created_at: new Date().toISOString() }
        setTasks(prev => [optimisticTask, ...prev])
        setNewTask('')

        const { error } = await supabase.from('tasks').insert([{ title: newTask, status: 'todo', assignee_id: user.id, team_id: teamId }])
        if (error) {
            setTasks(prev => prev.filter(t => t.id !== tempId))
            toast.error("เพิ่มงานไม่ได้: " + error.message)
        } else {
            toast.success("เพิ่มงานสำเร็จ!")
            fetchData()
        }
    }

    async function handleStatusChange(taskId, newStatus) {
        setTasks(prev => prev.map(t => t.id === taskId ? {...t, status: newStatus} : t))
        await supabase.from('tasks').update({ status: newStatus }).eq('id', taskId)
    }

    async function handleDeleteTask(taskId) {
        setTasks(prev => prev.filter(t => t.id !== taskId))
        const { error } = await supabase.from('tasks').delete().eq('id', taskId)
        if (!error) {
            toast.success("ลบงานเรียบร้อย", { description: "งานถูกส่งลงถังขยะแล้ว" })
        } else {
            toast.error("ลบไม่ได้: " + error.message)
            fetchData()
        }
    }

    const handleDragStart = (event) => setActiveId(event.active.id)

    const handleDragEnd = async (event) => {
        const { active, over } = event
        setActiveId(null)
        if (!over) return

        const taskId = active.data.current.taskId
        const targetId = over.id
        
        if (targetId === 'trash-zone') {
            await handleDeleteTask(taskId)
            return
        }

        const targetUserId = over.data.current?.userId
        if (taskId && targetUserId) {
            setTasks(prev => prev.map(t => t.id === taskId ? {...t, assignee_id: targetUserId} : t))
            toast.info("มอบหมายงานใหม่")
            await supabase.from('tasks').update({ assignee_id: targetUserId }).eq('id', taskId)
        }
    }

    return (
        <div className="h-screen bg-background text-foreground flex flex-col overflow-hidden font-sans transition-colors duration-300">
            <header className="h-16 border-b border-border flex items-center justify-between px-6 bg-background/80 backdrop-blur-md sticky top-0 z-20">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => navigate('/')} className="text-muted-foreground hover:text-foreground">
                        <ArrowLeft size={20} />
                    </Button>
                    <div>
                        <h1 className="font-bold text-lg flex items-center gap-2">
                            {teamName || 'Loading...'}
                            {isRealtime && <span className="flex h-2 w-2 rounded-full bg-green-500 animate-ping"/>}
                        </h1>
                        <p className="text-xs text-muted-foreground">Workspace</p>
                    </div>
                </div>
                <div className="flex items-center gap-2 md:gap-3">
                    <div className="relative hidden md:block w-48 lg:w-64">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input 
                            placeholder="ค้นหางาน..." 
                            className="h-9 pl-9 bg-muted/50 border-transparent focus:bg-background transition-all"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <Button variant="outline" size="sm" onClick={() => setIsTeamSettingsOpen(true)} className="hidden md:flex gap-2">
                        <Settings size={16} /> <span className="hidden lg:inline">สมาชิก</span>
                    </Button>
                    <ModeToggle />
                    
                    {/* User Menu Dropdown */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Avatar className="h-8 w-8 border border-border cursor-pointer hover:scale-105 transition-transform">
                                <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">ME</AvatarFallback>
                            </Avatar>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>
                                บัญชีของฉัน ({myProfile?.display_name || user?.email})
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
            
            {/* 🟢 3. ส่ง sensors เข้าไปใน DndContext */}
            <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
                <DeleteZone activeId={activeId} /> 

                <main className="flex-1 flex flex-col p-6 overflow-hidden">
                    <div className="max-w-2xl mx-auto w-full mb-8 flex gap-3">
                        <Input 
                            value={newTask} 
                            onChange={e => setNewTask(e.target.value)} 
                            placeholder="พิมพ์งานใหม่ที่นี่... (Enter เพื่อเพิ่ม)" 
                            className="h-12 text-base bg-card shadow-sm border-border/60 focus:border-primary"
                            onKeyDown={(e) => e.key === 'Enter' && handleAddTask(e)}
                        />
                        <Button onClick={handleAddTask} className="h-12 px-6 shadow-md">
                            <Plus size={20} className="mr-2"/> เพิ่มงาน
                        </Button>
                    </div>

                    <div className="flex-1 flex gap-6 overflow-x-auto pb-4 px-2 items-start">
                        {profiles.map((profile) => (
                            <UserColumn 
                                key={profile.id} 
                                userProfile={profile} 
                                tasks={filteredTasks.filter(t => t.assignee_id === profile.id)} 
                                onStatusChange={handleStatusChange}
                                onTaskClick={(task) => { setSelectedTask(task); setIsTaskModalOpen(true) }} 
                            />
                        ))}
                    </div>
                </main>

                <DragOverlay>
                    {activeId ? <DragCardContent title={activeTask?.title} /> : null}
                </DragOverlay>
            </DndContext>

            <TaskDetailModal 
                task={selectedTask} 
                isOpen={isTaskModalOpen} 
                onClose={() => setIsTaskModalOpen(false)} 
                onUpdate={fetchData} 
            />
            
            <TeamSettingsModal
                teamId={teamId}
                isOpen={isTeamSettingsOpen}
                onClose={() => setIsTeamSettingsOpen(false)}
            />

            <ProfileSettingsModal
                isOpen={isProfileModalOpen}
                onClose={() => setIsProfileModalOpen(false)}
            />
        </div>
    )
}