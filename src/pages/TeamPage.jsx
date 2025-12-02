import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useAuth } from '@/context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Plus, Users, LogOut, ArrowRight, Sparkles } from 'lucide-react'
import { ModeToggle } from "@/components/mode-toggle"
import { toast } from "sonner"

export default function TeamPage() {
  const [teams, setTeams] = useState([])
  const [newTeamName, setNewTeamName] = useState('')
  const { user, signOut } = useAuth()
  const navigate = useNavigate()

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
    if (e.key === 'Enter') {
      handleCreateTeam()
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/20 text-foreground relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl" />
      </div>

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
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <ModeToggle />
              <Button 
                variant="outline" 
                size="default"
                onClick={signOut}
                className="flex-1 sm:flex-none hover:bg-accent transition-colors"
              >
                <LogOut size={16} className="mr-2" />
                ออกจากระบบ
              </Button>
            </div>
            <span className="text-sm text-muted-foreground">
              {user?.email}
            </span>
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
                onKeyPress={handleKeyPress}
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
              <Card 
                key={team.id}
                onClick={() => navigate(`/board/${team.id}`)}
                className="group bg-gradient-to-br from-card to-card/80 border-border/50 cursor-pointer hover:border-primary/40 hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 overflow-hidden relative animate-in fade-in slide-in-from-bottom-4"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                {/* Decorative Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/0 to-primary/0 group-hover:from-primary/5 group-hover:to-primary/10 transition-all duration-300" />
                
                <CardContent className="p-6 relative z-10">
                  <div className="flex flex-col h-full min-h-[140px]">
                    {/* Icon and Arrow */}
                    <div className="flex items-start justify-between mb-6">
                      <div className="p-3 bg-background/80 backdrop-blur-sm rounded-xl border border-border/50 text-muted-foreground group-hover:text-primary group-hover:border-primary/30 group-hover:shadow-lg transition-all duration-300">
                        <Users size={24} />
                      </div>
                      <div className="p-2 rounded-lg bg-background/50 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all duration-300">
                        <ArrowRight size={20} />
                      </div>
                    </div>

                    {/* Team Info */}
                    <div className="mt-auto">
                      <h3 className="text-xl font-bold mb-2 truncate group-hover:text-primary transition-colors">
                        {team.name}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        คลิกเพื่อเข้าสู่พื้นที่ทำงาน
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
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
    </div>
  )
}