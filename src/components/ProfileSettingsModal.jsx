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
    const { user } = useAuth()
    const [firstName, setFirstName] = useState('')
    const [lastName, setLastName] = useState('')
    const [position, setPosition] = useState('')
    const [loading, setLoading] = useState(false)

    // โหลดข้อมูลเดิมเมื่อเปิด Modal
    useEffect(() => {
        if (isOpen && user) fetchProfile()
    }, [isOpen, user])

    async function fetchProfile() {
        const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
        if (data) {
            setFirstName(data.first_name || '')
            setLastName(data.last_name || '')
            setPosition(data.position || '')
        }
    }

    async function handleSave() {
        setLoading(true)
        const updates = {
            id: user.id,
            first_name: firstName,
            last_name: lastName,
            position: position,
            // อัปเดตชื่อที่แสดง (Display Name) ให้เป็น "ชื่อ นามสกุล" หรือใช้อีเมลถ้าไม่มีชื่อ
            display_name: `${firstName} ${lastName}`.trim() || user.email.split('@')[0], 
            updated_at: new Date(),
        }

        const { error } = await supabase.from('profiles').upsert(updates)

        if (!error) {
            toast.success("บันทึกข้อมูลโปรไฟล์เรียบร้อย")
            onClose()
            // รีโหลดหน้าเพื่อให้ข้อมูลใหม่แสดงผลทันที
            window.location.reload() 
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
                    {/* Email (Read-only) */}
                    <div className="grid gap-2">
                        <Label className="text-muted-foreground">อีเมล (แก้ไขไม่ได้)</Label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input disabled value={user?.email || ''} className="pl-9 bg-muted/50 border-border/50" />
                        </div>
                    </div>

                    {/* ชื่อ - นามสกุล */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label>ชื่อจริง</Label>
                            <Input 
                                value={firstName} 
                                onChange={e => setFirstName(e.target.value)} 
                                placeholder="เช่น สมชาย" 
                                className="bg-background"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label>นามสกุล</Label>
                            <Input 
                                value={lastName} 
                                onChange={e => setLastName(e.target.value)} 
                                placeholder="เช่น ใจดี" 
                                className="bg-background"
                            />
                        </div>
                    </div>

                    {/* ตำแหน่ง */}
                    <div className="grid gap-2">
                        <Label>ตำแหน่งงาน</Label>
                        <div className="relative">
                            <Briefcase className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input 
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