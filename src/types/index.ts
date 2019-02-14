interface AppointmentInfo {
  firstName: string
  lastName: string
  telArea: number
  telPrefix: number
  telSuffix: number
  dlNumber?: string
  birthMonth?: string
  birthDay?: string
  birthYear?: string
  requestedTask?: 'DT' | 'MC'
  safetyCourseCompletedSelection: 'TRUE' | 'FALSE'
}

export interface Settings {
  /** Number of items that user would like to process */
  itemsToProcess: number
  /** The address from which to search for DMV offices */
  address?: string
  /** The zip code from which to search for DMV offices */
  zipCode?: string
  /** The coordinates from which to search for DMV offices */
  coords?: {
    lat: string
    lng: string
  }
  /** The distance from the address to search for DMV offices */
  maxDistanceMiles: number
  /** Type of test to poll for. Either DriveTest or OfficeVisit */
  mode: 'OfficeVisit' | 'DriveTest'
  /** User's appointment information */
  appointmentInfo: AppointmentInfo
  /** Type of appointment. Office Visit only. */
  appointmentTypes: Array<'CID' | 'RID' | 'VR'>
}

export interface DmvLocation {
  name: string
  distance: number
  id: number
  lat: number
  lng: number
}

export interface Result {
  /** The date of the appointment */
  date?: Date
  /** How many days until the appointment */
  daysUntil?: number
  /** ID of the DMV Office */
  id: number
  /** Name of the DMV Office */
  location: string
  /** Whether or not the request failed */
  hasFailed?: boolean
  /** Cause of the failure */
  cause?: 'timeout' | 'unknown'
  /** Data received from DMV server if the request failed */
  response?: string
}
