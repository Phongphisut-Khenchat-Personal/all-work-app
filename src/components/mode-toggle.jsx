import { Moon, Sun, Palette } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useTheme } from "@/components/theme-provider"

export function ModeToggle() {
  const { setTheme, theme } = useTheme()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" className="border-zinc-500/30 bg-transparent relative overflow-hidden transition-all duration-300">
          {theme === 'pride' ? (
             <Palette className="h-[1.2rem] w-[1.2rem] text-pink-500 animate-pulse" />
          ) : (
             <>
                <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
             </>
          )}
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setTheme("light")}>
          <Sun className="mr-2 h-4 w-4" /> สว่าง (Light)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("dark")}>
          <Moon className="mr-2 h-4 w-4" /> มืด (Dark)
        </DropdownMenuItem>
        
        {/* เมนู Pride สีรุ้ง */}
        <DropdownMenuItem onClick={() => setTheme("pride")} className="font-bold text-pink-600 focus:text-pink-700 focus:bg-pink-50">
          <Palette className="mr-2 h-4 w-4" /> Pride Month 🏳️‍🌈
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={() => setTheme("system")}>
          ตามระบบ (System)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}