

const endpoints = {

  // Authentication
  LOGIN: 'auth/login',
  ROLE_BASED_LOGIN: 'auth/roleBasedLogin',
  LOGIN_WITH_PIN: 'auth/loginWithPin',
  REGISTER_PATIENT: 'auth/registerPatient',
  VALIDATE_OTP: 'auth/validateOtp',
  RESEND_OTP: 'auth/resendOtp',
  LOGOUT: 'auth/logout',
  SET_PIN: 'auth/setPin',
  CHANGE_PIN: 'auth/changePin',
  FORGOT_PIN: 'auth/forgotPin',
  GET_ROLES_BY_MOBILE: 'auth/getRolesByMobile',

  // Provider Onboarding
  REGISTER_PROVIDER: 'provider/register',

  // get user

  GET_USER_PROFILE: 'provider/getProvider/',

  GET_AVAILABLE_BALANCE: 'finance/available/',

  // User Endpoints
  GET_USER: (userId?: string) => userId ? `users/getUser?userId=${userId}` : 'users/getUser',
  GET_CLINIC_ADDRESS: (doctorId: string) => `users/getClinicAddress?doctorId=${doctorId}`,
  ADD_FEEDBACK: 'users/addFeedback',
  SUBMIT_PATIENT_RESPONSE: 'users/submitPatientResponse',
  UPDATE_FCM_TOKEN: 'users/updateFcmToken',
  GET_KYC_BY_USER_ID: 'users/getKycByUserId',
  UPDATE_LANGUAGE: (userId: string, code: string) => `users/${userId}/${code}/language`,
  VYDUSER396_LANGUAGE: (selectedLanguage: string) => `users/VYDUSER396/${selectedLanguage}/language`,
  GET_ALL_FEEDBACKS: (userId: string) => `users/getAllFeedbacksGivenByPatient/${userId}`,
  GET_DOCTORS_LIST_BY_FAMILY: (userId: string) => `users/getDoctorsListByFamily/${userId}`,
  GET_FEEDBACK_BY_ID: (feedbackId: string) => `users/getFeedbackById/${feedbackId}`,
  ADD_KYC_DETAILS: 'users/addKYCDetails',
  GENERATE_REFERRAL_CODE: 'users/generateReferralCode',

  // Appointment Endpoints
  CANCEL_APPOINTMENT: 'appointment/cancelAppointment',
  CREATE_APPOINTMENT: 'appointment/createAppointment',
  RELEASE_DOCTOR_SLOT: 'appointment/releaseDoctorSlot',
  RESCHEDULE_APPOINTMENT: 'appointment/rescheduleAppointment',
  UPDATE_APPOINTMENT_STATUS: 'appointment/updateAppointmentStatus',

  // Provider Slots Endpoints
  PROVIDER_SLOTS_CREATE: 'provider-slots/createProviderSlots',
  PROVIDER_SLOTS_GET: 'provider-slots/getProviderAvailability',
  PROVIDER_SLOTS_DELETE: 'provider-slots/deleteSlots',
  PROVIDER_SLOTS_DELETE_SELECTED: 'provider-slots/deleteSelectedSlots',
  GET_PROVIDER_EARNINGS: 'provider-slots/getProviderEarnings',
  GET_PROVIDER_APPOINTMENTS: 'provider-slots/provider-appointments/getProviderAppointments',
  ACCEPT_PROVIDER_APPOINTMENT: 'appointment/acceptProviderAppointment',
  REJECT_PROVIDER_APPOINTMENT: 'appointment/rejectProviderAppointment',
  SEND_OTP_TO_PATIENT: 'appointment/sendOtpToPatient',
  VERIFY_PATIENT_OTP: 'appointment/verifyPatientOtp',
  COMPLETE_PROVIDER_APPOINTMENT: 'appointment/completeProviderAppointment',
  SUBMIT_PATIENT_RATING: 'appointment/submitPatientRating',

  // Merchant Endpoints
  MERCHANT_CATEGORIES: 'rental/merchant/inventory/categories',
  MERCHANT_CATEGORY_BY_ID: (id: string) => `rental/merchant/inventory/categories/${id}`,
  MERCHANT_PRODUCTS: 'rental/merchant/inventory/products',
  MERCHANT_PRODUCT_BY_ID: (id: string) => `rental/merchant/inventory/products/${id}`,
  MERCHANT_CATEGORY_PRODUCTS: (categoryId: string) => `rental/merchant/inventory/categories/${categoryId}/products`,
  MERCHANT_DASHBOARD_STATS: 'rental/merchant/dashboard/stats',
  MERCHANT_RECENT_ORDERS: 'rental/merchant/dashboard/recent-orders',
  MERCHANT_ORDERS: 'rental/merchant/orders',
  MERCHANT_ORDER_BY_ID: (orderId: string) => `rental/merchant/orders/${orderId}`,
  MERCHANT_ORDER_TRACKING: (orderId: string) => `rental/merchant/orders/${orderId}/tracking`,
  MERCHANT_ORDER_INVOICE: (orderId: string) => `rental/merchant/orders/${orderId}/invoice`,
  MERCHANT_EARNINGS: 'rental/merchant/earnings',
  MERCHANT_EARNINGS_BREAKDOWN: 'rental/merchant/earnings/breakdown',
  MERCHANT_EARNINGS_PAYOUT: 'rental/merchant/earnings/payout',
  MERCHANT_PROFILE: 'rental/merchant/profile',
  MERCHANT_BULK_UPLOAD: 'rental/merchant/inventory/bulk/upload',
  MERCHANT_BULK_TEMPLATE: (categoryId: string) => `rental/merchant/inventory/bulk/template?categoryId=${categoryId}`,
  MERCHANT_BULK_COMMIT: 'rental/merchant/inventory/bulk/commit',
}

export default endpoints