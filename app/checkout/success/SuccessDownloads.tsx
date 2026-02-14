'use client'

import DownloadButton from '@/components/ui/DownloadButton'

interface SuccessDownloadsProps {
  trackId: string
  trackTitle: string
  acapellaUrl: string | null
  instrumentalUrl: string | null
  licensePdfUrl: string | null
  lyricsPdfUrl: string | null
}

export default function SuccessDownloads({
  trackId,
  trackTitle,
  acapellaUrl,
  instrumentalUrl,
  licensePdfUrl,
  lyricsPdfUrl,
}: SuccessDownloadsProps) {
  return (
    <div className="flex flex-wrap items-center justify-end gap-1.5">
      {acapellaUrl && (
        <DownloadButton
          href={`/api/downloads/${trackId}?type=acapella`}
          label="Acapella"
          ariaLabel={`Download acapella for ${trackTitle}`}
          title="Download Acapella"
        />
      )}
      {instrumentalUrl && (
        <DownloadButton
          href={`/api/downloads/${trackId}?type=instrumental`}
          label="Stems"
          ariaLabel={`Download instrumental for ${trackTitle}`}
          title="Download Instrumental"
        />
      )}
      {licensePdfUrl && (
        <DownloadButton
          href={`/api/downloads/${trackId}?type=license`}
          label="License"
          ariaLabel={`Download license for ${trackTitle}`}
          title="Download License PDF"
        />
      )}
      {lyricsPdfUrl && (
        <DownloadButton
          href={`/api/downloads/${trackId}?type=lyrics`}
          label="Lyrics"
          ariaLabel={`Download lyrics for ${trackTitle}`}
          title="Download Lyrics PDF"
        />
      )}
    </div>
  )
}
