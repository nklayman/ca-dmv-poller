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
  itemsToProcess: number
  /** The address from which to search for DMV offices */
  address?: string
  /** The zip code from which to search for DMV offices */
  zipCode?: string
  /** The coordinates from which to search for DMV offices */
  coords?: {
    lat: string;
    lng: string;
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
