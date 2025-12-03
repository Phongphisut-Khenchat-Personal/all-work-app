import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { UserPlus, Mail, Shield, User, X, Briefcase } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'
import { toast } from "sonner"

export function TeamSettingsModal({ teamId, isOpen, onClose }) {
    const [email, setEmail] = useState('')
    const [members, setMembers] = useState([])
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        if (isOpen && teamId) fetchMembers()
    }, [isOpen, teamId])

    async function fetchMembers() {
        const { data, error } = await supabase
            .from('team_members')
            .select(`
                *,
                profiles:user_id (email, display_name, position) 
            `)
            .eq('team_id', teamId)
        
        if (data) setMembers(data)
    }

    async function handleInvite(e) {
        e.preventDefault()
        setLoading(true)

        const { data: users, error: userError } = await supabase
            .from('profiles')
            .select('id')
            .eq('email', email)
            .single()

        if (!users) {
            toast.error("ไม่พบผู้ใช้นี้ในระบบ", { description: "เพื่อนต้องสมัครสมาชิก All Work ก่อนนะครับ" })
            setLoading(false)
            return
        }

        const { error: addError } = await supabase
            .from('team_members')
            .insert([{ team_id: teamId, user_id: users.id, role: 'member' }])

        if (!addError) {
            toast.success(`เพิ่ม ${email} เข้าทีมแล้ว!`)
            setEmail('')
            fetchMembers()
        } else {
            toast.error("เพิ่มไม่ได้: " + addError.message)
        }
        setLoading(false)
    }

    async function handleRemoveMember(userId) {
        if(!confirm("ต้องการลบสมาชิกคนนี้ออกจากทีม?")) return

        const { error } = await supabase
            .from('team_members')
            .delete()
            .eq('team_id', teamId)
            .eq('user_id', userId)

        if (!error) {
            toast.success("ลบสมาชิกเรียบร้อย")
            fetchMembers()
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px] bg-card text-card-foreground">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <UserPlus size={20} className="text-primary"/> จัดการสมาชิกในทีม
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleInvite} className="flex gap-2 mt-4">
                    <div className="relative flex-1">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input 
                            placeholder="ใส่อีเมลเพื่อน (ต้องสมัครสมาชิกแล้ว)" 
                            className="pl-9 bg-background" 
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                        />
                    </div>
                    <Button type="submit" disabled={loading}>
                        {loading ? "..." : "เชิญ"}
                    </Button>
                </form>

                <div className="mt-6">
                    <h4 className="text-sm font-semibold text-muted-foreground mb-3">สมาชิกปัจจุบัน ({members.length})</h4>
                    <ScrollArea className="h-[250px] pr-4">
                        <div className="space-y-3">
                            {members.map((m) => (
                                <div key={m.id} className="flex items-center justify-between p-3 bg-muted/40 rounded-xl border border-border/50">
                                    <div className="flex items-center gap-3">
                                        <Avatar className="h-10 w-10 border border-border shadow-sm">
                                            <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                                                {m.profiles?.display_name?.substring(0,2).toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <p className="text-sm font-bold text-foreground">
                                                {m.profiles?.display_name || 'Unknown'}
                                            </p>
                                            
                                            {/* แสดงตำแหน่ง (Position) ถ้ามี */}
                                            {m.profiles?.position && (
                                                <p className="text-[10px] text-primary flex items-center gap-1 mb-0.5">
                                                    <Briefcase size={10} /> {m.profiles.position}
                                                </p>
                                            )}

                                            <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                                                {m.role === 'owner' ? <Shield size={10} className="text-yellow-500" /> : <User size={10} />}
                                                {m.role} • {m.profiles?.email}
                                            </p>
                                        </div>
                                    </div>
                                    {m.role !== 'owner' && (
                                        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive h-8 w-8" onClick={() => handleRemoveMember(m.user_id)}>
                                            <X size={16} />
                                        </Button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </ScrollArea>
                </div>
            </DialogContent>
        </Dialog>
    )
}