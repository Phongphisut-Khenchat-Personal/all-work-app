import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { UserPlus, Mail, Shield, User, Briefcase, LogOut, MoreHorizontal, UserMinus } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'
import { toast } from "sonner"
import { getInitials } from '@/lib/utils'
import { inviteMember, leaveTeam } from '@/lib/boardApi'

export function TeamSettingsModal({ teamId, isOpen, onClose, isOwner, currentUserId, onChanged }) {
    const [email, setEmail] = useState('')
    const [members, setMembers] = useState([])
    const [loading, setLoading] = useState(false)
    const [memberToRemove, setMemberToRemove] = useState(null)
    const [confirmName, setConfirmName] = useState('')
    const [leaveOpen, setLeaveOpen] = useState(false)
    const [leaveConfirm, setLeaveConfirm] = useState('')

    async function fetchMembers() {
        const { data, error } = await supabase
            .from('team_members')
            .select(`
                *,
                profiles:user_id (email, display_name, position)
            `)
            .eq('team_id', teamId)

        if (error) {
            toast.error('โหลดสมาชิกไม่สำเร็จ: ' + error.message)
            return
        }
        if (data) setMembers(data)
    }

    useEffect(() => {
        if (isOpen && teamId) fetchMembers()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, teamId])

    async function handleInvite(e) {
        e.preventDefault()
        if (!email.trim()) return
        setLoading(true)

        const { error } = await inviteMember(teamId, email.trim())

        if (!error) {
            toast.success(`เพิ่ม ${email} เข้าทีมแล้ว!`)
            setEmail('')
            await fetchMembers()
            onChanged?.()
        } else {
            toast.error("เพิ่มไม่ได้: " + error.message)
        }
        setLoading(false)
    }

    const removeLabel = memberToRemove?.profiles?.display_name || memberToRemove?.profiles?.email || ''
    const canConfirmRemove = confirmName.trim() === removeLabel.trim() && removeLabel.length > 0

    async function handleRemoveMember() {
        if (!memberToRemove || !canConfirmRemove) return
        const { error } = await supabase
            .from('team_members')
            .delete()
            .eq('team_id', teamId)
            .eq('user_id', memberToRemove.user_id)

        if (!error) {
            toast.success("นำออกจากทีมแล้ว บัญชียังใช้งานได้")
            setMemberToRemove(null)
            setConfirmName('')
            await fetchMembers()
            onChanged?.()
        } else {
            toast.error("ลบสมาชิกไม่สำเร็จ: " + error.message)
        }
    }

    async function handleLeave() {
        if (leaveConfirm.trim() !== 'ออกจากทีม') return
        const { error } = await leaveTeam(teamId, currentUserId)
        if (error) {
            toast.error("ออกจากทีมไม่สำเร็จ: " + error.message)
            return
        }
        toast.success("ออกจากทีมแล้ว")
        setLeaveOpen(false)
        onChanged?.('left')
        onClose()
    }

    return (
        <>
            <Dialog open={isOpen} onOpenChange={onClose}>
                <DialogContent className="sm:max-w-[520px] bg-card text-card-foreground">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <UserPlus size={20} className="text-primary"/> สมาชิกในทีม
                        </DialogTitle>
                        <DialogDescription>
                            เชิญหรือนำออกจากทีมนี้เท่านั้น ไม่ได้แก้บัญชีของเพื่อน
                        </DialogDescription>
                    </DialogHeader>

                    {isOwner ? (
                        <form onSubmit={handleInvite} className="flex gap-2 mt-2">
                            <div className="relative flex-1">
                                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input
                                    type="email"
                                    placeholder="อีเมลเพื่อนที่สมัคร All Work แล้ว"
                                    className="pl-9 bg-background"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                            <Button type="submit" disabled={loading}>
                                {loading ? "..." : "เชิญเข้าทีม"}
                            </Button>
                        </form>
                    ) : (
                        <p className="text-sm text-muted-foreground mt-2">เฉพาะเจ้าของทีมที่เชิญหรือนำสมาชิกออกได้</p>
                    )}

                    <div className="mt-4">
                        <h4 className="text-sm font-semibold text-muted-foreground mb-3">สมาชิกปัจจุบัน ({members.length})</h4>
                        <ScrollArea className="h-[250px] pr-4">
                            <div className="space-y-3">
                                {members.map((m) => (
                                    <div key={m.id} className="flex items-center justify-between p-3 bg-muted/40 rounded-xl border border-border/50">
                                        <div className="flex items-center gap-3 min-w-0">
                                            <Avatar className="h-10 w-10 border border-border shadow-sm">
                                                <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                                                    {getInitials(m.profiles?.display_name, m.profiles?.email)}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="min-w-0">
                                                <p className="text-sm font-bold text-foreground truncate">
                                                    {m.profiles?.display_name || 'Unknown'}
                                                </p>
                                                {m.profiles?.position && (
                                                    <p className="text-[10px] text-primary flex items-center gap-1 mb-0.5">
                                                        <Briefcase size={10} /> {m.profiles.position}
                                                    </p>
                                                )}
                                                <p className="text-[10px] text-muted-foreground flex items-center gap-1 truncate">
                                                    {m.role === 'owner' ? <Shield size={10} className="text-yellow-500" /> : <User size={10} />}
                                                    {m.role === 'owner' ? 'เจ้าของทีม' : 'สมาชิก'} • {m.profiles?.email}
                                                </p>
                                            </div>
                                        </div>
                                        {isOwner && m.role !== 'owner' && (
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                                                        <MoreHorizontal size={16} />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem
                                                        className="text-destructive focus:text-destructive"
                                                        onClick={() => {
                                                            setConfirmName('')
                                                            setMemberToRemove(m)
                                                        }}
                                                    >
                                                        <UserMinus className="mr-2 h-4 w-4" /> นำออกจากทีม
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                    </div>

                    {!isOwner && currentUserId && (
                        <Button variant="outline" className="w-full text-destructive hover:text-destructive" onClick={() => { setLeaveConfirm(''); setLeaveOpen(true) }}>
                            <LogOut className="mr-2 h-4 w-4" /> ออกจากทีมนี้
                        </Button>
                    )}
                </DialogContent>
            </Dialog>

            <AlertDialog open={!!memberToRemove} onOpenChange={(open) => { if (!open) { setMemberToRemove(null); setConfirmName('') } }}>
                <AlertDialogContent className="bg-card border-border">
                    <AlertDialogHeader>
                        <AlertDialogTitle>นำออกจากทีม ไม่ลบบัญชี</AlertDialogTitle>
                        <AlertDialogDescription>
                            {removeLabel || 'สมาชิกคนนี้'} จะเข้าบอร์ดทีมนี้ไม่ได้แล้ว แต่ยังล็อกอิน All Work ได้ตามปกติ
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="space-y-2 py-2">
                        <Label htmlFor="confirm-remove">พิมพ์ชื่อ <span className="font-semibold text-foreground">{removeLabel}</span> เพื่อยืนยัน</Label>
                        <Input
                            id="confirm-remove"
                            value={confirmName}
                            onChange={(e) => setConfirmName(e.target.value)}
                            placeholder={removeLabel}
                            autoComplete="off"
                        />
                    </div>
                    <AlertDialogFooter>
                        <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
                        <AlertDialogAction
                            disabled={!canConfirmRemove}
                            onClick={handleRemoveMember}
                            className="bg-destructive hover:bg-destructive/90 disabled:opacity-50"
                        >
                            นำออกจากทีม
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <AlertDialog open={leaveOpen} onOpenChange={setLeaveOpen}>
                <AlertDialogContent className="bg-card border-border">
                    <AlertDialogHeader>
                        <AlertDialogTitle>ออกจากทีมนี้?</AlertDialogTitle>
                        <AlertDialogDescription>
                            คุณจะไม่เห็นบอร์ดงานของทีมนี้อีก จนกว่าเจ้าของจะเชิญกลับ บัญชียังใช้ได้
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="space-y-2 py-2">
                        <Label htmlFor="confirm-leave">พิมพ์ <span className="font-semibold text-foreground">ออกจากทีม</span> เพื่อยืนยัน</Label>
                        <Input
                            id="confirm-leave"
                            value={leaveConfirm}
                            onChange={(e) => setLeaveConfirm(e.target.value)}
                            placeholder="ออกจากทีม"
                            autoComplete="off"
                        />
                    </div>
                    <AlertDialogFooter>
                        <AlertDialogCancel>อยู่ต่อ</AlertDialogCancel>
                        <AlertDialogAction
                            disabled={leaveConfirm.trim() !== 'ออกจากทีม'}
                            onClick={handleLeave}
                            className="bg-destructive hover:bg-destructive/90 disabled:opacity-50"
                        >
                            ออกจากทีม
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}
