import { useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { Navigate } from 'react-router-dom'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ModeToggle } from "@/components/mode-toggle"
import { LogIn, UserPlus, Loader2, Briefcase, Mail, Lock, Sparkles, CheckCircle2, Zap } from 'lucide-react'
import { toast } from "sonner"
import { supabase } from '@/lib/supabaseClient'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [position, setPosition] = useState('')
  const [loading, setLoading] = useState(false)
  const [isSignUp, setIsSignUp] = useState(false)
  const [isForgot, setIsForgot] = useState(false)
  const { user, isRecovery, signIn, signUp, resetPassword, updatePassword, setIsRecovery, refreshProfile } = useAuth()

  if (user && !isRecovery) {
    return <Navigate to="/" replace />
  }

  const upsertProfile = async (userId) => {
    const displayName = `${firstName} ${lastName}`.trim() || email.split('@')[0]
    const { error } = await supabase.from('profiles').upsert({
      id: userId,
      email,
      first_name: firstName,
      last_name: lastName,
      position,
      display_name: displayName,
    })
    if (error) throw error
    await refreshProfile(userId)
  }

  const handleAuth = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      if (isRecovery) {
        if (password.length < 6) throw new Error('รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร')
        if (password !== confirmPassword) throw new Error('รหัสผ่านไม่ตรงกัน')
        const { error } = await updatePassword(password)
        if (error) throw error
        setIsRecovery(false)
        toast.success('ตั้งรหัสผ่านใหม่เรียบร้อย')
        return
      }

      if (isForgot) {
        const { error } = await resetPassword(email)
        if (error) throw error
        toast.success('ส่งลิงก์รีเซ็ตรหัสผ่านแล้ว', { description: 'กรุณาตรวจอีเมลของคุณ' })
        setIsForgot(false)
        return
      }

      if (isSignUp) {
        if (password.length < 6) throw new Error('รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร')
        const displayName = `${firstName} ${lastName}`.trim() || email.split('@')[0]
        const { data, error: signUpError } = await signUp({
          email,
          password,
          options: {
            data: {
              first_name: firstName,
              last_name: lastName,
              position,
              display_name: displayName,
            },
          },
        })
        if (signUpError) throw signUpError

        if (data?.session && data?.user) {
          try {
            await upsertProfile(data.user.id)
          } catch (profileError) {
            console.error('Profile upsert error:', profileError)
            toast.warning('สมัครสำเร็จ แต่บันทึกโปรไฟล์ไม่ครบ', { description: profileError.message })
          }
        }

        if (data?.session) {
          toast.success('สมัครสมาชิกเรียบร้อย! ยินดีต้อนรับครับ')
        } else {
          toast.success('สมัครสมาชิกเรียบร้อย!', { description: 'กรุณายืนยันอีเมล แล้วค่อยเข้าสู่ระบบ' })
          setIsSignUp(false)
        }
      } else {
        const { error } = await signIn({ email, password })
        if (error) throw error
        toast.success('เข้าสู่ระบบสำเร็จ! ยินดีต้อนรับครับ')
      }
    } catch (error) {
      toast.error('เกิดข้อผิดพลาด: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const heading = isRecovery
    ? 'ตั้งรหัสผ่านใหม่'
    : isForgot
      ? 'ลืมรหัสผ่าน'
      : isSignUp
        ? 'สร้างบัญชีใหม่'
        : 'ยินดีต้อนรับกลับ'

  const subtitle = isRecovery
    ? 'กรอกรหัสผ่านใหม่สำหรับบัญชีของคุณ'
    : isForgot
      ? 'ใส่อีเมลเพื่อรับลิงก์รีเซ็ตรหัสผ่าน'
      : isSignUp
        ? 'กรอกข้อมูลเพื่อเริ่มต้นใช้งานระบบ'
        : 'กรอกอีเมลและรหัสผ่านเพื่อเข้าสู่ระบบ'

  return (
    <div className="min-h-screen flex w-full bg-background transition-colors duration-300">
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

      <div className="flex-1 flex items-center justify-center p-4 sm:p-8 bg-background relative">
        <div className="absolute top-4 right-4 z-50"><ModeToggle /></div>

        <div className="w-full max-w-sm space-y-8 animate-in fade-in zoom-in-95 duration-500">
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-bold tracking-tight text-foreground">{heading}</h2>
            <p className="text-muted-foreground text-sm">{subtitle}</p>
          </div>

          <form onSubmit={handleAuth} className="space-y-4">
            {isSignUp && !isForgot && !isRecovery && (
              <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-300">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="first-name" className="text-sm font-medium text-foreground">ชื่อ</label>
                    <Input id="first-name" placeholder="สมชาย" value={firstName} onChange={e => setFirstName(e.target.value)} className="bg-background" required />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="last-name" className="text-sm font-medium text-foreground">นามสกุล</label>
                    <Input id="last-name" placeholder="ใจดี" value={lastName} onChange={e => setLastName(e.target.value)} className="bg-background" required />
                  </div>
                </div>
                <div className="space-y-2">
                  <label htmlFor="position" className="text-sm font-medium text-foreground">ตำแหน่ง</label>
                  <div className="relative">
                    <Briefcase className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input id="position" placeholder="Developer, Designer..." value={position} onChange={e => setPosition(e.target.value)} className="pl-9 bg-background" required />
                  </div>
                </div>
              </div>
            )}

            {!isRecovery && (
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium text-foreground">อีเมล</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input id="email" type="email" placeholder="name@company.com" className="pl-9 bg-background" value={email} onChange={e => setEmail(e.target.value)} required />
                </div>
              </div>
            )}

            {!isForgot && (
              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium text-foreground">{isRecovery ? 'รหัสผ่านใหม่' : 'รหัสผ่าน'}</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input id="password" type="password" placeholder="••••••••" className="pl-9 bg-background" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} />
                </div>
              </div>
            )}

            {isRecovery && (
              <div className="space-y-2">
                <label htmlFor="confirm-password" className="text-sm font-medium text-foreground">ยืนยันรหัสผ่าน</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input id="confirm-password" type="password" placeholder="••••••••" className="pl-9 bg-background" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required minLength={6} />
                </div>
              </div>
            )}

            {!isSignUp && !isForgot && !isRecovery && (
              <div className="flex justify-end">
                <button type="button" onClick={() => setIsForgot(true)} className="text-xs font-medium text-primary hover:underline">
                  ลืมรหัสผ่าน?
                </button>
              </div>
            )}

            <Button type="submit" className="w-full font-bold shadow-sm" disabled={loading}>
              {loading ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" /> กำลังดำเนินการ...</>) : (
                isRecovery ? 'บันทึกรหัสผ่านใหม่' :
                isForgot ? 'ส่งลิงก์รีเซ็ต' :
                isSignUp ? <><UserPlus className="mr-2 h-4 w-4" /> สมัครสมาชิก</> :
                <><LogIn className="mr-2 h-4 w-4" /> เข้าสู่ระบบ</>
              )}
            </Button>
          </form>

          {!isRecovery && (
            <>
              <div className="relative"><div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border" /></div><div className="relative flex justify-center text-xs uppercase"><span className="bg-background px-2 text-muted-foreground">หรือ</span></div></div>
              <div className="text-center text-sm">
                {isForgot ? (
                  <button type="button" onClick={() => setIsForgot(false)} className="font-semibold text-primary hover:underline">กลับไปเข้าสู่ระบบ</button>
                ) : (
                  <>
                    <span className="text-muted-foreground">{isSignUp ? "มีบัญชีอยู่แล้ว? " : "ยังไม่มีบัญชี? "}</span>
                    <button type="button" onClick={() => { setIsSignUp(!isSignUp); setIsForgot(false) }} className="font-semibold text-primary hover:underline transition-all">{isSignUp ? "เข้าสู่ระบบ" : "สมัครสมาชิกเลย"}</button>
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
