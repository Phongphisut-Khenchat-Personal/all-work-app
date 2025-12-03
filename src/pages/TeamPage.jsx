import { useEffect, useState, useMemo } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useAuth } from '@/context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { DndContext, useDraggable, useDroppable, DragOverlay, useSensor, useSensors, PointerSensor } from '@dnd-kit/core' // 🟢 เพิ่ม useSensor, useSensors, PointerSensor
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Plus, Users, LogOut, ArrowRight, Sparkles, Trash2, ShieldAlert, User, Settings } from 'lucide-react'
import { ModeToggle } from "@/components/mode-toggle"
import { toast } from "sonner"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { ProfileSettingsModal } from "@/components/ProfileSettingsModal"

// --- 1. ถังขยะ (Delete Zone) ---
function DeleteZoneTeam({ activeId }) {
  const { isOver, setNodeRef } = useDroppable({ id: 'team-trash-zone' })
  const isDragging = !!activeId
  const style = {
    color: isOver ? 'hsl(var(--destructive))' : 'hsl(var(--muted-foreground))',
    backgroundColor: isOver ? 'hsl(var(--destructive)/0.2)' : 'hsl(var(--background)/0.5)',
    boxShadow: isOver ? '0 0 25px hsl(var(--destructive)/1)' : '0 4px 12px rgba(0,0,0,0.2)',
    transform: isOver ? 'scale(1.2) rotate(5deg)' : (isDragging ? 'scale(1.1)' : 'scale(1)'),
  }
  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`fixed bottom-8 right-8 w-24 h-24 rounded-full transition-all duration-300 backdrop-blur-md z-50 flex flex-col items-center justify-center text-xs font-semibold border border-border/50
                ${isDragging ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}
            `}
    >
      <Trash2 size={32} className={`transition-colors mb-1 ${isOver ? 'text-destructive' : 'text-muted-foreground'}`} />
      {isOver ? "ปล่อยเพื่อลบ" : "ทิ้งทีม"}
    </div>
  )
}

// --- 2. การ์ดทีมที่ลากได้ (Team Card Draggable) ---
function TeamCardDraggable({ team, navigate, index }) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: `team-${team.id}`,
    data: { teamId: team.id, teamName: team.name }
  })

  const style = {
    opacity: transform ? 0.3 : 1, 
    animationDelay: `${index * 50}ms`
  }

  return (
    <div ref={setNodeRef} {...listeners} {...attributes} style={style} className="h-full">
      <Card
        onClick={() => navigate(`/board/${team.id}`)}
        className="group h-full bg-gradient-to-br from-card to-card/80 border-border/50 cursor-pointer hover:border-primary/40 hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 overflow-hidden relative animate-in fade-in slide-in-from-bottom-4"
      >
        {/* Decorative Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/0 to-primary/0 group-hover:from-primary/5 group-hover:to-primary/10 transition-all duration-300" />

        <CardContent className="p-6 relative z-10 flex flex-col h-full min-h-[160px]">
          <div className="flex items-start justify-between mb-6">
            <div className="p-3 bg-background/80 backdrop-blur-sm rounded-xl border border-border/50 text-muted-foreground group-hover:text-primary group-hover:border-primary/30 group-hover:shadow-lg transition-all duration-300">
              <Users size={24} />
            </div>
            <div className="p-2 rounded-lg bg-background/50 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all duration-300">
              <ArrowRight size={20} />
            </div>
          </div>

          <div className="mt-auto">
            <h3 className="text-xl font-bold mb-2 truncate group-hover:text-primary transition-colors">
              {team.name}
            </h3>
            <p className="text-sm text-muted-foreground">
              คลิกเพื่อเข้าสู่พื้นที่ทำงาน
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// --- Main Page ---
export default function TeamPage() {
  const [teams, setTeams] = useState([])
  const [newTeamName, setNewTeamName] = useState('')

  const [activeId, setActiveId] = useState(null)
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [teamToDelete, setTeamToDelete] = useState(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false)
  const [myProfile, setMyProfile] = useState(null)
  const { user, signOut } = useAuth()
  const navigate = useNavigate()

  // 🟢 เพิ่ม Sensors เพื่อแก้ปัญหา "คลิกไม่ได้"
  // ตั้งค่าให้ต้องลากเกิน 8px ถึงจะนับว่าเป็นการลาก (ถ้าขยับน้อยกว่านั้นคือกดคลิก)
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  )

  useEffect(() => {
    async function fetchMyProfile() {
      if (!user) return
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      setMyProfile(data)
    }
    fetchMyProfile()
  }, [user])

  const activeTeam = useMemo(() => {
    if (!activeId) return null
    const id = activeId.toString().replace('team-', '')
    return teams.find(t => t.id.toString() === id)
  }, [activeId, teams])

  useEffect(() => { fetchTeams() }, [])

  async function fetchTeams() {
    const { data } = await supabase.from('teams').select('*').order('id')
    setTeams(data || [])
  }

  async function handleCreateTeam() {
    if (!newTeamName.trim()) {
      toast.warning("กรุณาตั้งชื่อทีมก่อนครับ")
      return
    }

    const { error } = await supabase.from('teams').insert([{ name: newTeamName }])

    if (!error) {
      toast.success(`สร้างทีม "${newTeamName}" สำเร็จ!`)
      setNewTeamName('')
      fetchTeams()
    } else {
      toast.error("สร้างทีมไม่สำเร็จ: " + error.message)
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') handleCreateTeam()
  }

  async function handleDeleteTeam(teamId, teamName) {
    const { count, error: countError } = await supabase.from('tasks').select('*', { count: 'exact' }).eq('team_id', teamId)
    if (countError) { toast.error("Error: ตรวจสอบงานไม่สำเร็จ"); return }

    if (count > 0) {
      toast.error(`ลบทีม "${teamName}" ไม่ได้!`, { description: `มีงานค้างอยู่ ${count} งาน กรุณาลบงานในบอร์ดออกก่อน` })
      return
    }

    const { error } = await supabase.from('teams').delete().eq('id', teamId)
    if (!error) { toast.success(`ลบทีม "${teamName}" สำเร็จ!`); fetchTeams() }
    else { toast.error("ลบทีมไม่สำเร็จ: " + error.message) }
  }

  const handleConfirmDelete = async () => {
    setOpenDeleteDialog(false);
    if (teamToDelete) await handleDeleteTeam(teamToDelete.teamId, teamToDelete.teamName);
    setTeamToDelete(null);
  };

  const handleDragStart = (event) => setActiveId(event.active.id)

  const handleDragEnd = async (event) => {
    const { active, over } = event
    setActiveId(null)
    if (!over) return
    const teamId = active.data.current.teamId
    const teamName = active.data.current.teamName
    const targetId = over.id
    if (targetId === 'team-trash-zone') {
      setTeamToDelete({ teamId, teamName });
      setOpenDeleteDialog(true);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/20 text-foreground relative overflow-hidden transition-colors">
      
      {/* 🟢 ส่ง sensors เข้าไปใน DndContext */}
      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>

        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl" />
        </div>

        <DeleteZoneTeam activeId={activeId} />

        <div className="relative z-10 container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          {/* Header Section */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-12 pb-8 border-b border-border/50">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="bg-gradient-to-br from-primary to-primary/80 p-3 rounded-2xl shadow-lg">
                  <Users size={28} className="text-primary-foreground" />
                </div>
                <div>
                  <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                    All Work
                  </h1>
                </div>
              </div>
              <p className="text-muted-foreground text-base ml-1">
                จัดการและเลือกพื้นที่ทำงานของคุณ
              </p>
            </div>

            <div className="flex flex-col items-end gap-3 w-full sm:w-auto">
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <ModeToggle />

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="flex-1 sm:flex-none hover:bg-accent transition-colors gap-2 px-3">
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="bg-primary/20 text-primary text-[10px]">ME</AvatarFallback>
                      </Avatar>
                      <span className="hidden sm:inline">บัญชี</span>
                    </Button>
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
            </div>
          </div>

          {/* Create Team Card */}
          <Card className="bg-gradient-to-br from-card to-card/50 border-border/50 backdrop-blur-sm mb-10 shadow-xl hover:shadow-2xl transition-all duration-300">
            <CardContent className="p-6 sm:p-8">
              <div className="flex items-center gap-3 mb-4">
                <Sparkles size={20} className="text-primary" />
                <h2 className="text-xl font-semibold">สร้างทีมใหม่</h2>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <Input
                  placeholder="ตั้งชื่อทีมของคุณ... (เช่น ทีม Developer)"
                  value={newTeamName}
                  onChange={e => setNewTeamName(e.target.value)}
                  onKeyDown={handleKeyPress}
                  className="bg-background/50 h-12 text-base border-border/50 focus:border-primary transition-colors flex-1"
                />
                <Button
                  onClick={handleCreateTeam}
                  className="h-12 px-8 font-semibold shadow-lg hover:shadow-xl transition-all hover:scale-105 w-full sm:w-auto"
                >
                  <Plus size={20} className="mr-2" />
                  สร้างทีม
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Teams Grid */}
          <div className="mb-6">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <span>ทีมทั้งหมด</span>
              <span className="text-lg font-normal text-muted-foreground">({teams.length})</span>
            </h2>
          </div>

          {teams.length > 0 ? (
            <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {teams.map((team, index) => (
                <TeamCardDraggable
                  key={team.id}
                  team={team}
                  index={index}
                  navigate={navigate}
                />
              ))}
            </div>
          ) : (
            <Card className="border-2 border-dashed border-border/50 bg-accent/10 backdrop-blur-sm">
              <CardContent className="py-20 text-center">
                <div className="max-w-md mx-auto space-y-4">
                  <div className="w-20 h-20 mx-auto bg-accent/50 rounded-full flex items-center justify-center">
                    <Users size={40} className="text-muted-foreground" />
                  </div>
                  <h3 className="text-xl font-semibold text-muted-foreground">
                    ยังไม่มีทีมในระบบ
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    เริ่มต้นด้วยการสร้างทีมแรกของคุณด้านบน
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Drag Overlay */}
        <DragOverlay>
          {activeId ? (
            <Card className="w-[300px] bg-card border-2 border-primary shadow-2xl opacity-90 cursor-grabbing rotate-3">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 bg-background/80 rounded-xl border border-border/50 text-primary">
                    <Users size={24} />
                  </div>
                </div>
                <h3 className="text-xl font-bold truncate text-foreground">{activeTeam?.name}</h3>
                <p className="text-sm text-primary mt-1">กำลังย้าย/ลบ...</p>
              </CardContent>
            </Card>
          ) : null}
        </DragOverlay>

      </DndContext>

      {/* Dialog ยืนยันการลบ */}
      <AlertDialog open={openDeleteDialog} onOpenChange={setOpenDeleteDialog}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center text-lg text-destructive"><ShieldAlert className="mr-2 h-5 w-5" /> ยืนยันการลบ Workspace</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              คุณแน่ใจหรือไม่ว่าต้องการลบทีม <span className="font-bold text-foreground mx-1">"{teamToDelete?.teamName}"</span>?
              <br />การกระทำนี้จะลบงานทั้งหมดในทีมและไม่สามารถย้อนกลับได้
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-destructive hover:bg-destructive/90">ลบทิ้ง</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Profile Settings */}
      <ProfileSettingsModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
      />
    </div>
  )
}