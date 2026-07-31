import { useState } from 'react'
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import {
  LayoutDashboard,
  Calendar,
  Image as ImageIcon,
  History,
  Users,
  Menu,
  LogOut,
  Sparkles,
} from 'lucide-react'

export default function Layout() {
  const { user, isAdmin, signOut } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleLogout = () => {
    signOut()
    navigate('/login')
  }

  const navItems = [
    { label: 'Painel', path: '/', icon: LayoutDashboard },
    { label: 'Agendas', path: '/agendas', icon: Calendar },
    { label: 'Posts', path: '/posts', icon: ImageIcon },
    { label: 'Logs de Automação', path: '/logs', icon: History },
    ...(isAdmin ? [{ label: 'Usuários', path: '/usuarios', icon: Users }] : []),
  ]

  const getInitials = (name?: string, email?: string) => {
    if (name && name.trim()) {
      return name
        .split(' ')
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    }
    return email ? email[0].toUpperCase() : 'U'
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans text-slate-900">
      <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/95 backdrop-blur shadow-subtle">
        <div className="max-w-7xl mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link
            to="/"
            className="flex items-center gap-2 font-bold text-xl text-indigo-600 hover:text-indigo-700 transition"
          >
            <div className="bg-indigo-600 text-white p-1.5 rounded-lg">
              <Sparkles className="h-5 w-5" />
            </div>
            <span>MarketingADM</span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive =
                location.pathname === item.path ||
                (item.path !== '/' && location.pathname.startsWith(item.path))
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-indigo-50 text-indigo-600'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              )
            })}
          </nav>

          <div className="flex items-center gap-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="relative h-9 w-9 rounded-full ring-2 ring-indigo-100 hover:ring-indigo-300"
                >
                  <Avatar className="h-9 w-9 bg-indigo-600 text-white">
                    <AvatarFallback className="bg-indigo-600 text-white font-semibold text-xs">
                      {getInitials(user?.name, user?.email)}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user?.name || 'Usuário'}</p>
                    <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
                    <span className="mt-1 inline-flex w-fit items-center rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-semibold text-indigo-700 uppercase">
                      {user?.role || 'analyst'}
                    </span>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="text-red-600 cursor-pointer focus:text-red-600 focus:bg-red-50"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sair</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden text-slate-600">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72 p-0">
                <SheetHeader className="p-4 border-b text-left">
                  <SheetTitle className="flex items-center gap-2 text-indigo-600">
                    <Sparkles className="h-5 w-5" />
                    <span>MarketingADM</span>
                  </SheetTitle>
                </SheetHeader>
                <div className="flex flex-col py-4 px-2 space-y-1">
                  {navItems.map((item) => {
                    const Icon = item.icon
                    const isActive = location.pathname === item.path
                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        onClick={() => setMobileOpen(false)}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium ${
                          isActive
                            ? 'bg-indigo-50 text-indigo-600 font-semibold'
                            : 'text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        <Icon className="h-5 w-5" />
                        {item.label}
                      </Link>
                    )
                  })}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 md:px-6 lg:px-8 py-6">
        <Outlet />
      </main>

      <footer className="border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>© 2026 MarketingADM. Automação de Posts para Instagram.</p>
          <div className="flex gap-4 text-slate-400">
            <span className="hover:text-slate-600 cursor-pointer">Termos de Uso</span>
            <span className="hover:text-slate-600 cursor-pointer">Privacidade</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
