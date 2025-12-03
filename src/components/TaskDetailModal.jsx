import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar as CalendarIcon, Clock, Flag, User } from 'lucide-react'
import { format } from "date-fns"
import { th } from "date-fns/locale" // หรือใช้ en-US ถ้าชอบอังกฤษ
import { supabase } from '@/lib/supabaseClient'
import { toast } from "sonner"

export function TaskDetailModal({ task, isOpen, onClose, onUpdate }) {
    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')
    const [priority, setPriority] = useState('medium')
    const [dueDate, setDueDate] = useState()
    const [loading, setLoading] = useState(false)

    // โหลดข้อมูลเดิมมาใส่ในฟอร์ม
    useEffect(() => {
        if (task) {
            setTitle(task.title || '')
            setDescription(task.description || '')
            setPriority(task.priority || 'medium')
            setDueDate(task.due_date ? new Date(task.due_date) : undefined)
        }
    }, [task])

    const handleSave = async () => {
        setLoading(true)
        const { error } = await supabase
            .from('tasks')
            .update({ 
                title, 
                description, 
                priority, 
                due_date: dueDate 
            })
            .eq('id', task.id)

        setLoading(false)
        if (!error) {
            toast.success("บันทึกข้อมูลเรียบร้อย")
            onUpdate() // แจ้งหน้าหลักให้รีเฟรช
            onClose()
        } else {
            toast.error("บันทึกไม่สำเร็จ: " + error.message)
        }
    }

    const priorityColors = {
        low: "text-blue-500",
        medium: "text-yellow-500",
        high: "text-red-500"
    }

    if (!task) return null

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[600px] bg-card text-card-foreground">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold flex items-center gap-2">
                        <span className="text-muted-foreground text-base font-normal">Task:</span> 
                        <Input 
                            value={title} 
                            onChange={(e) => setTitle(e.target.value)} 
                            className="font-bold text-lg border-none shadow-none focus-visible:ring-0 px-0 h-auto"
                        />
                    </DialogTitle>
                </DialogHeader>

                <div className="grid gap-6 py-4">
                    {/* Properties Grid */}
                    <div className="grid grid-cols-2 gap-4">
                        {/* Priority */}
                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-muted-foreground uppercase flex items-center gap-2">
                                <Flag size={14} /> ความสำคัญ
                            </label>
                            <Select value={priority} onValueChange={setPriority}>
                                <SelectTrigger className={`${priorityColors[priority]} font-medium`}>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="low" className="text-blue-500">Low (ต่ำ)</SelectItem>
                                    <SelectItem value="medium" className="text-yellow-500">Medium (กลาง)</SelectItem>
                                    <SelectItem value="high" className="text-red-500">High (สูง)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Due Date */}
                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-muted-foreground uppercase flex items-center gap-2">
                                <Clock size={14} /> กำหนดส่ง
                            </label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant={"outline"} className={`w-full justify-start text-left font-normal ${!dueDate && "text-muted-foreground"}`}>
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {dueDate ? format(dueDate, "PPP", { locale: th }) : <span>เลือกวันที่</span>}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0">
                                    <Calendar mode="single" selected={dueDate} onSelect={setDueDate} initialFocus />
                                </PopoverContent>
                            </Popover>
                        </div>
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-muted-foreground uppercase">รายละเอียดเพิ่มเติม</label>
                        <Textarea 
                            value={description} 
                            onChange={(e) => setDescription(e.target.value)} 
                            placeholder="ใส่รายละเอียดงานที่นี่..." 
                            className="min-h-[150px] resize-none"
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>ยกเลิก</Button>
                    <Button onClick={handleSave} disabled={loading}>
                        {loading ? "กำลังบันทึก..." : "บันทึกการเปลี่ยนแปลง"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}