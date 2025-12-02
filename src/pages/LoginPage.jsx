import { useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ModeToggle } from "@/components/mode-toggle"
import { LogIn, UserPlus, Loader2, Briefcase, Mail, Lock, Sparkles, CheckCircle2, Zap } from 'lucide-react'
import { toast } from "sonner"

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [isSignUp, setIsSignUp] = useState(false)
  const { signIn, signUp } = useAuth()
  const navigate = useNavigate()

  const handleAuth = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const { error } = isSignUp 
        ? await signUp({ email, password })
        : await signIn({ email, password })

      if (error) throw error
      
      if (!isSignUp) {
        toast.success("เข้าสู่ระบบสำเร็จ! ยินดีต้อนรับครับ")
        navigate('/')
      } else {
        toast.success("สมัครสมาชิกเรียบร้อย! กรุณาล็อกอิน")
        setIsSignUp(false)
      }
    } catch (error) {
      toast.error("เกิดข้อผิดพลาด: " + error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex w-full bg-background transition-colors duration-300">
      
      {/* --- ฝั่งซ้าย: Brand Section (แสดงเฉพาะจอใหญ่) --- */}
      {/* ใช้ bg-primary และ text-primary-foreground เพื่อให้สีตัดกันเสมอในทุกธีม */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-primary overflow-hidden items-center justify-center">
        
        {/* ลวดลายพื้นหลัง (ใช้สี primary-foreground แบบจางๆ แทนสีขาว) */}
        <div className="absolute inset-0">
            <div className="absolute inset-0 opacity-20" style={{
                backgroundImage: `radial-gradient(circle at 20% 50%, currentColor 0%, transparent 50%),
                                  radial-gradient(circle at 80% 80%, currentColor 0%, transparent 50%)`,
                color: 'var(--primary-foreground)' // ดึงสีที่ตัดกันมาใช้
            }} />
            <div className="absolute inset-0 opacity-10" style={{
                backgroundImage: `linear-gradient(currentColor 1px, transparent 1px),
                                  linear-gradient(90deg, currentColor 1px, transparent 1px)`,
                backgroundSize: '40px 40px',
                color: 'var(--primary-foreground)'
            }} />
        </div>

        {/* เนื้อหา */}
        <div className="relative z-10 p-12 max-w-2xl w-full text-primary-foreground">
            <div className="space-y-6 animate-in fade-in slide-in-from-left duration-700">
                {/* Logo Box */}
                <div className="inline-flex items-center justify-center w-20 h-20 bg-primary-foreground/10 backdrop-blur-md rounded-2xl border border-primary-foreground/20 shadow-xl">
                    <Briefcase size={40} className="text-primary-foreground" />
                </div>
                
                <div className="space-y-2">
                    <h1 className="text-5xl xl:text-6xl font-black tracking-tight leading-tight">
                        All Work
                    </h1>
                    <p className="text-xl opacity-90 font-light">
                        ระบบจัดการงานสำหรับทีมยุคใหม่
                    </p>
                </div>

                {/* Features List */}
                <div className="grid gap-4 mt-8 pt-8 border-t border-primary-foreground/10">
                    {[
                        { icon: Sparkles, title: "Modern Design", desc: "ดีไซน์สวยงาม ทันสมัย ใช้งานง่าย" },
                        { icon: Zap, title: "Fast & Fluid", desc: "ทำงานลื่นไหลด้วยเทคโนโลยีล่าสุด" },
                        { icon: CheckCircle2, title: "Track Everything", desc: "ไม่พลาดทุกความคืบหน้าของงาน" }
                    ].map((item, idx) => (
                        <div key={idx} className="flex items-center gap-4 p-3 rounded-xl hover:bg-primary-foreground/5 transition-colors duration-300">
                            <div className="p-2.5 bg-primary-foreground/10 rounded-lg">
                                <item.icon size={20} />
                            </div>
                            <div>
                                <h3 className="font-bold text-sm">{item.title}</h3>
                                <p className="text-xs opacity-70">{item.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
      </div>

      {/* --- ฝั่งขวา: Login Form --- */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-8 bg-background relative">
        
        {/* ปุ่มเปลี่ยนธีม (ลอยอยู่มุมขวาบน) */}
        <div className="absolute top-4 right-4 z-50">
            <ModeToggle />
        </div>

        {/* Mobile Header (แสดงเฉพาะจอมือถือ) */}
        <div className="lg:hidden absolute top-4 left-4 flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-primary-foreground">
                <Briefcase size={16} />
            </div>
            <span className="font-bold text-lg text-foreground">All Work</span>
        </div>

        {/* การ์ด Login */}
        <div className="w-full max-w-sm space-y-8 animate-in fade-in zoom-in-95 duration-500">
            <div className="text-center space-y-2">
                <h2 className="text-3xl font-bold tracking-tight text-foreground">
                    {isSignUp ? "สร้างบัญชีใหม่" : "ยินดีต้อนรับกลับ"}
                </h2>
                <p className="text-muted-foreground text-sm">
                    {isSignUp ? "กรอกข้อมูลเพื่อเริ่มต้นใช้งานระบบ" : "กรอกอีเมลและรหัสผ่านเพื่อเข้าสู่ระบบ"}
                </p>
            </div>

            <form onSubmit={handleAuth} className="space-y-4">
                <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">อีเมล</label>
                    <div className="relative">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input 
                            type="email" 
                            placeholder="name@company.com" 
                            className="pl-9 bg-background" // ใช้สีพื้นหลังปกติ ไม่โปร่งใส
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            required
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <label className="text-sm font-medium text-foreground">รหัสผ่าน</label>
                        {!isSignUp && (
                            <button type="button" className="text-xs font-medium text-primary hover:underline">
                                ลืมรหัสผ่าน?
                            </button>
                        )}
                    </div>
                    <div className="relative">
                        <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input 
                            type="password" 
                            placeholder="••••••••" 
                            className="pl-9 bg-background"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            required
                        />
                    </div>
                </div>

                <Button type="submit" className="w-full font-bold shadow-sm" disabled={loading}>
                    {loading ? (
                        <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> กำลังโหลด...</>
                    ) : (
                        isSignUp ? <><UserPlus className="mr-2 h-4 w-4" /> สมัครสมาชิก</> : <><LogIn className="mr-2 h-4 w-4" /> เข้าสู่ระบบ</>
                    )}
                </Button>
            </form>

            {/* Divider */}
            <div className="relative">
                <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">หรือ</span>
                </div>
            </div>

            <div className="text-center text-sm">
                <span className="text-muted-foreground">
                    {isSignUp ? "มีบัญชีอยู่แล้ว? " : "ยังไม่มีบัญชี? "}
                </span>
                <button 
                    type="button"
                    onClick={() => setIsSignUp(!isSignUp)}
                    className="font-semibold text-primary hover:underline transition-all"
                >
                    {isSignUp ? "เข้าสู่ระบบ" : "สมัครสมาชิกเลย"}
                </button>
            </div>
        </div>
      </div>
    </div>
  )
}