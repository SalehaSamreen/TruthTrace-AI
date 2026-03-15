import piexif from 'piexifjs';

export interface MetadataInfo {
  hasExif: boolean;
  cameraModel?: string;
  dateTime?: string;
  software?: string;
  gps?: { lat: number; lng: number };
  compressionLevel?: number;
}

export async function analyzeMetadata(imageBuffer: Buffer): Promise<MetadataInfo> {
  try {
    const hexString = imageBuffer.toString('binary');
    const exifData = piexif.load(hexString);

    const info: MetadataInfo = {
      hasExif: !!(exifData && Object.keys(exifData).length > 0),
    };

    // Extract camera info safely
    if (exifData && exifData['0th']) {
      const ifd0 = exifData['0th'] as Record<number, any>;
      try {
        if (ifd0[piexif.ImageIFD.Model]) {
          const modelData = ifd0[piexif.ImageIFD.Model];
          info.cameraModel = Array.isArray(modelData) ? modelData[0] : modelData;
        }
        if (ifd0[piexif.ImageIFD.DateTime]) {
          const dateData = ifd0[piexif.ImageIFD.DateTime];
          info.dateTime = Array.isArray(dateData) ? dateData[0] : dateData;
        }
        if (ifd0[piexif.ImageIFD.Software]) {
          const softwareData = ifd0[piexif.ImageIFD.Software];
          info.software = Array.isArray(softwareData) ? softwareData[0] : softwareData;
        }
      } catch (e) {
        // Silent fail on metadata extract
      }
    }

    // Extract GPS if available
    if (exifData && exifData['GPS']) {
      try {
        const gpsData = exifData['GPS'] as Record<number, any>;
        if (gpsData[piexif.GPSIFD.GPSLatitude] && gpsData[piexif.GPSIFD.GPSLongitude]) {
          const lat = gpsData[piexif.GPSIFD.GPSLatitude];
          const lng = gpsData[piexif.GPSIFD.GPSLongitude];
          if (Array.isArray(lat) && Array.isArray(lng) && lat.length >= 3 && lng.length >= 3) {
            info.gps = {
              lat:
                lat[0][0] / lat[0][1] +
                lat[1][0] / lat[1][1] / 60 +
                lat[2][0] / lat[2][1] / 3600,
              lng:
                lng[0][0] / lng[0][1] +
                lng[1][0] / lng[1][1] / 60 +
                lng[2][0] / lng[2][1] / 3600,
            };
          }
        }
      } catch (e) {
        // Silent fail on GPS extract
      }
    }

    return info;
  } catch (e) {
    return { hasExif: false };
  }
}

export function getCompressionAnomaly(fileSize: number, width: number, height: number): number {
  // Estimate expected compressed size and compare
  const pixels = width * height;
  const estimatedSize = pixels * 0.1; // Rough estimate for typical JPEG

  if (fileSize < estimatedSize * 0.3) {
    return 2; // Very compressed, unusual
  } else if (fileSize > estimatedSize * 2) {
    return 1; // Lightly compressed
  }
  return 0; // Normal compression
}
