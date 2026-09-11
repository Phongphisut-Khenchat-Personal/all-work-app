import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar as CalendarIcon, Clock, Flag, User, Trash2 } from 'lucide-react'
import { format } from "date-fns"
import { th } from "date-fns/locale"
import { supabase } from '@/lib/supabaseClient'
import { toast } from "sonner"

export function TaskDetailModal({ task, isOpen, onClose, onUpdate, members = [], columns = [] }) {
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            {task ? (
                <TaskDetailForm
                    key={task.id}
                    task={task}
                    onClose={onClose}
                    onUpdate={onUpdate}
                    members={members}
                    columns={columns}
                />
            ) : null}
        </Dialog>
    )
}

function TaskDetailForm({ task, onClose, onUpdate, members, columns }) {
    const [title, setTitle] = useState(task.title || '')
    const [description, setDescription] = useState(task.description || '')
    const [priority, setPriority] = useState(task.priority || 'medium')
    const [columnId, setColumnId] = useState(String(task.column_id || columns[0]?.id || ''))
    const [assigneeId, setAssigneeId] = useState(task.assignee_id || 'unassigned')
    const [dueDate, setDueDate] = useState(task.due_date ? new Date(task.due_date) : undefined)
    const [loading, setLoading] = useState(false)
    const [confirmDelete, setConfirmDelete] = useState(false)

    const owner = members.find(m => m.id === (task.created_by || task.assignee_id))

    const handleSave = async () => {
        if (!title.trim()) {
            toast.warning('กรุณาใส่ชื่องาน')
            return
        }
        setLoading(true)
        const { error } = await supabase
            .from('tasks')
            .update({
                title: title.trim(),
                description,
                priority,
                column_id: columnId ? Number(columnId) : task.column_id,
                assignee_id: assigneeId === 'unassigned' ? null : assigneeId,
                due_date: dueDate ? dueDate.toISOString() : null,
            })
            .eq('id', task.id)

        setLoading(false)
        if (!error) {
            toast.success("บันทึกข้อมูลเรียบร้อย")
            onUpdate()
            onClose()
        } else {
            toast.error("บันทึกไม่สำเร็จ: " + error.message)
        }
    }

    const handleDelete = async () => {
        const { error } = await supabase.from('tasks').delete().eq('id', task.id)
        if (error) {
            toast.error("ลบงานไม่สำเร็จ: " + error.message)
            return
        }
        toast.success("ลบงานเรียบร้อย")
        setConfirmDelete(false)
        onUpdate()
        onClose()
    }

    const priorityColors = {
        low: "text-blue-500",
        medium: "text-yellow-500",
        high: "text-red-500"
    }

    return (
        <>
            <DialogContent className="sm:max-w-[600px] bg-card text-card-foreground">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold flex items-center gap-2">
                        <span className="text-muted-foreground text-base font-normal">งาน:</span>
                        <Input
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="font-bold text-lg border-none shadow-none focus-visible:ring-0 px-0 h-auto"
                        />
                    </DialogTitle>
                    <DialogDescription>
                        ของ {owner?.display_name || owner?.email || 'สมาชิกในทีม'} — เพื่อนในทีมแก้และย้ายได้
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-6 py-4">
                    <div className="grid grid-cols-2 gap-4">
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

                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-muted-foreground uppercase">กระดาน</label>
                            <Select value={columnId} onValueChange={setColumnId}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {columns.map((column) => (
                                        <SelectItem key={column.id} value={String(column.id)}>{column.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-muted-foreground uppercase flex items-center gap-2">
                                <User size={14} /> ผู้รับผิดชอบ
                            </label>
                            <Select value={assigneeId} onValueChange={setAssigneeId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="ยังไม่มอบหมาย" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="unassigned">ยังไม่มอบหมาย</SelectItem>
                                    {members.map((member) => (
                                        <SelectItem key={member.id} value={member.id}>
                                            {member.display_name || member.email}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

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

                <DialogFooter className="sm:justify-between">
                    <Button variant="ghost" className="text-destructive hover:text-destructive" onClick={() => setConfirmDelete(true)}>
                        <Trash2 className="mr-2 h-4 w-4" /> ลบงาน
                    </Button>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={onClose}>ยกเลิก</Button>
                        <Button onClick={handleSave} disabled={loading}>
                            {loading ? "กำลังบันทึก..." : "บันทึกการเปลี่ยนแปลง"}
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>

            <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
                <AlertDialogContent className="bg-card border-border">
                    <AlertDialogHeader>
                        <AlertDialogTitle>ลบงานนี้?</AlertDialogTitle>
                        <AlertDialogDescription>
                            จะลบ <span className="font-semibold text-foreground">“{task.title}”</span> ของ {owner?.display_name || 'สมาชิก'} ถาวร เพื่อนช่วยลบได้ถ้าเจ้าของลืม แต่กู้คืนไม่ได้
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>ไม่ลบ</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">ลบงาน</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}
