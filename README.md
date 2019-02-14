# CA DMV Poller

> A developer API to access the CA DMV appointment system

**NOTE: This is a developer API. Use [CA DMV Appointment FastFinder](https://play.google.com/store/apps/details?id=com.f12devs.CaDmvAppointmentFastFinder), an Android app, if you just want to get an appointment.**

## Install

Install this module like any other npm package:

```
$ npm install ca-dmv-poller
```

## Usage

```javascript
const Poller = require('ca-dmv-poller')

const poller = new Poller({
  itemsToProcess: 1, // Number of items user would like to process
  maxDistanceMiles: 15, // Distance from home location to search for DMV Offices

  // Provide zipCode, coords, or address
  zipCode: '95630', // or
  coords: {
    lat: '38.733792',
    lng: '-121.141315'
  } // or
  address: '1600 Amphitheatre Pkwy, Mountain View, CA 94043',

  mode: 'OfficeVisit', // or 'DriveTest'
  // CID: Apply for, replace, or renew a California DL/ID
  // RID: Apply for, replace, or renew a REAL ID
  // VR: Register or title a vehicle or vessel (boat)
  appointmentTypes: ['CID'],
  // User's appointment information
  appointmentInfo: {
    appointmentInfo: {
      firstName: 'John',
      lastName: 'Doe',
      telArea: '123',
      telPrefix: '456',
      telSuffix: '7890',
      birthDay: '01',
      birthMonth: '01',
      birthYear: '2001',
      dlNumber: 'I0004567', // AKA Permit Number
      requestedTask: 'DT', // (automobile) or 'MC' (motorcycle),
      safetyCourseCompletedSelection: 'TRUE' // or 'FALSE', motorcycle test only
    }
  }
})

poller
  .check()
  .then(results => {
    results.forEach(result => {
      if (result.hasFailed) {
        console.log(
          `The request to ${result.location} (id ${
            result.id
          }) failed because: ${result.cause}`
        )
        return
      }
      console.log('Day of appointment: ', result.date)
      console.log('Days until appointment: ', result.daysUntil)
      console.log('Location of appointment: ', result.location)
    })
  })
  .catch(e => console.error(e))
```

Special Thanks to [Michael Vartan](https://github.com/vartan) and his tool, [ca-dmv-poller](https://github.com/vartan/ca-dmv-poller), for inspiration and initial implementation of this app.
