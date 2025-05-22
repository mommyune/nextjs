"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { UAParser } from "ua-parser-js"
import { differenceInHours, differenceInMinutes, format } from "date-fns"

import { authClient } from "@/lib/auth-client"
import type { Session } from "@/lib/auth-types"

import { MobileIcon } from "@radix-ui/react-icons"
import { ArrowUpDown, Laptop, Loader2, Search, X } from "lucide-react"

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  Table,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableBody,
} from "@/components/ui/table"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Skeleton } from "@/components/ui/skeleton"

import { IpLookupTool } from "./ip-lookup"

// Helper to format relative time nicely
function formatRelativeTime(date: Date): string {
  const now = new Date()
  const diffHours = differenceInHours(now, date)

  if (diffHours < 12) {
    const diffMinutes = differenceInMinutes(now, date)
    if (diffMinutes < 1) return "Just now"
    if (diffMinutes < 60)
      return `${diffMinutes} minute${diffMinutes > 1 ? "s" : ""} ago`
    return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`
  }

  return format(date, "PPP HH:mm")
}

export default function Sessions(props: {
  session: Session | null
  activeSessions: Session["session"][]
}) {
  const router = useRouter()
  const [isTerminating, setIsTerminating] = useState<string>()
  const [searchTerm, setSearchTerm] = useState("")
  const [sortAsc, setSortAsc] = useState(false)
  const [selectedSessions, setSelectedSessions] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedIp, setSelectedIp] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const sessionsPerPage = 15

  // Sort sessions by createdAt
  const sortedSessions = [...props.activeSessions]
    .filter((session) => session.userAgent && session.createdAt && session.ipAddress)
    .sort((a, b) => {
      const aTime = new Date(a.createdAt).getTime()
      const bTime = new Date(b.createdAt).getTime()
      return sortAsc ? aTime - bTime : bTime - aTime
    })

  // Filter sessions by search term in userAgent, OS, browser, or IP address
  const filteredSessions = sortedSessions.filter((session) => {
    const parser = new UAParser(session.userAgent || "")
    const os = parser.getOS().name?.toLowerCase() || ""
    const browser = parser.getBrowser().name?.toLowerCase() || ""
    const ip = session.ipAddress?.toLowerCase() || ""
    const ua = session.userAgent?.toLowerCase() || ""
    const term = searchTerm.toLowerCase()
    return ua.includes(term) || os.includes(term) || browser.includes(term) || ip.includes(term)
  })

  // Pagination calculations
  const totalPages = Math.ceil(filteredSessions.length / sessionsPerPage)
  const paginatedSessions = filteredSessions.slice(
    (currentPage - 1) * sessionsPerPage,
    currentPage * sessionsPerPage,
  )

  // Handler to revoke all other sessions except current
  const handleRevoke = async () => {
    setLoading(true)
    try {
      await authClient.revokeOtherSessions()
      toast.success("All other sessions revoked.")
      window.location.reload()
    } catch {
      toast.error("Failed to revoke sessions.")
    } finally {
      setLoading(false)
    }
  }

  // Handler for IP Lookup button click
  function IpLookup(e: React.MouseEvent) {
    e.stopPropagation()
    const row = (e.currentTarget as HTMLElement).closest("tr")
    if (!row) return

    const ipCell = row.querySelector("td:nth-child(5)")
    if (!ipCell) return

    const ipButton = ipCell.querySelector("button:first-child")
    if (!ipButton) return

    const ipAddress = ipButton.textContent?.trim()
    if (!ipAddress || ipAddress === "—") {
      toast.error("No valid IP address found")
      return
    }

    setSelectedIp(ipAddress)
  }

  return (
    <div className="flex flex-col lg:flex-row gap-4">
      {/* Left side: Sessions Table */}
      <div className="flex-1">
        <Card>
          <CardContent className="pt-6">
            {/* Search input */}
            <div className="flex items-center mb-4 justify-between max-w-full">
              <div className="flex items-center gap-2 max-w-sm w-full">
                <div className="relative w-full">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4 pointer-events-none" />
                  <Input
                    type="text"
                    placeholder="Search by Device, Browser, or IP Address"
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value)
                      setCurrentPage(1)
                    }}
                    className="pl-9 pr-4"
                  />
                </div>
                {searchTerm && (
                  <Button
                    onClick={() => setSearchTerm("")}
                    variant="destructive"
                    size="icon"
                    className="cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          </CardContent>

          {/* Sessions Table */}
          <Table className="min-w-[740px]">
            <TableHeader className="bg-muted">
              <TableRow>
                <TableHead>
                  {/* Select All checkbox */}
                  <Button size="sm" variant="ghost">
                    <Checkbox
                      checked={
                        filteredSessions.length > 0 &&
                        selectedSessions.length ===
                          filteredSessions.filter(
                            (s) => s.id !== props.session?.session.id,
                          ).length
                      }
                      onCheckedChange={(checked) => {
                        if (checked) {
                          const tokensToAdd = filteredSessions
                            .filter((s) => s.id !== props.session?.session.id)
                            .map((s) => s.token)
                          setSelectedSessions(tokensToAdd)
                        } else {
                          setSelectedSessions([])
                        }
                      }}
                    />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button size="sm" variant="ghost">
                    Device
                  </Button>
                </TableHead>
                <TableHead>
                  <Button size="sm" variant="ghost">
                    Browser
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setSortAsc((prev) => !prev)}
                  >
                    Sign in date <ArrowUpDown />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button size="sm" variant="ghost">
                    IP address
                  </Button>
                </TableHead>
                <TableHead className="text-right">
                  {selectedSessions.length > 0 ? (
                    <Button
                      onClick={async () => {
                        setLoading(true)
                        try {
                          await Promise.all(
                            selectedSessions.map((token) =>
                              authClient.revokeSession({ token }),
                            ),
                          )
                          toast.success("Selected sessions terminated.")
                          window.location.reload()
                        } catch {
                          toast.error("Failed to terminate sessions.")
                        } finally {
                          setLoading(false)
                        }
                      }}
                      variant="destructive"
                      disabled={loading}
                      className="cursor-pointer w-[140px]"
                    >
                      {loading
                        ? "Terminating..."
                        : `Revoke selected: ${selectedSessions.length}`}
                    </Button>
                  ) : (
                    <Button
                      onClick={handleRevoke}
                      variant="destructive"
                      disabled={loading}
                      className="cursor-pointer w-[140px]"
                    >
                      {loading ? "Terminating..." : `Revoke other`}
                    </Button>
                  )}
                </TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {paginatedSessions.length === 0
                ? [...Array(sessionsPerPage)].map((_, i) => (
                    <TableRow key={`skeleton-${i}`}>
                      {[...Array(6)].map((_, j) => (
                        <TableCell key={j}>
                          <Skeleton />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                : [
                    ...paginatedSessions.map((session) => {
                      const parser = new UAParser(session.userAgent || "")
                      const deviceType = parser.getDevice().type
                      const osName = parser.getOS().name
                      const browserName = parser.getBrowser().name

                      return (
                        <TableRow key={session.id}>
                          <TableCell>
                            <Button size="sm" variant="ghost">
                              <Checkbox
                                checked={selectedSessions.includes(session.token)}
                                onCheckedChange={(checked) => {
                                  setSelectedSessions((prev) =>
                                    checked
                                      ? [...prev, session.token]
                                      : prev.filter((token) => token !== session.token),
                                  )
                                }}
                                disabled={session.id === props.session?.session.id}
                              />
                            </Button>
                          </TableCell>
                          <TableCell>
                            <SearchButton
                              term={osName}
                              setSearchTerm={setSearchTerm}
                              icon={
                                deviceType === "mobile" ? (
                                  <MobileIcon />
                                ) : (
                                  <Laptop size={16} />
                                )
                              }
                            />
                          </TableCell>
                          <TableCell>
                            <SearchButton term={browserName} setSearchTerm={setSearchTerm} />
                          </TableCell>
                          <TableCell>
                            <Button size="sm" variant="ghost">
                              {formatRelativeTime(new Date(session.createdAt))}
                            </Button>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <SearchButton term={session.ipAddress || ""} setSearchTerm={setSearchTerm} />
                              <div className="ml-auto">
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button size="icon" variant="ghost" onClick={IpLookup}>
                                        <Search />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Lookup IP</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              className="cursor-pointer"
                              variant={
                                session.id === props.session?.session.id
                                  ? "destructive"
                                  : "outline"
                              }
                              disabled={session.id === props.session?.session.id}
                              onClick={async () => {
                                setIsTerminating(session.id)
                                const res = await authClient.revokeSession({
                                  token: session.token,
                                })

                                if (res.error) {
                                  toast.error(res.error.message)
                                } else {
                                  toast.success("Session terminated")
                                }

                                router.refresh()
                                setIsTerminating(undefined)
                              }}
                            >
                              {isTerminating === session.id ? (
                                <Loader2 size={15} className="animate-spin" />
                              ) : session.id === props.session?.session.id ? (
                                "Sign Out"
                              ) : (
                                "Revoke"
                              )}
                            </Button>
                          </TableCell>
                        </TableRow>
                      )
                    }),
                    // Fill remaining rows with skeletons to maintain consistent height
                    ...[...Array(sessionsPerPage - paginatedSessions.length)].map((_, i) => (
                      <TableRow key={`skeleton-${i}`}>
                        {[...Array(6)].map((_, j) => (
                          <TableCell key={j}>
                            <Skeleton className="h-5 w-full" />
                          </TableCell>
                        ))}
                      </TableRow>
                    )),
                  ]}
            </TableBody>
          </Table>

          {/* Pagination controls */}
          <div className="flex justify-between items-center mt-4 px-6 pb-4">
            <span className="text-sm text-muted-foreground">
              Page {currentPage} of {totalPages}
            </span>
            <div className="flex gap-2">
              <Button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                variant="outline"
              >
                Previous
              </Button>
              <Button
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                variant="outline"
              >
                Next
              </Button>
            </div>
          </div>
        </Card>
      </div>

      {/* Right side: IP Lookup Tool */}
      <div className="lg:w-[350px] xl:w-[430px]">
        {selectedIp ? (
          <IpLookupTool ipAddress={selectedIp} />
        ) : (
          <IpLookupTool />
          // Alternatively:
          // <div className="p-4 text-center text-muted-foreground">
          //   No IP selected. Click the search button to lookup an IP.
          // </div>
        )}
      </div>
    </div>
  )
}

interface SearchButtonProps {
  term?: string
  setSearchTerm: (term: string) => void
  icon?: React.ReactNode
}

export function SearchButton({ term, setSearchTerm, icon }: SearchButtonProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            onClick={() => term && setSearchTerm(term)}
            disabled={!term}
            variant="ghost"
            size="sm"
            aria-label={term ? `Search ${term}` : "No data to search"}
          >
            {icon && <span className="flex items-center">{icon}</span>}
            <span>{term ?? "—"}</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{term ? `Search ${term}` : "No data to search"}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}