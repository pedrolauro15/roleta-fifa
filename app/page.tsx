'use client'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { teams } from '@/mock/teams'
import dynamic from 'next/dynamic'
import Image from 'next/image'
import { useState } from 'react'

const SpinWheel = dynamic(() => import('@/components/custom/spinWheel'), {
  loading: () => <p>Carregando...</p>,
  ssr: false,
})

export default function Home() {
  const [team, setTeam] = useState<null | {
    name: string
    color: string
    icon: string
    primaryColor: string
    contrastColor: string
  }>(null)
  const [open, setOpen] = useState(false)
  function onTeamSelected(team: string) {
    const selection = teams.find((teamL) => teamL.name === team)
    setTeam(selection || null)
    setOpen(true)
  }

  return (
    <div className="w-screen h-screen flex items-center justify-center">
      <SpinWheel
        buttonText="Girar"
        segments={teams.map((team) => ({
          segmentText: team.name,
          segColor: team.primaryColor,
          textColor: team.contrastColor,
          icon: team.icon,
        }))}
        onFinished={onTeamSelected}
      />
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resultado</DialogTitle>
          </DialogHeader>
          <div className="flex items-center gap-4">
            {team && team.icon && (
              <Image
                src={team.icon}
                unoptimized
                width={40}
                height={40}
                alt={team.name}
              />
            )}
            <p>{team?.name}</p>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button>Fechar</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
