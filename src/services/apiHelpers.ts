import endpoints from "./endpoints";
import server from "./index";

export interface ILoginBody {
  mobile: string;
  userType: string;
}

export interface IRoleBasedLoginBody {
  mobile: string;
  userType: string;
}

export interface IValidateOtpBody {
  userId: string;
  OTP: string;
}

export interface ILoginWithPinBody {
  mobile: string;
  pin: string;
  role: string;
  referralCode?: string;
}


export const getAvailableBalance = (
  id: string,
) => {
  return server.get(
    `${endpoints.GET_AVAILABLE_BALANCE}${id}`,
    {
      requiresAuth: true,
    },
  );
};

// RESEND OTP
export const resendOtp = (data: {
  mobile: string;
}) => {
  return server.post(
    endpoints.RESEND_OTP,
    data
  );
};




// GET ROLES BY MOBILE
export const getRolesByMobile = (mobile: string) => {
  return server.post(endpoints.GET_ROLES_BY_MOBILE, { mobile });
};

// REGISTER PROVIDER (Onboarding — multipart/form-data)
export const registerProvider = (formData: FormData) => {
  return server.post(endpoints.REGISTER_PROVIDER, formData);
};


export const getUserProfile = (id: string) => {
  return server.get(`${endpoints.GET_USER_PROFILE}${id}`
    , {
      requiresAuth: true,
    }
  );
};

// LOGOUT
export const logoutUser = () => {
  return server.post(
    endpoints.LOGOUT
  );
};

// Provider Slots API
export interface IProviderSlotsBody {
  providerId: any;
  startDate: string;
  endDate: string;
  days: string[];
  startTime: string;
  endTime: string;
  interval: number;
}

export interface IProviderSlot {
  time: string;
  status: 'available' | 'booked';
  appointmentId: string | null;
}

export interface IProviderDateAvailability {
  date: string;
  day: string;
  totalSlots: number;
  availableSlots: number;
  slots: IProviderSlot[];
}

export interface IProviderAvailabilityResponse {
  status: string;
  provider: {
    providerId: string;
    providerName: string;
    consultationFee: number;
    specialization: string;
  };
  availability: {
    from: string;
    to: string;
    totalDays: number;
  };
  dates: IProviderDateAvailability[];
}

export const createProviderSlots = (data: IProviderSlotsBody) => {
  return server.post(endpoints.PROVIDER_SLOTS_CREATE, data, {
    requiresAuth: true,
  });
};

export const getProviderAvailability = (providerId: string, startDate: string, endDate: string) => {
  return server.get(
    `${endpoints.PROVIDER_SLOTS_GET}?providerId=${providerId}&startDate=${startDate}&endDate=${endDate}`,
    {
      requiresAuth: true,
    }
  );
};

export const getProviderAppointments = (providerId: string) => {
  return server.get(
    `${endpoints.GET_PROVIDER_APPOINTMENTS}?providerId=${providerId}`,
    {
      requiresAuth: true,
    }
  );
};

export const acceptProviderAppointment = (data: { appointmentId: string }) => {
  return server.patch(
    endpoints.ACCEPT_PROVIDER_APPOINTMENT,
    data,
    {
      requiresAuth: true,
    }
  );
};

export const updateAppointmentStatus = (data: { appointmentId: string, status: string }) => {
  return server.patch(
    endpoints.UPDATE_APPOINTMENT_STATUS,
    data,
    {
      requiresAuth: true,
    }
  );
};

export const rejectProviderAppointment = (data: { appointmentId: string, rejectionReason: string }) => {
  return server.patch(
    endpoints.REJECT_PROVIDER_APPOINTMENT,
    data,
    {
      requiresAuth: true,
    }
  );
};

export const sendOtpToPatient = (
  data: { appointmentId: string },
  userId: string,
) => {
  return server.post(
    endpoints.SEND_OTP_TO_PATIENT,
    data,
    {
      requiresAuth: true,
      headers: {
        userid: userId,
      },
    },
  );
};

export const verifyPatientOtp = (data: { appointmentId: string, otp: string }) => {
  return server.post(endpoints.VERIFY_PATIENT_OTP, data, { requiresAuth: true });
};

export interface ICompleteAppointmentBody {
  appointmentId: string;
  clinicalChecklist: any;
  prescriptionHandoff: string;
}

export const completeProviderAppointment = (data: ICompleteAppointmentBody) => {
  return server.patch(endpoints.COMPLETE_PROVIDER_APPOINTMENT, data, { requiresAuth: true });
};

export const deleteProviderSlotsByDay = (providerId: string, day: string) => {
  return server.delete(`${endpoints.PROVIDER_SLOTS_DELETE}?providerId=${providerId}&day=${day}`, {
    requiresAuth: true,
  });
};

export const deleteSelectedProviderSlots = (providerId: string, date: string, slots: string) => {
  return server.delete(`${endpoints.PROVIDER_SLOTS_DELETE_SELECTED}?providerId=${providerId}&date=${date}&slots=${slots}`, {
    requiresAuth: true,
  });
};

export const getProviderEarnings = (providerId: string) => {
  return server.get(
    `${endpoints.GET_PROVIDER_EARNINGS}?providerId=${providerId}`,
    {
      requiresAuth: true,
    }
  );
};

export interface ISubmitPatientRatingBody {
  appointmentId: string;
  stars: number;
  comment?: string;
  tags?: string[];
}

export const submitPatientRating = (data: ISubmitPatientRatingBody) => {
  return server.post(endpoints.SUBMIT_PATIENT_RATING, data, { requiresAuth: true });
};

// Merchant Categories
export const getMerchantCategories = (userId: string) => {
  return server.get(endpoints.MERCHANT_CATEGORIES, {
    requiresAuth: true,
    headers: {
      userid: userId,
      role: 'merchant',
    },
  });
};

export const createMerchantCategory = (userId: string, data: any) => {
  return server.post(endpoints.MERCHANT_CATEGORIES, data, {
    requiresAuth: true,
    headers: {
      userid: userId,
      role: 'merchant',
    },
  });
};

export const updateMerchantCategory = (userId: string, categoryId: string, data: any) => {
  return server.put(endpoints.MERCHANT_CATEGORY_BY_ID(categoryId), data, {
    requiresAuth: true,
    headers: {
      userid: userId,
      role: 'merchant',
    },
  });
};

export const deleteMerchantCategory = (userId: string, categoryId: string) => {
  return server.delete(endpoints.MERCHANT_CATEGORY_BY_ID(categoryId), {
    requiresAuth: true,
    headers: {
      userid: userId,
      role: 'merchant',
    },
  });
};

export const getMerchantCategoryProducts = (userId: string, categoryId: string) => {
  return server.get(endpoints.MERCHANT_CATEGORY_PRODUCTS(categoryId), {
    requiresAuth: true,
    headers: {
      userid: userId,
      role: 'merchant',
    },
  });
};

export const createMerchantProduct = (userId: string, data: any) => {
  return server.post(endpoints.MERCHANT_PRODUCTS, data, {
    requiresAuth: true,
    headers: {
      userid: userId,
      role: 'merchant',
    },
  });
};

export const updateMerchantProduct = (userId: string, productId: string, data: any) => {
  return server.put(endpoints.MERCHANT_PRODUCT_BY_ID(productId), data, {
    requiresAuth: true,
    headers: {
      userid: userId,
      role: 'merchant',
    },
  });
};

export const deleteMerchantProduct = (userId: string, productId: string) => {
  return server.delete(endpoints.MERCHANT_PRODUCT_BY_ID(productId), {
    requiresAuth: true,
    headers: {
      userid: userId,
      role: 'merchant',
    },
  });
};

export const getMerchantDashboardStats = (userId: string) => {
  return server.get(endpoints.MERCHANT_DASHBOARD_STATS, {
    requiresAuth: true,
    headers: {
      userid: userId,
      role: 'merchant',
    },
  });
};

export const getMerchantRecentOrders = (userId: string) => {
  return server.get(endpoints.MERCHANT_RECENT_ORDERS, {
    requiresAuth: true,
    headers: {
      userid: userId,
      role: 'merchant',
    },
  });
};

export const getMerchantOrders = (userId: string) => {
  return server.get(endpoints.MERCHANT_ORDERS, {
    requiresAuth: true,
    headers: {
      userid: userId,
      role: 'merchant',
    },
  });
};

export const getMerchantOrderById = (userId: string, orderId: string) => {
  return server.get(endpoints.MERCHANT_ORDER_BY_ID(orderId), {
    requiresAuth: true,
    headers: {
      userid: userId,
      role: 'merchant',
    },
  });
};

export const updateMerchantOrderTracking = (userId: string, orderId: string, data: { status: string; description: string }) => {
  return server.put(endpoints.MERCHANT_ORDER_TRACKING(orderId), data, {
    requiresAuth: true,
    headers: {
      userid: userId,
      role: 'merchant',
    },
  });
};

export const downloadMerchantOrderInvoice = (userId: string, orderId: string) => {
  return server.get(endpoints.MERCHANT_ORDER_INVOICE(orderId), {
    requiresAuth: true,
    headers: {
      userid: userId,
      role: 'merchant',
    },
  });
};

export const getMerchantEarnings = (userId: string) => {
  return server.get(endpoints.MERCHANT_EARNINGS, {
    requiresAuth: true,
    headers: {
      userid: userId,
      role: 'merchant',
    },
  });
};

export const getMerchantEarningsBreakdown = (userId: string) => {
  return server.get(endpoints.MERCHANT_EARNINGS_BREAKDOWN, {
    requiresAuth: true,
    headers: {
      userid: userId,
      role: 'merchant',
    },
  });
};

export const requestMerchantEarningsPayout = (userId: string, payoutAmount: number) => {
  return server.post(endpoints.MERCHANT_EARNINGS_PAYOUT, { payoutAmount }, {
    requiresAuth: true,
    headers: {
      userid: userId,
      role: 'merchant',
    },
  });
};

export const getMerchantProfile = (userId: string) => {
  return server.get(endpoints.MERCHANT_PROFILE, {
    requiresAuth: true,
    headers: {
      userid: userId,
      role: 'merchant',
    },
  });
};

export const updateMerchantProfile = (
  userId: string,
  data: { displayAccountName: string; communicationEmail: string; contactPhoneLine: string }
) => {
  return server.put(endpoints.MERCHANT_PROFILE, data, {
    requiresAuth: true,
    headers: {
      userid: userId,
      role: 'merchant',
    },
  });
};

export const getBulkUploadTemplate = (userId: string, categoryId: string) => {
  return server.get(endpoints.MERCHANT_BULK_TEMPLATE(categoryId), {
    requiresAuth: true,
    headers: {
      userid: userId,
      role: 'merchant',
    },
  });
};

export const uploadBulkCsvFile = (userId: string, categoryId: string, fileUri: string, fileName: string) => {
  const formData = new FormData();
  formData.append('categoryId', categoryId);
  formData.append('file', {
    uri: fileUri,
    name: fileName,
    type: 'text/csv',
  } as any);

  return server.post(endpoints.MERCHANT_BULK_UPLOAD, formData, {
    requiresAuth: true,
    headers: {
      userid: userId,
      role: 'merchant',
    },
  });
};

export const commitBulkUpload = (userId: string, batchToken: string, ignoreInvalidRows: boolean = true) => {
  return server.post(endpoints.MERCHANT_BULK_COMMIT, { batchToken, ignoreInvalidRows }, {
    requiresAuth: true,
    headers: {
      userid: userId,
      role: 'merchant',
    },
  });
};
