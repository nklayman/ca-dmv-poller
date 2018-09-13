interface AppointmentInfo {
  firstName: string
  lastName: string
  telArea: number
  telPrefix: number
  telSuffix: number
  dlNumber?: ''
  birthMonth?: ''
  birthDay?: ''
  birthYear?: ''
}

export interface Settings {
  itemsToProcess: number
  /** The address from which to search for DMV offices */
  address: string
  /** The distance from the address to search for DMV offices */
  maxDistanceMiles: number
  /** Type of test to poll for. Either DriveTest or OfficeVisit */
  mode: 'OfficeVisit' | 'DriveTest'
  /** User's appointment information */
  appointmentInfo: AppointmentInfo
  /** Type of appointment. Office Visit only. */
  appointmentType: 'CID' | 'RID' | 'VR'
}

export interface DmvLocation {
  name: string
  distance: number
  id: number
  lat: number
  lng: number
}
