"use client"

import { useState, useEffect } from "react"
import { Loader2, Globe, ExternalLink, Building2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"

interface IpLookupData {
  region: string
  country: string
  city: string
  lat: number
  lon: number
  isp: string
  as: string
}

interface IpInfoCardProps {
  ipAddress?: string
}

export function IpLookupTool({ ipAddress }: IpInfoCardProps) {
  const [ipData, setIpData] = useState<IpLookupData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!ipAddress) {
      setIpData(null)
      setError(null)
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    fetch(`https://ipwho.is/${ipAddress}`)
      .then(res => res.json())
      .then(data => {
        if (!data.success) throw new Error(data.message || "IP lookup failed")

        setIpData({
          region: data.region || "",
          country: data.country || "",
          city: data.city || "",
          lat: data.latitude || 0,
          lon: data.longitude || 0,
          isp: data.connection?.isp || "",
          as: data.connection?.asn || "",
        })
      })
      .catch(err => {
        setError(err instanceof Error ? err.message : "Failed to fetch IP data")
        setIpData(null)
      })
      .finally(() => setLoading(false))
  }, [ipAddress])

  const osmViewUrl = ipData
    ? `https://www.openstreetmap.org/?mlat=${ipData.lat}&mlon=${ipData.lon}#map=14/${ipData.lat}/${ipData.lon}`
    : "#"

  const osmMapUrl = ipData
    ? `https://www.openstreetmap.org/export/embed.html?bbox=${ipData.lon - 0.02},${ipData.lat - 0.02},${ipData.lon + 0.02},${ipData.lat + 0.02}&layer=mapnik&marker=${ipData.lat},${ipData.lon}`
    : ""

  return (
    <Card className="w-full h-full">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base font-medium">
          <Globe className="h-4 w-4" />
          IP Lookup: {ipAddress || "No IP selected"}
        </CardTitle>
      </CardHeader>

      <CardContent>
        {(!ipAddress || loading) ? (
          <LoadingState loading={loading} />
        ) : error ? (
          <ErrorState error={error} />
        ) : ipData ? (
          <ResultDisplay ipData={ipData} osmMapUrl={osmMapUrl} osmViewUrl={osmViewUrl} />
        ) : null}
      </CardContent>
    </Card>
  )
}

function LoadingState({ loading }: { loading: boolean }) {
  return (
    <div className="space-y-4">
      <Skeleton className="w-full aspect-video rounded-md" />
      <div className="grid grid-cols-2 gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i}>
            <Skeleton className="h-4 w-1/2 mb-1" />
            <Skeleton className="h-6 w-3/4" />
          </div>
        ))}
      </div>
      <Separator className="my-2" />
      <Skeleton className="h-6 w-32 rounded-full" />
      {loading && (
        <div className="flex items-center justify-center pt-4">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          <span className="ml-2 text-sm text-muted-foreground">Looking up IP information...</span>
        </div>
      )}
    </div>
  )
}

function ErrorState({ error }: { error: string }) {
  return (
    <>
      <div className="relative overflow-hidden rounded-md border bg-red-100 p-6 flex items-center justify-center text-red-700 font-semibold text-center aspect-video">
        Error: {error}
      </div>
      <LoadingState loading={false} />
    </>
  )
}

function ResultDisplay({
  ipData,
  osmMapUrl,
  osmViewUrl,
}: {
  ipData: IpLookupData
  osmMapUrl: string
  osmViewUrl: string
}) {
  return (
    <div className="space-y-4">
      <div className="relative overflow-hidden rounded-md border">
        <div className="aspect-video w-full">
          <iframe
            src={osmMapUrl}
            className="h-full w-full border-0"
            title="IP Location Map"
            loading="lazy"
            allowFullScreen
          />
        </div>
        <div className="absolute bottom-2 right-2">
          <Button
            size="sm"
            onClick={() => window.open(osmViewUrl, "_blank")}
            className="flex items-center gap-1 cursor-pointer"
          >
            <span>View in Maps</span>
            <ExternalLink className="h-3 w-3" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <InfoItem label="Country" value={ipData.country} />
        <InfoItem label="ISP" value={ipData.isp} />
        <InfoItem label="Region" value={ipData.region} />
        <InfoItem label="ASN" value={ipData.as} />
        <InfoItem label="City" value={ipData.city} />
        <div>
          <h3 className="text-sm font-medium">Coordinates</h3>
          <p className="text-base">{ipData.lat}, {ipData.lon}</p>
        </div>
      </div>

      <Separator className="my-2" />

      <div className="flex flex-wrap gap-2">
        <Badge variant="secondary" className="flex items-center gap-1">
          <Building2 className="h-3 w-3" />
          Data provided by ipwhois.io
        </Badge>
      </div>
    </div>
  )
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <h3 className="text-sm font-medium">{label}</h3>
      <p className="text-base">{value}</p>
    </div>
  )
}
