"use client"

import React, { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { Link, useLocation } from "react-router-dom"
import { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface NavItem {
  name: string
  url: string
  icon: LucideIcon
}

interface MobileNavProps {
  items: NavItem[]
  className?: string
}

export function MobileNav({ items, className }: MobileNavProps) {
  const location = useLocation()
  const [activeTab, setActiveTab] = useState("")
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768)
    }

    handleResize()
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  useEffect(() => {
    // Set active tab based on current location
    const currentItem = items.find(item => location.pathname === item.url)
    if (currentItem) {
      setActiveTab(currentItem.name)
    }
  }, [location.pathname, items])

  if (!isMobile) return null

  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ 
        type: "spring",
        stiffness: 300,
        damping: 30,
        delay: 0.1
      }}
      className={cn(
        "fixed bottom-6 left-1/2 -translate-x-1/2 z-50",
        className,
      )}
    >
      <div className="flex items-center gap-2 bg-white/90 border border-psychPurple/10 backdrop-blur-xl py-2 px-2 rounded-full shadow-lg shadow-psychPurple/10">
        {items.map((item) => {
          const Icon = item.icon
          const isActive = activeTab === item.name

          return (
            <Link
              key={item.name}
              to={item.url}
              onClick={() => setActiveTab(item.name)}
              className={cn(
                "relative cursor-pointer text-sm font-medium px-4 py-3 rounded-full transition-all duration-300",
                "text-psychText/60 hover:text-psychPurple active:scale-95",
                isActive && "text-psychPurple",
              )}
            >
              <motion.div
                className="flex items-center justify-center"
                whileTap={{ scale: 0.95 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
              >
                <Icon size={20} strokeWidth={2.5} />
              </motion.div>
              
              {isActive && (
                <motion.div
                  layoutId="lamp"
                  className="absolute inset-0 w-full bg-psychPurple/10 rounded-full -z-10"
                  initial={false}
                  transition={{
                    type: "spring",
                    stiffness: 300,
                    damping: 30,
                  }}
                >
                  {/* Lamp effect */}
                  <motion.div 
                    className="absolute -top-3 left-1/2 -translate-x-1/2 w-8 h-1.5 bg-psychPurple rounded-t-full"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 }}
                  >
                    {/* Glow effects */}
                    <div className="absolute w-12 h-8 bg-psychPurple/20 rounded-full blur-md -top-3 -left-2" />
                    <div className="absolute w-8 h-6 bg-psychPurple/30 rounded-full blur-md -top-2" />
                    <div className="absolute w-4 h-4 bg-psychPurple/40 rounded-full blur-sm top-0 left-2" />
                  </motion.div>
                </motion.div>
              )}
            </Link>
          )
        })}
      </div>
    </motion.div>
  )
} 