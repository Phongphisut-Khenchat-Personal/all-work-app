import { useEffect, useState, useMemo } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useAuth } from '@/context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { DndContext, useDraggable, useDroppable, DragOverlay, useSensor, useSensors, PointerSensor } from '@dnd-kit/core'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Plus, Users, LogOut, ArrowRight, Sparkles, Trash2, ShieldAlert, User, Loader2, Shield } from 'lucide-react'
import { ModeToggle } from "@/components/mode-toggle"
import { toast } from "sonner"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { ProfileSettingsModal } from "@/components/ProfileSettingsModal"
import { getInitials } from '@/lib/utils'
import { Label } from "@/components/ui/label"

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

function TeamCardDraggable({ team, navigate, index }) {
  const canDelete = team.myRole === 'owner'
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: `team-${team.id}`,
    data: { teamId: team.id, teamName: team.name, canDelete },
    disabled: !canDelete,
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
        <div className="absolute inset-0 bg-gradient-to-br from-primary/0 to-primary/0 group-hover:from-primary/5 group-hover:to-primary/10 transition-all duration-300" />

        <CardContent className="p-6 relative z-10 flex flex-col h-full min-h-[160px]">
          <div className="flex items-start justify-between mb-6">
            <div className="p-3 bg-background/80 backdrop-blur-sm rounded-xl border border-border/50 text-muted-foreground group-hover:text-primary group-hover:border-primary/30 group-hover:shadow-lg transition-all duration-300">
              <Users size={24} />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase tracking-wide font-semibold text-muted-foreground bg-background/70 px-2 py-1 rounded-md border border-border/50">
                {canDelete ? 'เจ้าของ' : 'สมาชิก'}
              </span>
              <div className="p-2 rounded-lg bg-background/50 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all duration-300">
                <ArrowRight size={20} />
              </div>
            </div>
          </div>

          <div className="mt-auto">
            <h3 className="text-xl font-bold mb-2 truncate group-hover:text-primary transition-colors">
              {team.name}
            </h3>
            <p className="text-sm text-muted-foreground">
              {canDelete ? 'ลากไปถังขยะเพื่อลบทีม' : 'คลิกเพื่อเข้าสู่พื้นที่ทำงาน'}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function TeamPage() {
  const [teams, setTeams] = useState([])
  const [newTeamName, setNewTeamName] = useState('')
  const [loadingTeams, setLoadingTeams] = useState(true)
  const [creating, setCreating] = useState(false)

  const [activeId, setActiveId] = useState(null)
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false)
  const [teamToDelete, setTeamToDelete] = useState(null)
  const [confirmTeamName, setConfirmTeamName] = useState('')
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false)
  const { user, profile, signOut } = useAuth()
  const navigate = useNavigate()

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  )

  const activeTeam = useMemo(() => {
    if (!activeId) return null
    const id = activeId.toString().replace('team-', '')
    return teams.find(t => t.id.toString() === id)
  }, [activeId, teams])

  async function fetchTeams() {
    setLoadingTeams(true)
    const { data, error } = await supabase
      .from('team_members')
      .select('role, team:teams(*)')
      .eq('user_id', user.id)

    if (error) {
      toast.error('โหลดทีมไม่สำเร็จ: ' + error.message)
      setTeams([])
    } else {
      const next = (data || [])
        .filter(row => row.team)
        .map(row => ({ ...row.team, myRole: row.role }))
        .sort((a, b) => a.id - b.id)
      setTeams(next)
    }
    setLoadingTeams(false)
  }

  useEffect(() => {
    if (user) fetchTeams()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  async function handleCreateTeam() {
    if (!newTeamName.trim()) {
      toast.warning("กรุณาตั้งชื่อทีมก่อนครับ")
      return
    }

    setCreating(true)
    const { error } = await supabase.from('teams').insert([{ name: newTeamName.trim() }])
    setCreating(false)

    if (!error) {
      toast.success(`สร้างทีม "${newTeamName.trim()}" สำเร็จ!`)
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
    const { error } = await supabase.from('teams').delete().eq('id', teamId)
    if (!error) {
      toast.success(`ลบทีม "${teamName}" สำเร็จ!`)
      fetchTeams()
    } else {
      toast.error("ลบทีมไม่สำเร็จ: " + error.message)
    }
  }

  const handleConfirmDelete = async () => {
    setOpenDeleteDialog(false)
    if (teamToDelete) await handleDeleteTeam(teamToDelete.teamId, teamToDelete.teamName)
    setTeamToDelete(null)
  }

  const handleDragStart = (event) => setActiveId(event.active.id)

  const handleDragEnd = async (event) => {
    const { active, over } = event
    setActiveId(null)
    if (!over) return
    if (active.data.current?.canDelete === false) return
    const teamId = active.data.current.teamId
    const teamName = active.data.current.teamName
    if (over.id === 'team-trash-zone') {
      setTeamToDelete({ teamId, teamName })
      setConfirmTeamName('')
      setOpenDeleteDialog(true)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/20 text-foreground relative overflow-hidden transition-colors">
      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl" />
        </div>

        <DeleteZoneTeam activeId={activeId} />

        <div className="relative z-10 container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
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
                        <AvatarFallback className="bg-primary/20 text-primary text-[10px]">
                          {getInitials(profile?.display_name, user?.email)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="hidden sm:inline">บัญชี</span>
                    </Button>
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
            </div>
          </div>

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
                  disabled={creating}
                  className="h-12 px-8 font-semibold shadow-lg hover:shadow-xl transition-all hover:scale-105 w-full sm:w-auto"
                >
                  {creating ? <Loader2 size={20} className="mr-2 animate-spin" /> : <Plus size={20} className="mr-2" />}
                  สร้างทีม
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="mb-6">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <span>ทีมของฉัน</span>
              <span className="text-lg font-normal text-muted-foreground">({teams.length})</span>
            </h2>
          </div>

          {loadingTeams ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : teams.length > 0 ? (
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
                    ยังไม่มีทีม
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    สร้างทีมแรกของคุณด้านบน หรือให้เพื่อนเชิญเข้าทีม
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <DragOverlay>
          {activeId ? (
            <Card className="w-[300px] bg-card border-2 border-primary shadow-2xl opacity-90 cursor-grabbing rotate-3">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 bg-background/80 rounded-xl border border-border/50 text-primary">
                    <Users size={24} />
                  </div>
                  <Shield className="text-primary" size={18} />
                </div>
                <h3 className="text-xl font-bold truncate text-foreground">{activeTeam?.name}</h3>
                <p className="text-sm text-primary mt-1">กำลังย้าย/ลบ...</p>
              </CardContent>
            </Card>
          ) : null}
        </DragOverlay>
      </DndContext>

      <AlertDialog open={openDeleteDialog} onOpenChange={(open) => { setOpenDeleteDialog(open); if (!open) setConfirmTeamName('') }}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center text-lg text-destructive"><ShieldAlert className="mr-2 h-5 w-5" /> ลบทีมนี้?</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              จะลบทีม <span className="font-bold text-foreground mx-1">"{teamToDelete?.teamName}"</span> พร้อมสมาชิก กระดาน และงานทั้งหมด กู้คืนไม่ได้
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2 py-2">
            <Label htmlFor="confirm-team">พิมพ์ชื่อทีม <span className="font-semibold text-foreground">{teamToDelete?.teamName}</span> เพื่อยืนยัน</Label>
            <Input
              id="confirm-team"
              value={confirmTeamName}
              onChange={(e) => setConfirmTeamName(e.target.value)}
              placeholder={teamToDelete?.teamName}
              autoComplete="off"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
            <AlertDialogAction
              disabled={confirmTeamName.trim() !== (teamToDelete?.teamName || '')}
              onClick={handleConfirmDelete}
              className="bg-destructive hover:bg-destructive/90 disabled:opacity-50"
            >
              ลบทีม
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <ProfileSettingsModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
      />
    </div>
  )
}
