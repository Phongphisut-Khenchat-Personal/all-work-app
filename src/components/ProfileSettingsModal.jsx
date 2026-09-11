import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { User, Briefcase, Mail } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'
import { useAuth } from '@/context/AuthContext'
import { toast } from "sonner"

export function ProfileSettingsModal({ isOpen, onClose }) {
    const { user, refreshProfile } = useAuth()
    const [firstName, setFirstName] = useState('')
    const [lastName, setLastName] = useState('')
    const [position, setPosition] = useState('')
    const [loading, setLoading] = useState(false)

    async function fetchProfile() {
        const { data, error } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle()
        if (error) {
            toast.error('โหลดโปรไฟล์ไม่สำเร็จ: ' + error.message)
            return
        }
        if (data) {
            setFirstName(data.first_name || '')
            setLastName(data.last_name || '')
            setPosition(data.position || '')
        }
    }

    useEffect(() => {
        if (isOpen && user) fetchProfile()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, user])

    async function handleSave() {
        setLoading(true)
        const updates = {
            id: user.id,
            email: user.email,
            first_name: firstName,
            last_name: lastName,
            position: position,
            display_name: `${firstName} ${lastName}`.trim() || user.email.split('@')[0],
            updated_at: new Date(),
        }

        const { error } = await supabase.from('profiles').upsert(updates)

        if (!error) {
            await refreshProfile(user.id)
            toast.success("บันทึกข้อมูลโปรไฟล์เรียบร้อย")
            onClose()
        } else {
            toast.error("บันทึกไม่สำเร็จ: " + error.message)
        }
        setLoading(false)
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px] bg-card text-card-foreground">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl font-bold">
                        <User className="w-5 h-5 text-primary" /> แก้ไขข้อมูลส่วนตัว
                    </DialogTitle>
                </DialogHeader>
                
                <div className="grid gap-5 py-4">
                    <div className="grid gap-2">
                        <Label className="text-muted-foreground">อีเมล (แก้ไขไม่ได้)</Label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input disabled value={user?.email || ''} className="pl-9 bg-muted/50 border-border/50" />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="profile-first-name">ชื่อจริง</Label>
                            <Input 
                                id="profile-first-name"
                                value={firstName} 
                                onChange={e => setFirstName(e.target.value)} 
                                placeholder="เช่น สมชาย" 
                                className="bg-background"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="profile-last-name">นามสกุล</Label>
                            <Input 
                                id="profile-last-name"
                                value={lastName} 
                                onChange={e => setLastName(e.target.value)} 
                                placeholder="เช่น ใจดี" 
                                className="bg-background"
                            />
                        </div>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="profile-position">ตำแหน่งงาน</Label>
                        <div className="relative">
                            <Briefcase className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input 
                                id="profile-position"
                                value={position} 
                                onChange={e => setPosition(e.target.value)} 
                                className="pl-9 bg-background" 
                                placeholder="เช่น Software Engineer, Designer" 
                            />
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>ยกเลิก</Button>
                    <Button onClick={handleSave} disabled={loading} className="font-semibold shadow-md">
                        {loading ? "กำลังบันทึก..." : "บันทึกการเปลี่ยนแปลง"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
