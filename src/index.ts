import EventEmitter from 'events'
import https from 'https'
import querystring from 'querystring'
import coordinateDistance from './coordinateDistance'
import dmvInfo from './dmvInfo.json'
import { DmvLocation, Settings } from './types/index'

export = class Poller extends EventEmitter {
  public results: any[]
  private settings: Settings
  constructor (settings: Settings) {
    super()
    this.settings = settings
    this.results = []
  }
  public check () {
    return new Promise(async (resolve, reject) => {
      try {
        const validDmvLocations = await this.getNearbyDMVs()

        for (const dmvOffice of validDmvLocations) {
          try {
            const responseString = await this.makeDMVRequest(dmvOffice)
            this.checkAppointmentResult(dmvOffice.name, responseString)
          } catch (e) {
            return reject(e)
          }
        }
      } catch (e) {
        return reject(e)
      }
      resolve(this.results)
    })
  }
  public getHomeLocation (): Promise<any> {
    return new Promise(async (resolve, reject) => {
      const { settings } = this
      if (settings.zipCode) {
        const zipCode = ((await import('./zipCodes.json')) as any)[
          settings.zipCode
        ]
        if (zipCode) {
          resolve({ lat: zipCode[0], lng: zipCode[1] })
        } else {
          return reject(
            new Error(
              'Unable to find coordinates of zip code. Make sure it is a valid California zip code.'
            )
          )
        }
      } else if (settings.address) {
        const postData: { [index: string]: any } = {
          address: settings.address,
          benchmark: 4,
          format: 'json'
        }

        const postString = querystring.stringify(postData)
        const options = {
          host: 'geocoding.geo.census.gov',
          method: 'GET',
          path: '/geocoder/locations/onelineaddress?' + postString,
          port: 443
        }

        https
          .request(options, (res) => {
            res.setEncoding('utf-8')
            let responseString = ''

            res.on('data', (data) => {
              responseString += data
            })
            res.on('end', () => {
              try {
                const { result } = JSON.parse(responseString)
                const addressMatches = result.addressMatches
                const coords = addressMatches[0].coordinates
                resolve({ lat: coords.y, lng: coords.x })
              } catch {
                return reject(
                  new Error(
                    'Unable to determine location. Make sure you are provided a valid address.'
                  )
                )
              }
            })
            res.on('error', (e) => {
              return reject(e)
            })
          })
          .end()
      } else {
        return reject(
          new Error('Please provide either an address or a zip code.')
        )
      }
    })
  }
  public getNearbyDMVs (): Promise<DmvLocation[]> {
    return new Promise(async (resolve, reject) => {
      const coordinates: {
        lat: number;
        lng: number;
      } =
        this.settings.coords ||
        (await this.getHomeLocation().catch((e) => {
          return reject(e)
        }))
      const validDmvLocations: DmvLocation[] = []
      try {
        Object.keys(dmvInfo).forEach((dmvName) => {
          const officeInfo = (dmvInfo as any)[dmvName]
          const distance = coordinateDistance(
            coordinates.lat,
            coordinates.lng,
            officeInfo.lat,
            officeInfo.lng
          )
          if (distance <= this.settings.maxDistanceMiles) {
            validDmvLocations.push({
              ...officeInfo,
              distance,
              name: dmvName
            })
          }
        })
        this.emit('getDmvLocations', validDmvLocations)
        resolve(validDmvLocations)
      } catch (e) {
        return reject(e)
      }
    })
  }
  public getPath () {
    if (this.settings.mode === 'DriveTest') {
      return '/wasapp/foa/findDriveTest.do'
    } else {
      return '/wasapp/foa/findOfficeVisit.do'
    }
  }
  public makeDMVRequest (officeInfo: DmvLocation): Promise<string> {
    const { settings } = this
    return new Promise((resolve, reject) => {
      const postData: { [index: string]: any } = {
        mode: settings.mode,
        numberItems: settings.itemsToProcess,
        officeId: officeInfo.id,
        ...settings.appointmentInfo
      }
      if (settings.mode === 'OfficeVisit') {
        settings.appointmentTypes.forEach((type) => {
          postData[`task${type}`] = true
        })
      } else if (settings.mode !== 'DriveTest') {
        return reject(
          new Error(
            'Please make sure the mode is set to "OfficeVisit" or "DriveTest"'
          )
        )
      }

      const postString = querystring.stringify(postData)

      const options = {
        headers: {
          'Content-Length': postString.length,
          'Content-Type': 'application/x-www-form-urlencoded',
          // tslint:disable-next-line
          Referer: `https://www.dmv.ca.gov${this.getPath()}`,
          'User-Agent':
            'Mozilla/5.0 (Windows; U; Windows NT 5.1; en-US; rv:1.8.1.13) Gecko/20080311 Firefox/2.0.0.13'
        },
        host: 'www.dmv.ca.gov',
        method: 'POST',
        path: this.getPath(),
        port: 443
      }

      const req = https.request(options, (res) => {
        res.setEncoding('utf-8')
        let responseString = ''

        res.on('data', (data) => {
          responseString += data
        })
        res.on('end', () => {
          resolve(responseString)
        })
        req.on('error', (e) => {
          reject(e)
        })
      })
      req.write(postString)
      req.end()
    })
  }
  public checkAppointmentResult (name: string, body: string) {
    const dateMatch = body.match(
      / .*, .* \d{1,2}, \d{4} at \d{1,2}:\d{2} (AM|PM)/
    )
    if (!dateMatch || dateMatch.length < 1) {
      throw new Error(
        // tslint:disable-next-line
        "Either your appointment info was incorrect, or the DMV has blocked your IP address temporarily for making too many requests."
      )
    }
    const dateString = dateMatch[0].replace(' at', ',')
    const date = new Date(Date.parse(dateString))
    const timeDiff = date.getTime() - new Date().getTime()
    const daysUntil = timeDiff / 1000 / 60 / 60 / 24
    const result = {
      date,
      daysUntil,
      location: name
    }
    this.results.push(result)
    this.emit('findLocation', result)
  }
}
