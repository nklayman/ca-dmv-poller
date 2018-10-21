import EventEmitter from 'events'
import https from 'https'
import querystring from 'querystring'
import coordinateDistance from './coordinateDistance'
import dmvInfo from './dmvInfo.json'
import { DmvLocation, Settings } from './types/index'

export default class Poller extends EventEmitter {
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
            this.checkAppointmentResult(
              dmvOffice.name,
              responseString,
              dmvOffice.id
            )
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
        const zipCode = (await import('./zipCodes.json'))[settings.zipCode]
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

        const req = https.request(options, (res) => {
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
                  'Unable to determine location. Make sure you are providing a valid address.'
                )
              )
            }
          })
          res.on('error', (e) => {
            return reject(e)
          })
        })
        req.on('error', () => {
          return reject(
            new Error('Unable to connect to US Census Geocoding service')
          )
        })
        req.end()
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
          const officeInfo = dmvInfo[dmvName]
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
        this.emit('findLocations', validDmvLocations)
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
  public getRequestString (id: number, stringify = true) {
    const { settings } = this
    const postData: { [index: string]: any } = {
      mode: settings.mode,
      numberItems: settings.itemsToProcess,
      officeId: id,
      ...settings.appointmentInfo
    }
    if (settings.mode === 'OfficeVisit') {
      settings.appointmentTypes.forEach((type) => {
        postData[`task${type}`] = true
      })
    } else if (settings.mode !== 'DriveTest') {
      throw new Error(
        'Please make sure the mode is set to "OfficeVisit" or "DriveTest"'
      )
    }

    if (stringify) {
      return querystring.stringify(postData)
    } else {
      return postData
    }
  }
  public makeDMVRequest (officeInfo: DmvLocation): Promise<string> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        // Fail location if requests takes longer than 20 seconds
        resolve('timeout')
      }, 15000)
      if (
        global.cordova &&
        global.cordova.plugin &&
        global.cordova.plugin.http
      ) {
        const options = {
          data: this.getRequestString(officeInfo.id, false),
          headers: {
            // 'Content-Length': postString.length,
            'Content-Type': 'application/x-www-form-urlencoded',
            // tslint:disable-next-line
            Referer: `https://www.dmv.ca.gov${this.getPath()}`,
            'User-Agent':
              'Mozilla/5.0 (Windows; U; Windows NT 5.1; en-US; rv:1.8.1.13) Gecko/20080311 Firefox/2.0.0.13'
          },
          method: 'POST'
        }
        global.cordova.plugin.http.sendRequest(
          `https://www.dmv.ca.gov${this.getPath()}`,
          options,
          (response: any) => {
            clearTimeout(timeout)
            resolve(response.data)
          },
          (e: Error) => {
            clearTimeout(timeout)
            return reject(e)
          }
        )
      } else {
        const postString = this.getRequestString(officeInfo.id)
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

        try {
          const req = https.request(options, (res) => {
            res.setEncoding('utf-8')
            let responseString = ''

            res.on('data', (data) => {
              responseString += data
            })
            res.on('end', () => {
              clearTimeout(timeout)
              resolve(responseString)
            })
            req.on('error', (e) => {
              clearTimeout(timeout)
              return reject(e)
            })
          })
          req.on('error', () => {
            clearTimeout(timeout)
            return reject(new Error('Could not connect to DMV servers'))
          })
          req.write(postString)
          req.end()
        } catch {
          clearTimeout(timeout)
          return reject(new Error('Could not connect to DMV servers'))
        }
      }
    })
  }
  public checkAppointmentResult (name: string, body: string, id: number) {
    const dateMatch = body.match(
      / .*, .* \d{1,2}, \d{4} at \d{1,2}:\d{2} (AM|PM)/
    )
    if (!dateMatch || dateMatch.length < 1) {
      if (/Please correct the following error\(s\)/.test(body)) {
        throw new Error(
          'It appears your appointment information was incorrect.'
        )
      } else if (
        body.match(
          'Sorry , you are ineligible to make a Behind-the-Wheel driving test appointment online.' +
            '  For additional information, please call 1-800-777-0133.'
        )
      ) {
        throw new Error(
          'You can only make a driving test appointment within 60 days of having your permit for 6 months.'
        )
      } else if (/The requested webpage was rejected\./.test(body)) {
        throw new Error(
          'You have been temporarily blocked from accessing DMV services. Wait a few minutes and try again.'
        )
      } else {
        const errorMsg = {
          cause: body === 'timeout' ? 'timeout' : 'unknown',
          id,
          location: name,
          response: body,
          status: 'failed'
        }
        this.results.push(errorMsg)
        this.emit('findAppointment', errorMsg)

        return
      }
    }
    const dateString = dateMatch[0].replace(' at', ',')
    const date = new Date(Date.parse(dateString))
    const timeDiff = date.getTime() - new Date().getTime()
    const daysUntil = timeDiff / 1000 / 60 / 60 / 24
    const result = {
      date,
      daysUntil,
      id,
      location: name
    }
    this.results.push(result)
    this.emit('findAppointment', result)
  }
}
