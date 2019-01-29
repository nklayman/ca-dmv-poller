export default [
  {
    error: 'It appears your appointment information was incorrect.',
    match: 'Please correct the following error(s)'
  },
  {
    error:
      'You can only make a driving test appointment within 60 days of having your permit for 6 months.',
    match:
      'Sorry , you are ineligible to make a Behind-the-Wheel driving test appointment online.  ' +
      'For additional information, please call 1-800-777-0133.'
  },
  {
    error:
      'The permit/driver license number and/or birth date does not match DMV records. ' +
      'Please check your information and try again.',
    match:
      'Sorry, the permit/driver license number and/or birth date does not match our records.  ' +
      'Please recheck the information and resubmit.  If this problem persists, please call 1-800-777-0133.'
  },
  {
    error:
      'You have been temporarily blocked from accessing DMV services. Wait a few minutes and try again.',
    match: 'The requested webpage was rejected.'
  }
]
