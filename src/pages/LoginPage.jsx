import { useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ModeToggle } from "@/components/mode-toggle"
import { LogIn, UserPlus, Loader2, Briefcase, Mail, Lock, Sparkles, CheckCircle2, Zap, User } from 'lucide-react'
import { toast } from "sonner"
import { supabase } from '@/lib/supabaseClient'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  // เพิ่ม State สำหรับข้อมูลส่วนตัว
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [position, setPosition] = useState('')
  
  const [loading, setLoading] = useState(false)
  const [isSignUp, setIsSignUp] = useState(false)
  const { signIn, signUp } = useAuth()
  const navigate = useNavigate()

  const handleAuth = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      if (isSignUp) {
        // 1. สมัครสมาชิก
        const { data, error: signUpError } = await signUp({ email, password })
        if (signUpError) throw signUpError

        // 2. ถ้าสมัครผ่าน ให้บันทึกข้อมูล Profile เพิ่มเติม
        if (data?.user) {
            const { error: profileError } = await supabase.from('profiles').update({
                first_name: firstName,
                last_name: lastName,
                position: position,
                display_name: `${firstName} ${lastName}`.trim() || email.split('@')[0]
            }).eq('id', data.user.id)

            if (profileError) console.error("Profile update error:", profileError)
        }

        toast.success("สมัครสมาชิกเรียบร้อย! กรุณาล็อกอิน")
        setIsSignUp(false)
      } else {
        // ล็อกอินปกติ
        const { error } = await signIn({ email, password })
        if (error) throw error
        toast.success("เข้าสู่ระบบสำเร็จ! ยินดีต้อนรับครับ")
        navigate('/')
      }
    } catch (error) {
      toast.error("เกิดข้อผิดพลาด: " + error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex w-full bg-background transition-colors duration-300">
      
      {/* --- ฝั่งซ้าย: Brand Section --- */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-primary overflow-hidden items-center justify-center">
        <div className="absolute inset-0">
            <div className="absolute inset-0 opacity-20" style={{
                backgroundImage: `radial-gradient(circle at 20% 50%, currentColor 0%, transparent 50%), radial-gradient(circle at 80% 80%, currentColor 0%, transparent 50%)`,
                color: 'var(--primary-foreground)'
            }} />
            <div className="absolute inset-0 opacity-10" style={{
                backgroundImage: `linear-gradient(currentColor 1px, transparent 1px), linear-gradient(90deg, currentColor 1px, transparent 1px)`,
                backgroundSize: '40px 40px',
                color: 'var(--primary-foreground)'
            }} />
        </div>

        <div className="relative z-10 p-12 max-w-2xl w-full text-primary-foreground">
            <div className="space-y-6 animate-in fade-in slide-in-from-left duration-700">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-primary-foreground/10 backdrop-blur-md rounded-2xl border border-primary-foreground/20 shadow-xl">
                    <Briefcase size={40} className="text-primary-foreground" />
                </div>
                <div className="space-y-2">
                    <h1 className="text-5xl xl:text-6xl font-black tracking-tight leading-tight">All Work</h1>
                    <p className="text-xl opacity-90 font-light">ระบบจัดการงานสำหรับทีมยุคใหม่</p>
                </div>
                <div className="grid gap-4 mt-8 pt-8 border-t border-primary-foreground/10">
                    {[
                        { icon: Sparkles, title: "Modern Design", desc: "ดีไซน์สวยงาม ทันสมัย ใช้งานง่าย" },
                        { icon: Zap, title: "Fast & Fluid", desc: "ทำงานลื่นไหลด้วยเทคโนโลยีล่าสุด" },
                        { icon: CheckCircle2, title: "Track Everything", desc: "ไม่พลาดทุกความคืบหน้าของงาน" }
                    ].map((item, idx) => (
                        <div key={idx} className="flex items-center gap-4 p-3 rounded-xl hover:bg-primary-foreground/5 transition-colors duration-300">
                            <div className="p-2.5 bg-primary-foreground/10 rounded-lg"><item.icon size={20} /></div>
                            <div><h3 className="font-bold text-sm">{item.title}</h3><p className="text-xs opacity-70">{item.desc}</p></div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
      </div>

      {/* --- ฝั่งขวา: Login Form --- */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-8 bg-background relative">
        <div className="absolute top-4 right-4 z-50"><ModeToggle /></div>

        <div className="w-full max-w-sm space-y-8 animate-in fade-in zoom-in-95 duration-500">
            <div className="text-center space-y-2">
                <h2 className="text-3xl font-bold tracking-tight text-foreground">{isSignUp ? "สร้างบัญชีใหม่" : "ยินดีต้อนรับกลับ"}</h2>
                <p className="text-muted-foreground text-sm">{isSignUp ? "กรอกข้อมูลเพื่อเริ่มต้นใช้งานระบบ" : "กรอกอีเมลและรหัสผ่านเพื่อเข้าสู่ระบบ"}</p>
            </div>

            <form onSubmit={handleAuth} className="space-y-4">
                {/* ส่วนที่เพิ่ม: ข้อมูลส่วนตัว (แสดงเฉพาะตอนสมัครสมาชิก) */}
                {isSignUp && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-300">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-foreground">ชื่อ</label>
                                <Input placeholder="สมชาย" value={firstName} onChange={e => setFirstName(e.target.value)} className="bg-background" required />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-foreground">นามสกุล</label>
                                <Input placeholder="ใจดี" value={lastName} onChange={e => setLastName(e.target.value)} className="bg-background" required />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-foreground">ตำแหน่ง</label>
                            <div className="relative">
                                <Briefcase className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input placeholder="Developer, Designer..." value={position} onChange={e => setPosition(e.target.value)} className="pl-9 bg-background" required />
                            </div>
                        </div>
                    </div>
                )}

                <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">อีเมล</label>
                    <div className="relative">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input type="email" placeholder="name@company.com" className="pl-9 bg-background" value={email} onChange={e => setEmail(e.target.value)} required />
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">รหัสผ่าน</label>
                    <div className="relative">
                        <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input type="password" placeholder="••••••••" className="pl-9 bg-background" value={password} onChange={e => setPassword(e.target.value)} required />
                    </div>
                </div>

                <Button type="submit" className="w-full font-bold shadow-sm" disabled={loading}>
                    {loading ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" /> กำลังดำเนินการ...</>) : (isSignUp ? <><UserPlus className="mr-2 h-4 w-4" /> สมัครสมาชิก</> : <><LogIn className="mr-2 h-4 w-4" /> เข้าสู่ระบบ</>)}
                </Button>
            </form>

            <div className="relative"><div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border" /></div><div className="relative flex justify-center text-xs uppercase"><span className="bg-background px-2 text-muted-foreground">หรือ</span></div></div>

            <div className="text-center text-sm">
                <span className="text-muted-foreground">{isSignUp ? "มีบัญชีอยู่แล้ว? " : "ยังไม่มีบัญชี? "}</span>
                <button type="button" onClick={() => setIsSignUp(!isSignUp)} className="font-semibold text-primary hover:underline transition-all">{isSignUp ? "เข้าสู่ระบบ" : "สมัครสมาชิกเลย"}</button>
            </div>
        </div>
      </div>
    </div>
  )
}