// src/utils/SvgIcons.js

import React from 'react';
import Svg, { Path, Circle, Rect, Polyline } from 'react-native-svg';

/**
 * Common wrapper props for all icons
 * @param {Object} props
 * @param {number} [props.size=24]
 * @param {string} [props.color='currentColor']
 */
const Icon = ({ size = 24, color = 'currentColor', width, height, ...props }) => ({
  width: width ?? size,
  height: height ?? size,
  stroke: color,
  fill: 'none',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  viewBox: '0 0 24 24',
  ...props,
});

// Keywords: menu, hamburger, navigation, menu button
// Hamburger Menu
export const HamburgerMenuIcon = (props) => {
  const svgProps = Icon(props);
  return (
    <Svg {...svgProps}>
      <Path d="M3 12h18M3 6h18M3 18h18" />
    </Svg>
  );
};

// Keywords: rupee, INR, currency, rupee symbol, payment
// Rupee Symbol ₹
export const RupeeSymbolIcon = (props) => {
  const svgProps = Icon(props);
  return (
    <Svg {...svgProps}>
      <Path d="M6 3h12M6 8h12M6 13h8c2 0 4 1.5 4 3.5S14 20 12 20H6l6 4-6-4" />
    </Svg>
  );
};

// Keywords: calendar, date, appointment, schedule, diary
// Calendar with date "31" inside
export const CalendarIcon = (props) => {
  const svgProps = Icon(props);
  return (
    <Svg {...svgProps}>
      <Path d="M8 3v4M16 3v4M4 11h16" />
      <Path d="M4 7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7z" />
      <Path d="M9 15h2v-2H9v2zm4 0h2v-2h-2v2zm-4 4h2v-2H9v2zm4 0h2v-2h-2v2z" strokeWidth="1.5" />
      <Path d="M14 14l-1 1 1 1" strokeWidth="3" />
    </Svg>
  );
};

// Keywords: back, left, previous, chevron-left
// Left Indicator (Chevron Left)
export const LeftIndicatorIcon = (props) => {
  const svgProps = Icon(props);
  return (
    <Svg {...svgProps}>
      <Path d="M15 18l-6-6 6-6" />
    </Svg>
  );
};

// Keywords: camera, photo, take picture, capture
// Camera (filled)
export const CameraIcon = (props) => {
  // original path coordinates are in the 258..290 / 471..495 range; translate them
  // so they fit inside a 32x32 viewBox
  const { color = 'currentColor', ...rest } = props;
  const svgProps = Icon({ ...rest, viewBox: '0 0 32 32', fill: color });
  return (
    <Svg {...svgProps}>
      <Path
        transform="translate(-258 -467)"
        d="M286,471 L283,471 L282,469 C281.411,467.837 281.104,467 280,467 L268,467 C266.896,467 266.53,467.954 266,469 L265,471 L262,471 C259.791,471 258,472.791 258,475 L258,491 C258,493.209 259.791,495 262,495 L286,495 C288.209,495 290,493.209 290,491 L290,475 C290,472.791 288.209,471 286,471 Z M274,491 C269.582,491 266,487.418 266,483 C266,478.582 269.582,475 274,475 C278.418,475 282,478.582 282,483 C282,487.418 278.418,491 274,491 Z M274,477 C270.687,477 268,479.687 268,483 C268,486.313 270.687,489 274,489 C277.313,489 280,486.313 280,483 C280,479.687 277.313,477 274,477 L274,477 Z"
      />
    </Svg>
  );
};

// Keywords: signature, sign, digital sign, e-sign, autograph, sign upload
// Signature Icon (28x28)
export const SignatureIcon = (props) => {
  const { color = '#212121', ...rest } = props;
  const svgProps = Icon({ ...rest, viewBox: '0 0 28 28', fill: color, stroke: 'none' });
  return (
    <Svg {...svgProps}>
      <Path d="M16.4798956,21.0019578 L16.75,21 C17.9702352,21 18.6112441,21.5058032 19.4020627,22.7041662 L19.7958278,23.3124409 C20.1028266,23.766938 20.2944374,23.9573247 20.535784,24.0567929 C20.9684873,24.2351266 21.3271008,24.1474446 22.6440782,23.5133213 L23.0473273,23.3170319 C23.8709982,22.9126711 24.4330286,22.6811606 25.0680983,22.5223931 C25.4699445,22.4219316 25.8771453,22.6662521 25.9776069,23.0680983 C26.0780684,23.4699445 25.8337479,23.8771453 25.4319017,23.9776069 C25.0371606,24.0762922 24.6589465,24.2178819 24.1641364,24.4458997 L23.0054899,25.0032673 C21.4376302,25.7436944 20.9059009,25.8317321 19.964216,25.4436275 C19.3391237,25.1860028 18.9836765,24.813298 18.4635639,24.0180227 L18.2688903,23.7140849 C17.7071112,22.8288731 17.4057794,22.5384538 16.8688444,22.5036655 L16.75,22.5 C16.2017306,22.5 16.0933104,22.5684572 14.009281,24.1150241 C12.2670395,25.4079488 10.9383359,26.0254984 9.24864243,26.0254984 C7.18872869,26.0254984 5.24773367,25.647067 3.43145875,24.8905363 L6.31377803,24.2241784 C7.25769404,24.4250762 8.23567143,24.5254984 9.24864243,24.5254984 C10.5393035,24.5254984 11.609129,24.0282691 13.1153796,22.9104743 L14.275444,22.0545488 C15.5468065,21.1304903 15.8296113,21.016032 16.4798956,21.0019578 L16.4798956,21.0019578 Z M22.7770988,3.22208979 C24.4507223,4.8957133 24.4507566,7.60916079 22.7771889,9.28281324 L21.741655,10.3184475 C22.8936263,11.7199657 22.8521526,13.2053774 21.7811031,14.279556 L18.7800727,17.2805874 L18.7800727,17.2805874 C18.4870374,17.5733384 18.0121637,17.573108 17.7194126,17.2800727 C17.4266616,16.9870374 17.426892,16.5121637 17.7199273,16.2194126 L20.7188969,13.220444 C21.2039571,12.7339668 21.2600021,12.1299983 20.678941,11.3818945 L10.0845437,21.9761011 C9.78635459,22.2743053 9.41036117,22.482705 8.99944703,22.5775313 L2.91864463,23.9807934 C2.37859061,24.1054212 1.89457875,23.6214094 2.0192066,23.0813554 L3.42247794,17.0005129 C3.51729557,16.5896365 3.72566589,16.2136736 4.0238276,15.9154968 L16.7165019,3.22217992 C18.3900415,1.54855555 21.1034349,1.54851059 22.7770988,3.22208979 Z M17.7771889,4.28281324 L5.08451462,16.9761302 C4.98512738,17.0755224 4.91567061,17.2008434 4.88406473,17.3378022 L3.7506248,22.2493752 L8.66215777,21.1159445 C8.79912915,21.0843357 8.92446029,21.0148692 9.02385665,20.9154678 L21.7165019,8.22217992 C22.8043063,7.13432049 22.8042862,5.37060478 21.7164588,4.2827701 C20.6285914,3.19496507 18.8649506,3.19499653 17.7771889,4.28281324 Z" />
    </Svg>
  );
};

// Keywords: video, play, media, record, clip
// Video Icon (filled) - uses provided 32x32 path
export const VideoIcon = (props) => {
  const { color = 'currentColor', ...rest } = props;
  const svgProps = Icon({ ...rest, viewBox: '0 0 32 32', fill: color });
  return (
    <Svg {...svgProps}>
      <Path d="M32,5.074v21.854c0,0.189-0.107,0.365-0.279,0.449c-0.068,0.033-0.146,0.051-0.221,0.051c-0.107,0-0.216-0.033-0.307-0.104l-7.939-6.121v3.129c0,0.277-0.225,0.5-0.5,0.5H0.5c-0.275,0-0.5-0.223-0.5-0.5V7.667c0-0.275,0.225-0.5,0.5-0.5h22.254c0.275,0,0.5,0.225,0.5,0.5v3.899l7.918-6.872c0.146-0.128,0.354-0.158,0.537-0.078C31.885,4.7,32,4.877,32,5.074z" />
    </Svg>
  );
};

// Keywords: lock, secure, password, privacy, protected
// Lock icon (from provided SVG)
export const LockIcon = (props) => {
  const svgProps = Icon(props);
  return (
    <Svg {...svgProps} viewBox="0 0 24 24" fill="none">
      <Path d="M12 14.5V16.5" />
      <Path d="M7 10.0288C7.47142 10 8.05259 10 8.8 10H15.2C15.9474 10 16.5286 10 17 10.0288" />
      <Path d="M7 10.0288C6.41168 10.0647 5.99429 10.1455 5.63803 10.327C5.07354 10.6146 4.6146 11.0735 4.32698 11.638C4 12.2798 4 13.1198 4 14.8V16.2C4 17.8802 4 18.7202 4.32698 19.362C4.6146 19.9265 5.07354 20.3854 5.63803 20.673C6.27976 21 7.11984 21 8.8 21H15.2C16.8802 21 17.7202 21 18.362 20.673C18.9265 20.3854 19.3854 19.9265 19.673 19.362C20 18.7202 20 17.8802 20 16.2V14.8C20 13.1198 20 12.2798 19.673 11.638C19.3854 11.0735 18.9265 10.6146 18.362 10.327C18.0057 10.1455 17.5883 10.0647 17 10.0288" />
      <Path d="M7 10.0288V8C7 5.23858 9.23858 3 12 3C14.7614 3 17 5.23858 17 8V10.0288" />
    </Svg>
  );
};

// Keywords: forward, next, chevron-right
// Right Indicator (Chevron Right)
export const RightIndicatorIcon = (props) => {
  const svgProps = Icon(props);
  return (
    <Svg {...svgProps}>
      <Path d="M9 18l6-6-6-6" />
    </Svg>
  );
};

// ====================side bar start================
// Keywords: show password, view, eye open, visibility
// Eye Open (Visibility On / Show Password)
export const EyeOpenIcon = (props) => {
  const svgProps = Icon(props);
  return (
    <Svg {...svgProps}>
      <Path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <Circle cx="12" cy="12" r="3" />
    </Svg>
  );
};

// Keywords: hide password, eye closed, visibility off
// Eye Closed (Visibility Off / Hide Password)
export const EyeClosedIcon = (props) => {
  const svgProps = Icon(props);
  return (
    <Svg {...svgProps}>
      <Path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <Path d="M3 3l18 18" strokeWidth="3" strokeLinecap="round" />
    </Svg>
  );
};

// Keywords: dashboard, overview, analytics, home
// Dashboard
export const DashboardIcon = (props) => {
  const svgProps = Icon(props);
  return (
    <Svg {...svgProps}>
      <Path d="M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z" />
    </Svg>
  );
};

// Keywords: appointments, schedule, booking, meeting
// Appointments
export const AppointmentsIcon = (props) => {
  const svgProps = Icon(props);
  return (
    <Svg {...svgProps}>
      <Path d="M19 4H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z" />
      <Path d="M16 2v4M8 2v4M3 10h18M12 14h4v4h-4z" />
    </Svg>
  );
};

// Keywords: follow-up, reminder, revisit, check-in
// Follow-ups
export const FollowUpsIcon = (props) => {
  const svgProps = Icon(props);

  return (
    <Svg {...svgProps} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="7.5" strokeWidth="2" />

      <Path
        d="M12 8v4l2.5 1.5"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <Path
        d="M19.5 12
           a7.5 7.5 0 1 1 -2.2 -5.3"
        strokeWidth="2"
        strokeLinecap="round"
      />

      <Polyline
        points="17.5 4.5 17.5 7.5 20.5 7.5"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
};

// Keywords: patients, users, contacts, people
// My Patients
export const MyPatientsIcon = (props) => {
  const svgProps = Icon(props);
  return (
    <Svg {...svgProps}>
      <Path d="M17 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2" />
      <Circle cx="10" cy="7" r="4" />
      <Path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <Path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </Svg>
  );
};

// Keywords: prescription, e-prescription, Rx, medicine
// Digital Prescription
export const DigitalPrescriptionIcon = (props) => {
  const svgProps = Icon(props);
  return (
    <Svg {...svgProps}>
      <Path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <Path d="M14 2v6h6" />
      <Path d="M10 13h4m-4 4h6" />
      <Path d="M9 17h3l3 3v-6" />
    </Svg>
  );
};

// Keywords: lab, test, science, flask, pathology
// Labs - Erlenmeyer Flask with Liquid and Bubbles
export const LabsIcon = (props) => {
  const svgProps = Icon(props);
  return (
    <Svg {...svgProps}>
      <Path d="M9 2h6" strokeWidth="2" strokeLinecap="round" />
      <Path d="M10 2v5h4V2" strokeLinecap="round" />

      <Path d="M6 7l-3 13c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2L18 7" strokeLinecap="round" />

      <Path d="M8 12h8" strokeWidth="3" strokeLinecap="round" />

      <Circle cx="10" cy="16" r="1" />
      <Circle cx="12" cy="14" r="1.5" />
      <Circle cx="14" cy="17" r="1" />
      <Circle cx="13" cy="10" r="0.8" />
    </Svg>
  );
};

// Keywords: pharmacy, medicine, dispensary
// Pharmacy
export const PharmacyIcon = (props) => {
  const svgProps = Icon(props);
  return (
    <Svg {...svgProps}>
      <Path d="M19 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2z" />
      <Path d="M9 12h6m-3-3v6" />
    </Svg>
  );
};

// Keywords: template, form, layout, preset
// Templates
export const TemplatesIcon = (props) => {
  const svgProps = Icon(props);
  return (
    <Svg {...svgProps}>
      <Path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <Path d="M14 2v6h6M16 13H8m8 4H8" />
    </Svg>
  );
};

// Keywords: staff, team, employees, personnel
// Staff Management
export const StaffManagementIcon = (props) => {
  const svgProps = Icon(props);
  return (
    <Svg {...svgProps}>
      <Path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <Circle cx="9" cy="7" r="4" />
      <Path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <Path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </Svg>
  );
};

// Keywords: clinic, hospital, building, management
// Clinic Management - Hospital Building with Medical Cross
export const ClinicManagementIcon = (props) => {
  const svgProps = Icon(props);
  return (
    <Svg {...svgProps}>
      <Path d="M4 21h16V8H4z" strokeWidth="2" strokeLinecap="round" />

      <Path d="M2 8h20l-10-6z" strokeWidth="2" strokeLinecap="round" />

      <Path d="M8 12h3M13 12h3M8 16h3M13 16h3" strokeLinecap="round" />

      <Path d="M12 10v4m-2-2h4" strokeWidth="2.5" strokeLinecap="round" />
    </Svg>
  );
};

// Keywords: availability, clock, status, schedule
// Availability
export const AvailabilityIcon = (props) => {
  const svgProps = Icon(props);
  return (
    <Svg {...svgProps}>
      <Circle cx="12" cy="12" r="10" />
      <Path d="M12 6v6l4 2" />
    </Svg>
  );
};

// Keywords: billing, invoice, receipt, payment
// Billing - Invoice/Receipt Icon
export const BillingIcon = (props) => {
  const svgProps = Icon(props);
  return (
    <Svg {...svgProps}>
      <Path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <Path d="M14 2v6h6" />

      <Path d="M16 13H8" strokeLinecap="round" />
      <Path d="M16 17H8" strokeLinecap="round" />
      <Path d="M10 9H8" strokeLinecap="round" />
    </Svg>
  );
};

// Keywords: bank, accounts, finance, ledger
// Accounts - Bank Building Icon
export const BankIcon = (props) => {
  const svgProps = Icon(props);
  return (
    <Svg {...svgProps}>
      <Path d="M4 21h16" strokeWidth="2" strokeLinecap="round" />
      <Path d="M6 18v-8" strokeLinecap="round" />
      <Path d="M10 18v-8" strokeLinecap="round" />
      <Path d="M14 18v-8" strokeLinecap="round" />
      <Path d="M18 18v-8" strokeLinecap="round" />

      <Path d="M6 10h12" strokeWidth="2" strokeLinecap="round" />
      <Path d="M4 10l2-8h12l2 8" strokeLinecap="round" />

      <Path d="M2 10h20l-10-8z" />
    </Svg>
  );
};

// Keywords: reviews, ratings, stars, feedback
// Reviews
export const ReviewsIcon = (props) => {
  const svgProps = Icon(props);
  return (
    <Svg {...svgProps}>
      <Path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </Svg>
  );
};

// Keywords: pin, location pin, map pin, marker
// Pin Management
export const PinManagementIcon = (props) => {
  const svgProps = Icon(props);
  return (
    <Svg {...svgProps}>
      <Path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <Circle cx="12" cy="12" r="3" />
    </Svg>
  );
};

// Keywords: delete, trash, remove, bin
// Delete Account - Trash Bin Icon
export const DeleteAccountIcon = (props) => {
  const svgProps = Icon(props);
  return (
    <Svg {...svgProps}>
      <Path d="M4 7h16" strokeWidth="2" strokeLinecap="round" />
      <Path d="M6 10v8c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2v-8" />
      <Path d="M8 7V4c0-1.1.9-2 2-2h4c1.1 0 2 .9 2 2v3" strokeLinecap="round" />

      <Path d="M10 12v6" strokeLinecap="round" />
      <Path d="M14 12v6" strokeLinecap="round" />
    </Svg>
  );
};

// Keywords: logout, sign out, exit
// Logout
export const LogoutIcon = (props) => {
  const svgProps = Icon(props);
  return (
    <Svg {...svgProps}>
      <Path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <Path d="M16 17l5-5-5-5" />
      <Path d="M21 12H9" />
    </Svg>
  );
};

// Keywords: login, sign in, authenticate
// LoginIcon
export const LoginIcon = (props) => {
  const svgProps = Icon(props);

  return (
    <Svg {...svgProps} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 3v18"
        strokeWidth="2"
        strokeLinecap="round"
      />

      <Path
        d="M4 3h7"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <Path
        d="M4 21h7"
        strokeWidth="2"
        strokeLinecap="round"
      />

      <Path
        d="M20 12h-8"
        strokeWidth="2"
        strokeLinecap="round"
      />

      <Path
        d="M16 8l-4 4 4 4"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
};

// Keywords: phone, call, contact
// Phone (Call) Icon - Classic Handset
export const PhoneIcon = (props) => {
  const svgProps = Icon(props);
  return (
    <Svg {...svgProps}>
      <Path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
    </Svg>
  );
};

// Keywords: search, find, magnify, lookup
// Search Icon - Magnifying Glass
export const SearchIcon = (props) => {
  const svgProps = Icon(props);
  return (
    <Svg {...svgProps}>
      <Circle cx="11" cy="11" r="8" />
      <Path d="m21 21-4.35-4.35" strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
};

// Keywords: filter, sort, refine, narrow
// Filter Icon - Horizontal Lines with Decreasing Width (100% → 66% → 33%)
export const FilterIcon = (props) => {
  const svgProps = Icon(props);
  return (
    <Svg {...svgProps}>
      <Path d="M3 5h18" strokeWidth="2" strokeLinecap="round" />

      <Path d="M6 12h12" strokeWidth="2" strokeLinecap="round" />

      <Path d="M9 19h6" strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
};

// Keywords: close, cancel, x, dismiss
// Simple X Mark (Close / Cancel)
export const CloseXIcon = (props) => {
  const svgProps = Icon(props);
  return (
    <Svg {...svgProps}>
      <Path d="M18 6L6 18M6 6l12 12" strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
};

// Keywords: warning, alert, caution, triangle, exclamation
// Warning Icon - triangle with exclamation inside
export const WarningIcon = (props) => {
  const svgProps = Icon(props);
  return (
    <Svg {...svgProps}>
      <Path
        d="M12 15H12.01M12 12V9M4.98207 19H19.0179C20.5615 19 21.5233 17.3256 20.7455 15.9923L13.7276 3.96153C12.9558 2.63852 11.0442 2.63852 10.2724 3.96153L3.25452 15.9923C2.47675 17.3256 3.43849 19 4.98207 19Z"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
};

// Keywords: mail, email, envelope, message, inbox, contact, send mail
// Mail Icon - simple envelope outline
export const MailIcon = (props) => {
  const svgProps = Icon(props);
  return (
    <Svg {...svgProps}>
      <Path d="M3 6h18v12H3z" />
      <Path d="M3 6l9 8 9-8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
};

// Keywords: medical, clinic, suitcase, kit, first aid, pharmacy, medical bag, health kit
// Medical Suitcase Icon (provided SVG)
export const MedicalSuitcaseIcon = (props) => {
  const { color = '#1C274C', ...rest } = props;
  const svgProps = Icon({ ...rest, viewBox: '0 0 24 24' });
  return (
    <Svg {...svgProps} fill="none">
      <Path
        d="M2 14C2 10.2288 2 8.34315 3.17157 7.17157C4.34315 6 6.22876 6 10 6H14C17.7712 6 19.6569 6 20.8284 7.17157C22 8.34315 22 10.2288 22 14C22 17.7712 22 19.6569 20.8284 20.8284C19.6569 22 17.7712 22 14 22H10C6.22876 22 4.34315 22 3.17157 20.8284C2 19.6569 2 17.7712 2 14Z"
        stroke={color}
        strokeWidth={1.5}
      />
      <Path
        opacity={0.5}
        d="M16 6C16 4.11438 16 3.17157 15.4142 2.58579C14.8284 2 13.8856 2 12 2C10.1144 2 9.17157 2 8.58579 2.58579C8 3.17157 8 4.11438 8 6"
        stroke={color}
        strokeWidth={1.5}
      />
      <Path
        d="M13.5 14H10.5M12 12.5V15.5"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
      />
      <Circle
        opacity={0.5}
        cx="12"
        cy="14"
        r="4"
        stroke={color}
        strokeWidth={1.5}
      />
    </Svg>
  );
};

// Keywords: dropdown, chevron-down, expand, select
// Dropdown Icon - Inverted Triangle (Pointing Down)
export const DropdownIcon = (props) => {
  const svgProps = Icon(props);
  return (
    <Svg {...svgProps}>
      <Path d="M6 9l6 6 6-6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
};

// Keywords: book, read, library, reference, guide, manual, prescription guide
// Book Icon (outline) - added from provided SVG
export const BookIcon = (props) => {
  const { color = '#1C274D', ...rest } = props;
  const svgProps = Icon({ ...rest, viewBox: '0 0 24 24' });
  return (
    <Svg {...svgProps} fill="none">
      <Path
        d="M4 8C4 5.17157 4 3.75736 4.87868 2.87868C5.75736 2 7.17157 2 10 2H14C16.8284 2 18.2426 2 19.1213 2.87868C20 3.75736 20 5.17157 20 8V16C20 18.8284 20 20.2426 19.1213 21.1213C18.2426 22 16.8284 22 14 22H10C7.17157 22 5.75736 22 4.87868 21.1213C4 20.2426 4 18.8284 4 16V8Z"
        stroke={color}
        strokeWidth={1.5}
      />
      <Path
        d="M19.8978 16H7.89778C6.96781 16 6.50282 16 6.12132 16.1022C5.08604 16.3796 4.2774 17.1883 4 18.2235"
        stroke={color}
        strokeWidth={1.5}
      />
      <Path d="M7 16V2.5" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
      <Path
        d="M13 16V19.5309C13 19.8065 13 19.9443 12.9051 20C12.8103 20.0557 12.6806 19.9941 12.4211 19.8708L11.1789 19.2808C11.0911 19.2391 11.0472 19.2182 11 19.2182C10.9528 19.2182 10.9089 19.2391 10.8211 19.2808L9.57889 19.8708C9.31943 19.9941 9.18971 20.0557 9.09485 20C9 19.9443 9 19.8065 9 19.5309V16.45"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
      />
    </Svg>
  );
};

// Keywords: trophy, award, achievement, reward, leaderboard, badge, accomplishment
// Trophy Icon (filled) - uses provided 508x508 SVG
export const TrophyIcon = (props) => {
  const { color = 'currentColor', ...rest } = props;
  const svgProps = Icon({ ...rest, viewBox: '0 0 508 508', fill: color, stroke: 'none' });
  return (
    <Svg {...svgProps}>
      <Path d="M428.776,34.6c-10.8-0.9-21.2,1.4-30.1,6.1c0.3-8.8,0.5-17.6,0.5-26.6c0-3.7,2.3-14.1-14.1-14.1h-261.9 c-15.4,0-14.2,10.4-14.1,14.1c0,8.9,0.2,17.7,0.5,26.5c-8.9-4.7-19.3-7.1-30.1-6.1c-72,6.3-81.2,71.4-79.1,94.6 c7.4,81.5,75.1,145.3,156.1,149.3c15,33.4,32.9,58.9,52.8,74.4v63.1h-18.8c-43.1,0-78.2,35-78.2,78c0,7.8,6.3,14.1,14.1,14.1 h255.3c7.8,0,14.1-6.3,14.1-14.1c0-43-35.1-78-78.2-78h-18.8v-63.1c19.9-15.5,37.8-41 52.7-74.3c81-4,148.7-67.7,156.1-149.3 C509.876,106.1,500.776,40.9,428.776,34.6z M28.476,126.6c-1.4-15.7,6.4-62.1,53.5-64c14.2-0.6,26.8,9.2,28.1,23.4 s-9.2,26.7-23.4,28c-7.8,0.7-13.5,7.6-12.8,15.3c0.7,7.8,7.6,13.5,15.4,12.8c10.3-0.9,19.9-4.7,27.9-10.9 c6.1,43.9,15.6,83.7,27.6,117.7C83.576,239.9,34.176,189.7,28.476,126.6z M317.676,444.1c22.6,0,41.7,15.1,47.8,35.7h-222.9 c6.1-20.6,25.2-35.7,47.8-35.7H317.676z M237.476,415.9v-48.3c11,2.9,22.2,2.9,33.2,0v48.3H237.476z M254.076,341.6 c-54.6,0-113.3-125.3-116.6-313.4h233.3C367.476,216.3,308.676,341.6,254.076,341.6z M479.676,126.7 c-5.7,63.1-55.1,113.4-116.2,122.4c12.1-34,21.5-73.8,27.7-117.7c8,6.1,17.6,9.9,27.9,10.9c7.7,0.8,14.7-5,15.4-12.8 c0.7-7.8-5-14.6-12.8-15.3c-14.2-1.3-24.7-13.9-23.4-28c1.3-14.2,13.9-23.9,28.1-23.4C473.276,64.6,481.076,111,479.676,126.7z" />
      <Path d="M336.376,121c-1.7-5.1-6.1-8.8-11.4-9.6l-40.2-5.8l-18-36.3c-2.4-4.8-7.3-7.9-12.7-7.9c-5.4,0-10.3,3-12.7,7.9l-18,36.3 l-40.2,5.8c-5.3,0.8-9.8,4.5-11.4,9.6c-1.7,5.1-0.3,10.7,3.6,14.5l29.1,28.3l-6.9,39.9c-0.9,5.3,1.3,10.6,5.6,13.8 c4.4,3.2,10.1,3.6,14.9,1.1l35.9-18.9l35.9,18.9c5,2.2,11,1.6,14.9-1.1c4.4-3.1,6.5-8.5,5.6-13.8l-6.9-39.9l29.1-28.3 C336.576,131.7,337.976,126.1,336.376,121z M278.576,148.7c-3.3,3.2-4.9,7.9-4.1,12.5l3.3,19.1l-17.2-9c-2.1-1.1-4.3-1.6-6.6-1.6 c-2.3,0-4.5,0.5-6.6,1.6l-17.2,9l3.3-19.1c0.8-4.6-0.7-9.2-4.1-12.5l-13.9-13.5l19.2-2.8c4.6-0.7,8.6-3.6,10.6-7.7l8.6-17.4 l8.6,17.4c2.1,4.2,6,7.1,10.6,7.7l19.2,2.8L278.576,148.7z" />
    </Svg>
  );
};

// Keywords: kebab menu, more options
// MoreVert Icon - Vertical Three Dots (Kebab Menu)
// MoreVert Icon - Vertical Three Filled Dots (Kebab Menu)
export const MoreVertIcon = (props) => {
  const svgProps = Icon({ ...props, fill: 'currentColor' }); // Ensure fill uses color prop
  return (
    <Svg {...svgProps}>
      <Circle cx="12" cy="4" r="1" fill="currentColor" />
      <Circle cx="12" cy="13" r="1" fill="currentColor" />
      <Circle cx="12" cy="22" r="1" fill="currentColor" />
    </Svg>
  );
};

// Keywords: edit, pencil, modify, write
// Edit Icon - Pencil
export const EditIcon = (props) => {
  const svgProps = Icon(props);
  return (
    <Svg {...svgProps}>
      <Path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
};

// Keywords: add, new, plus, create
// Add Icon - Plus Sign
export const AddIcon = (props) => {
  const svgProps = Icon(props);
  return (
    <Svg {...svgProps}>
      <Path d="M12 5v14" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M5 12h14" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
};

// Keywords: up, arrow, direction
// Up Arrow - filled triangle pointing up
export const UpArrowIcon = (props) => {
  const svgProps = Icon({ ...props, fill: 'currentColor', viewBox: '0 0 24 24' });
  return (
    <Svg {...svgProps}>
      <Path d="M3 19h18a1.002 1.002 0 0 0 .823-1.569l-9-13c-.373-.539-1.271-.539-1.645 0l-9 13A.999.999 0 0 0 3 19z" />
    </Svg>
  );
};

// Keywords: down, arrow, direction
// Down Arrow - filled triangle pointing down
export const DownArrowIcon = (props) => {
  const svgProps = Icon({ ...props, fill: 'currentColor', viewBox: '0 0 24 24' });
  return (
    <Svg {...svgProps}>
      <Path d="M11.178 19.569a.998.998 0 0 0 1.644 0l9-13A.999.999 0 0 0 21 5H3a1.002 1.002 0 0 0-.822 1.569l9 13z" />
    </Svg>
  );
};

// Keywords: location, map, pin, marker
// Location Icon - Map Pin / Marker
export const LocationIcon = (props) => {
  const svgProps = Icon(props);
  return (
    <Svg {...svgProps}>
      <Path d="M12 2a6 6 0 0 0-6 6c0 4.5 6 10 6 10s6-5.5 6-10a6 6 0 0 0-6-6z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx="12" cy="8" r="2" />
    </Svg>
  );
};

// Keywords: home, house, residence
// Home Icon (filled) - 16x16 viewBox, uses currentColor by default
export const HomeIcon = (props) => {
  const { color = 'currentColor', ...rest } = props;
  const svgProps = Icon({ ...rest, viewBox: '0 0 16 16', fill: color, stroke: 'none' });
  return (
    <Svg {...svgProps}>
      <Path d="M1 6V15H6V11C6 9.89543 6.89543 9 8 9C9.10457 9 10 9.89543 10 11V15H15V6L8 0L1 6Z" />
    </Svg>
  );
};

// Keywords: user, account, profile
// Account (user inside circle) - filled, uses currentColor
export const AccountIcon = (props) => {
  const { color = 'currentColor', ...rest } = props;
  // For filled icons we want no stroke (prevents a visible outline when scaled)
  const svgProps = Icon({ ...rest, viewBox: '0 0 24 24', fill: color, stroke: 'none' });
  return (
    <Svg {...svgProps}>
      <Path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12ZM15 9C15 10.6569 13.6569 12 12 12C10.3431 12 9 10.6569 9 9C9 7.34315 10.3431 6 12 6C13.6569 6 15 7.34315 15 9ZM12 20.5C13.784 20.5 15.4397 19.9504 16.8069 19.0112C17.4108 18.5964 17.6688 17.8062 17.3178 17.1632C16.59 15.8303 15.0902 15 11.9999 15C8.90969 15 7.40997 15.8302 6.68214 17.1632C6.33105 17.8062 6.5891 18.5963 7.19296 19.0111C8.56018 19.9503 10.2159 20.5 12 20.5Z"
      />
    </Svg>
  );
};

// Keywords: person, profile, user
// Person Icon (filled) - 32x32 viewBox, uses provided path and currentColor by default
export const PersonIcon = (props) => {
  const { color = 'currentColor', ...rest } = props;
  const svgProps = Icon({ ...rest, viewBox: '0 0 32 32', fill: color, stroke: 'none' });
  return (
    <Svg {...svgProps}>
      <Path d="M16 15.503A5.041 5.041 0 1 0 16 5.42a5.041 5.041 0 0 0 0 10.083zm0 2.215c-6.703 0-11 3.699-11 5.5v3.363h22v-3.363c0-2.178-4.068-5.5-11-5.5z" />
    </Svg>
  );
};

// Keywords: person, profile, user, card
// PersonInCard Icon (filled) - uses provided 442x442 SVG and currentColor by default
export const PersonInCardIcon = (props) => {
  const { color = 'currentColor', ...rest } = props;
  const svgProps = Icon({ ...rest, viewBox: '0 0 442 442', fill: color, stroke: 'none' });
  return (
    <Svg {...svgProps}>
      <Path d="M120,216c19.299,0,35-15.701,35-35s-15.701-35-35-35s-35,15.701-35,35S100.701,216,120,216z M120,166 c8.271,0,15,6.729,15,15s-6.729,15-15,15s-15-6.729-15-15S111.729,166,120,166z" />
      <Path d="M70,296c5.523,0,10-4.477,10-10c0-18.604,12.767-34.282,30-38.734v13.11c0,5.523,4.477,10,10,10s10-4.477,10-10v-13.11 c17.233,4.452,30,20.13,30,38.734c0,5.523,4.477,10,10,10s10-4.477,10-10c0-33.084-26.916-60-60-60s-60,26.916-60,60 C60,291.523,64.477,296,70,296z" />
      <Path d="M432,90.429H10c-5.523,0-10,4.477-10,10v241.143c0,5.523,4.477,10,10,10h422c5.523,0,10-4.477,10-10V100.429 C442,94.906,437.523,90.429,432,90.429z M422,331.571H20V110.429h402V331.571z" />
      <Path d="M230,182.232h71c5.523,0,10-4.477,10-10s-4.477-10-10-10h-71c-5.523,0-10,4.477-10,10S224.477,182.232,230,182.232z" />
      <Path d="M230,229.768h142c5.523,0,10-4.477,10-10s-4.477-10-10-10H230c-5.523,0-10,4.477-10,10S224.477,229.768,230,229.768z" />
      <Path d="M230,279.768h142c5.523,0,10-4.477,10-10s-4.477-10-10-10H230c-5.523,0-10,4.477-10,10S224.477,279.768,230,279.768z" />
    </Svg>
  );
};

// Keywords: briefcase, work, job, business
// Briefcase Icon (filled) - 64x64 viewBox, uses provided path and currentColor by default
export const BriefcaseIcon = (props) => {
  const { color = 'currentColor', ...rest } = props;
  const svgProps = Icon({ ...rest, viewBox: '0 0 64 64', fill: color, stroke: 'none' });
  return (
    <Svg {...svgProps}>
      <Path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M60,16H48V4c0-2.211-1.789-4-4-4H20c-2.211,0-4,1.789-4,4v12H4c-2.211,0-4,1.789-4,4v40c0,2.211,1.789,4,4,4h56c2.211,0,4-1.789,4-4V20C64,17.789,62.211,16,60,16z M24,8h16v8H24V8z"
      />
    </Svg>
  );
};

// Keywords: check, done, success, approve
// CheckMark (filled) — use large 1024x1024 path scaled via viewBox
export const CheckMarkIcon = (props) => {
  const { color = 'currentColor', ...rest } = props;
  const svgProps = Icon({ ...rest, viewBox: '0 0 1024 1024', fill: color, stroke: 'none' });
  return (
    <Svg {...svgProps}>
      <Path d="M760 380.4l-61.6-61.6-263.2 263.1-109.6-109.5L264 534l171.2 171.2L760 380.4z" />
    </Svg>
  );
};

// Keywords: check-circle, verified, success, checkmark-circle, done
// Checkmark Circle Icon - circular outline with check inside (outline style)
export const CheckmarkCircleIcon = (props) => {
  const svgProps = Icon(props);
  return (
    <Svg {...svgProps}>
      <Path d="M9 12l2 2 4-4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <Circle cx="12" cy="12" r="9" />
    </Svg>
  );
};

// Keywords: QR code, barcode, scan
// QR Code Icon
export const QRCodeIcon = (props) => {
  const svgProps = Icon(props);
  return (
    <Svg {...svgProps}>
      <Path d="M4 4h6v6H4z" fill="currentColor" />
      <Path d="M14 4h6v6h-6z" fill="currentColor" />
      <Path d="M4 14h6v6H4z" fill="currentColor" />

      <Rect x="14" y="14" width="2" height="2" fill="currentColor" />
      <Rect x="18" y="14" width="2" height="2" fill="currentColor" />
      <Rect x="14" y="18" width="2" height="2" fill="currentColor" />
      <Rect x="18" y="18" width="2" height="2" fill="currentColor" />

      <Rect x="8" y="8" width="2" height="2" fill="currentColor" />
      <Rect x="12" y="12" width="2" height="2" fill="currentColor" />
      <Rect x="16" y="8" width="2" height="2" fill="currentColor" />
      <Rect x="8" y="16" width="2" height="2" fill="currentColor" />
    </Svg>
  );
};

// Keywords: image, picture, photo, media
// Image / Picture Outline Icon
export const ImageOutlineIcon = (props) => {
  const svgProps = Icon(props);
  return (
    <Svg {...svgProps}>
      <Path d="M19 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2z" />

      <Path d="M8.5 10l3.5 4 3-3 4 5H5z" strokeLinecap="round" strokeLinejoin="round" />

      <Circle cx="17" cy="8" r="2" />
    </Svg>
  );
};

// Keywords: comment, feedback, text, message
// Comment Text Outline - filled variant matching design (uses currentColor)
export const CommentTextOutlineIcon = (props) => {
  const svgProps = Icon({ ...props, fill: 'currentColor', viewBox: '0 0 24 24' });
  return (
    <Svg {...svgProps}>
      <Path
        d="M2 6a3 3 0 0 1 3-3h14a3 3 0 0 1 3 3v10a3 3 0 0 1-3 3H7.667a1 1 0 0 0-.6.2L3.6 21.8A1 1 0 0 1 2 21V6zm5 0a1 1 0 0 0 0 2h10a1 1 0 1 0 0-2H7zm0 4a1 1 0 1 0 0 2h10a1 1 0 1 0 0-2H7zm0 4a1 1 0 1 0 0 2h4a1 1 0 1 0 0-2H7z"
        fillRule="evenodd"
        clipRule="evenodd"
      />
    </Svg>
  );
};

// Keywords: target, location, map, center
// Map Target Icon - Center Dot + Outer Circle + Four Direction Bars
export const MapTargetIcon = (props) => {
  const svgProps = Icon(props);
  return (
    <Svg {...svgProps}>
      <Circle cx="12" cy="12" r="10" />

      <Path d="M12 2v-2" strokeWidth="3" strokeLinecap="round" />
      <Path d="M12 22v2" strokeWidth="3" strokeLinecap="round" />
      <Path d="M2 12h-2" strokeWidth="3" strokeLinecap="round" />
      <Path d="M22 12h2" strokeWidth="3" strokeLinecap="round" />

      <Circle cx="12" cy="12" r="2" fill="currentColor" />
    </Svg>
  );
};

// Keywords: upload, cloud, arrow, import
// Upload Icon - Larger Filled Arrowhead with Existing Tray & Gap
// Upload to Cloud Icon - Outline Cloud with Centered Up Arrow
export const UploadIcon = (props) => {
  const svgProps = Icon(props);
  return (
    <Svg {...svgProps}>
      <Path d="M17 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" strokeWidth="2" fill="none" />

      <Path d="M12 8v8" strokeWidth="2" strokeLinecap="round" />
      <Path d="M8 12l4-4 4 4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
};

// Keywords: send, paper plane, message, share
// Send Icon - outline paper-plane / send glyph
export const SendIcon = (props) => {
  const svgProps = Icon({ ...props, viewBox: '0 0 24 24' });
  return (
    <Svg {...svgProps}>
      <Path d="M10.3009 13.6949L20.102 3.89742M10.5795 14.1355L12.8019 18.5804C13.339 19.6545 13.6075 20.1916 13.9458 20.3356C14.2394 20.4606 14.575 20.4379 14.8492 20.2747C15.1651 20.0866 15.3591 19.5183 15.7472 18.3818L19.9463 6.08434C20.2845 5.09409 20.4535 4.59896 20.3378 4.27142C20.2371 3.98648 20.013 3.76234 19.7281 3.66167C19.4005 3.54595 18.9054 3.71502 17.9151 4.05315L5.61763 8.2523C4.48114 8.64037 3.91289 8.83441 3.72478 9.15032C3.56153 9.42447 3.53891 9.76007 3.66389 10.0536C3.80791 10.3919 4.34498 10.6605 5.41912 11.1975L9.86397 13.42C10.041 13.5085 10.1295 13.5527 10.2061 13.6118C10.2742 13.6643 10.3352 13.7253 10.3876 13.7933C10.4468 13.87 10.491 13.9585 10.5795 14.1355Z" />
    </Svg>
  );
};

// Keywords: money, bills, cash, finance
// Amount - Money Bills Stack
export const AmountIcon = (props) => {
  // Use the provided 96x96 filled SVG. Default fill white so icon is white by default.
  // Passing a `color` prop will still override via spread order.
  const svgProps = Icon({ ...props, fill: '#ffffff', stroke: '#ffffff', viewBox: '0 0 96 96' });
  return (
    <Svg {...svgProps}>
      <Path d="M90,12H6a5.9966,5.9966,0,0,0-6,6V78a5.9966,5.9966,0,0,0,6,6H90a5.9966,5.9966,0,0,0,6-6V18A5.9966,5.9966,0,0,0,90,12ZM24,72A12.0119,12.0119,0,0,0,12,60V36A12.0119,12.0119,0,0,0,24,24H72A12.0119,12.0119,0,0,0,84,36V60A12.0119,12.0119,0,0,0,72,72Z" />
      <Path d="M48,36A12,12,0,1,0,60,48,12.0119,12.0119,0,0,0,48,36Z" />
    </Svg>
  );
};

// Keywords: expenditure, expense, money out
// Expenditure - Wallet with Outgoing Money/Arrow
export const ExpenditureIcon = (props) => {
  const svgProps = Icon(props);
  return (
    <Svg {...svgProps}>
      <Path d="M3 6h18v12H3z" strokeWidth="2" strokeLinecap="round" />
      <Path d="M3 10h18" strokeLinecap="round" />
      <Path d="M12 14v-6" strokeWidth="2" strokeLinecap="round" />
      <Path d="M9 11l3 3 3-3" strokeWidth="2" strokeLinecap="round" />
      <Path d="M15 12h3" strokeLinecap="round" />
    </Svg>
  );
};

export const SyncIcon = (props) => {
  // Use currentColor fill so the passed `color` prop controls the icon color
  // and use the original 32x32 viewBox so the path coordinates render correctly
  const svgProps = Icon({ ...props, fill: 'currentColor', viewBox: '0 0 32 32' });

  return (
    <Svg {...svgProps}>
      <Path d="M16 4 C10.886719 4 6.617188 7.160156 4.875 11.625 L6.71875 12.375 C8.175781 8.640625 11.710938 6 16 6 C19.242188 6 22.132813 7.589844 23.9375 10 L20 10 L20 12 L27 12 L27 5 L25 5 L25 8.09375 C22.808594 5.582031 19.570313 4 16 4 Z M25.28125 19.625 C23.824219 23.359375 20.289063 26 16 26 C12.722656 26 9.84375 24.386719 8.03125 22 L12 22 L12 20 L5 20 L5 27 L7 27 L7 23.90625 C9.1875 26.386719 12.394531 28 16 28 C21.113281 28 25.382813 24.839844 27.125 20.375 Z" />
    </Svg>
  );
};

// Keywords: star, favorite, rating, award
// Full Star (filled) - defaults to gold but respects `color` prop
export const FullStarIcon = (props) => {
  const fillColor = props?.color ?? '#FFD700'; // gold by default
  const svgProps = Icon({ ...props, fill: fillColor, stroke: fillColor, viewBox: '0 0 64 64' });
  return (
    <Svg {...svgProps}>
      <Path d="M32.001,9.188l5.666,17.438l18.335,0l-14.833,10.777l5.666,17.438l-14.834,-10.777l-14.833,10.777l5.666,-17.438l-14.834,-10.777l18.335,0l5.666,-17.438Z" />
    </Svg>
  );
};

// Keywords: star, favorite, rating, award
// Half Star - default gold fill, respects color prop
export const HalfStarIcon = (props) => {
  const fillColor = props?.color ?? '#FFD700';
  const svgProps = Icon({ ...props, fill: fillColor, stroke: fillColor, viewBox: '0 0 52 52' });
  return (
    <Svg {...svgProps}>
      <Path d="M27.4133467,3.10133815 L32.0133467,18.1013381 C32.2133467,18.7013381 32.8133467,19.0013381 33.4133467,19.0013381 L48.4133467,19.0013381 C49.9133467,19.0013381 50.5133467,21.0013381 49.3133467,21.9013381 L37.1133467,30.9013381 C36.6133467,31.3013381 36.4133467,32.0013381 36.6133467,32.6013381 L42.4133467,48.0013381 C42.8133467,49.4013381 41.3133467,50.6013381 40.1133467,49.7013381 L27.0133467,39.9013381 C26.5133467,39.5013381 25.8133467,39.5013381 25.2133467,39.9013381 L12.0133467,49.7013381 C10.8133467,50.6013381 9.21334668,49.4013381 9.71334668,48.0013381 L15.3133467,32.6013381 C15.5133467,32.0013381 15.3133467,31.3013381 14.8133467,30.9013381 L2.61334668,21.9013381 C1.41334668,21.0013381 2.11334668,19.0013381 3.51334668,19.0013381 L18.5133467,19.0013381 C19.2133467,19.0013381 19.7133467,18.8013381 19.9133467,18.1013381 L24.6133467,3.00133815 C25.0133467,1.60133815 27.0133467,1.70133815 27.4133467,3.10133815 Z M26.0133467,12.8023264 C26,14.1700393 26,33.5426636 26,34.4953918 C26.1865845,34.6476135 28.9331193,36.6890643 34.2396046,40.6197441 C34.9394191,41.144605 35.8141872,40.4447905 35.5809157,39.6283403 L35.5809157,39.6283403 L32.3085327,31.0201416 C31.9597778,30.2501831 32.3085327,29.7487793 32.7398682,29.4849854 L32.7398682,29.4849854 L39.6048489,24.6961622 C40.3046634,24.1713013 39.9547562,23.0049438 39.0799881,23.0049438 L39.0799881,23.0049438 L31.0206299,23.0049438 C30.6707226,23.0049438 29.7518921,22.8880615 29.5025635,21.9888306 L29.5025635,21.9888306 L26.8332347,13.4436151 C26.7175852,13.0388421 26.3602784,12.8204102 26.0133467,12.8023264 Z" />
    </Svg>
  );
};

// Keywords: doctor, healthcare, medical, professional
// Doctor Icon (complex 512x512 SVG) - filled, uses currentColor
export const DoctorIcon = (props) => {
  const svgProps = Icon({ ...props, fill: 'currentColor', viewBox: '0 0 512 512' });
  return (
    <Svg {...svgProps}>
      <Path d="M110.547,411.844c-5.234,5.813-9.141,12.5-11.328,19.266c-1.531,4.766-2.266,9.469-2.266,13.875 c0,2.688,0.266,5.25,0.844,7.672c0.438,1.797,1.031,3.516,1.828,5.094c0.594,1.203,1.313,2.344,2.156,3.375 c1.266,1.531,2.828,2.859,4.688,3.781c1.844,0.938,3.969,1.438,6.125,1.422v-9.766c-0.453,0-0.797-0.063-1.125-0.156 c-0.578-0.156-1.047-0.422-1.578-0.891c-0.375-0.359-0.781-0.828-1.156-1.469c-0.563-0.922-1.094-2.203-1.453-3.734 c-0.359-1.547-0.563-3.344-0.563-5.328c0-3.297,0.578-7.047,1.797-10.891c1.141-3.531,2.953-7.188,5.328-10.656 c3.547-5.219,8.391-9.984,13.984-13.391c2.781-1.703,5.781-3.078,8.891-4.016c3.125-0.938,6.391-1.438,9.766-1.438 c4.5,0,8.813,0.906,12.844,2.531c6.031,2.406,11.484,6.453,15.844,11.281c4.344,4.813,7.578,10.406,9.266,15.688 c1.234,3.844,1.813,7.594,1.813,10.891c0,2.016-0.219,3.844-0.594,5.391c-0.266,1.156-0.641,2.188-1.047,3 c-0.313,0.625-0.641,1.125-0.984,1.547c-0.5,0.609-1,1-1.484,1.25c-0.5,0.234-1.016,0.375-1.766,0.391v9.766 c1.281,0.016,2.547-0.172,3.75-0.5c2.109-0.578,4-1.672,5.547-3.094c1.156-1.063,2.125-2.281,2.922-3.609 c1.219-2,2.063-4.219,2.609-6.594s0.813-4.906,0.813-7.547c0-4.406-0.734-9.125-2.266-13.875 c-1.453-4.516-3.672-8.984-6.547-13.188c-4.313-6.297-10.063-12.016-16.969-16.234c-3.453-2.094-7.188-3.813-11.172-5 c-3.984-1.219-8.203-1.875-12.578-1.875c-5.828,0-11.391,1.188-16.469,3.234C122.375,401.109,115.781,406.047,110.547,411.844z" />
      <Path d="M165.594,452.109c-1.594,1.266-2.531,3.172-2.531,5.219v7.891c0,2.031,0.938,3.953,2.531,5.219 c1.594,1.25,3.688,1.719,5.656,1.25l5.266-1.25v-18.344l-5.266-1.25C169.281,450.375,167.188,450.844,165.594,452.109z" />
      <Path d="M121.719,450.844l-5.281,1.25v18.344l5.281,1.25c1.969,0.469,4.063,0,5.656-1.25 c1.594-1.266,2.531-3.188,2.531-5.219v-7.891c0-2.047-0.938-3.953-2.531-5.219S123.688,450.375,121.719,450.844z" />
      <Path d="M453.453,429.594c-2.016-7.531-4.859-14.281-8.359-20.281c-6.141-10.547-14.266-18.75-23.234-25.25 c-6.734-4.875-13.922-8.859-21.234-12.281c-10.953-5.125-22.156-9.063-32.5-12.891c-10.344-3.813-19.797-7.547-27.156-11.891 c-2.688-1.594-5.109-3.25-7.203-4.984c-3.125-2.609-5.563-5.391-7.328-8.5s-2.953-6.609-3.406-10.984 c-0.328-3.125-0.469-6.063-0.469-8.875c0-8.281,1.219-15.453,2.781-22.781c4.625-5.219,8.859-11.438,12.859-18.875 c4.016-7.484,7.828-16.219,11.625-26.563c2.438-1.109,4.891-2.438,7.281-4.063c5.469-3.656,10.656-8.781,14.984-15.609 c4.313-6.828,7.781-15.313,10.156-25.781c0.656-2.906,0.969-5.797,0.969-8.641c0.016-5.938-1.391-11.594-3.75-16.656 c-1.641-3.516-3.719-6.734-6.141-9.656c1.234-4.563,2.734-10.703,4.078-17.891c1.844-9.984,3.375-21.984,3.375-34.594 c0-8.141-0.641-16.547-2.297-24.844c-1.234-6.219-3.063-12.391-5.625-18.297c-3.859-8.891-9.469-17.25-17.266-24.156 c-7.219-6.391-16.266-11.484-27.188-14.75c-3.859-4.625-7.734-8.563-11.703-11.906c-3.438-2.875-6.953-5.297-10.547-7.281 c-5.406-3-11-4.984-16.734-6.188s-11.578-1.641-17.641-1.641c-8.359,0-17.156,0.828-26.875,1.781 c-3.672,0.375-6.75,0.828-9.422,1.297c-3.984,0.719-6.969,1.453-9.359,1.938c-1.203,0.234-2.25,0.422-3.281,0.547 c-1.031,0.109-2.031,0.188-3.172,0.188c-1.531,0-3.297-0.125-5.609-0.453c-7.078-1.031-13.547-2.625-18.625-4.188 c-2.531-0.766-4.719-1.531-6.438-2.188c-0.859-0.328-1.609-0.625-2.203-0.875c-0.609-0.25-1.063-0.484-1.328-0.609l0.016,0.016 c-0.781-0.406-1.531-0.625-2.203-0.75C182.609,0.031,182.016,0,181.5,0c-1.078,0-1.844,0.156-2.453,0.313s-1.078,0.344-1.5,0.516 c-0.813,0.328-1.438,0.672-2.063,1.047c-1.141,0.688-2.234,1.453-3.391,2.344c-2.016,1.563-4.234,3.5-6.594,5.781 c-3.531,3.406-7.313,7.531-10.75,12.031c-1.719,2.234-3.328,4.578-4.781,7s-2.734,4.906-3.75,7.516 c-4.969,12.922-8.25,24.828-10.281,35.813c-2.047,10.984-2.828,21.047-2.828,30.281c0,15.109,2.109,27.922,4.141,38.75 c0,0.516,0.016,1,0.047,1.516c0.063,1.016,0.172,2.063,0.281,3.156c0.172,1.625,0.359,3.297,0.5,4.703 c0.078,0.703,0.141,1.328,0.188,1.813c0.016,0.234,0.031,0.453,0.031,0.609l0.016,0.156v0.047v0.016v0.922l1.984,8.828 c-2.859,3.125-5.328,6.625-7.25,10.469c-2.688,5.344-4.281,11.375-4.281,17.75c0,2.813,0.328,5.719,0.984,8.609 c1.563,6.984,3.641,13.078,6.125,18.391c3.719,7.984,8.438,14.188,13.656,18.844c4.047,3.625,8.375,6.266,12.656,8.219 c3.781,10.344,7.594,19.063,11.609,26.547c4,7.453,8.219,13.656,12.844,18.875c1.563,7.328,2.781,14.516,2.797,22.797 c0,2.813-0.156 5.75-0.484 8.875c-0.313,3-0.969,5.594-1.922,7.938c-1.422,3.5-3.5,6.484-6.328,9.313 c-2.828,2.781-6.438,5.391-10.703,7.813c-4.328,2.453-9.344,4.75-14.797,6.938c-9.563,3.875-20.469,7.531-31.516,11.953 c-8.281,3.297-16.672,7.063-24.672,11.766c-6,3.531-11.766,7.625-17.078,12.484c-7.953,7.281-14.813,16.359-19.547,27.578 c-4.75,11.234-7.391,24.531-7.375,40.25c0,2.219,0.469,4.328,1.234,6.281c0.703,1.828,1.688,3.5,2.844,5.094 c2.188,2.969,5,5.625,8.453,8.188c6.063,4.469,14.109,8.656,24.531,12.594c15.625,5.891,36.563,11.188,63.641,15.031 c27.063,3.844,60.266,6.25,100.266,6.25c34.703,0,64.266-1.797,89.156-4.781c18.656-2.25,34.703-5.156,48.313-8.484 c10.219-2.484,19.078-5.219,26.672-8.094c5.688-2.156,10.688-4.406,15.031-6.719c3.25-1.734,6.125-3.516,8.672-5.344 c3.813-2.766,6.875-5.609,9.203-8.844c1.172-1.609,2.125-3.328,2.828-5.203c0.703-1.844,1.125-3.875,1.125-5.969 C456.984,447.813,455.75,438.203,453.453,429.594z M327.266,358.094l-50.156,78.328l-5.594-38.453l14.234-15.063l-9.219-15.375 l38.906-20.453c1.078,1.391,2.219,2.703,3.422,3.953C321.438,353.672,324.266,356,327.266,358.094z M183.078,87.156 c45.219,10.031,133.641-9.141,133.641-9.141s0.953,21.922,16.031,42.047c5.938,7.906,10.828,20.266,14.5,32.016 c-0.984-1.828-3.297-2.516-6.75-2.953c-7.75-1.047-19.266-1.719-32.234-1.094c-38.531,1.891-35.672,5.391-50.797,5.391 s-12.266-3.5-50.797-5.391c-12.969-0.625-24.484,0.047-32.25,1.094c-4.031,0.531-6.563,1.344-7.141,4.031 c-0.203,1-0.516,2.125-1.906,2.672C169.641,139.891,181.516,119.531,183.078,87.156z M339.922,176.469 c0,0.219-0.156,22.313-15.188,29.859c-5.109,2.578-11.516,4-18.031,4.016c-6.875,0-13.156-1.563-18.172-4.516 c-5.547-3.25-9.281-8.078-11.109-14.313c-0.438-1.453-0.828-2.906-1.234-4.313c-1.188-4.297-4.391-16.234,2.406-21.484 c4.375-3.422,17.953-5.578,30.969-5.578c11.828,0,23.891,1.609,27.422,5.297C339.313,167.875,340.219,172.219,339.922,176.469z M238.75,187.203c-0.406,1.406-0.813,2.859-1.234,4.313c-1.828,6.234-5.563,11.063-11.094,14.313 c-5.031,2.953-11.313,4.516-18.188,4.516c-6.516-0.016-12.906-1.438-18.031-4.016c-15.031-7.547-15.172-29.641-15.188-29.859 c-0.297-4.25,0.609-8.594,2.922-11.031c3.547-3.688,15.609-5.297,27.438-5.297c13,0,26.594,2.156,30.984,5.578 C243.141,170.969,239.938,182.906,238.75,187.203z M188.547,264.063c-3.922-7.313-7.828-16.406-11.844-27.75l-1.328-3.703 l-3.688-1.359c-2.563-0.938-5.063-2.156-7.453-3.766c-3.609-2.422-7.031-5.734-10.172-10.672s-5.953-11.563-7.984-20.516 c-0.391-1.703-0.547-3.328-0.547-4.922c0-3.594,0.859-7,2.5-10.25c1.344-2.703,3.219-5.25,5.5-7.563 c3.844,5.813,7.031,10.422,8.188,11.578c2.203,2.203,3.297,0.078,3.469-4.047c1.359,9.172,5.719,24.313,19.797,31.797 c20.266,10.766,50.516,6.734,60.781-17.234c4.641-10.813,4.703-21.375,11.703-21.375c6.984,0,7.063,10.563,11.703,21.375 c10.281,23.969,40.531,28,60.797,17.234c20.25-10.766,20.391-37.422,20.391-39.297c0-0.969,0.922-1.703,2.234-1.844 c1.719,7.234,2.609,12.141,2.609,12.141s1.938-3.703,4.844-8.641c1.734,2.031,3.172,4.219,4.234,6.5 c1.422,3.063,2.188,6.266,2.188,9.594c0,1.609-0.172,3.25-0.563,4.938c-1.344,5.969-3.047,10.906-4.953,15 c-2.875,6.125-6.188,10.344-9.656,13.438c-3.453,3.094-7.141,5.109-10.969,6.531l-3.703,1.344l-1.313,3.719 c-4.016,11.344-7.938,20.453-11.859,27.75c-3.938,7.313-7.844,12.813-11.906,17.094l-1.609,1.703l-0.5,2.266 c-1.813,8.359-3.625,17.594-3.625,28.531c0,3.375,0.172,6.891,0.547,10.594c0.453,4.344,1.453,8.422,2.938,12.172 c0.063,0.172,0.156,0.359,0.219,0.516l-50.891,26.766l-56.406-26.172c1.734-4.063,2.906-8.5,3.406-13.281 c0.391-3.703,0.547-7.219,0.547-10.594c0.016-10.938-1.797-20.188-3.625-28.547l-0.5-2.266l-1.609-1.688 C196.391,276.844,192.469,271.375,188.547,264.063z M188.094,355.594c2.938-2.359,5.641-5,8.031-7.969l43.016,19.969l-9.188,15.313 l14.219,15.063l-5.25,36.203l-54.875-75.609C185.438,357.609,186.797,356.625,188.094,355.594z M440.219,458.5 c-0.016,0.094-0.125,0.406-0.422,0.906c-0.563,0.969-1.875,2.531-4.094,4.313c-1.922,1.547-4.516,3.281-7.781,5.063 c-5.734,3.141-13.5,6.406-23.344,9.5c-14.781,4.656-34.297,8.906-58.922,12c-24.625,3.063-54.359,4.969-89.672,4.969 c-34.094,0-63-1.781-87.125-4.672c-18.094-2.172-33.5-4.984-46.344-8.109c-9.656-2.359-17.875-4.906-24.703-7.5 c-5.141-1.938-9.5-3.906-13.078-5.828c-2.688-1.438-4.953-2.859-6.797-4.172c-2.75-1.969-4.5-3.766-5.375-5 c-0.438-0.594-0.656-1.063-0.734-1.281c-0.047-0.094-0.063-0.156-0.063-0.188c0-9.375,1.063-17.406,2.906-24.375 c1.609-6.094,3.828-11.391,6.531-16.078c4.719-8.203,10.922-14.641,18.297-20.063c5.5-4.078,11.672-7.563,18.203-10.672 c7.328-3.484,15.109-6.484,22.922-9.375v16.875h5.859h5.859v-21.203c7.469-2.797,14.75-5.672,21.531-9.109l86.703,119.453 l75.75-118.266c0.234,0.359,0.469,0.719,0.688,1.063c3.156,5.078,5.359,10.609,6.828,16.875c1.453,6.25,2.125,13.25,2.125,21.047 c0,18.063,0,33.797,0,44.391H318.75v11.734h67v-11.734h-27.219c0-10.594,0-26.328,0-44.391c0-11.359-1.297-21.703-4.516-31.141 c-0.281-0.813-0.578-1.625-0.891-2.422c9.156,3.609,18.734,6.859,28.016,10.547c7.953,3.141,15.672,6.578,22.688,10.656 c5.281,3.063,10.172,6.5,14.516,10.406c6.516,5.922,11.859,12.906,15.703,21.859C437.875,433.516,440.219,444.516,440.219,458.5 L440.219,458.5z" />
    </Svg>
  );
};

// More icons can be added below following the same structure...

