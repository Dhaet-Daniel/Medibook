const Setting = require('../models/Setting');

async function calculateFee(doctor, appointmentType) {
  if (appointmentType === 'online' && doctor.onlineFee > 0) {
    return doctor.onlineFee;
  }

  if (appointmentType === 'in-person' && doctor.consultationFee > 0) {
    return doctor.consultationFee;
  }

  const defaultSetting = await Setting.findOne({ key: 'defaultConsultationFee' });
  return defaultSetting ? defaultSetting.value : 50;
}

module.exports = { calculateFee };
